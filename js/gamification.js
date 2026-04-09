/**
 * ═══════════════════════════════════════════════════════════════════
 *  Gamification Dashboard  ·  Level / EXP Engine  ·  v2.0
 *  Author: AAS1112
 * ═══════════════════════════════════════════════════════════════════
 *
 *  Categories & max daily minutes
 *  ─────────────────────────────────────────────────────────────────
 *  Mental    (Zihinsel)  : Ders-90, Makale-30, Okuma-60, Yabancı Dil-30, Felsefe-60   → 270 dk
 *  Career    (Kariyer)   : Kişisel Proje-90, İş Arama-30                               → 120 dk
 *  Stamina   (Fiziksel)  : Spor-180, Soğuk Duş-15, Bakım-15                           → 210 dk
 *  Willpower (İrade)     : Sosyal-75, Gün Planı-15                                     → 90 dk
 *
 *  Normalised EXP formula (per day, per category):
 *    EXP = round( (completedMinutes / maxMinutes) × 100 )
 *
 *  Levelling curve (exponential):
 *    requiredTotalEXP(level) = 100 × (level-1)^1.5
 *    → Level 1 :  0 EXP (Başlangıç)
 *    → Level 2 :  100 EXP
 *    → Level 3 :  ~282 EXP
 *    → Level 10:  ~2700 EXP
 */

// ─── Category meta ──────────────────────────────────────────────────────────
const CATEGORIES = {
    Mental:    { label: 'Mental',    icon: '🧠', color: '#818cf8', glow: 'rgba(129,140,248,0.5)', maxMinutes: 270 },
    Career:    { label: 'Career',    icon: '⚡', color: '#34d399', glow: 'rgba(52,211,153,0.5)',  maxMinutes: 120 },
    Stamina:   { label: 'Stamina',   icon: '🔥', color: '#f472b6', glow: 'rgba(244,114,182,0.5)', maxMinutes: 210 },
    Willpower: { label: 'Willpower', icon: '🛡️', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)',  maxMinutes: 90  },
};

// ─── Levelling helpers ───────────────────────────────────────────────────────

/**
 * Total EXP required to REACH a given level from level 1.
 * Uses: required = 100 × (level-1)^1.5
 */
function expRequiredForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
}

/**
 * Given accumulated EXP, compute { level, progress, expToNext, totalForNext }.
 */
function computeLevel(totalExp) {
    let level = 1;
    while (expRequiredForLevel(level + 1) <= totalExp) {
        level++;
    }
    const expForCurrent = expRequiredForLevel(level);
    const expForNext    = expRequiredForLevel(level + 1);
    
    // Prevent negative progress or divide by zero
    let progress = 0;
    if (expForNext > expForCurrent) {
        progress = Math.round(((totalExp - expForCurrent) / (expForNext - expForCurrent)) * 100);
    }
    progress = Math.max(0, Math.min(progress, 99)); // Clamp between 0 and 99
    
    const expToNext     = expForNext - totalExp;

    return { level, progress, expToNext, totalExp, expForNext };
}

/**
 * Maps a global level number to a Turkish RPG title.
 */
function levelTitle(globalLevel) {
    if (globalLevel <= 2)  return 'Acemi 🌱';
    if (globalLevel <= 5)  return 'Deneyimli ⚔️';
    if (globalLevel <= 9)  return 'Uzman 💫';
    if (globalLevel <= 14) return 'Usta 🔥';
    if (globalLevel <= 19) return 'Elit ⚡';
    if (globalLevel <= 29) return 'Efsanevi 👑';
    return 'Tanrısal 🌌';
}

// ─── Aggregate category EXPs from all records ────────────────────────────────

function aggregateCategoryEXP(records) {
    const totals = {};
    for (const cat of Object.keys(CATEGORIES)) totals[cat] = 0;

    for (const day of records) {
        // Prefer the pre-computed `categories` field (from Python backend)
        if (day.categories) {
            for (const cat of Object.keys(CATEGORIES)) {
                totals[cat] += (day.categories[cat]?.exp || 0);
            }
        } else {
            // Fallback: compute from raw habits using CATEGORY_TASKS
            // (in case JSON is old format)
            const raw = day.habits || {};
            const FALLBACK = {
                Mental:    { 'Ders-90': 90, 'Makale-30': 30, 'Okuma-60': 60, 'Yabancı Dil-30': 30, 'Felsefe-60': 60, 'Mühendislik Haberleri-30': 30 },
                Career:    { 'Kişisel Proje-90': 90, 'İş Arama-30': 30, 'Proje Fikri-30': 30 },
                Stamina:   { 'Spor-180': 180, 'Soğuk Duş-15': 15, 'Bakım-15': 15 },
                Willpower: { 'Sosyal-75': 75, 'Gün Planı-15': 15 },
            };
            for (const [cat, tasks] of Object.entries(FALLBACK)) {
                const maxMins  = Object.values(tasks).reduce((a, b) => a + b, 0);
                const doneMins = Object.entries(tasks)
                    .filter(([name]) => raw[name])
                    .reduce((sum, [, mins]) => sum + mins, 0);
                totals[cat] += Math.round((doneMins / maxMins) * 100);
            }
        }
    }

    return totals; // { Mental: 350, Career: 210, ... }
}

// ─── Compute today's radar data (percentage per category) ─────────────────────

function getTodayRadarData(records) {
    if (records.length === 0) return {};
    const today = records[0]; // already sorted descending
    const result = {};

    for (const cat of Object.keys(CATEGORIES)) {
        if (today.categories) {
            result[cat] = today.categories[cat]?.exp || 0;
        } else {
            result[cat] = 0;
        }
    }
    return result;
}

// ─── Overall daily completion (for existing charts) ──────────────────────────

function getDailyOverallPct(day) {
    if (day.categories) {
        const vals = Object.values(day.categories).map(c => c.exp);
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    const habits = Object.values(day.habits || {});
    if (habits.length === 0) return 0;
    return Math.round((habits.filter(Boolean).length / habits.length) * 100);
}

// ════════════════════════════════════════════════════════════════════
//  RENDER FUNCTIONS
// ════════════════════════════════════════════════════════════════════

// ─── Level Cards ─────────────────────────────────────────────────────────────

function renderLevelCards(categoryTotals) {
    const container = document.getElementById('levelCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    for (const [cat, meta] of Object.entries(CATEGORIES)) {
        const totalExp = categoryTotals[cat] || 0;
        const levelData = computeLevel(totalExp);

        const card = document.createElement('div');
        card.className = 'level-card';
        card.style.setProperty('--cat-color', meta.color);
        card.style.setProperty('--cat-glow',  meta.glow);

        card.innerHTML = `
            <div class="level-card-header">
                <span class="cat-icon">${meta.icon}</span>
                <span class="cat-label">${meta.label}</span>
                <span class="cat-level-badge">LVL ${levelData.level}</span>
            </div>
            <div class="level-card-body">
                <div class="exp-numbers">
                    <span class="exp-current">${totalExp} <small>EXP</small></span>
                    <span class="exp-next">→ ${levelData.expForNext} EXP</span>
                </div>
                <div class="level-progress-track">
                    <div class="level-progress-fill" style="width: 0%"
                         data-target="${levelData.progress}"></div>
                </div>
                <div class="progress-label">
                    <span>Sonraki level: <strong>${levelData.expToNext} EXP</strong> kaldı</span>
                    <span>${levelData.progress}%</span>
                </div>
            </div>
        `;
        container.appendChild(card);
    }

    // Animate bars
    requestAnimationFrame(() => {
        setTimeout(() => {
            container.querySelectorAll('.level-progress-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 300);
    });
}

// ─── Hero mini category bars ─────────────────────────────────────────────────

function renderHeroCatBars(categoryTotals) {
    const container = document.getElementById('heroCatBars');
    if (!container) return;
    container.innerHTML = '';

    for (const [cat, meta] of Object.entries(CATEGORIES)) {
        const totalExp  = categoryTotals[cat] || 0;
        const levelData = computeLevel(totalExp);

        const bar = document.createElement('div');
        bar.className = 'hero-cat-bar-row';
        bar.innerHTML = `
            <div class="hcb-meta">
                <span class="hcb-icon">${meta.icon}</span>
                <span class="hcb-name">${meta.label}</span>
                <span class="hcb-lvl" style="color:${meta.color}">LVL ${levelData.level}</span>
            </div>
            <div class="hcb-track">
                <div class="hcb-fill" style="width:0%; background:${meta.color};
                     box-shadow:0 0 8px ${meta.glow};"
                     data-target="${levelData.progress}"></div>
            </div>
        `;
        container.appendChild(bar);
    }

    requestAnimationFrame(() => {
        setTimeout(() => {
            container.querySelectorAll('.hcb-fill').forEach(f => {
                f.style.width = f.dataset.target + '%';
            });
        }, 500);
    });
}


// ─── Radar Chart (ApexCharts) ─────────────────────────────────────────────────

function renderRadarChart(categoryTotals) {
    const labels     = Object.keys(CATEGORIES);
    const seriesData = labels.map(cat => computeLevel(categoryTotals[cat] || 0).level);
    const colors     = labels.map(cat => CATEGORIES[cat].color);

    // Find the max level to set the radar axis properly
    const maxLevel   = Math.max(...seriesData, 5);

    const options = {
        series: [{ name: "Yetenek Seviyesi", data: seriesData }],
        chart: {
            height: 480, // Increased height for larger container
            type: 'radar',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 900 },
            parentHeightOffset: 0
        },
        theme: { mode: 'dark' },
        labels,
        colors: ['#a78bfa'],
        stroke:  { width: 2.5, colors: ['#a78bfa'] },
        fill:    { opacity: 0.25, colors: ['#a78bfa'] },
        markers: { size: 5, colors: ['#fff'], strokeColors: '#a78bfa', strokeWidth: 2 },
        plotOptions: {
            radar: {
                size: 130, // Reduced from 180 to fit labels horizontally and prevent clipping
                polygons: {
                    strokeColors:      'rgba(255,255,255,0.07)',
                    connectorColors:   'rgba(255,255,255,0.07)',
                    fill: { colors: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] }
                }
            }
        },
        yaxis: {
            min: 0,
            max: maxLevel + 1,
            tickAmount: maxLevel + 1,
            labels: {
                formatter: v => Math.floor(v),
                style: { colors: ['#94a3b8'], fontSize: '11px' }
            }
        },
        xaxis: {
            labels: {
                style: { colors: labels.map(cat => CATEGORIES[cat].color), fontSize: '14px', fontWeight: 700 }
            }
        },
        tooltip: {
            y: { formatter: v => 'Level ' + v }
        }
    };

    const el = document.querySelector('#radarChart');
    if (!el) return;
    el.innerHTML = '';
    
    // Change heading title to reflect total logic
    const titleEl = el.parentElement.querySelector('h2');
    if (titleEl) {
        titleEl.innerHTML = '<i class="fas fa-spider"></i> Karakter Yetenek Dağılımı';
    }

    new ApexCharts(el, options).render();
}

// ─── Recent Efforts (son 5 gün) ───────────────────────────────────────────────

function renderRecentEfforts(recordsDesc) {
    const listDiv = document.getElementById('recentDaysList');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    recordsDesc.slice(0, 7).forEach(day => {
        const pct = getDailyOverallPct(day);

        // API'den gelen day.date ayni olabilir, bu yuzden de day.name (asıl gün adı YYYY-MM-DD olarak gelir) kontrol edelim.
        const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(day.name) ? day.name : day.date;
        const d = new Date(dateStr);
        const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        
        const isToday = new Date().toISOString().split('T')[0] === dateStr;
        const dayName = isToday ? 'Bugün' : dayNames[d.getDay()];
        const formattedDate = `${d.getDate().toString().padStart(2, '0')} ${monthNames[d.getMonth()]}`;

        const subLabel = dateStr !== day.name ? day.name : day.date; // Use the other string as small sublabel

        const row = document.createElement('div');
        row.className = 'recent-day-row';
        row.innerHTML = `
            <div class="recent-day-header">
                <span><strong style="font-size: 1.05em; font-weight: 700;">${dayName}</strong> <span style="opacity:0.6; font-size:0.8rem; margin-left: 6px;">${formattedDate}</span> <span style="opacity:0.4; font-size:0.75rem; margin-left: 4px;">• ${subLabel}</span></span>
                <span style="font-weight:700; color:#a78bfa; text-shadow: 0 0 5px rgba(167,139,250,0.4);">${pct}%</span>
            </div>
            <div class="progress-bar-container" style="height: 10px; margin-bottom: 0;">
                <div class="progress-bar-fill" style="width: 0%" data-target="${pct}"></div>
            </div>
        `;
        listDiv.appendChild(row);
    });

    requestAnimationFrame(() => {
        setTimeout(() => {
            listDiv.querySelectorAll('.progress-bar-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 400);
    });
}

// ─── Heatmap ─────────────────────────────────────────────────────────────────

function renderHeatmap(recordsAsc) {
    if (recordsAsc.length === 0) return;

    const heatmapData = recordsAsc.slice(-30).map(day => {
        const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(day.name) ? day.name : day.date;
        return {
            x: dateStr.substring(5),
            y: getDailyOverallPct(day)
        };
    });

    const options = {
        series: [{ name: 'Genel Tamamlanma', data: heatmapData }],
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
                        { from: 0,  to: 0,   name: 'Boş',   color: 'rgba(255,255,255,0.04)' },
                        { from: 1,  to: 35,  name: 'Düşük', color: '#6366f1' },
                        { from: 36, to: 69,  name: 'Orta',  color: '#8b5cf6' },
                        { from: 70, to: 100, name: 'Yüksek',color: '#ec4899' }
                    ]
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: { width: 1 }
    };

    const el = document.querySelector('#heatmapChart');
    if (!el) return;
    el.innerHTML = '';
    new ApexCharts(el, options).render();
}

// ─── Trend Line ───────────────────────────────────────────────────────────────

function renderTrendLine(recordsAsc) {
    if (recordsAsc.length === 0) return;

    const recent    = recordsAsc.slice(-30);
    const dates     = recent.map(d => {
        const dateStr = /^\d{4}-\d{2}-\d{2}$/.test(d.name) ? d.name : d.date;
        return dateStr.substring(5);
    });
    const percents  = recent.map(d => getDailyOverallPct(d));

    const options = {
        series: [{ name: 'Günlük Başarım (%)', data: percents }],
        chart: {
            height: 300,
            type: 'area',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 800 }
        },
        theme: { mode: 'dark' },
        colors: ['#00d4ff'],
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 1, opacityFrom: 0.6, opacityTo: 0.05, stops: [0, 90, 100] }
        },
        dataLabels: { enabled: false },
        stroke: { curve: 'smooth', width: 2 },
        xaxis: {
            categories: dates,
            labels: { style: { colors: '#94a3b8', fontSize: '11px' } }
        },
        yaxis: {
            min: 0,
            max: 100,
            labels: {
                formatter: v => v + '%',
                style: { colors: '#94a3b8' }
            }
        },
        tooltip: { y: { formatter: v => v + '%' } }
    };

    const el = document.querySelector('#lineChart');
    if (!el) return;
    el.innerHTML = '';
    new ApexCharts(el, options).render();
}

// ─── Player stats header + hero character card ────────────────────────────────

function calculatePlayerStats(records) {
    // Days tracked
    const dayEl = document.getElementById('userLevel');
    if (dayEl) dayEl.innerText = records.length;

    // Overall avg completion rate
    let total = 0, sum = 0;
    records.forEach(day => {
        sum += getDailyOverallPct(day);
        total++;
    });
    const avg = total === 0 ? 0 : Math.round(sum / total);
    const xpEl = document.getElementById('userXP');
    if (xpEl) xpEl.innerText = avg;
}

function updateHeroCharacterCard(categoryTotals) {
    // Compute global average EXP and level
    const cats       = Object.keys(CATEGORIES);
    const avgExp     = Math.round(cats.reduce((s, c) => s + (categoryTotals[c] || 0), 0) / cats.length);
    const levelData  = computeLevel(avgExp);
    const globalLvl  = Math.round(cats.reduce((s, c) => s + computeLevel(categoryTotals[c] || 0).level, 0) / cats.length);

    // Level number
    const lvlEl = document.getElementById('heroGlobalLevel');
    if (lvlEl) {
        lvlEl.innerText = globalLvl;
        // Entrance animation
        lvlEl.style.transform = 'scale(0.6)';
        lvlEl.style.opacity = '0';
        requestAnimationFrame(() => {
            setTimeout(() => {
                lvlEl.style.transition = 'transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease';
                lvlEl.style.transform = 'scale(1)';
                lvlEl.style.opacity = '1';
            }, 200);
        });
    }

    // Dynamic title label
    const titleEl = document.getElementById('heroTitleLabel');
    if (titleEl) titleEl.innerText = levelTitle(globalLvl);

    // EXP text
    const expEl = document.getElementById('heroGlobalExp');
    if (expEl) expEl.innerText = avgExp + ' EXP';

    // XP progress bar
    const fill = document.getElementById('heroXpFill');
    const pct  = document.getElementById('heroXpPct');
    const next = document.getElementById('heroXpToNext');
    if (fill) {
        requestAnimationFrame(() => {
            setTimeout(() => { fill.style.width = levelData.progress + '%'; }, 300);
        });
    }
    if (pct)  pct.innerText  = levelData.progress + '%';
    if (next) next.innerText = levelData.expToNext + ' EXP kaldı';

    // SVG ring: circumference for r=88 → 2π×88 ≈ 553
    const ring = document.getElementById('heroRingFill');
    if (ring) {
        const circ   = 553;
        const offset = circ * (1 - levelData.progress / 100);
        requestAnimationFrame(() => {
            setTimeout(() => { ring.style.strokeDashoffset = offset; }, 400);
        });
    }
}

// ════════════════════════════════════════════════════════════════════
//  BOOT
// ════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('gamification.json');
        if (!response.ok) throw new Error('Data could not be fetched');

        const records = await response.json();

        const recordsWithSortDate = records.map(r => {
            const robustDate = /^\d{4}-\d{2}-\d{2}$/.test(r.name) ? r.name : r.date;
            return { ...r, _sortDate: robustDate };
        });

        const recordsDesc = [...recordsWithSortDate].sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate));
        const recordsAsc  = [...recordsWithSortDate].sort((a, b) => new Date(a._sortDate) - new Date(b._sortDate));

        if (recordsDesc.length === 0) {
            document.getElementById('loading').innerHTML = '<p>Henüz kayıt bulunamadı.</p>';
            return;
        }

        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';

        // ① Calculate overall player stats
        calculatePlayerStats(recordsDesc);

        // ② Aggregate EXP per category and render level cards
        const categoryTotals = aggregateCategoryEXP(recordsDesc);
        renderLevelCards(categoryTotals);
        updateHeroCharacterCard(categoryTotals);


        // ③ Radar chart (overall Character Build)
        renderRadarChart(categoryTotals);

        // ④ Recent 5 days
        renderRecentEfforts(recordsDesc);

        // ⑤ Heatmap
        renderHeatmap(recordsAsc);

        // ⑥ Trend line
        renderTrendLine(recordsAsc);

    } catch (error) {
        console.error('Dashboard error:', error);
        document.getElementById('loading').innerHTML = `
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444;"></i>
            <p style="margin-top:10px;">Veriler yüklenirken bir hata oluştu: ${error.message}</p>
        `;
    }
});
