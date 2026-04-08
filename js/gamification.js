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
 *    requiredTotalEXP(level) = 100 × level^1.5
 *    → Level 1 :  100 EXP
 *    → Level 5 :  ~1118 EXP
 *    → Level 10 : ~3162 EXP
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
 * Total EXP required to REACH a given level from level 0.
 * Uses: required = 100 × level^1.5
 */
function expRequiredForLevel(level) {
    return Math.floor(100 * Math.pow(level, 1.5));
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
    const progress      = Math.round(((totalExp - expForCurrent) / (expForNext - expForCurrent)) * 100);
    const expToNext     = expForNext - totalExp;

    return { level, progress: Math.min(progress, 99), expToNext, totalExp, expForNext };
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
                Mental:    { 'Ders-90': 90, 'Makale-30': 30, 'Okuma-60': 60, 'Yabancı Dil-30': 30, 'Felsefe-60': 60 },
                Career:    { 'Kişisel Proje-90': 90, 'İş Arama-30': 30 },
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

    let globalExpSum = 0;
    let globalLevelSum = 0;

    for (const [cat, meta] of Object.entries(CATEGORIES)) {
        const totalExp = categoryTotals[cat] || 0;
        const levelData = computeLevel(totalExp);
        globalExpSum  += totalExp;
        globalLevelSum += levelData.level;

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

    // ── Global Level Card ────────────────────────────────────────────────
    const globalAvgLevel = Math.round(globalLevelSum / Object.keys(CATEGORIES).length);
    const globalLevelData = computeLevel(Math.round(globalExpSum / Object.keys(CATEGORIES).length));

    const globalCard = document.createElement('div');
    globalCard.className = 'level-card level-card-global';
    globalCard.style.setProperty('--cat-color', '#a78bfa');
    globalCard.style.setProperty('--cat-glow',  'rgba(167,139,250,0.6)');

    globalCard.innerHTML = `
        <div class="level-card-header">
            <span class="cat-icon">👑</span>
            <span class="cat-label">Global Karakter</span>
            <span class="cat-level-badge global-badge">LVL ${globalAvgLevel}</span>
        </div>
        <div class="level-card-body">
            <div class="exp-numbers">
                <span class="exp-current">${Math.round(globalExpSum / Object.keys(CATEGORIES).length)} <small>Ort. EXP</small></span>
                <span class="exp-next">→ ${globalLevelData.expForNext} EXP</span>
            </div>
            <div class="level-progress-track">
                <div class="level-progress-fill" style="width: 0%"
                     data-target="${globalLevelData.progress}"></div>
            </div>
            <div class="progress-label">
                <span>4 kategorinin ağırlıklı ortalaması</span>
                <span>${globalLevelData.progress}%</span>
            </div>
        </div>
    `;
    container.appendChild(globalCard);

    // Animate bars
    requestAnimationFrame(() => {
        setTimeout(() => {
            container.querySelectorAll('.level-progress-fill').forEach(bar => {
                bar.style.width = bar.dataset.target + '%';
            });
        }, 300);
    });

    // Update hero global level display
    const heroLevel = document.getElementById('userLevel');
    if (heroLevel) heroLevel.innerText = globalAvgLevel;
}

// ─── Radar Chart (ApexCharts) ─────────────────────────────────────────────────

function renderRadarChart(records) {
    if (records.length === 0) return;

    const todayData  = getTodayRadarData(records);
    const labels     = Object.keys(CATEGORIES);
    const seriesData = labels.map(cat => todayData[cat] || 0);
    const colors     = labels.map(cat => CATEGORIES[cat].color);

    const options = {
        series: [{ name: "Bugünkü Tamamlanma (%)", data: seriesData }],
        chart: {
            height: 360,
            type: 'radar',
            toolbar: { show: false },
            background: 'transparent',
            animations: { enabled: true, easing: 'easeinout', speed: 900 }
        },
        theme: { mode: 'dark' },
        labels,
        colors: ['#a78bfa'],
        stroke:  { width: 2.5, colors: ['#a78bfa'] },
        fill:    { opacity: 0.25, colors: ['#a78bfa'] },
        markers: { size: 5, colors: ['#fff'], strokeColors: '#a78bfa', strokeWidth: 2 },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors:      'rgba(255,255,255,0.07)',
                    connectorColors:   'rgba(255,255,255,0.07)',
                    fill: { colors: ['rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)'] }
                }
            }
        },
        yaxis: {
            min: 0,
            max: 100,
            tickAmount: 5,
            labels: {
                formatter: v => v.toFixed(0) + '%',
                style: { colors: ['#94a3b8'], fontSize: '11px' }
            }
        },
        xaxis: {
            labels: {
                style: { colors: labels.map(cat => CATEGORIES[cat].color), fontSize: '13px', fontWeight: 700 }
            }
        },
        tooltip: {
            y: { formatter: v => v + ' EXP puan' }
        }
    };

    const el = document.querySelector('#radarChart');
    if (!el) return;
    el.innerHTML = '';
    new ApexCharts(el, options).render();
}

// ─── Recent Efforts (son 5 gün) ───────────────────────────────────────────────

function renderRecentEfforts(recordsDesc) {
    const listDiv = document.getElementById('recentDaysList');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    recordsDesc.slice(0, 5).forEach(day => {
        const pct = getDailyOverallPct(day);

        const row = document.createElement('div');
        row.className = 'recent-day-row';
        row.innerHTML = `
            <div class="recent-day-header">
                <span><strong>${day.date}</strong> <span style="opacity:0.6; font-size:0.8rem">- ${day.name}</span></span>
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

    const heatmapData = recordsAsc.slice(-30).map(day => ({
        x: day.date.substring(5),
        y: getDailyOverallPct(day)
    }));

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
    const dates     = recent.map(d => d.date.substring(5));
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
    if (lvlEl) lvlEl.innerText = globalLvl;

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

    // SVG ring: circumference = 326.7, offset = circ * (1 - progress/100)
    const ring = document.getElementById('heroRingFill');
    if (ring) {
        const circ   = 326.7;
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

        const recordsDesc = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recordsAsc  = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));

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


        // ③ Radar chart (today's snapshot)
        renderRadarChart(recordsDesc);

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
