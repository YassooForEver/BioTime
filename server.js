require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// === الدالة السحرية لتنظيف المفتاح (The Cleaner) ===
// SAP في حالتك محتاج المفتاح "خام" (بدون فواصل أو أسطر جديدة)
function getRawPrivateKey() {
    let key = process.env.SAP_PRIVATE_KEY || "";
    // حذف أي فواصل أو headers أو مسافات أو أسطر جديدة
    return key
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '')
        .replace(/\n/g, '')
        .replace(/\s/g, ''); // حذف المسافات
}

// === إعدادات BioTime ===
const BIOTIME_CONFIG = {
    url: process.env.BIOTIME_URL,
    username: process.env.BIOTIME_USER,
    password: process.env.BIOTIME_PASS
};

// 1. BioTime Token
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

// 2. SAP Integration (Raw Mode)
async function getSAPFirstToken() {
    console.log("🔄 جاري طلب SAP IDP Token (Raw Key Mode)...");
    
    // استخدام المفتاح الخام "سادة"
    const rawKey = getRawPrivateKey();

    const params = new URLSearchParams();
    params.append("client_id", process.env.SAP_CLIENT_ID);
    params.append("company_id", process.env.SAP_COMPANY_ID);
    params.append("user_id", process.env.SAP_USER_ID);
    params.append("token_url", process.env.SAP_TOKEN_URL);
    params.append("private_key", rawKey); // المفتاح الخام

    const res = await fetch(`${process.env.SAP_TOKEN_URL}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const text = await res.text();
    if (!res.ok) {
        // لو فشل، اعرض الرد عشان نفهم السبب
        console.error("❌ SAP IDP Error:", text);
        throw new Error("SAP IDP Error: " + text);
    }
    console.log("✅ تم الحصول على Assertion.");
    return text; 
}

async function getSAPFinalToken(assertion) {
    console.log("🔄 استبدال Assertion بـ Access Token...");
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
        console.error("❌ SAP Token Error:", JSON.stringify(json));
        throw new Error("SAP Token Error: " + JSON.stringify(json));
    }
    console.log("✅ تم استلام Access Token.");
    return json.access_token;
}

// === Endpoints ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(`📥 جلب ${startDate} : ${endDate}`);
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
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/send-sap', async (req, res) => {
    const { records } = req.body;
    console.log(`🚀 ترحيل ${records.length} سجل...`);

    try {
        // 1. المصادقة
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);

        // 2. التجهيز
        const sapPayload = records.map(rec => ({
            "assignmentId": rec.assignmentId,
            "timestamp": `${rec.timestampSAP}+0200`,
            "typeCode": rec.typeCode
        }));

        // 3. الإرسال
        const sapRes = await fetch(process.env.SAP_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sapPayload)
        });

        const sapResponseText = await sapRes.text();
        console.log("📩 رد SAP:", sapResponseText);

        let sapResult;
        try { sapResult = JSON.parse(sapResponseText); } catch (e) { sapResult = sapResponseText; }

        if (sapRes.ok) {
            res.json({ success: true, count: records.length, message: "تم الترحيل بنجاح" });
        } else {
            res.json({ success: false, message: "SAP رفض البيانات", details: sapResult });
        }

    } catch (error) {
        console.error("⛔ خطأ:", error.message);
        res.json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));