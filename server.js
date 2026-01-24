require('dotenv').config();
const express = require('express');
const app = express();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

app.use(express.json());

// إعدادات الاتصال
const BIOTIME_CONFIG = {
    url: process.env.BIOTIME_URL,
    username: process.env.BIOTIME_USER,
    password: process.env.BIOTIME_PASS
};

// الدوال
async function getBioTimeToken() {
    const formData = new URLSearchParams();
    formData.append("username", BIOTIME_CONFIG.username);
    formData.append("password", BIOTIME_CONFIG.password);
    const res = await fetch(`${BIOTIME_CONFIG.url}/jwt-api-token-auth/`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error("Login Failed");
    const data = await res.json();
    return `JWT ${data.token}`;
}

// الـ API
app.post('/api/fetch-preview', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const token = await getBioTimeToken();
        const url = `${BIOTIME_CONFIG.url}/iclock/api/transactions/?start_time=${startDate} 00:00:00&end_time=${endDate} 23:59:59&page_size=5000`;
        const response = await fetch(url, { headers: { "Authorization": token } });
        const json = await response.json();
        
        // تنسيق البيانات
        const records = (json.data || []).map(r => ({
            employeeName: r.first_name + " " + r.last_name,
            assignmentId: r.emp_code,
            originalTime: r.punch_time.split(' ')[1],
            timestampSAP: r.punch_time.replace(' ', 'T') + '+0200',
            typeCode: r.punch_state_display === "Check In" ? "P10" : "P20",
            location: r.area_alias || "Main"
        }));

        res.json({ success: true, records });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/api/send-sap', async (req, res) => {
    res.json({ success: true, count: req.body.records.length });
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;