document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('books-grid');
    const dynamicFilters = document.getElementById('dynamic-filters');
    let allBooks = [];
    let currentCategory = 'all';
    let currentStatus = 'all';

    // Fetch book data
    fetch('kitaplar.json')
        .then(response => {
            if (!response.ok) throw new Error('Veri çekilemedi.');
            return response.json();
        })
        .then(data => {
            allBooks = data;
            generateCategoryButtons();
            renderBooks();
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
            renderBooks();
        });
    });

    function renderBooks() {
        booksGrid.innerHTML = '';
        
        const filteredBooks = allBooks.filter(book => {
            // Category Filtresi
            const matchCategory = (currentCategory === 'all') || (book.category === currentCategory);
            
            // Status Filtresi
            const matchStatus = (currentStatus === 'all') || (book.status === currentStatus);
            
            return matchCategory && matchStatus;
        });

        // Tarihe göre sıralama (En yeni en üstte)
        filteredBooks.sort((a, b) => {
            if (!a.date || a.date === '-') return 1;
            if (!b.date || b.date === '-') return -1;
            return new Date(b.date) - new Date(a.date);
        });

        if (filteredBooks.length === 0) {
            booksGrid.innerHTML = '<p style="text-align:center; width:100%; grid-column:1/-1; color:var(--text-color);">Bu filtreye uygun kitap bulunamadı.</p>';
            return;
        }

        filteredBooks.forEach(book => {
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
    }
});
