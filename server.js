require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
// استدعاء المكتبة بالطريقة الكلاسيكية المستقرة
const fetch = require('node-fetch');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 🔑 إعدادات SAP (مستخرجة من الكود الأصلي)
// ==========================================
const SAP_CONFIG = {
    tokenUrl: "https://api55.sapsf.eu",
    apiUrl: "https://api55.sapsf.eu/rest/timemanagement/timeeventprocessing/v1/TimeEvents",
    clientId: "NmQyMWQ5ZTM0MjM0Yzg3OGNkZDk1YmNjYWMzMA",
    companyId: "domiatecgr",
    userId: "TECHNICAL_USER_CICOTERMINAL_9D3F8AC1",
    // المفتاح الخاص (كما هو في الملف الأصلي)
    privateKey: "TUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDdzFBSW9peVNJa3JHZWs0U2QrakxRTjhJT3ViazlEZmdwYUJVa1NJVkJickFjNDQ1SmxKTDdxT3NOWE8vK3pVb0h4bktmSkozQUpnOFRtc01saHhudW5uMDBvWUIzbUZhTC9GOGhFY00ybnkxdlRvTEJTSFdoMmd3eHlXRFQ4ZWdNeGtqbzU3YmdqcUJ2M1NxSzdFMEtha1ZwTHZ3ZlhyWnAwSU1BdVlIMTR2YXlzTHc1a1hnY2VBOTBMMGUxWFlVK2h4cjlKRGd0N2loK1FpSGVJOVFSbDlHMFVaZGdPNDJ6SEtVSFdudVoxd0xseHpaaVZuc0hGWmRmMTVqM3Z6RW0wcnVSYWdaR3NjU1NnNHFxTEp0T1Z5VmZFS3plRzBiTHlIdGpQL0ZnclhpQXMxQ0E1K1ZJamNSenpwRlJUVG5OWG1FNldsUXJoVTFhSjlaVDNkWG5BZ01CQUFFQ2dnRUFOWE5BVzhVRGZBenJoOFdMbHIwa1V2QW54bys1UUkxU2NDRzRFa21oamcvSlNGSTRsbUZFdExGd3E0OW1OQjBWdlpmczJkSVZwUmxjQVU4TW9mRmVrMVJ4QUZHNUpXMTA2OGVUY2NtT3Vwb08vOUE1a2ZjM0ozOWpwRUQ4OWRQdmtyejFHUUhCczhzcEQrZElqc215MSswYm9obkR1Qy9HNytGSldCUzdCZm5jNnE5WWRONDFibXpzMnoyTEFVUVEwdjNtU08vUVVlbmlPMmM1d2RJZDArZEx6UGVnVU1QbjhubHhiU0g4Zi93N21ITUJnQktxdzJ0c1BrQ3ZwVE1EeDc3K3l0M2JOR2lIejRtTDFQZ0RwZXhuWUZWclJxZjBvMWFDeGVuaVhqb3VzWTBuZG8vNlFWaWdlaDRpWmdkMEU2T01MUFF1cEgwUE9La2pwbkpyOFFLQmdRRDRyQitZTWZ0WEczMGUraXVrS1dDV3dWS0lzK2RTRUFvWkw5b0VoZkorSUNvUUZFZmNGaVBobWJBeXpPeFJCZXN2NXNGNVJBZmFiRFVLczJuSnFqc3R0aXNNNTdOR1pzUEtMV3JranBwRkZqZWdJekZFclRoS3JwUEZKN1VLMzNENklDbEVFVWQ4bnRreDNyUmdwN2k1RXNoc3psTTQwdGM0ZHBoTStXS2lrd0tCZ1FDMkNleHBrOE9XWERYWndabm16L0tyZFR4Ty85WFdKZEtqVlRZSmJnOUduYzNOV3dtd2JlSzdQV2lTRnAyemRNU1IvR0RlNlJBc2V0b2s2RzRscDNtMjJaUHQ2S09zc2FUSDNiTXBYdGw3U0ZQZDMrRE94VnB6dGVMdlpiMW1JTzNCbXRLcFVuUkhxcnBRQlVPV2hINWdzUzdPd2pFd1JjcHdHZlg3OVRldjNRS0JnUUR4a2J3TGpKcCtqMXlvS0IwWEYzOFdWRzFLRVlKbzdOM3lnOUxHVEIwNnV5SkJob0ljWW9HdTJpOFoyb3JEVnYyWEJoTHpLOHg1T2w3NHF6dmNSWHZCdDFMdzhYRHR0azBDN2NZR2pDVi9jY3JOelFKQ2xnZTJQUXVlSGltNGkwRmtLclFMeE1GdVpaM1czV0xhOW5QempqU1h4b09BRXdveWRyc1RJN3pXOHdLQmdBU0FxRlZRTDFWSHdKazdQYWhFMm5hOU5wbXBvRXRrc2hvU0lIMEpPTjJCUjdiZG1wYS9rUTBhanJ5V1RKNUV0QnY4UnhVY1pLY0UvdUpNMFhTaStOSzUvUHUwZGwvdUlPcEVwSXJRYXNhdTJrd3hubWplM3NiZjU5WU9DU28raEVMMnBtRkR4ZGFEOVluSEo0M1FoeU96SGpwRStWeDlUVzJLWnRndGo0d05Bb0dCQU83MGhRY1BzR29NRHFvZnFZUDFBMEI1ODYzQUZvL3J4bUYwL1lvWTVLMFJLMmRKM1NOODdFanlpRG5qeU1paVZoQzhQU09hWGZWWkJFWllsYlZtYjNvbWZ6dGk1T1dZMlVFQVJFcWdXQkdxMklDVjNHWCtMTXQ2dDlPQWlKcmR6d1lNdWtKRUpLR3dhaE9Bd3FkUjlNaHVzK2MxdWJNOWMrV0ZlQllBNklOZyMjI2RvbWlhdGVjZ3I",
    // Basic Auth السري (ضروري جداً للخطوة الثانية)
    basicAuth: "Basic c29sZXguYWRtaW5AZG9taWF0ZWNnckQ6U29sZXhAMTIzNDU="
};

// === إعدادات BioTime ===
const BIOTIME_CONFIG = {
    url: process.env.BIOTIME_URL || "http://41.33.98.251:8090",
    username: process.env.BIOTIME_USER || "API",
    password: process.env.BIOTIME_PASS || "Admin@2023"
};

// === 1. الحصول على توكن BioTime ===
async function getBioTimeToken() {
    const formData = new URLSearchParams();
    formData.append("username", BIOTIME_CONFIG.username);
    formData.append("password", BIOTIME_CONFIG.password);

    try {
        const res = await fetch(`${BIOTIME_CONFIG.url}/jwt-api-token-auth/`, { 
            method: 'POST', body: formData, timeout: 60000 
        });
        if (!res.ok) throw new Error("فشل الاتصال بـ BioTime");
        const data = await res.json();
        return `JWT ${data.token}`;
    } catch (error) {
        throw error;
    }
}

// === 2. دوال SAP (مطابقة للملف الأصلي) ===

// الخطوة أ: طلب الـ Assertion
async function getSAPFirstToken() {
    console.log("🔄 1. SAP: Requesting IDP Token...");
    const params = new URLSearchParams();
    params.append("client_id", SAP_CONFIG.clientId);
    params.append("company_id", SAP_CONFIG.companyId);
    params.append("user_id", SAP_CONFIG.userId);
    params.append("token_url", SAP_CONFIG.tokenUrl);
    params.append("private_key", SAP_CONFIG.privateKey);

    const res = await fetch(`${SAP_CONFIG.tokenUrl}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
        timeout: 30000
    });

    const text = await res.text();
    if (!res.ok) throw new Error("SAP IDP Error: " + text);
    return text;
}

// الخطوة ب: تبديل الـ Assertion بـ Access Token (مع Basic Auth)
async function getSAPFinalToken(assertion) {
    console.log("🔄 2. SAP: Exchanging Assertion for Access Token...");
    const params = new URLSearchParams();
    params.append("client_id", SAP_CONFIG.clientId);
    params.append("company_id", SAP_CONFIG.companyId);
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:saml2-bearer");
    params.append("assertion", assertion);

    const res = await fetch(`${SAP_CONFIG.tokenUrl}/oauth/token`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': SAP_CONFIG.basicAuth // المفتاح السري هنا
        },
        body: params,
        timeout: 30000
    });

    const json = await res.json();
    if (!res.ok) throw new Error("SAP Token Error: " + JSON.stringify(json));
    return json.access_token;
}

// === نقاط الاتصال (Endpoints) ===

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 1. جلب البيانات من BioTime
app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        console.log(`📥 Fetching BioTime: ${startDate} to ${endDate}`);
        
        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        
        const response = await fetch(url, { headers: { "Authorization": token }, timeout: 60000 });
        const json = await response.json();
        
        const records = (json.data || []).map(r => {
            let typeCode = "P10"; 
            const state = r.punch_state_display.toLowerCase();
            
            // مطابقة منطق الكود الأصلي
            if(state.includes("check in")) typeCode = "P10";
            else if(state.includes("check out")) typeCode = "P20";
            else if(state.includes("overtime in")) typeCode = "P30";
            else if(state.includes("overtime out")) typeCode = "P40";

            return {
                employeeName: r.first_name + " " + r.last_name,
                assignmentId: r.emp_code,
                // نحتفظ بالوقت الأصلي للعرض
                originalTime: r.punch_time.split(' ')[1],
                // نحتفظ بالوقت الخام للإرسال
                rawDateTime: r.punch_time, 
                typeCode: typeCode,
                location: r.area_alias || "Main Office"
            };
        });

        res.json({ success: true, records });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. ترحيل البيانات لـ SAP
app.post('/api/send-sap', async (req, res) => {
    const { records } = req.body;
    console.log(`🚀 Sending ${records.length} records to SAP...`);

    try {
        // المصادقة أولاً
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);
        console.log("✅ SAP Authenticated.");

        // تجهيز البيانات (نفس تنسيق الملف الأصلي)
        const sapPayload = records.map(rec => {
            // إضافة +0530 (توقيت الهند) كما هو مطلوب في السيستم القديم
            const formattedDate = rec.rawDateTime.replace(' ', 'T') + "+0530";
            return {
                "assignmentId": rec.assignmentId,
                "timestamp": formattedDate,
                "typeCode": rec.typeCode
            };
        });

        // الإرسال
        const sapRes = await fetch(SAP_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sapPayload),
            timeout: 60000
        });

        const sapResponseText = await sapRes.text();
        console.log("📩 SAP Response:", sapResponseText);

        let sapResult;
        try { sapResult = JSON.parse(sapResponseText); } catch (e) { sapResult = sapResponseText; }

        if (sapRes.ok) {
            res.json({ success: true, count: records.length, message: "تم الترحيل بنجاح" });
        } else {
            res.json({ success: false, message: "SAP رفض البيانات", details: sapResult });
        }

    } catch (error) {
        console.error("⛔ SAP Error:", error.message);
        res.json({ success: false, message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));