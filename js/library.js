document.addEventListener('DOMContentLoaded', () => {
    const booksGrid = document.getElementById('books-grid');
    const filterBtns = document.querySelectorAll('.filter-btn');
    let allBooks = [];

    // Fetch book data (Will be populated via GitHub Actions + Notion)
    fetch('kitaplar.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Veri çekilemedi. Kitap dosyası bulunamadı.');
            }
            return response.json();
        })
        .then(data => {
            allBooks = data;
            renderBooks('all');
        })
        .catch(error => {
            console.error('Hata:', error);
            booksGrid.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-color);">Kitap verileri yüklenirken bir hata oluştu veya henüz kitap eklenmedi (Otomasyon betiğini kontrol edin).</p>';
        });

    function getStatusClass(status) {
        if (!status) return '';
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('okundu')) return 'status-okundu';
        if (lowerStatus.includes('okunuyor')) return 'status-okunuyor';
        if (lowerStatus.includes('okunacak')) return 'status-okunacak';
        return '';
    }

    function renderBooks(filterValue) {
        booksGrid.innerHTML = '';
        
        const filteredBooks = allBooks.filter(book => {
            if (filterValue === 'all') return true;
            if (filterValue === 'Okunuyor' && book.status === 'Okunuyor') return true;
            if (filterValue === 'Okundu' && book.status === 'Okundu') return true;
            if (filterValue === 'Okunacak' && book.status === 'Okunacak') return true;
            if (filterValue === 'Akademik Kitaplar & Makaleler' && book.category === 'Akademik Kitaplar & Makaleler') return true;
            return false;
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
                <img src="${book.cover}" alt="${book.title} Kapağı" class="book-cover" onerror="this.src='https://via.placeholder.com/300x450?text=Kapak+Yok'">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author}</p>
                    <div class="book-meta">
                        <span class="book-status ${statusClass}">${book.status}</span>
                        <span class="book-date">${book.date !== '-' ? '<i class="far fa-calendar-alt"></i> ' + book.date : ''}</span>
                    </div>
                </div>
            `;
            
            booksGrid.appendChild(card);
        });
    }

    // Assign click events for filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            const filterValue = e.target.getAttribute('data-filter');
            renderBooks(filterValue);
        });
    });
});
