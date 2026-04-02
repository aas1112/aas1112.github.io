// Gamification Dashboard Core logic
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Fetch Notion data
        const response = await fetch('gamification.json');
        if (!response.ok) throw new Error('Data could not be fetched');
        
        let records = await response.json();
        
        // Sort records by date ascending for charts, but keep descending copy
        const recordsDesc = [...records].sort((a,b) => new Date(b.date) - new Date(a.date));
        const recordsAsc = [...records].sort((a,b) => new Date(a.date) - new Date(b.date));

        if(recordsDesc.length === 0) {
            document.getElementById('loading').innerHTML = '<p>Henüz kayıt bulunamadı.</p>';
            return;
        }

        // Hide loading, show dashboard
        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';

        // 1. Calculate Player Stats
        calculatePlayerStats(recordsDesc);

        // 2. Render Recent Efforts Snapshot (Son 5 gün)
        renderRecentEfforts(recordsDesc);

        // 3. Render Radar Chart (Habit focus distribution)
        renderRadarChart(recordsDesc);

        // 4. Render Heatmap (Consistency)
        renderHeatmap(recordsAsc);

        // 5. Render Line Chart (Trend)
        renderTrendLine(recordsAsc);

    } catch (error) {
        console.error("Dashboard error:", error);
        document.getElementById('loading').innerHTML = `
            <i class="fas fa-exclamation-triangle fa-2x" style="color: #ef4444;"></i>
            <p style="margin-top: 10px;">Veriler yüklenirken bir hata oluştu.</p>
        `;
    }
});

function calculatePlayerStats(records) {
    // Toplam kayıt günü
    document.getElementById('userLevel').innerText = records.length;

    // Tüm zamanların başarı oranı
    let totalHabits = 0;
    let completedHabits = 0;

    records.forEach(day => {
        const habits = Object.values(day.habits);
        totalHabits += habits.length;
        completedHabits += habits.filter(h => h).length;
    });

    const percent = totalHabits === 0 ? 0 : Math.round((completedHabits / totalHabits) * 100);
    document.getElementById('userXP').innerText = percent;
}

function renderRecentEfforts(recordsDesc) {
    const listDiv = document.getElementById('recentDaysList');
    if (!listDiv) return;
    listDiv.innerHTML = '';
    
    // Al son 5 günü
    const recentRecords = recordsDesc.slice(0, 5);
    
    recentRecords.forEach(day => {
        const habitsEntries = Object.entries(day.habits);
        const total = habitsEntries.length;
        const completed = habitsEntries.filter(([_, val]) => val).length;
        
        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        const row = document.createElement('div');
        row.className = 'recent-day-row';
        
        // Use inline styles to make distinct but consistent progress bars
        row.innerHTML = `
            <div class="recent-day-header">
                <span><strong>${day.date}</strong> <span style="opacity:0.6; font-size:0.8rem">- ${day.name}</span></span>
                <span style="font-weight:700; color:#a78bfa; text-shadow: 0 0 5px rgba(167, 139, 250, 0.4);">${percentage}%</span>
            </div>
            <div class="progress-bar-container" style="height: 10px; margin-bottom: 0;">
                <div class="progress-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        listDiv.appendChild(row);
    });
}

function renderRadarChart(records) {
    if(records.length === 0) return;
    
    // RPG Stat Kategorileri ve Hangi Alışkanlıkları İçerdikleri
    const categories = {
        'Stamina': { completed: 0, total: 0 },
        'Career': { completed: 0, total: 0 },
        'Intelligence': { completed: 0, total: 0 },
        'Charisma': { completed: 0, total: 0 },
        'Willpower': { completed: 0, total: 0 }
    };

    const categoryMapping = {
        'Spor': 'Stamina',
        'Erken Kalkmak': 'Stamina',
        'İş-Proje': 'Career',
        'Ders': 'Career',
        'Yabancı Dil': 'Intelligence',
        'Felsefe': 'Intelligence',
        'Makale': 'Intelligence',
        'Sosyal': 'Charisma',
        'Bakım': 'Charisma',
        'Soğuk Duş': 'Willpower',
        'Gün Planı': 'Willpower',
        'Okuma': 'Willpower'
    };

    // Tüm günlerdeki verileri ilgili kategorilere göre topla
    records.forEach(day => {
        Object.entries(day.habits).forEach(([name, isDone]) => {
            const categoryName = categoryMapping[name];
            if (categoryName) {
                categories[categoryName].total++;
                if (isDone) categories[categoryName].completed++;
            }
        });
    });

    const labels = Object.keys(categories);
    const seriesData = labels.map(cat => {
        const stats = categories[cat];
        return Math.round((stats.completed / (stats.total || 1)) * 100);
    });

    var options = {
        series: [{
            name: 'Başarı Oranı (%)',
            data: seriesData,
        }],
        chart: {
            height: 350,
            type: 'radar',
            toolbar: { show: false },
            background: 'transparent'
        },
        theme: { mode: 'dark' },
        labels: labels,
        stroke: { width: 2, colors: ['#8b5cf6'] },
        fill: { opacity: 0.2, colors: ['#8b5cf6'] },
        markers: { size: 4, colors: ['#fff'], strokeColors: '#8b5cf6', strokeWidth: 2 },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 5,
            labels: {
                formatter: function(val) { return val.toFixed(0) + "%" }
            }
        }
    };

    var chart = new ApexCharts(document.querySelector("#radarChart"), options);
    chart.render();
}

function renderHeatmap(recordsAsc) {
    if(recordsAsc.length === 0) return;

    // Series format for heatmap: [{name: 'Gelişim', data: [{x: 'Date', y: count}]}]
    const heatmapData = [];
    recordsAsc.forEach(day => {
        const count = Object.values(day.habits).filter(v => v).length;
        heatmapData.push({
            x: day.date.substring(5), // YYYY-MM-DD -> MM-DD
            y: count
        });
    });

    // Chunk them if there are too many, or just show last 30
    const recentData = heatmapData.slice(-30);

    var options = {
        series: [{
            name: 'Tamamlanan',
            data: recentData
        }],
        chart: {
            height: 200,
            type: 'heatmap',
            toolbar: { show: false },
            background: 'transparent'
        },
        theme: { mode: 'dark' },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, name: 'Boş', color: 'rgba(255,255,255,0.05)' },
                        { from: 1, to: 3, name: 'Düşük', color: '#6366f1', opacity: 0.4 }, // Indigo
                        { from: 4, to: 7, name: 'Orta', color: '#8b5cf6', opacity: 0.7 }, // Violet
                        { from: 8, to: 20, name: 'Yüksek', color: '#ec4899', opacity: 1 } // Neon Pink
                    ]
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: { width: 1 }
    };

    var chart = new ApexCharts(document.querySelector("#heatmapChart"), options);
    chart.render();
}

function renderTrendLine(recordsAsc) {
    if(recordsAsc.length === 0) return;

    const dates = [];
    const percentages = [];

    recordsAsc.forEach(day => {
        const habits = Object.values(day.habits);
        const count = habits.filter(v => v).length;
        const total = habits.length;
        
        dates.push(day.date.substring(5));
        percentages.push(total === 0 ? 0 : Math.round((count/total)*100));
    });

    // Take last 30 to prevent crowding
    const recentDates = dates.slice(-30);
    const recentPercs = percentages.slice(-30);

    var options = {
        series: [{
            name: 'Günlük Başarım (%)',
            data: recentPercs
        }],
        chart: {
            height: 300,
            type: 'area',
            toolbar: { show: false },
            background: 'transparent'
        },
        theme: { mode: 'dark' },
        colors: ['#00d4ff'],
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.7,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { categories: recentDates }
    };

    var chart = new ApexCharts(document.querySelector("#lineChart"), options);
    chart.render();
}
