// انتظر حتى تحميل الصفحة بالكامل
document.addEventListener('DOMContentLoaded', function() {

    // المتغيرات العامة
    let startDate = new Date().toISOString().split('T')[0];
    let endDate = new Date().toISOString().split('T')[0];
    let fullData = [];
    let chartInstance = null;

    // 1. تشغيل الكليندر (Flatpickr)
    flatpickr("#dateRange", {
        mode: "range",              // تفعيل وضع المدى (من - إلى)
        dateFormat: "Y-m-d",        // صيغة التاريخ
        defaultDate: [new Date(), new Date()], // الافتراضي: اليوم
        locale: { rangeSeparator: "  إلى  " }, // الفاصل بين التاريخين
        onChange: function(selectedDates, dateStr, instance) {
            if (selectedDates.length > 0) {
                // ضبط فرق التوقيت
                const offset = selectedDates[0].getTimezoneOffset() * 60000;
                startDate = new Date(selectedDates[0].getTime() - offset).toISOString().split('T')[0];
                
                if (selectedDates.length === 2) {
                    endDate = new Date(selectedDates[1].getTime() - offset).toISOString().split('T')[0];
                } else {
                    endDate = startDate;
                }
                console.log("Selected:", startDate, "to", endDate);
            }
        }
    });

    // 2. دالة جلب البيانات
    window.fetchData = async function() {
        if (!startDate) {
            Swal.fire('تنبيه', 'الرجاء اختيار التاريخ', 'warning');
            return;
        }

        Swal.fire({ 
            title: 'جاري الاتصال...',
            text: `جلب من ${startDate} إلى ${endDate}`,
            didOpen: () => Swal.showLoading() 
        });

        try {
            const res = await fetch('/api/fetch-preview', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ startDate, endDate })
            });
            
            const result = await res.json();
            Swal.close();

            if (result.success) {
                fullData = result.records;
                
                // إظهار القسم المخفي
                const dash = document.getElementById('dashboardArea');
                dash.classList.remove('hidden');
                dash.style.display = 'block'; // تأكيد الإظهار

                updateUI(fullData);
                populateFilters();
                renderChart(fullData);
                
                Swal.fire({ icon: 'success', title: 'تم', text: `تم جلب ${fullData.length} سجل` });
            } else {
                Swal.fire('خطأ', result.message, 'error');
            }
        } catch (e) { 
            console.error(e);
            Swal.fire('خطأ', 'تأكد من تشغيل السيرفر (node server.js)', 'error'); 
        }
    };

    // دوال المساعدة (UI Helpers)
    function updateUI(data) {
        document.getElementById('totalCount').innerText = data.length;
        document.getElementById('inCount').innerText = data.filter(x => x.typeCode === 'P10').length;
        document.getElementById('outCount').innerText = data.filter(x => x.typeCode === 'P20').length;
        
        const tbody = document.getElementById('tableBody');
        tbody.innerHTML = '';
        data.forEach((rec, idx) => {
            const dateOnly = rec.timestampSAP.split('T')[0];
            tbody.innerHTML += `
                <tr>
                    <td><input type="checkbox" class="row-check" checked data-idx="${idx}"></td>
                    <td><b>${rec.employeeName}</b><br><small>${rec.assignmentId}</small></td>
                    <td>${rec.originalTime}</td>
                    <td>${dateOnly}</td>
                    <td><span class="badge ${rec.typeCode}">${rec.typeCode === 'P10' ? 'Check In' : 'Check Out'}</span></td>
                    <td>${rec.location}</td>
                </tr>`;
        });
    }

    function populateFilters() {
        const locs = [...new Set(fullData.map(r => r.location))];
        const sel = document.getElementById('filterLocation');
        sel.innerHTML = '<option value="all">كل المواقع</option>';
        locs.forEach(l => sel.innerHTML += `<option value="${l}">${l}</option>`);
    }

    window.applyFilters = function() {
        const loc = document.getElementById('filterLocation').value;
        const filtered = loc === 'all' ? fullData : fullData.filter(r => r.location === loc);
        updateUI(filtered);
    };

    window.sendToSAP = async function() {
        const checks = document.querySelectorAll('.row-check:checked');
        if (checks.length === 0) return Swal.fire('تنبيه', 'اختر سجلاً واحداً على الأقل', 'warning');

        const selectedRecords = Array.from(checks).map(c => fullData[c.dataset.idx]);
        
        Swal.fire({ title: 'جاري الإرسال...', didOpen: () => Swal.showLoading() });

        try {
            const res = await fetch('/api/send-sap', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ records: selectedRecords })
            });
            const result = await res.json();
            
            if (result.success) {
                Swal.fire('نجاح', `تم ترحيل ${result.count} سجل!`, 'success');
            } else {
                Swal.fire('فشل', result.message, 'error');
            }
        } catch (e) { Swal.fire('خطأ', 'فشل الشبكة', 'error'); }
    };

    window.toggleAll = function(src) {
        document.querySelectorAll('.row-check').forEach(c => c.checked = src.checked);
    };

    function renderChart(data) {
        const ctx = document.getElementById('attendanceChart').getContext('2d');
        const days = {};
        data.forEach(d => { 
            const day = d.timestampSAP.split('T')[0]; 
            days[day] = (days[day] || 0) + 1; 
        });
        
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Object.keys(days),
                datasets: [{ 
                    label: 'نشاط الحضور', 
                    data: Object.values(days), 
                    borderColor: '#007aff',
                    backgroundColor: 'rgba(0,122,255,0.2)',
                    fill: true 
                }]
            },
            options: { responsive: true, plugins: { legend: { display: false } } }
        });
    }
});