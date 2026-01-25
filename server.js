require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === إصلاح المفتاح الخاص (Private Key Fixer) ===
// الدالة دي بتظبط المفتاح لو مكتوب سطر واحد بالغلط
function getFormattedPrivateKey() {
    let key = process.env.SAP_PRIVATE_KEY || "";
    // لو المفتاح مش بادئ بـ -----BEGIN، يبقى غالباً محتاج تظبيط
    if (!key.includes('-----BEGIN PRIVATE KEY-----')) {
        console.warn("⚠️ تحذير: المفتاح في .env قد يكون غير منسق، جاري محاولة إصلاحه...");
    }
    // استبدال الرموز الغريبة (\n) بأسطر حقيقية
    return key.replace(/\\n/g, '\n').replace(/"/g, ''); 
}

// === إعدادات BioTime ===
const BIOTIME_CONFIG = {
    url: process.env.BIOTIME_URL,
    username: process.env.BIOTIME_USER,
    password: process.env.BIOTIME_PASS
};

// === 1. دالة التوكن الخاص بـ BioTime ===
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
        if (!res.ok) throw new Error(`BioTime Login Failed: ${res.statusText}`);
        const data = await res.json();
        return `JWT ${data.token}`;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// === 2. دوال الاتصال بـ SAP (القلب النابض) ===

// الخطوة أ: الحصول على Assertion
async function getSAPFirstToken() {
    console.log("🔄 جاري طلب SAP IDP Token...");
    const privateKey = getFormattedPrivateKey(); // استخدام المفتاح المصحح

    const params = new URLSearchParams();
    params.append("client_id", process.env.SAP_CLIENT_ID);
    params.append("company_id", process.env.SAP_COMPANY_ID);
    params.append("user_id", process.env.SAP_USER_ID);
    params.append("token_url", process.env.SAP_TOKEN_URL);
    params.append("private_key", privateKey); 

    const res = await fetch(`${process.env.SAP_TOKEN_URL}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const text = await res.text();
    if (!res.ok) {
        console.error("❌ فشل في الخطوة الأولى (IDP):", text);
        throw new Error("SAP IDP Error: " + text);
    }
    console.log("✅ تم الحصول على Assertion بنجاح.");
    return text; 
}

// الخطوة ب: الحصول على Access Token
async function getSAPFinalToken(assertion) {
    console.log("🔄 جاري استبدال Assertion بـ Access Token...");
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

    const json = await res.json();
    if (!res.ok) {
        console.error("❌ فشل في الخطوة الثانية (Token):", JSON.stringify(json));
        throw new Error("SAP Token Error: " + JSON.stringify(json));
    }
    console.log("✅ تم الحصول على SAP Access Token.");
    return json.access_token;
}

// === Endpoints ===

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(`📥 جلب بيانات من ${startDate} إلى ${endDate}`);
        
        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        
        const response = await fetch(url, { headers: { "Authorization": token } });
        const json = await response.json();
        
        const records = (json.data || []).map(r => ({
            employeeName: r.first_name + " " + r.last_name,
            assignmentId: r.emp_code,
            originalTime: r.punch_time.split(' ')[1],
            timestampSAP: r.punch_time.replace(' ', 'T'),
            typeCode: r.punch_state_display.toLowerCase().includes("check in") ? "P10" : "P20",
            location: r.area_alias || "Main Office"
        }));

        res.json({ success: true, records });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/send-sap', async (req, res) => {
    const { records } = req.body;
    console.log(`🚀 بدء ترحيل ${records.length} سجل إلى SAP...`);

    try {
        // 1. المصادقة
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);

        // 2. تجهيز البيانات
        // ملاحظة: SAP بيحتاج التاريخ بتوقيت ISO كامل
        const sapPayload = records.map(rec => ({
            "assignmentId": rec.assignmentId,
            "timestamp": `${rec.timestampSAP}+0200`, // توقيت مصر
            "typeCode": rec.typeCode
        }));

        // 3. الإرسال
        console.log(`📤 إرسال Payload إلى: ${process.env.SAP_API_ENDPOINT}`);
        const sapRes = await fetch(process.env.SAP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sapPayload)
        });

        const sapResponseText = await sapRes.text();
        console.log("📩 رد SAP النهائي:", sapResponseText);

        let sapResult;
        try { sapResult = JSON.parse(sapResponseText); } catch (e) { sapResult = sapResponseText; }

        if (sapRes.ok) {
            res.json({ success: true, count: records.length, message: "تم الترحيل بنجاح" });
        } else {
            res.json({ success: false, message: "SAP رفض البيانات", details: sapResult });
        }

    } catch (error) {
        console.error("⛔ كارثة في الترحيل:", error.message);
        res.json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Running on http://localhost:${PORT}`));