document.addEventListener('DOMContentLoaded', () => {
    // Ana sayfada scroll ile aktif bölümü belirleme
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    
    if (isIndexPage) {
        const sections = ['about', 'education', 'experience', 'skills'];
        const navLinks = document.querySelectorAll('.nav-links a[data-section]');
        
        // Intersection Observer ile aktif bölümü belirle
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('data-section') === sectionId) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }, observerOptions);
        
        // Her bölümü gözlemle
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                observer.observe(section);
            }
        });
        
        // Sayfa yüklendiğinde ilk aktif bölümü belirle
        const checkInitialSection = () => {
            const scrollPosition = window.scrollY + 150;
            let activeSection = 'about';
            
            sections.forEach(sectionId => {
                const section = document.getElementById(sectionId);
                if (section) {
                    const sectionTop = section.offsetTop;
                    const sectionHeight = section.offsetHeight;
                    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                        activeSection = sectionId;
                    }
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('data-section') === activeSection) {
                    link.classList.add('active');
                }
            });
        };
        
        // Sayfa yüklendiğinde ve scroll yapıldığında kontrol et
        checkInitialSection();
        window.addEventListener('scroll', checkInitialSection);
    }
    
    // Smooth scroll için - sadece # ile başlayan linkler için
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            // Mailto, tel, http, https gibi linkleri engelleme
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href;
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
            }
        });
    });

    // Mobil menü toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        // Menü açıkken sayfayı kaydırmayı engelle
        document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : '';
    });

    // Menü linklerine tıklandığında menüyü kapat
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Mobil görünümde dropdown menüyü açma/kapama
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
            }
        });
    });

    // Sayfa scroll olduğunda menüyü kapat
    window.addEventListener('scroll', () => {
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Ekran döndürüldüğünde menüyü resetle
    window.addEventListener('orientationchange', () => {
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
    });
});

// Sertifika görüntüleme fonksiyonu
function viewCertificate(pdfPath) {
    window.open(pdfPath, '_blank');
} 