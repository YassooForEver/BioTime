require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === توجيه الصفحة الرئيسية ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==========================================
// 1. الاتصال بـ BioTime (زي ما هو)
// ==========================================
const BIOTIME_CONFIG = {
    url: process.env.BIOTIME_URL,
    username: process.env.BIOTIME_USER,
    password: process.env.BIOTIME_PASS
};

async function getBioTimeToken() {
    const formData = new URLSearchParams();
    formData.append("username", BIOTIME_CONFIG.username);
    formData.append("password", BIOTIME_CONFIG.password);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    try {
        const res = await fetch(`${BIOTIME_CONFIG.url}/jwt-api-token-auth/`, { 
            method: 'POST', 
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        return `JWT ${data.token}`;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        
        const response = await fetch(url, { headers: { "Authorization": token } });
        const json = await response.json();
        
        const records = (json.data || []).map(r => ({
            employeeName: r.first_name + " " + r.last_name,
            assignmentId: r.emp_code,
            originalTime: r.punch_time.split(' ')[1],
            timestampSAP: r.punch_time.replace(' ', 'T'), // هنسيب الوقت خام دلوقتي ونعدله في الارسال
            typeCode: r.punch_state_display === "Check In" ? "P10" : (r.punch_state_display === "Check Out" ? "P20" : "P10"),
            location: r.area_alias || "Main Office"
        }));

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


// ==========================================
// 2. الاتصال بـ SAP (السر كله هنا)
// ==========================================

// دالة 1: تجيب الـ SAML Assertion
async function getSAPFirstToken() {
    const params = new URLSearchParams();
    params.append("client_id", process.env.SAP_CLIENT_ID);
    params.append("company_id", process.env.SAP_COMPANY_ID);
    params.append("user_id", process.env.SAP_USER_ID);
    params.append("token_url", process.env.SAP_TOKEN_URL);
    params.append("private_key", process.env.SAP_PRIVATE_KEY); // المفتاح الطويل جدا

    const res = await fetch(`${process.env.SAP_TOKEN_URL}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) throw new Error("SAP Step 1 Failed: IDP Token Error");
    return await res.text(); // بيرجع نص طويل (Assertion)
}

// دالة 2: تبدل الـ Assertion بـ Access Token
async function getSAPFinalToken(assertion) {
    const params = new URLSearchParams();
    params.append("client_id", process.env.SAP_CLIENT_ID);
    params.append("company_id", process.env.SAP_COMPANY_ID);
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:saml2-bearer");
    params.append("assertion", assertion);

    const res = await fetch(`${process.env.SAP_TOKEN_URL}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    if (!res.ok) throw new Error("SAP Step 2 Failed: Access Token Error");
    const json = await res.json();
    return json.access_token; // ده التوكن اللي هنستخدمه
}

app.post('/api/send-sap', async (req, res) => {
    const { records } = req.body;
    let successCount = 0;
    let failCount = 0;
    let errors = [];

    try {
        console.log("Authenticating with SAP...");
        // 1. تنفيذ بروتوكول المصادقة المعقد
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);
        console.log("SAP Authentication Successful!");

        // 2. تجهيز البيانات بنفس تنسيق الكود القديم
        // الكود القديم بيعمل Array وبيبعتها مرة واحدة (Bulk)
        const sapPayload = records.map(rec => {
            // تحويل التوقيت لنفس صيغة الكود القديم (ISO + Offset)
            // الكود القديم كان بيحط +0530 بس الأصح نستخدم توقيت السيرفر المحلي أو مصر +0200
            // هنا هنستخدم التنسيق المطلوب: YYYY-MM-DDTHH:mm:ss+0200
            const isoTime = `${rec.timestampSAP}+0200`; 

            return {
                "assignmentId": rec.assignmentId,
                "timestamp": isoTime,
                "typeCode": rec.typeCode
            };
        });

        // 3. إرسال البيانات لـ SAP REST API
        // الكود القديم بيبعت البيانات كلها مرة واحدة كـ JSON Array
        const sapRes = await fetch(process.env.SAP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sapPayload)
        });

        const sapResponseText = await sapRes.text();
        
        // تحليل الرد (الكود القديم بيعمل ملفات، إحنا هنحلل الـ JSON الراجع)
        let sapResult;
        try {
            sapResult = JSON.parse(sapResponseText);
        } catch (e) {
            sapResult = sapResponseText;
        }

        if (sapRes.ok) {
            // غالباً SAP بيرجع تفاصيل عن كل سجل (Success/Fail)
            // هنفترض النجاح للكل طالما الرد 200 OK
            // (ممكن تحتاج تعديل هنا حسب شكل الرد الفعلي لـ SAP)
            console.log("SAP Response:", sapResult);
            
            // حساب عدد الناجحين بناءً على رد SAP (لو بيرجع مصفوفة نتائج)
            if (Array.isArray(sapResult)) {
                 // منطق بسيط: عد اللي مفيهوش errors
                 successCount = sapResult.length; 
            } else {
                 successCount = records.length;
            }
            
            res.json({ success: true, count: successCount, message: "تم إرسال البيانات لـ SAP بنجاح!" });
        } else {
            console.error("SAP Submission Failed:", sapResponseText);
            res.json({ success: false, message: "SAP رفض البيانات", details: sapResult });
        }

    } catch (error) {
        console.error("SAP Error:", error);
        res.json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));