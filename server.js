require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

// استدعاء fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// إعدادات BioTime
const BIOTIME_CONFIG = {
    url: "http://41.33.98.251:8090",
    username: "API",
    password: "Admin@2023"
};

// إعدادات SAP
const SAP_CONFIG = {
    tokenUrl: "https://api55.sapsf.eu",
    apiUrl: "https://api55.sapsf.eu/rest/timemanagement/timeeventprocessing/v1/TimeEvents",
    clientId: "NmQyMWQ5ZTM0MjM0Yzg3OGNkZDk1YmNjYWMzMA",
    companyId: "domiatecgr",
    userId: "TECHNICAL_USER_CICOTERMINAL_9D3F8AC1",
    privateKey: "TUlJRXZnSUJBREFOQmdrcWhraUc5dzBCQVFFRkFBU0NCS2d3Z2dTa0FnRUFBb0lCQVFDdzFBSW9peVNJa3JHZWs0U2QrakxRTjhJT3ViazlEZmdwYUJVa1NJVkJickFjNDQ1SmxKTDdxT3NOWE8vK3pVb0h4bktmSkozQUpnOFRtc01saHhudW5uMDBvWUIzbUZhTC9GOGhFY00ybnkxdlRvTEJTSFdoMmd3eHlXRFQ4ZWdNeGtqbzU3YmdqcUJ2M1NxSzdFMEtha1ZwTHZ3ZlhyWnAwSU1BdVlIMTR2YXlzTHc1a1hnY2VBOTBMMGUxWFlVK2h4cjlKRGd0N2loK1FpSGVJOVFSbDlHMFVaZGdPNDJ6SEtVSFdudVoxd0xseHpaaVZuc0hGWmRmMTVqM3Z6RW0wcnVSYWdaR3NjU1NnNHFxTEp0T1Z5VmZFS3plRzBiTHlIdGpQL0ZnclhpQXMxQ0E1K1ZJamNSenpwRlJUVG5OWG1FNldsUXJoVTFhSjlaVDNkWG5BZ01CQUFFQ2dnRUFOWE5BVzhVRGZBenJoOFdMbHIwa1V2QW54bys1UUkxU2NDRzRFa21oamcvSlNGSTRsbUZFdExGd3E0OW1OQjBWdlpmczJkSVZwUmxjQVU4TW9mRmVrMVJ4QUZHNUpXMTA2OGVUY2NtT3Vwb08vOUE1a2ZjM0ozOWpwRUQ4OWRQdmtyejFHUUhCczhzcEQrZElqc215MSswYm9obkR1Qy9HNytGSldCUzdCZm5jNnE5WWRONDFibXpzMnoyTEFVUVEwdjNtU08vUVVlbmlPMmM1d2RJZDArZEx6UGVnVU1QbjhubHhiU0g4Zi93N21ITUJnQktxdzJ0c1BrQ3ZwVE1EeDc3K3l0M2JOR2lIejRtTDFQZ0RwZXhuWUZWclJxZjBvMWFDeGVuaVhqb3VzWTBuZG8vNlFWaWdlaDRpWmdkMEU2T01MUFF1cEgwUE9La2pwbkpyOFFLQmdRRDRyQitZTWZ0WEczMGUraXVrS1dDV3dWS0lzK2RTRUFvWkw5b0VoZkorSUNvUUZFZmNGaVBobWJBeXpPeFJCZXN2NXNGNVJBZmFiRFVLczJuSnFqc3R0aXNNNTdOR1pzUEtMV3JranBwRkZqZWdJekZFclRoS3JwUEZKN1VLMzNENklDbEVFVWQ4bnRreDNyUmdwN2k1RXNoc3psTTQwdGM0ZHBoTStXS2lrd0tCZ1FDMkNleHBrOE9XWERYWndabm16L0tyZFR4Ty85WFdKZEtqVlRZSmJnOUduYzNOV3dtd2JlSzdQV2lTRnAyemRNU1IvR0RlNlJBc2V0b2s2RzRscDNtMjJaUHQ2S09zc2FUSDNiTXBYdGw3U0ZQZDMrRE94VnB6dGVMdlpiMW1JTzNCbXRLcFVuUkhxcnBRQlVPV2hINWdzUzdPd2pFd1JjcHdHZlg3OVRldjNRS0JnUUR4a2J3TGpKcCtqMXlvS0IwWEYzOFdWRzFLRVlKbzdOM3lnOUxHVEIwNnV5SkJob0ljWW9HdTJpOFoyb3JEVnYyWEJoTHpLOHg1T2w3NHF6dmNSWHZCdDFMdzhYRHR0azBDN2NZR2pDVi9jY3JOelFKQ2xnZTJQUXVlSGltNGkwRmtLclFMeE1GdVpaM1czV0xhOW5QempqU1h4b09BRXdveWRyc1RJN3pXOHdLQmdBU0FxRlZRTDFWSHdKazdQYWhFMm5hOU5wbXBvRXRrc2hvU0lIMEpPTjJCUjdiZG1wYS9rUTBhanJ5V1RKNUV0QnY4UnhVY1pLY0UvdUpNMFhTaStOSzUvUHUwZGwvdUlPcEVwSXJRYXNhdTJrd3hubWplM3NiZjU5WU9DU28raEVMMnBtRkR4ZGFEOVluSEo0M1FoeU96SGpwRStWeDlUVzJLWnRndGo0d05Bb0dCQU83MGhRY1BzR29NRHFvZnFZUDFBMEI1ODYzQUZvL3J4bUYwL1lvWTVLMFJLMmRKM1NOODdFanlpRG5qeU1paVZoQzhQU09hWGZWWkJFWllsYlZtYjNvbWZ6dGk1T1dZMlVFQVJFcWdXQkdxMklDVjNHWCtMTXQ2dDlPQWlKcmR6d1lNdWtKRUpLR3dhaE9Bd3FkUjlNaHVzK2MxdWJNOWMrV0ZlQllBNklOZyMjI2RvbWlhdGVjZ3I",
    basicAuth: "Basic c29sZXguYWRtaW5AZG9taWF0ZWNnckQ6U29sZXhAMTIzNDU="
};

// دوال المصادقة (Auth)
async function getBioTimeToken() {
    const formData = new URLSearchParams();
    formData.append("username", BIOTIME_CONFIG.username);
    formData.append("password", BIOTIME_CONFIG.password);
    const res = await fetch(`${BIOTIME_CONFIG.url}/jwt-api-token-auth/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error("BioTime Login Failed");
    const data = await res.json();
    return `JWT ${data.token}`;
}

async function getSAPFirstToken() {
    console.log("🔄 1. Requesting SAP IDP Token...");
    const params = new URLSearchParams();
    params.append("client_id", SAP_CONFIG.clientId);
    params.append("company_id", SAP_CONFIG.companyId);
    params.append("user_id", SAP_CONFIG.userId);
    params.append("token_url", SAP_CONFIG.tokenUrl);
    params.append("private_key", SAP_CONFIG.privateKey);

    const res = await fetch(`${SAP_CONFIG.tokenUrl}/oauth/idp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    });

    const text = await res.text();
    if (!res.ok) throw new Error("SAP IDP Error: " + text);
    return text;
}

async function getSAPFinalToken(assertion) {
    console.log("🔄 2. Exchanging Assertion for Access Token...");
    const params = new URLSearchParams();
    params.append("client_id", SAP_CONFIG.clientId);
    params.append("company_id", SAP_CONFIG.companyId);
    params.append("grant_type", "urn:ietf:params:oauth:grant-type:saml2-bearer");
    params.append("assertion", assertion);

    const res = await fetch(`${SAP_CONFIG.tokenUrl}/oauth/token`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': SAP_CONFIG.basicAuth
        },
        body: params
    });

    const textResponse = await res.text();
    let accessToken;
    try {
        const json = JSON.parse(textResponse);
        accessToken = json.access_token;
    } catch (e) {
        accessToken = textResponse.substring(17, 581); // Legacy method fallback
    }

    if (!res.ok && !accessToken) throw new Error("SAP Token Error: " + textResponse);
    return accessToken;
}

// === Endpoints ===

app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        const response = await fetch(url, { headers: { "Authorization": token } });
        const text = await response.text();
        let json; try { json = JSON.parse(text); } catch (e) { json = []; }
        let rawData = json.data || json.results || (Array.isArray(json) ? json : []);

        const records = rawData.map(r => {
            let typeCode = "P10"; 
            const state = (r.punch_state_display || "").toLowerCase();
            if(state.includes("check in") || state.includes("دخول")) typeCode = "P10";
            else if(state.includes("check out") || state.includes("خروج")) typeCode = "P20";

            return {
                // 🔥🔥🔥 هنا الإصلاح: إضافة ID الحركة 🔥🔥🔥
                id: r.id, // رقم الحركة الأصلي في BioTime (المفتاح المفقود!)
                
                assignmentId: r.emp_code,
                employeeName: (r.first_name || "") + " " + (r.last_name || ""),
                rawDateTime: r.punch_time, 
                originalTime: r.punch_time.split(' ')[1],
                typeCode: typeCode,
                location: r.area_alias || "Main Office"
            };
        });
        res.json({ success: true, records });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});


// 🔥 دالة الترحيل الذكية جداً (Smart Reporting) 🔥
// 🔥 دالة الترحيل الذكية والاحترافية (Smart Reporting Final) 🔥
app.post('/api/send-sap', async (req, res) => {
    try {
        const { records } = req.body;
        if (!records || records.length === 0) return res.json({ success: false, message: "لم يتم تحديد سجلات" });

        console.log(`🚀 SAP: معالجة ${records.length} سجل...`);

        // 1. التوثيق
        const assertion = await getSAPFirstToken();
        const accessToken = await getSAPFinalToken(assertion);

        // 2. تجهيز البيانات
        const sapPayload = records.map(rec => ({
            "id": rec.id, 
            "assignmentId": rec.assignmentId,
            "timestamp": rec.rawDateTime.replace(' ', 'T') + "+0530",
            "typeCode": rec.typeCode
        }));

        // 3. الإرسال
        const sapRes = await fetch(SAP_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(sapPayload)
        });

        const sapText = await sapRes.text();
        let sapResult = { succeededTimeEvents: [], failedTimeEvents: [] };
        try { sapResult = JSON.parse(sapText); } catch (e) { sapResult = { failedTimeEvents: [], succeededTimeEvents: [] }; }

        // === تحليل النتائج بدقة ===
        const successList = sapResult.succeededTimeEvents || [];
        const failList = sapResult.failedTimeEvents || [];

        let successCount = successList.length;
        let duplicatesCount = 0;
        let realErrorsCount = 0;

        // فرز الأخطاء (مكرر vs خطأ حقيقي)
        failList.forEach(fail => {
            if (fail.errorText && fail.errorText.includes("already exists")) {
                duplicatesCount++;
            } else {
                realErrorsCount++;
            }
        });

        // === صياغة الرسالة الاحترافية ===
        let responsePayload = {
            success: true,
            count: successCount,      // الرقم اللي كان ناقص وبيعمل undefined
            duplicates: duplicatesCount,
            icon: 'success',
            title: '',
            message: ''
        };

        if (realErrorsCount > 0) {
            // حالة: وجود مشاكل حقيقية
            responsePayload.success = false;
            responsePayload.icon = 'error';
            responsePayload.title = '⚠️ تم الترحيل مع وجود أخطاء';
            responsePayload.message = `✅ تم قبول: ${successCount}\n♻️ مكرر (موجود مسبقاً): ${duplicatesCount}\n❌ فشل: ${realErrorsCount} (بسبب أخطاء بيانات)`;
        } 
        else if (successCount === 0 && duplicatesCount > 0) {
            // حالة: كله مكرر (السيناريو اللي كان بيضايقك)
            responsePayload.icon = 'info'; // أيقونة زرقاء (معلومة)
            responsePayload.title = 'البيانات محدثة بالفعل';
            responsePayload.message = `لم يتم إضافة سجلات جديدة.\nجميع السجلات المختارة (${duplicatesCount}) موجودة مسبقاً في SAP.`;
        } 
        else if (successCount > 0 && duplicatesCount > 0) {
            // حالة: ميكس (شويه جديد وشويه قديم)
            responsePayload.icon = 'success'; 
            responsePayload.title = 'تم التحديث بنجاح';
            responsePayload.message = `✅ تم إضافة ${successCount} سجل جديد.\nℹ️ تم تخطي ${duplicatesCount} سجل لأنها موجودة مسبقاً.`;
        } 
        else if (successCount > 0 && duplicatesCount === 0) {
            // حالة: نجاح صافي (كله جديد)
            responsePayload.icon = 'success';
            responsePayload.title = 'عملية ناجحة';
            responsePayload.message = `✅ تم ترحيل جميع السجلات (${successCount}) بنجاح إلى SAP.`;
        } 
        else {
            // حالة نادرة (0 و 0)
            responsePayload.icon = 'warning';
            responsePayload.title = 'تنبيه';
            responsePayload.message = 'لم يقم SAP بإجراء أي تغييرات.';
        }

        res.json(responsePayload);

    } catch (error) {
        console.error("⛔ Error:", error);
        res.status(500).json({ success: false, icon: 'error', title: 'خطأ سيرفر', message: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server Ready at http://localhost:${PORT}`));