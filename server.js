require('dotenv').config();
const express = require('express');
const path = require('path'); // استدعاء مكتبة المسارات
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());

// === تصحيح المسار (البوصلة) ===
// السطر ده بيقول: ملفات الموقع موجودة في فولدر اسمه public جنب ملف السيرفر
app.use(express.static(path.join(__dirname, 'public')));

// === التوجيه الإجباري ===
// لو حد طلب الصفحة الرئيسية، ابعتله index.html غصب عنه
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'public', 'index.html');
    res.sendFile(indexPath);
});

// ==========================================
// باقي كود الـ API زي ما هو (بدون تغيير)
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
    
    // إضافة Timeout عشان لو السيرفر طول ميعلقش
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 ثواني

    try {
        const res = await fetch(`${BIOTIME_CONFIG.url}/jwt-api-token-auth/`, { 
            method: 'POST', 
            body: formData,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error("فشل الاتصال بـ BioTime - تأكد من البيانات");
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
        console.log(`Fetching from ${startDate} to ${endDate}...`); 

        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        
        const response = await fetch(url, { headers: { "Authorization": token } });
        const json = await response.json();
        
        const records = (json.data || []).map(r => ({
            employeeName: r.first_name + " " + r.last_name,
            assignmentId: r.emp_code,
            originalTime: r.punch_time.split(' ')[1],
            timestampSAP: r.punch_time.replace(' ', 'T') + '+0200',
            typeCode: r.punch_state_display === "Check In" ? "P10" : "P20",
            location: r.area_alias || "Main Office"
        }));

        res.json({ success: true, records });
    } catch (error) {
        console.error("API Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/send-sap', async (req, res) => {
    res.json({ success: true, count: req.body.records.length });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));