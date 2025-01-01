document.addEventListener('DOMContentLoaded', () => {
    // Dil butonlarını seç
    const langButtons = document.querySelectorAll('.lang-btn');
    
    // Varsayılan dili ayarla (tarayıcı diline göre)
    const defaultLang = navigator.language.split('-')[0];
    let currentLang = localStorage.getItem('language') || defaultLang;
    
    // Dil değiştirme fonksiyonu
    const changeLanguage = (lang) => {
        currentLang = lang;
        localStorage.setItem('language', lang);
        
        // Tüm çevrilebilir elementleri güncelle
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            element.textContent = translations[lang][key];
        });
        
        // Aktif dil butonunu güncelle
        langButtons.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
        });
    };
    
    // Dil butonlarına tıklama olayı ekle
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            changeLanguage(btn.getAttribute('data-lang'));
        });
    });
    
    // Sayfa yüklendiğinde varsayılan dili ayarla
    changeLanguage(currentLang);

    // Smooth scroll için
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Header yüksekliği
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// Sertifika görüntüleme fonksiyonu
function viewCertificate(pdfPath) {
    window.open(pdfPath, '_blank');
} 