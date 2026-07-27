/* ═══════════════════════════════════════════════════════════════════
   Gamification Engine v4.0 — Scorpio-Eagle Metamorphosis & RPG Upgrades
   Notion API → Gamification JSON → Interactive Retro RPG HUD
 ═══════════════════════════════════════════════════════════════════ */

const CATEGORIES = {
    Career:    { name: 'Kariyer & Mühendislik', icon: '⚡', color: '#06b6d4', targetMins: 540 },
    Mental:    { name: 'Zihin & Gelişim',      icon: '🧠', color: '#a855f7', targetMins: 60 },
    Stamina:   { name: 'Fiziksel & Efor',      icon: '🔥', color: '#ec4899', targetMins: 45 },
    Willpower: { name: 'İrade & Temiz Yaşam',  icon: '🛡️', color: '#10b981', targetMins: 90 },
};

/**
 * Exponential EXP Level Formula:
 * EXP required for level N = 100 * (N - 1)^1.5
 */
function expRequiredForLevel(level) {
    if (level <= 1) return 0;
    return Math.floor(100 * Math.pow(level - 1, 1.5));
}

function computeLevel(totalExp) {
    let level = 1;
    while (expRequiredForLevel(level + 1) <= totalExp) {
        level++;
    }
    const expForCurrent = expRequiredForLevel(level);
    const expForNext    = expRequiredForLevel(level + 1);
    
    let progress = 0;
    if (expForNext > expForCurrent) {
        progress = Math.round(((totalExp - expForCurrent) / (expForNext - expForCurrent)) * 100);
    }
    progress = Math.max(0, Math.min(progress, 99));
    const expToNext = expForNext - totalExp;

    return { level, progress, expToNext, totalExp, expForNext };
}

/**
 * Astrological Scorpio to Eagle Metamorphosis titles
 */
function levelTitle(globalLevel) {
    if (globalLevel <= 2)  return 'CYBER ENGINEER · STAGE I';
    if (globalLevel <= 4)  return 'CYBER ENGINEER · STAGE II';
    if (globalLevel <= 7)  return 'SYSTEM ARCHITECT · STAGE III';
    if (globalLevel <= 12) return 'PRINCIPAL ENGINEER · STAGE IV';
    return 'CORE MASTER · STAGE V';
}

// ─── Aggregate category EXPs from all records ────────────────────────────────

function aggregateCategoryEXP(records) {
    const totals = {};
    for (const cat of Object.keys(CATEGORIES)) totals[cat] = 0;

    for (const day of records) {
        if (day.categories) {
            for (const cat of Object.keys(CATEGORIES)) {
                totals[cat] += (day.categories[cat]?.exp || 0);
            }
        }
    }
    return totals;
}

function getTodayRadarData(records) {
    if (records.length === 0) return {};
    const today = records[0];
    const result = {};
    for (const cat of Object.keys(CATEGORIES)) {
        result[cat] = today.categories ? (today.categories[cat]?.exp || 0) : 0;
    }
    return result;
}

function getDailyOverallPct(day) {
    if (day.categories) {
        const vals = Object.values(day.categories).map(c => c.exp);
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    }
    return 0;
}

// ─── Player Overall Stats Calculation ───────────────────────────────────────

function calculatePlayerStats(records) {
    const dayEl = document.getElementById('userLevel');
    if (dayEl) dayEl.innerText = records.length;

    let total = 0, sum = 0;
    records.forEach(day => {
        sum += getDailyOverallPct(day);
        total++;
    });
    const avg = total === 0 ? 0 : Math.round(sum / total);
    const xpEl = document.getElementById('userXP');
    if (xpEl) xpEl.innerText = avg;
}

// ─── Render Today's RPG Quest Breakdown ────────────────────────────────────

function renderTodayQuests(recordsDesc) {
    const container = document.getElementById('todayQuestsGrid');
    const dateTag   = document.getElementById('todayDateTag');
    if (!container || recordsDesc.length === 0) return;

    const latest = recordsDesc[0];
    if (dateTag) dateTag.innerText = latest.name || latest.date || 'BUGÜN';

    const numbers = latest.numbers || {};
    const cats    = latest.categories || {};
    const habits  = latest.habits || {};

    const careerDone  = numbers['Kariyer & Mühendislik (Dk)'] ?? cats.Career?.completedMinutes ?? 0;
    const mentalDone  = numbers['Zihin & Gelişim (Dk)'] ?? cats.Mental?.completedMinutes ?? 0;
    const staminaDone = numbers['Fiziksel & Efor (Dk)'] ?? cats.Stamina?.completedMinutes ?? 0;

    const willpowerCheckedCount = Object.entries(habits)
        .filter(([k, v]) => v && ['sigara', 'soul', 'bakım', 'bakim'].some(t => k.toLowerCase().includes(t)))
        .length;

    const quests = [
        {
            icon: '⚡',
            title: 'Kariyer & Mühendislik',
            val: `${careerDone} / 540 Dk`,
            xp: `${cats.Career?.exp || 0} EXP`,
            isDone: careerDone >= 540
        },
        {
            icon: '🧠',
            title: 'Zihin & Gelişim',
            val: `${mentalDone} / 60 Dk`,
            xp: `${cats.Mental?.exp || 0} EXP`,
            isDone: mentalDone >= 60
        },
        {
            icon: '🔥',
            title: 'Fiziksel & Efor',
            val: `${staminaDone} / 45 Dk`,
            xp: `${cats.Stamina?.exp || 0} EXP`,
            isDone: staminaDone >= 45
        },
        {
            icon: '🛡️',
            title: 'İrade & Temiz Yaşam',
            val: `${willpowerCheckedCount > 0 ? willpowerCheckedCount + ' Kalkan Aktif' : 'Beklemede'}`,
            xp: `${cats.Willpower?.exp || 0} EXP`,
            isDone: (cats.Willpower?.exp || 0) >= 30
        }
    ];

    container.innerHTML = '';
    quests.forEach(q => {
        const card = document.createElement('div');
        card.className = 'quest-item-card';
        card.innerHTML = `
            <div class="qic-top">
                <span class="qic-title"><span>${q.icon}</span> ${q.title}</span>
                <span class="qic-xp-tag">+${q.xp}</span>
            </div>
            <div class="qic-val">
                ${q.isDone ? '<span style="color:#10b981;font-weight:700;">TAMAMLANDI ⚔️</span>' : q.val}
            </div>
        `;
        container.appendChild(card);
    });
}

function updateHeroCharacterCard(categoryTotals) {
    const cats       = Object.keys(CATEGORIES);
    const totalExp   = Object.values(categoryTotals).reduce((s, val) => s + val, 0);
    window._lastGlobalExp = totalExp;

    const avgExp     = Math.round(totalExp / cats.length);
    const levelData  = computeLevel(avgExp);
    const globalLvl  = Math.round(cats.reduce((s, c) => s + computeLevel(categoryTotals[c] || 0).level, 0) / cats.length);

    const lvlEl = document.getElementById('heroGlobalLevel');
    if (lvlEl) lvlEl.innerText = globalLvl;

    const titleEl = document.getElementById('heroTitleLabel');
    if (titleEl) titleEl.innerText = levelTitle(globalLvl);

    const expEl = document.getElementById('heroGlobalExp');
    if (expEl) expEl.innerText = avgExp + ' EXP';

    const fill = document.getElementById('heroXpFill');
    const next = document.getElementById('heroXpToNext');
    if (fill) fill.style.width = levelData.progress + '%';
    if (next) next.innerText = levelData.expToNext + ' EXP kaldı';

    // Update Gold Vault & Equipment levels
    updateGoldAndInventory(totalExp);
}

// ─── Render Minecraft Heart Containers ─────────────────────────────────────

function renderHearts(categoryTotals) {
    const willpowerExp = categoryTotals['Willpower'] || 0;
    const willpowerLvl = computeLevel(willpowerExp).level;
    const container = document.getElementById('heroHeartsContainer');
    if (!container) return;

    const activeHearts = Math.min(5, Math.max(1, 1 + willpowerLvl));
    container.innerHTML = '';

    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('span');
        heart.className = `pixel-heart ${i < activeHearts ? 'filled' : 'empty'}`;
        heart.innerText = '❤️';
        container.appendChild(heart);
    }
}

// ─── GOLD VAULT & ITEM UPGRADES SYSTEM ────────────────────────────────────

const ITEM_CONFIGS = {
    weapon: { name: 'Redstone Kılıcı', icon: '⚔️', desc: 'Kariyer ve Mühendislik eforunuzu simgeler.', baseCost: 50, bonusPerLvl: '+15% EXP Boost' },
    shield: { name: 'İrade Kalkanı', icon: '🛡️', desc: 'Sigarasız yaşam ve irade kalkanınızı korur.', baseCost: 50, bonusPerLvl: '+20% Willpower Boost' },
    helm:   { name: 'Bilgelik Tacı', icon: '🎓', desc: 'Zihin ve kitap okuma gücünüzü temsil eder.', baseCost: 50, bonusPerLvl: '+15% Mental Boost' },
    boots:  { name: 'Efor Çizmeleri', icon: '👟', desc: 'Fiziksel dayanıklılık ve spor hızınızı artırır.', baseCost: 50, bonusPerLvl: '+15% Stamina Boost' },
    ring:   { name: 'Elmas Yüzük', icon: '💍', desc: 'Global seviyenizi ve toplam ganimetinizi katlar.', baseCost: 100, bonusPerLvl: '+25% Global Bonus' }
};

let currentSelectedItemKey = null;

function getItemLevels() {
    try {
        return JSON.parse(localStorage.getItem('rpg_item_levels')) || { weapon: 1, shield: 1, helm: 1, boots: 1, ring: 1 };
    } catch {
        return { weapon: 1, shield: 1, helm: 1, boots: 1, ring: 1 };
    }
}

function getSpentGold() {
    try {
        return parseInt(localStorage.getItem('rpg_spent_gold') || '0');
    } catch {
        return 0;
    }
}

function updateGoldAndInventory(totalGlobalExp) {
    const itemLevels = getItemLevels();
    const spentGold  = getSpentGold();
    
    const totalEarnedGold = totalGlobalExp * 2;
    const currentGold     = Math.max(0, totalEarnedGold - spentGold);
    
    const goldEl = document.getElementById('userGoldCoins');
    if (goldEl) goldEl.innerText = currentGold;

    for (const [key, lvl] of Object.entries(itemLevels)) {
        const badgeEl = document.getElementById(`gearLvl${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (badgeEl) badgeEl.innerText = `Lv.${lvl}`;
    }
}

function openItemUpgradeModal(itemKey) {
    const cfg = ITEM_CONFIGS[itemKey];
    if (!cfg) return;
    currentSelectedItemKey = itemKey;
    
    const itemLevels = getItemLevels();
    const curLvl     = itemLevels[itemKey] || 1;
    const cost       = cfg.baseCost * curLvl;

    document.getElementById('modalItemIcon').innerText = cfg.icon;
    document.getElementById('modalItemName').innerText = cfg.name;
    document.getElementById('modalItemLevel').innerText = `Mevcut Seviye: Lv.${curLvl}`;
    document.getElementById('modalItemDesc').innerText  = cfg.desc;
    document.getElementById('modalItemBonus').innerText = `${cfg.bonusPerLvl} (Lv.${curLvl + 1}'de Katlanır)`;
    document.getElementById('modalUpgradeCost').innerText = cost;

    document.getElementById('itemUpgradeModal').style.display = 'flex';
}

function closeItemUpgradeModal() {
    document.getElementById('itemUpgradeModal').style.display = 'none';
}

function upgradeSelectedItem() {
    if (!currentSelectedItemKey) return;
    const cfg = ITEM_CONFIGS[currentSelectedItemKey];
    const itemLevels = getItemLevels();
    const curLvl = itemLevels[currentSelectedItemKey] || 1;
    const cost   = cfg.baseCost * curLvl;

    const goldEl = document.getElementById('userGoldCoins');
    const currentGold = parseInt(goldEl?.innerText || '0');

    if (currentGold < cost) {
        alert(`Yetersiz Altın Sikke! ${cost} Altın Sikkeye ihtiyacınız var. Notion'da görev tamamlayarak XP ve Altın kazanın!`);
        return;
    }

    itemLevels[currentSelectedItemKey] = curLvl + 1;
    localStorage.setItem('rpg_item_levels', JSON.stringify(itemLevels));
    localStorage.setItem('rpg_spent_gold', (getSpentGold() + cost).toString());

    closeItemUpgradeModal();
    if (window._lastGlobalExp) updateGoldAndInventory(window._lastGlobalExp);
}

// ─── Render Multi-Stage Tiered Achievements Showcase ─────────────────────────

function renderAchievements(records, categoryTotals) {
    const container = document.getElementById('achievementsContainer');
    if (!container) return;

    const totalGlobalExp = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const cats = Object.keys(CATEGORIES);
    const globalLvl = Math.round(cats.reduce((s, c) => s + computeLevel(categoryTotals[c] || 0).level, 0) / cats.length);

    const CHAINS = [
        {
            icon: '⚡',
            baseTitle: 'Redstone Mühendisi',
            unit: 'EXP',
            tiers: [
                { stage: 'I', target: 300, desc: 'Kariyer & İş kategorisinde 300+ EXP barajını aş.' },
                { stage: 'II', target: 600, desc: 'Kariyer & İş kategorisinde 600+ EXP seviyesine ulaş.' },
                { stage: 'III', target: 1200, desc: 'Kariyer & İş kategorisinde 1,200+ EXP efsane seviyesine eriş.' },
                { stage: 'IV', target: 2500, desc: 'Kariyer & İş kategorisinde 2,500+ EXP tanrısal seviyeye ulaş.' }
            ],
            getValue: () => categoryTotals['Career'] || 0
        },
        {
            icon: '📚',
            baseTitle: 'Bilgelik Üstadı',
            unit: 'EXP',
            tiers: [
                { stage: 'I', target: 300, desc: 'Zihin & Okuma kategorisinde 300+ EXP biriktir.' },
                { stage: 'II', target: 600, desc: 'Zihin & Okuma kategorisinde 600+ EXP bilgelik kademesine geç.' },
                { stage: 'III', target: 1200, desc: 'Zihin & Okuma kategorisinde 1,200+ EXP kütüphane koruyucusu ol.' }
            ],
            getValue: () => categoryTotals['Mental'] || 0
        },
        {
            icon: '🔥',
            baseTitle: 'Nether Koşucusu',
            unit: 'EXP',
            tiers: [
                { stage: 'I', target: 200, desc: 'Fiziksel spor ve eforda 200+ EXP seviyesine ulaş.' },
                { stage: 'II', target: 500, desc: 'Fiziksel spor ve eforda 500+ EXP atlet kademesine geç.' },
                { stage: 'III', target: 1000, desc: 'Fiziksel spor ve eforda 1,000+ EXP maratoncusu ol.' }
            ],
            getValue: () => categoryTotals['Stamina'] || 0
        },
        {
            icon: '🛡️',
            baseTitle: 'Demir İrade',
            unit: 'EXP',
            tiers: [
                { stage: 'I', target: 200, desc: 'Sigarasız yaşam ve iradede 200+ EXP kalkanı oluştur.' },
                { stage: 'II', target: 500, desc: 'Sigarasız yaşam ve iradede 500+ EXP elmas kalkanına geç.' },
                { stage: 'III', target: 1000, desc: 'Sigarasız yaşam ve iradede 1,000+ EXP çelik zırhına eriş.' }
            ],
            getValue: () => categoryTotals['Willpower'] || 0
        },
        {
            icon: '💎',
            baseTitle: 'Elmas Karakter',
            unit: 'EXP',
            tiers: [
                { stage: 'I', target: 1000, desc: 'Tüm alanlarda toplam 1,000+ EXP barajını devir.' },
                { stage: 'II', target: 2500, desc: 'Tüm alanlarda toplam 2,500+ EXP elmas seviyesine yüksel.' },
                { stage: 'III', target: 5000, desc: 'Tüm alanlarda toplam 5,000+ EXP şampiyonu ol.' }
            ],
            getValue: () => totalGlobalExp
        },
        {
            icon: '👑',
            baseTitle: 'Sistem Hakimi',
            unit: 'LVL',
            tiers: [
                { stage: 'I', target: 3, desc: 'Sistem Seviyesini Level 3 e yükselt.' },
                { stage: 'II', target: 5, desc: 'Sistem Seviyesini Level 5 e yükselt.' },
                { stage: 'III', target: 10, desc: 'Sistem Seviyesini Level 10 efsanesine eriş.' }
            ],
            getValue: () => globalLvl
        },
        {
            icon: '🏆',
            baseTitle: 'Kıdemli Maceracı',
            unit: 'gün',
            tiers: [
                { stage: 'I', target: 7, desc: 'En az 7 farklı gün boyunca disiplin kaydı gir.' },
                { stage: 'II', target: 30, desc: 'En az 30 gün boyunca kesintisiz disiplin sağla.' },
                { stage: 'III', target: 100, desc: 'En az 100 gün boyunca 100 Gün Serisine ulaş.' }
            ],
            getValue: () => records.length
        }
    ];

    const achievementsList = [];

    CHAINS.forEach(chain => {
        const val = chain.getValue();
        let nextTierFound = false;

        chain.tiers.forEach(tier => {
            const isUnlocked = val >= tier.target;

            if (isUnlocked) {
                achievementsList.push({
                    id: `${chain.baseTitle}_${tier.stage}`,
                    icon: chain.icon,
                    title: `${chain.baseTitle} ${tier.stage}`,
                    desc: tier.desc,
                    current: val,
                    target: tier.target,
                    unit: chain.unit,
                    isUnlocked: true
                });
            } else if (!nextTierFound) {
                nextTierFound = true;
                achievementsList.push({
                    id: `${chain.baseTitle}_${tier.stage}`,
                    icon: chain.icon,
                    title: `${chain.baseTitle} ${tier.stage}`,
                    desc: tier.desc,
                    current: val,
                    target: tier.target,
                    unit: chain.unit,
                    isUnlocked: false
                });
            }
        });
    });

    const unlockedCount = achievementsList.filter(a => a.isUnlocked).length;
    const lockedCount   = achievementsList.filter(a => !a.isUnlocked).length;

    const totalEl    = document.getElementById('achTotalCount');
    const unlockedEl = document.getElementById('achUnlockedCount');
    const lockedEl   = document.getElementById('achLockedCount');

    if (totalEl) totalEl.innerText = achievementsList.length;
    if (unlockedEl) unlockedEl.innerText = unlockedCount;
    if (lockedEl) lockedEl.innerText = lockedCount;

    function renderFiltered(filter) {
        container.innerHTML = '';
        const list = achievementsList.filter(item => {
            if (filter === 'unlocked') return item.isUnlocked;
            if (filter === 'locked') return !item.isUnlocked;
            return true;
        });

        if (list.length === 0) {
            container.innerHTML = `<p style="grid-column: 1/-1; color: #64748b; font-style: italic;">Bu filtrede gösterilecek rozet bulunamadı.</p>`;
            return;
        }

        list.forEach(ach => {
            const pct = Math.min(100, Math.round((ach.current / ach.target) * 100));
            const card = document.createElement('div');
            card.className = `achievement-card ${ach.isUnlocked ? 'unlocked' : 'locked'}`;

            card.innerHTML = `
                <div class="ach-icon-wrapper">
                    <span>${ach.icon}</span>
                </div>
                <div class="ach-body">
                    <div class="ach-title-row">
                        <span class="ach-title">${ach.title}</span>
                        <span class="ach-status-badge ${ach.isUnlocked ? 'unlocked' : 'locked'}">
                            ${ach.isUnlocked ? 'KAZANILDI 🏆' : 'KİLİTLİ 🔒'}
                        </span>
                    </div>
                    <p class="ach-desc">${ach.desc}</p>
                    <div class="ach-progress-track">
                        <div class="ach-progress-fill" style="width: ${pct}%"></div>
                    </div>
                    <div class="ach-progress-text">
                        ${ach.current} / ${ach.target} ${ach.unit} (${pct}%)
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    renderFiltered('all');

    const buttons = document.querySelectorAll('.ach-filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderFiltered(btn.dataset.filter);
        });
    });
}

// ─── Render Skill Tree Cards & Radar Chart ──────────────────────────────────

function renderLevelCards(categoryTotals) {
    const container = document.getElementById('levelCardsContainer');
    if (!container) return;
    container.innerHTML = '';

    for (const [catKey, config] of Object.entries(CATEGORIES)) {
        const exp       = categoryTotals[catKey] || 0;
        const levelData = computeLevel(exp);

        const card = document.createElement('div');
        card.className = 'level-card';
        card.style.borderTop = `3px solid ${config.color}`;

        card.innerHTML = `
            <div class="lc-header">
                <span class="lc-title"><span>${config.icon}</span> ${config.name}</span>
                <span class="lc-badge">LVL ${levelData.level}</span>
            </div>
            <div class="lc-exp-row">
                <span class="lc-exp-val">${exp} <small>EXP</small></span>
                <span class="lc-next-val">→ ${levelData.expForNext} EXP</span>
            </div>
            <div class="lc-track">
                <div class="lc-fill" style="width:${levelData.progress}%; background:${config.color}"></div>
            </div>
        `;
        container.appendChild(card);
    }
}

function renderRecentEfforts(recordsDesc) {
    const container = document.getElementById('recentDaysList');
    if (!container) return;
    container.innerHTML = '';

    const recent = recordsDesc.slice(0, 5);
    recent.forEach(day => {
        const pct = getDailyOverallPct(day);
        const item = document.createElement('div');
        item.className = 'recent-day-item';
        item.innerHTML = `
            <span class="rdi-date">${day.name || day.date}</span>
            <span class="rdi-bar"><span style="width:${pct}%"></span></span>
            <span class="rdi-pct">%${pct}</span>
        `;
        container.appendChild(item);
    });
}

function renderRadarChart(categoryTotals) {
    const container = document.getElementById('radarChart');
    if (!container) return;

    const seriesData = [
        categoryTotals['Career'] || 0,
        categoryTotals['Mental'] || 0,
        categoryTotals['Stamina'] || 0,
        categoryTotals['Willpower'] || 0
    ];

    const options = {
        chart: {
            type: 'radar',
            height: 320,
            toolbar: { show: false },
            background: 'transparent'
        },
        series: [{ name: 'Toplam EXP', data: seriesData }],
        labels: ['Kariyer', 'Zihin', 'Efor', 'İrade'],
        stroke: { width: 2, colors: ['#06b6d4'] },
        fill: { opacity: 0.25, colors: ['#06b6d4'] },
        markers: { size: 4, colors: ['#a855f7'] },
        yaxis: { show: false },
        xaxis: {
            labels: {
                style: { colors: ['#94a3b8', '#94a3b8', '#94a3b8', '#94a3b8'], fontSize: '12px' }
            }
        },
        theme: { mode: 'dark' }
    };

    container.innerHTML = '';
    const chart = new ApexCharts(container, options);
    chart.render();
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

        if (recordsDesc.length === 0) {
            document.getElementById('loading').innerHTML = '<p>Henüz kayıt bulunamadı.</p>';
            return;
        }

        document.getElementById('loading').style.display = 'none';
        document.getElementById('dashboardContent').style.display = 'block';

        calculatePlayerStats(recordsDesc);

        const categoryTotals = aggregateCategoryEXP(recordsDesc);
        renderLevelCards(categoryTotals);
        updateHeroCharacterCard(categoryTotals);
        renderHearts(categoryTotals);
        renderTodayQuests(recordsDesc);

        renderAchievements(recordsDesc, categoryTotals);
        renderRecentEfforts(recordsDesc);
        renderRadarChart(categoryTotals);

    } catch (error) {
        console.error('Dashboard error:', error);
        document.getElementById('loading').innerHTML = `
            <i class="fas fa-exclamation-triangle fa-2x" style="color:#ef4444;"></i>
            <p style="margin-top:10px;">Veriler yüklenirken bir hata oluştu: ${error.message}</p>
        `;
    }
});
