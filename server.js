require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 🔑 المفتاح الخاص (كما هو في الكود القديم)
// ==========================================
// وضعناه هنا لأن علامة # في آخره تسبب مشاكل في ملف .env
const RAW_PRIVATE_KEY = "TUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDdzFBSW9peVNJa3JHZWs0U2QrakxRTjhJT3ViazlEZmdwYUJVa1NJVkJickFjNDQ1SmxKTDdxT3NOWE8vK3pVb0h4bktmSkozQUpnOFRtc01saHhudW5uMDBvWUIzbUZhTC9GOGhFY00ybnkxdlRvTEJTSFdoMmd3eHlXRFQ4ZWdNeGtqbzU3YmdqcUJ2M1NxSzdFMEtha1ZwTHZ3ZlhyWnAwSU1BdVlIMTR2YXlzTHc1a1hnY2VBOTBMMGUxWFlVK2h4cjlKRGd0N2loK1FpSGVJOVFSbDlHMFVaZGdPNDJ6SEtVSFdudVoxd0xseHpaaVZuc0hGWmRmMTVqM3Z6RW0wcnVSYWdaR3NjU1NnNHFxTEp0T1Z5VmZFS3plRzBiTHlIdGpQL0ZnclhpQXMxQ0E1K1ZJamNSenpwRlJUVG5OWG1FNldsUXJoVTFhSjlaVDNkWG5BZ01CQUFFQ2dnRUFOWE5BVzhVRGZBenJoOFdMbHIwa1V2QW54bys1UUkxU2NDRzRFa21oamcvSlNGSTRsbUZFdExGd3E0OW1OQjBWdlpmczJkSVZwUmxjQVU4TW9mRmVrMVJ4QUZHNUpXMTA2OGVUY2NtT3Vwb08vOUE1a2ZjM0ozOWpwRUQ4OWRQdmtyejFHUUhCczhzcEQrZElqc215MSswYm9obkR1Qy9HNytGSldCUzdCZm5jNnE5WWRONDFibXpzMnoyTEFVUVEwdjNtU08vUVVlbmlPMmM1d2RJZDArZEx6UGVnVU1QbjhubHhiU0g4Zi93N21ITUJnQktxdzJ0c1BrQ3ZwVE1EeDc3K3l0M2JOR2lIejRtTDFQZ0RwZXhuWUZWclJxZjBvMWFDeGVuaVhqb3VzWTBuZG8vNlFWaWdlaDRpWmdkMEU2T01MUFF1cEgwUE9La2pwbkpyOFFLQmdRRDRyQitZTWZ0WEczMGUraXVrS1dDV3dWS0lzK2RTRUFvWkw5b0VoZkorSUNvUUZFZmNGaVBobWJBeXpPeFJCZXN2NXNGNVJBZmFiRFVLczJuSnFqc3R0aXNNNTdOR1pzUEtMV3JranBwRkZqZWdJekZFclRoS3JwUEZKN1VLMzNENklDbEVFVWQ4bnRreDNyUmdwN2k1RXNoc3psTTQwdGM0ZHBoTStXS2lrd0tCZ1FDMkNleHBrOE9XWERYWndabm16L0tyZFR4Ty85WFdKZEtqVlRZSmJnOUduYzNOV3dtd2JlSzdQV2lTRnAyemRNU1IvR0RlNlJBc2V0b2s2RzRscDNtMjJaUHQ2S09zc2FUSDNiTXBYdGw3U0ZQZDMrRE94VnB6dGVMdlpiMW1JTzNCbXRLcFVuUkhxcnBRQlVPV2hINWdzUzdPd2pFd1JjcHdHZlg3OVRldjNRS0JnUUR4a2J3TGpKcCtqMXlvS0IwWEYzOFdWRzFLRVlKbzdOM3lnOUxHVEIwNnV5SkJob0ljWW9HdTJpOFoyb3JEVnYyWEJoTHpLOHg1T2w3NHF6dmNSWHZCdDFMdzhYRHR0azBDN2NZR2pDVi9jY3JOelFKQ2xnZTJQUXVlSGltNGkwRmtLclFMeE1GdVpaM1czV0xhOW5QempqU1h4b09BRXdveWRyc1RJN3pXOHdLQmdBU0FxRlZRTDFWSHdKazdQYWhFMm5hOU5wbXBvRXRrc2hvU0lIMEpPTjJCUjdiZG1wYS9rUTBhanJ5V1RKNUV0QnY4UnhVY1pLY0UvdUpNMFhTaStOSzUvUHUwZGwvdUlPcEVwSXJRYXNhdTJrd3hubWplM3NiZjU5WU9DU28raEVMMnBtRkR4ZGFEOVluSEo0M1FoeU96SGpwRStWeDlUVzJLWnRndGo0d05Bb0dCQU83MGhRY1BzR29NRHFvZnFZUDFBMEI1ODYzQUZvL3J4bUYwL1lvWTVLMFJLMmRKM1NOODdFanlpRG5qeU1paVZoQzhQU09hWGZWWkJFWllsYlZtYjNvbWZ6dGk1T1dZMlVFQVJFcWdXQkdxMklDVjNHWCtMTXQ2dDlPQWlKcmR6d1lNdWtKRUpLR3dhaE9Bd3FkUjlNaHVzK2MxdWJNOWMrV0ZlQllBNklOZyMjI2RvbWlhdGVjZ3I";

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

// 2. SAP Integration (Using Hardcoded Key)
async function getSAPFirstToken() {
    console.log("🔄 جاري طلب SAP IDP Token (Using Correct Key)...");

    const params = new URLSearchParams();
    params.append("client_id", process.env.SAP_CLIENT_ID);
    params.append("company_id", process.env.SAP_COMPANY_ID);
    params.append("user_id", process.env.SAP_USER_ID);
    params.append("token_url", process.env.SAP_TOKEN_URL);
    // استخدام المفتاح الموجود في الكود مباشرة
    params.append("private_key", RAW_PRIVATE_KEY); 

    const res = await fetch(`${process.env.SAP_TOKEN_URL}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const text = await res.text();
    if (!res.ok) {
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
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);

        const sapPayload = records.map(rec => ({
            "assignmentId": rec.assignmentId,
            "timestamp": `${rec.timestampSAP}+0200`,
            "typeCode": rec.typeCode
        }));

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