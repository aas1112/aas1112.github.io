document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('books-grid');
    const dynamicFilters = document.getElementById('dynamic-filters');
    let allBooks = [];
    let currentCategory = 'all';
    let currentStatus = 'all';
    let currentPage = 1;
    const itemsPerPage = 9;

    // Fetch book data
    fetch('kitaplar.json')
        .then(response => {
            if (!response.ok) throw new Error('Veri çekilemedi.');
            return response.json();
        })
        .then(data => {
            allBooks = data;
            
            try { generateCategoryButtons(); } catch (e) { console.error("Category buttons error:", e); }
            try { renderBooks(); } catch (e) { console.error("Books view error:", e); }
            try { renderShelf(); } catch (e) { console.error("Shelf view error:", e); }
            try { renderChart(); } catch (e) { console.error("Chart view error:", e); }
        })
        .catch(error => {
            console.error('Hata:', error);
            booksGrid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-color);">Kitap verileri yüklenirken bir hata oluştu veya henüz kitap eklenmedi.</p>';
        });

    function getStatusClass(status) {
        if (!status) return '';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('okundu') || lowerStatus.includes('done')) return 'status-okundu';
        if (lowerStatus.includes('okunuyor') || lowerStatus.includes('progress')) return 'status-okunuyor';
        if (lowerStatus.includes('okunacak')) return 'status-okunacak';
        return '';
    }

    // Kategorileri (Ders, Makale, Okuma vb.) dinamik olarak belirle ve butonları yarat
    function generateCategoryButtons() {
        const categories = new Set();
        allBooks.forEach(book => {
            if (book.category && book.category !== '-') {
                categories.add(book.category);
            }
        });

        // Tümü butonu hep kalacak, diğerlerini ekle
        let buttonsHTML = `<button class="filter-btn category-btn active" data-filter="all">Tüm Türler</button>`;
        categories.forEach(cat => {
            buttonsHTML += `<button class="filter-btn category-btn" data-filter="${cat}">${cat}</button>`;
        });
        
        dynamicFilters.innerHTML = buttonsHTML;

        // Kategori butonlarına tıklama event'i ekle
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.getAttribute('data-filter');
                currentPage = 1;
                renderBooks();
            });
        });
    }

    // Status (okundu vb) butonları için tıklama event'leri
    document.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.status-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentStatus = e.target.getAttribute('data-filter');
            currentPage = 1;
            renderBooks();
        });
    });

    function renderShelf() {
        const shelf = document.getElementById('yearly-shelf');
        if (!shelf) return;

        // Current year or last 12 readings
        // For visual sake, let's grab random or latest 8-10 'Okundu' books. 
        let yearlyBooks = allBooks.filter(b => b.status && b.status.toLowerCase().includes('okundu') && b.date && b.date !== '-');
        yearlyBooks.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        // Let's filter to this year exactly if any, else just use latest across all to ensure it's not empty
        const currentYearStr = new Date().getFullYear().toString();
        const strictlyThisYear = yearlyBooks.filter(b => b.date && String(b.date).startsWith(currentYearStr));
        if (strictlyThisYear.length > 0) {
            yearlyBooks = strictlyThisYear;
        }

        yearlyBooks = yearlyBooks.slice(0, 8); // Max 8 books on the visual shelf

        if (yearlyBooks.length === 0) {
            shelf.innerHTML = '<p style="color: #4a332a; padding: 20px; font-weight: 600; text-align: center; width:100%;">Bu yıl henüz kitap okumadınız.</p>';
            return;
        }

        shelf.innerHTML = '';
        yearlyBooks.forEach((book, index) => {
            const bookEl = document.createElement('div');
            bookEl.className = 'shelf-book';
            
            // Random slant between -6 and 6 degrees
            const randomRotate = (Math.random() - 0.5) * 12; 
            bookEl.style.transform = `rotate(${randomRotate}deg)`;
            
            bookEl.innerHTML = `
                <img src="${book.cover}" alt="${book.title}" title="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Kapak+Yok'">
            `;
            shelf.appendChild(bookEl);

            // Add cute plants periodically
            if (index === 2) {
                const deco = document.createElement('div');
                deco.className = 'shelf-decoration';
                deco.innerHTML = '🪴';
                shelf.appendChild(deco);
            }
            if (index === 5) {
                const deco = document.createElement('div');
                deco.className = 'shelf-decoration';
                deco.innerHTML = '🌵';
                shelf.appendChild(deco);
            }
        });
    }

    function renderChart() {
        const ctx = document.getElementById('readingStatsChart');
        if (!ctx) return;

        // Okundu olanları al
        const readItems = allBooks.filter(b => b.status && b.status.toLowerCase().includes('okundu') && b.date && b.date !== '-');
        
        // Son 6 ayı hesapla
        const months = [];
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        const currentDate = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
            months.push({
                label: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
                year: d.getFullYear(),
                month: d.getMonth() + 1
            });
        }

        const bookCounts = months.map(() => 0);
        const articleCounts = months.map(() => 0);

        readItems.forEach(item => {
            const itemDate = new Date(item.date);
            const y = itemDate.getFullYear();
            const m = itemDate.getMonth() + 1;
            
            const idx = months.findIndex(monthObj => monthObj.year === y && monthObj.month === m);
            if (idx !== -1) {
                if (item.category && item.category.toLowerCase().includes('makale')) {
                    articleCounts[idx]++;
                } else {
                    bookCounts[idx]++;
                }
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    {
                        label: 'Okunan Kitap',
                        data: bookCounts,
                        backgroundColor: '#e0a96d',
                        borderRadius: 4
                    },
                    {
                        label: 'Okunan Makale',
                        data: articleCounts,
                        backgroundColor: '#8b5a2b',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#ceb8a3', stepSize: 1, precision: 0 },
                        grid: { color: 'rgba(206, 184, 163, 0.1)' }
                    },
                    x: {
                        ticks: { color: '#ceb8a3' },
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ceb8a3', font: {family: "'Outfit', sans-serif"} }
                    }
                }
            }
        });
    }

    function renderBooks() {
        booksGrid.innerHTML = '';
        
        const filteredBooks = allBooks.filter(book => {
            // Category Filtresi
            const matchCategory = (currentCategory === 'all') || (book.category === currentCategory);
            
            // Status Filtresi
            const matchStatus = (currentStatus === 'all') || (book.status === currentStatus);
            
            return matchCategory && matchStatus;
        });

        // Sıralama (Önce Status: Okunuyor > Okunacak > Okundu, Sonra Tarih)
        filteredBooks.sort((a, b) => {
            const getOrder = (status) => {
                if (!status) return 4;
                const low = status.toLowerCase();
                if (low.includes('okunuyor') || low.includes('progress')) return 1;
                if (low.includes('okunacak')) return 2;
                if (low.includes('okundu') || low.includes('done')) return 3;
                return 4;
            };

            const orderA = getOrder(a.status);
            const orderB = getOrder(b.status);

            if (orderA !== orderB) {
                return orderA - orderB;
            }

            // Aynı durumdaysa tarihe göre (En yeni en üstte)
            if (!a.date || a.date === '-') return 1;
            if (!b.date || b.date === '-') return -1;
            return new Date(b.date) - new Date(a.date);
        });

        // Sayfalama işlemleri
        const totalItems = filteredBooks.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

        if (paginatedBooks.length === 0) {
            booksGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1; color:#ceb8a3;">Bu filtreye uygun kitap bulunamadı.</p>';
            const existingPagination = document.getElementById('pagination-container');
            if (existingPagination) existingPagination.remove();
            return;
        }

        paginatedBooks.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            
            const statusClass = getStatusClass(book.status);

            card.innerHTML = `
                <div class="book-cover-container">
                    <img src="${book.cover}" alt="${book.title}" class="book-cover" onerror="this.src='https://via.placeholder.com/300x450?text=Kapak+Yok'">
                    <span class="book-category-tag">${book.category || 'Genel'}</span>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="book-meta">
                        <span class="book-status ${statusClass}">${book.status}</span>
                        <span class="book-date">${book.date !== '-' && book.date ? '<i class="far fa-calendar-alt"></i> ' + book.date : ''}</span>
                    </div>
                </div>
            `;
            
            booksGrid.appendChild(card);
        });

        // Sayfalama kontrollerini göster
        if (totalPages > 1) {
            renderPagination(totalPages);
        } else {
            const existingPagination = document.getElementById('pagination-container');
            if (existingPagination) existingPagination.remove();
        }
    }

    function renderPagination(totalPages) {
        let paginationContainer = document.getElementById('pagination-container');
        if (!paginationContainer) {
            paginationContainer = document.createElement('div');
            paginationContainer.id = 'pagination-container';
            paginationContainer.className = 'pagination';
            booksGrid.parentNode.insertBefore(paginationContainer, booksGrid.nextSibling);
        }

        let html = '';
        
        html += `<button class="page-btn ${currentPage === 1 ? 'disabled' : ''}" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            // Sadece yakın sayfaları gösterelim çok sayfa varsa tasarımı bozmasın
            if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
                html += `<button class="page-btn ${currentPage === i ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === currentPage - 2 || i === currentPage + 2) {
                html += `<span class="page-dots">...</span>`;
            }
        }
        
        html += `<button class="page-btn ${currentPage === totalPages ? 'disabled' : ''}" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
        
        paginationContainer.innerHTML = html;

        paginationContainer.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.classList.contains('disabled')) return;
                currentPage = parseInt(btn.getAttribute('data-page'));
                renderBooks();
                document.querySelector('.grid-title').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
});
