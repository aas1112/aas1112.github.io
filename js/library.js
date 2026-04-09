/**
 * library.js — Premium Library Page Logic
 *
 * Features:
 *  1. Renders book/article cards with glassmorphism design
 *  2. Category / status filtering + pagination
 *  3. Yearly shelf filmstrip (books only)
 *  4. Reading stats chart
 *  5. Reading Modal — article-only, fetches Notion page blocks via a
 *     lightweight Cloudflare Worker / proxy (see comment below)
 *
 * ── Notion Block Fetching ──────────────────────────────────────────────────
 * Notion API requires a server-side call (CORS + secret token).
 * Two options:
 *   A) Use a Cloudflare Worker / Vercel Edge Function as a proxy (recommended).
 *      Set NOTION_PROXY_URL to your deployed endpoint.
 *      Worker should accept: GET /blocks?page_id=<id>
 *      and return the Notion blocks JSON verbatim.
 *
 *   B) Pre-render blocks at build time: extend fetch_notion.py to export
 *      a separate `articles/<pageId>.json` for each article, then fetch
 *      that static file here. (Simplest for GitHub Pages — no proxy needed.)
 *
 * This file implements Option B by default (static JSON files).
 * Toggle NOTION_FETCH_MODE to 'proxy' to use Option A.
 * ──────────────────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Config ──────────────────────────────────────────────── */
const NOTION_FETCH_MODE  = 'static';          // 'static' | 'proxy'
const NOTION_PROXY_URL   = '/api/notion-blocks'; // Only used when mode = 'proxy'
const ARTICLES_BASE_PATH = 'articles/';          // Folder for pre-rendered JSON (mode = 'static')

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM refs ──
    const booksGrid     = document.getElementById('books-grid');
    const dynamicFilters = document.getElementById('dynamic-filters');

    // ── State ──
    let allItems       = [];
    let currentCategory = 'all';
    let currentStatus   = 'all';
    let currentPage     = 1;
    const ITEMS_PER_PAGE = 9;

    // ── Inject Reading Modal HTML ──
    injectReadingModal();

    // ── Fetch data ──
    fetch('kitaplar.json')
        .then(r => { if (!r.ok) throw new Error('Veri çekilemedi.'); return r.json(); })
        .then(data => {
            allItems = data;
            try { generateCategoryButtons(); } catch (e) { console.error('Category buttons:', e); }
            try { renderItems();             } catch (e) { console.error('Books render:', e);    }
            try { renderShelf();             } catch (e) { console.error('Shelf render:', e);    }
            try { renderChart();             } catch (e) { console.error('Chart render:', e);    }
        })
        .catch(err => {
            console.error(err);
            booksGrid.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1;color:#64748b;">Kütüphane verileri yüklenemedi.</p>';
        });

    /* ═══════════════════════════════════════════════════════════════
       HELPER: Status class
       ═══════════════════════════════════════════════════════════════ */
    function getStatusClass(status) {
        if (!status) return '';
        const l = status.toLowerCase();
        if (l.includes('okundu') || l.includes('done'))       return 'status-okundu';
        if (l.includes('okunuyor') || l.includes('progress')) return 'status-okunuyor';
        if (l.includes('okunacak'))                           return 'status-okunacak';
        return '';
    }

    /* ═══════════════════════════════════════════════════════════════
       CATEGORY FILTER BUTTONS (dynamic)
       ═══════════════════════════════════════════════════════════════ */
    function generateCategoryButtons() {
        const categories = new Set();
        allItems.forEach(b => { if (b.category && b.category !== '-') categories.add(b.category); });

        let html = '<button class="filter-btn category-btn active" data-filter="all">Tüm Türler</button>';
        categories.forEach(cat => {
            html += `<button class="filter-btn category-btn" data-filter="${cat}">${cat}</button>`;
        });
        dynamicFilters.innerHTML = html;

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.dataset.filter;
                currentPage = 1;
                renderItems();
            });
        });
    }

    /* Status buttons (static in HTML) */
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStatus = e.target.dataset.filter;
            currentPage = 1;
            renderItems();
        });
    });

    /* ═══════════════════════════════════════════════════════════════
       SHELF FILMSTRIP — Books read this year/recently
       ═══════════════════════════════════════════════════════════════ */
    function renderShelf() {
        const shelf = document.getElementById('yearly-shelf');
        if (!shelf) return;

        // Kitap türündeki okunmuşları al (Makale/Ders değil)
        let shelfItems = allItems.filter(b =>
            b.status && b.status.toLowerCase().includes('okundu') &&
            b.date   && b.date !== '-' &&
            b.category && !['makale', 'ders', 'magazine'].includes(b.category.toLowerCase())
        );
        shelfItems.sort((a, b) => new Date(b.date) - new Date(a.date));

        const yearStr = new Date().getFullYear().toString();
        const thisYear = shelfItems.filter(b => b.date && String(b.date).startsWith(yearStr));
        if (thisYear.length > 0) shelfItems = thisYear;

        shelfItems = shelfItems.slice(0, 12); // max 12 books

        if (shelfItems.length === 0) {
            shelf.innerHTML = '<p style="color:#475569;padding:20px;text-align:center;width:100%;">Bu yıl henüz kitap eklenmedi.</p>';
            return;
        }

        shelf.innerHTML = '';
        const decorations = { 3: '🪴', 7: '🌵', 11: '🔭' };

        shelfItems.forEach((book, idx) => {
            const el = document.createElement('div');
            el.className = 'shelf-book';
            const rot = (Math.random() - 0.5) * 10;
            el.style.transform = `rotate(${rot}deg)`;
            el.title = book.title;
            el.innerHTML = `<img src="${book.cover}" alt="${book.title}" loading="lazy"
                onerror="this.src='https://via.placeholder.com/80x120/1e293b/475569?text=📖'">`;
            shelf.appendChild(el);

            if (decorations[idx]) {
                const deco = document.createElement('div');
                deco.className = 'shelf-decoration';
                deco.textContent = decorations[idx];
                shelf.appendChild(deco);
            }
        });
    }

    /* ═══════════════════════════════════════════════════════════════
       READING STATS CHART
       ═══════════════════════════════════════════════════════════════ */
    function renderChart() {
        const ctx = document.getElementById('readingStatsChart');
        if (!ctx) return;

        const readItems = allItems.filter(b =>
            b.status && b.status.toLowerCase().includes('okundu') &&
            b.date   && b.date !== '-'
        );

        const monthNames = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({ label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`, year: d.getFullYear(), month: d.getMonth() + 1 });
        }

        const bookCounts    = months.map(() => 0);
        const articleCounts = months.map(() => 0);

        readItems.forEach(item => {
            const d   = new Date(item.date);
            const idx = months.findIndex(m => m.year === d.getFullYear() && m.month === d.getMonth() + 1);
            if (idx === -1) return;
            if (item.category && item.category.toLowerCase() === 'makale') articleCounts[idx]++;
            else bookCounts[idx]++;
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Okunan Kitap',
                        data: bookCounts,
                        backgroundColor: 'rgba(99,102,241,0.7)',
                        borderColor: 'rgba(99,102,241,1)',
                        borderWidth: 1,
                        borderRadius: 6
                    },
                    {
                        label: 'Okunan Makale',
                        data: articleCounts,
                        backgroundColor: 'rgba(6,182,212,0.65)',
                        borderColor: 'rgba(6,182,212,1)',
                        borderWidth: 1,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#64748b', stepSize: 1, precision: 0 },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    x: {
                        ticks: { color: '#64748b' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: "'Outfit', sans-serif" }, boxRadius: 4 }
                    }
                }
            }
        });
    }

    /* ═══════════════════════════════════════════════════════════════
       RENDER ITEMS (Books + Articles Grid)
       ═══════════════════════════════════════════════════════════════ */
    function renderItems() {
        booksGrid.innerHTML = '';

        const filtered = allItems.filter(item => {
            const matchCat    = currentCategory === 'all' || item.category === currentCategory;
            const matchStatus = currentStatus   === 'all' || item.status   === currentStatus;
            return matchCat && matchStatus;
        });

        filtered.sort((a, b) => {
            const order = s => {
                if (!s) return 4;
                const l = s.toLowerCase();
                if (l.includes('okunuyor') || l.includes('progress')) return 1;
                if (l.includes('okunacak'))                           return 2;
                if (l.includes('okundu') || l.includes('done'))       return 3;
                return 4;
            };
            const oa = order(a.status), ob = order(b.status);
            if (oa !== ob) return oa - ob;
            if (!a.date || a.date === '-') return 1;
            if (!b.date || b.date === '-') return -1;
            return new Date(b.date) - new Date(a.date);
        });

        const total      = filtered.length;
        const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
        const start      = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated  = filtered.slice(start, start + ITEMS_PER_PAGE);

        if (paginated.length === 0) {
            booksGrid.innerHTML = '<p style="text-align:center;width:100%;grid-column:1/-1;color:#475569;">Bu filtreye uygun içerik bulunamadı.</p>';
            removePagination();
            return;
        }

        paginated.forEach(item => booksGrid.appendChild(createCard(item)));

        totalPages > 1 ? renderPagination(totalPages) : removePagination();
    }

    /* ── Card Builder ── */
    function createCard(item) {
        const isArticle = item.category && item.category.toLowerCase() === 'makale';
        const statusClass = getStatusClass(item.status);
        const dateStr = (item.date && item.date !== '-')
            ? `<i class="far fa-calendar-alt"></i> ${item.date}` : '';

        const card = document.createElement('div');
        card.className = 'book-card' + (isArticle ? ' is-article' : '');

        card.innerHTML = `
            <div class="book-cover-container">
                <img src="${item.cover}" alt="${item.title}" class="book-cover" loading="lazy"
                    onerror="this.src='https://via.placeholder.com/300x200/1e293b/475569?text=Kapak+Yok'">
                <span class="book-category-tag">${item.category || 'Genel'}</span>
                ${isArticle ? '<span class="article-read-hint"><i class="fas fa-book-open"></i> Notları Oku</span>' : ''}
            </div>
            <div class="book-info">
                <h3 class="book-title">${item.title}</h3>
                <p class="book-author">${item.author}</p>
                <div class="book-meta">
                    <span class="book-status ${statusClass}">${item.status}</span>
                    <span class="book-date">${dateStr}</span>
                </div>
            </div>
        `;

        // Only articles open the reading modal
        if (isArticle) {
            card.addEventListener('click', () => openReadingModal(item));
        }

        return card;
    }

    /* ═══════════════════════════════════════════════════════════════
       PAGINATION
       ═══════════════════════════════════════════════════════════════ */
    function renderPagination(totalPages) {
        let container = document.getElementById('pagination-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'pagination-container';
            container.className = 'pagination';
            booksGrid.parentNode.insertBefore(container, booksGrid.nextSibling);
        }

        let html = `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="page-dots">…</span>`;
            }
        }

        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;

        container.innerHTML = html;

        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('disabled')) return;
                currentPage = parseInt(btn.dataset.page);
                renderItems();
                document.querySelector('.grid-title')?.scrollIntoView({ behavior: 'smooth' });
            });
        });
    }

    function removePagination() {
        document.getElementById('pagination-container')?.remove();
    }

    /* ═══════════════════════════════════════════════════════════════
       READING MODAL — inject, open, close
       ═══════════════════════════════════════════════════════════════ */
    function injectReadingModal() {
        const html = `
        <div id="reading-modal-overlay" role="dialog" aria-modal="true" aria-label="Makale Okuma Modu">
            <div id="reading-modal">
                <!-- gradient bar auto-added via CSS ::before -->
                <div class="modal-header">
                    <img id="modal-cover-thumb" class="modal-cover-thumb" src="" alt="Kapak">
                    <div class="modal-meta">
                        <span class="modal-article-label">📄 Makale Notu</span>
                        <h2 class="modal-title" id="modal-title">—</h2>
                        <p class="modal-author" id="modal-author">—</p>
                    </div>
                    <button class="modal-close-btn" id="modal-close-btn" aria-label="Kapat">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="reading-content" id="modal-content"></div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        const overlay  = document.getElementById('reading-modal-overlay');
        const closeBtn = document.getElementById('modal-close-btn');

        // Close on overlay click (outside drawer)
        overlay.addEventListener('click', e => {
            if (e.target === overlay) closeReadingModal();
        });

        // Close on button click
        closeBtn.addEventListener('click', closeReadingModal);

        // Close on Escape key
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeReadingModal();
        });
    }

    function openReadingModal(item) {
        const overlay  = document.getElementById('reading-modal-overlay');
        const thumb    = document.getElementById('modal-cover-thumb');
        const titleEl  = document.getElementById('modal-title');
        const authorEl = document.getElementById('modal-author');
        const content  = document.getElementById('modal-content');

        // Populate header
        titleEl.textContent  = item.title;
        authorEl.textContent = item.author;
        thumb.src            = item.cover;
        thumb.onerror        = () => { thumb.style.display = 'none'; };

        // Show modal with loading state
        content.innerHTML = `
            <div class="modal-loader">
                <div class="modal-loader-spinner"></div>
                <p>Notion'dan notlar çekiliyor…</p>
            </div>`;

        overlay.classList.add('open');
        document.body.style.overflow = 'hidden';

        // Fetch blocks
        fetchArticleBlocks(item)
            .then(html => { content.innerHTML = html || '<p style="color:#475569;">Bu makale için henüz not eklenmemiş.</p>'; })
            .catch(err => {
                console.error('Block fetch error:', err);
                content.innerHTML = `
                    <div class="modal-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>İçerik yüklenemedi.</p>
                        <small>${err.message || ''}</small>
                    </div>`;
            });
    }

    function closeReadingModal() {
        document.getElementById('reading-modal-overlay')?.classList.remove('open');
        document.body.style.overflow = '';
    }

    /* ═══════════════════════════════════════════════════════════════
       NOTION BLOCK FETCHING
       ═══════════════════════════════════════════════════════════════ */
    async function fetchArticleBlocks(item) {
        if (!item.notion_page_id) {
            return `<p style="color:#475569;font-style:italic;">Bu makale için henüz içerik bağlantısı eklenmemiş.<br>
                    <small style="font-size:0.8rem;">(notion_page_id eksik — fetch_notion.py güncellemesini kontrol edin)</small></p>`;
        }

        if (NOTION_FETCH_MODE === 'static') {
            // Option B: static pre-rendered JSON (kitaplar.json ile aynı dizinde articles/<pageId>.json)
            const url = `${ARTICLES_BASE_PATH}${item.notion_page_id}.json`;
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 404) {
                    return `<p style="color:#475569;font-style:italic;">
                        Bu makale için henüz not dosyası oluşturulmamış.<br>
                        <small style="font-size:0.8rem;">
                            fetch_notion.py çalıştırıldıktan sonra <code>${url}</code> oluşacaktır.
                        </small></p>`;
                }
                throw new Error(`HTTP ${res.status}`);
            }
            const blocks = await res.json();
            return blocksToHtml(blocks);

        } else {
            // Option A: proxy endpoint
            const res = await fetch(`${NOTION_PROXY_URL}?page_id=${item.notion_page_id}`);
            if (!res.ok) throw new Error(`Proxy error: HTTP ${res.status}`);
            const data = await res.json();
            const blocks = data.results || data;
            return blocksToHtml(blocks);
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       NOTION BLOCKS → HTML RENDERER
       Supports: paragraph, heading_1/2/3, bulleted/numbered/to_do,
       quote, code, divider, callout, toggle, image, table, embed
       ═══════════════════════════════════════════════════════════════ */
    function blocksToHtml(blocks) {
        if (!Array.isArray(blocks) || blocks.length === 0) return '';

        let html = '';
        let olOpen = false;

        blocks.forEach(block => {
            const type = block.type;
            const data = block[type] || {};

            // Close open <ol> if we're leaving numbered_list_item
            if (type !== 'numbered_list_item' && olOpen) {
                html += '</ol>';
                olOpen = false;
            }

            switch (type) {

                case 'paragraph': {
                    const text = richTextToHtml(data.rich_text);
                    html += text ? `<p>${text}</p>` : '<br>';
                    break;
                }

                case 'heading_1':
                    html += `<h1>${richTextToHtml(data.rich_text)}</h1>`;
                    break;
                case 'heading_2':
                    html += `<h2>${richTextToHtml(data.rich_text)}</h2>`;
                    break;
                case 'heading_3':
                    html += `<h3>${richTextToHtml(data.rich_text)}</h3>`;
                    break;

                case 'bulleted_list_item':
                    html += `<ul><li>${richTextToHtml(data.rich_text)}</li></ul>`;
                    break;

                case 'numbered_list_item':
                    if (!olOpen) { html += '<ol>'; olOpen = true; }
                    html += `<li>${richTextToHtml(data.rich_text)}</li>`;
                    break;

                case 'to_do': {
                    const checked = data.checked ? 'checked' : '';
                    const doneClass = data.checked ? 'done' : '';
                    html += `<div class="notion-todo ${doneClass}">
                        <input type="checkbox" ${checked} disabled>
                        <span>${richTextToHtml(data.rich_text)}</span>
                    </div>`;
                    break;
                }

                case 'quote':
                    html += `<blockquote>${richTextToHtml(data.rich_text)}</blockquote>`;
                    break;

                case 'code': {
                    const lang = data.language || '';
                    const codeText = richTextToPlain(data.rich_text);
                    html += `<pre><code class="language-${lang}">${escapeHtml(codeText)}</code></pre>`;
                    break;
                }

                case 'divider':
                    html += '<hr>';
                    break;

                case 'callout': {
                    const icon = data.icon?.emoji || data.icon?.type === 'external' ? '💡' : '💡';
                    html += `<div class="notion-callout">
                        <span class="notion-callout-icon">${icon}</span>
                        <div class="notion-callout-text">${richTextToHtml(data.rich_text)}</div>
                    </div>`;
                    break;
                }

                case 'toggle': {
                    // Note: children not fetched in one-level mode; they need separate block fetch
                    html += `<details class="notion-toggle">
                        <summary>${richTextToHtml(data.rich_text)}</summary>
                        <div class="notion-toggle-content">
                            <p style="color:#475569;font-size:0.85rem;">Alt içerik için Notion'u ziyaret edin.</p>
                        </div>
                    </details>`;
                    break;
                }

                case 'image': {
                    const url = data.type === 'external' ? data.external?.url : data.file?.url;
                    const caption = data.caption?.length ? richTextToPlain(data.caption) : '';
                    if (url) html += `<figure><img src="${url}" alt="${escapeHtml(caption)}" loading="lazy">
                        ${caption ? `<figcaption style="font-size:0.8rem;color:#475569;text-align:center;margin-top:6px;">${escapeHtml(caption)}</figcaption>` : ''}
                    </figure>`;
                    break;
                }

                case 'table': {
                    html += renderTable(block);
                    break;
                }

                case 'embed':
                case 'bookmark': {
                    const url = data.url || '';
                    html += url ? `<p><a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(url)}</a></p>` : '';
                    break;
                }

                case 'file': {
                    const fUrl = data.type === 'external' ? data.external?.url : data.file?.url;
                    const fName = richTextToPlain(data.caption) || 'Dosyayı İndir';
                    if (fUrl) html += `<p><a href="${escapeHtml(fUrl)}" target="_blank" rel="noopener">📎 ${escapeHtml(fName)}</a></p>`;
                    break;
                }

                default:
                    // Silently skip unsupported block types
                    break;
            }
        });

        if (olOpen) html += '</ol>';
        return html;
    }

    /* ── Rich Text → HTML ── */
    function richTextToHtml(richText) {
        if (!Array.isArray(richText)) return '';
        return richText.map(rt => {
            let t = escapeHtml(rt.plain_text || '');
            const ann = rt.annotations || {};

            if (ann.bold)          t = `<strong>${t}</strong>`;
            if (ann.italic)        t = `<em>${t}</em>`;
            if (ann.strikethrough) t = `<del>${t}</del>`;
            if (ann.underline)     t = `<u>${t}</u>`;
            if (ann.code)          t = `<code>${t}</code>`;
            if (ann.color && ann.color !== 'default') {
                const colorMap = {
                    gray: '#64748b', brown: '#a16207', orange: '#ea580c', yellow: '#ca8a04',
                    green: '#16a34a', blue: '#2563eb', purple: '#9333ea', pink: '#db2777', red: '#dc2626',
                    gray_background:   'rgba(100,116,139,0.2)', blue_background: 'rgba(37,99,235,0.15)',
                    purple_background: 'rgba(147,51,234,0.15)', green_background: 'rgba(22,163,74,0.15)',
                    yellow_background: 'rgba(202,138,4,0.15)',  red_background:   'rgba(220,38,38,0.15)',
                };
                const style = ann.color.includes('background')
                    ? `background:${colorMap[ann.color] || 'rgba(255,255,255,0.1)'};padding:1px 4px;border-radius:3px;`
                    : `color:${colorMap[ann.color] || 'inherit'};`;
                t = `<span style="${style}">${t}</span>`;
            }
            if (rt.href) t = `<a href="${escapeHtml(rt.href)}" target="_blank" rel="noopener">${t}</a>`;

            return t;
        }).join('');
    }

    /* ── Rich Text → Plain string ── */
    function richTextToPlain(richText) {
        if (!Array.isArray(richText)) return '';
        return richText.map(rt => rt.plain_text || '').join('');
    }

    /* ── Notion table block → HTML ── */
    function renderTable(tableBlock) {
        const rows = tableBlock.table?.rows || tableBlock.children || [];
        if (!rows.length) return '';
        let t = '<div class="notion-table-container" style="overflow-x: auto;"><table class="notion-table"><tbody>';
        rows.forEach((row, ri) => {
            const cells = row.table_row?.cells || [];
            const tag   = ri === 0 && tableBlock.table?.has_column_header ? 'th' : 'td';
            t += '<tr>' + cells.map(cell => `<${tag}>${richTextToHtml(cell)}</${tag}>`).join('') + '</tr>';
        });
        return t + '</tbody></table></div>';
    }

    /* ── HTML escape ── */
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

}); // END DOMContentLoaded
