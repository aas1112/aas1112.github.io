// Sertifikalar verisi
const certificatesData = [
    {
        id: 1,
        title: "Solar Energy Systems for Engineers",
        issuer: "University at Buffalo",
        date: "October 2024",
        year: "2024",
        category: "electrical-electronics",
        image: "images/sertifikalar/buffalo_solar.jpg",
        pdf: "certificates/buffalo_solar.pdf",
        description: "Güneş enerjisi sistemleri ve elektrik sistem tasarımı üzerine kapsamlı eğitim.",
        courses: [
            "Solar Energy Systems Overview",
            "Solar Energy and Electrical System Design",
            "Solar Energy Codes, Permitting and Zoning"
        ]
    },
    {
        id: 2,
        title: "Computer Vision and Machine Learning",
        issuer: "MathWorks",
        date: "October 2024",
        year: "2024",
        category: "image-processing",
        image: "images/sertifikalar/mathworks_vision.jpg",
        pdf: "certificates/mathworks_vision.pdf",
        description: "Bilgisayar görüşü ve makine öğrenmesi teknikleri üzerine ileri seviye eğitim.",
        courses: [
            "Introduction to Computer Vision",
            "Machine Learning for Computer Vision",
            "Object Tracking and Motion Detection"
        ]
    },
    {
        id: 3,
        title: "Advanced AI Engineering and Deep Learning",
        issuer: "IBM",
        date: "October 2024",
        year: "2024",
        category: "software",
        image: "images/sertifikalar/ibm_ai.jpg",
        pdf: "certificates/ibm_ai.pdf",
        description: "Derin öğrenme ve yapay zeka mühendisliği üzerine kapsamlı program.",
        courses: [
            "Machine Learning with Python",
            "Introduction to Deep Learning & Neural Networks with Keras",
            "Deep Learning with Keras and Tensorflow",
            "Introduction to Neural Networks and PyTorch",
            "Deep Learning with PyTorch",
            "AI Capstone Project with Deep Learning",
            "Generative AI and LLMs: Architecture and Data Preparation",
            "Gen AI Foundational Models for NLP & Language Understanding",
            "Generative AI Language Modeling with Transformers",
            "Generative AI Engineering and Fine-Tuning Transformers",
            "Generative AI Advance Fine-Tuning for LLMs",
            "Fundamentals of AI Agents Using RAG and LangChain",
            "Project: Generative AI Applications with RAG and LangChain"
        ]
    },
    {
        id: 4,
        title: "Software and Technology School",
        issuer: "Coderspace",
        date: "June 2024",
        year: "2024",
        category: "software",
        image: "images/sertifikalar/coderspace_tech.jpg",
        pdf: "certificates/coderspace_tech.pdf",
        description: "Yazılım geliştirme temelleri ve teknoloji inovasyonu.",
        courses: [
            "Software Development Fundamentals",
            "Technology and Innovation"
        ]
    },
    {
        id: 5,
        title: "Google Project Management",
        issuer: "Google",
        date: "June 2024",
        year: "2024",
        category: "management",
        image: "images/sertifikalar/google_pm.jpg",
        pdf: "certificates/google_pm.pdf",
        description: "Proje yönetimi süreçlerinden başarılı proje uygulamasına kadar kapsamlı eğitim.",
        courses: [
            "Foundations of Project Management",
            "Project Initiation: Starting a Successful Project",
            "Project Planning: Putting It All Together",
            "Project Execution: Running the Project",
            "Agile Project Management",
            "Capstone: Applying Project Management in the Real World"
        ]
    },
    {
        id: 6,
        title: "A Practitioner's Approach to Power Distribution & Automation",
        issuer: "L&T EduTech",
        date: "June 2024",
        year: "2024",
        category: "electrical-electronics",
        image: "images/sertifikalar/lt_power_dist.jpg",
        pdf: "certificates/lt_power_dist.pdf",
        description: "Güç dağıtımı ve otomasyon sistemleri üzerine endüstriyel yaklaşım.",
        courses: [
            "Electrical Power Distribution",
            "MV Substation - An industrial approach (PART-A)",
            "MV Substation - An industrial approach (PART-B)"
        ]
    },
    {
        id: 7,
        title: "Power Systems and Protection Engineering",
        issuer: "L&T EduTech",
        date: "June 2024",
        year: "2024",
        category: "electrical-electronics",
        image: "images/sertifikalar/lt_power_sys.jpg",
        pdf: "certificates/lt_power_sys.pdf",
        description: "Güç sistemleri ve koruma mühendisliği üzerine kapsamlı eğitim.",
        courses: [
            "Electrical Power Generation - An Industrial Outlook",
            "Basics of Electrical Protection System",
            "Advanced Study of Protection Schemes and Switchgear",
            "Design of Transmission Line: Modelling and Performance"
        ]
    },
    {
        id: 8,
        title: "Image Processing for Engineering and Science",
        issuer: "MathWorks",
        date: "May 2024",
        year: "2024",
        category: "image-processing",
        image: "images/sertifikalar/mathworks_image.jpg",
        pdf: "certificates/mathworks_image.pdf",
        description: "Mühendislik ve bilim için görüntü işleme teknikleri.",
        courses: [
            "Introduction to Image Processing",
            "Image Segmentation, Filtering, and Region Analysis",
            "Automating Image Processing"
        ]
    },
    {
        id: 9,
        title: "AI Infrastructure and Operations Fundamentals",
        issuer: "NVIDIA",
        date: "May 2024",
        year: "2024",
        category: "software",
        image: "images/sertifikalar/nvidia_ai.jpg",
        pdf: "certificates/nvidia_ai.pdf",
        description: "Yapay zeka altyapısı ve operasyonlarının temelleri.",
        courses: []
    },
    {
        id: 10,
        title: "Professional Data Analytics",
        issuer: "Google",
        date: "April 2024",
        year: "2024",
        category: "management",
        image: "images/sertifikalar/google_analytics.jpg",
        pdf: "certificates/google_analytics.pdf",
        description: "Veri analizi süreçlerinden görselleştirmeye kadar kapsamlı program.",
        courses: [
            "Foundations: Data, Data, Everywhere",
            "Ask Questions to Make Data-Driven Decisions",
            "Prepare Data for Exploration",
            "Process Data from Dirty to Clean",
            "Analyze Data to Answer Questions",
            "Share Data Through the Art of Visualization",
            "Data Analysis with R Programming",
            "Google Data Analytics Capstone: Complete a Case Study"
        ]
    },
    {
        id: 11,
        title: "Edge Impulse Introduction to Embedded Machine Learning",
        issuer: "Edge Impulse",
        date: "March 2024",
        year: "2024",
        category: "electrical-electronics",
        image: "images/sertifikalar/edge_impulse.jpg",
        pdf: "certificates/edge_impulse.pdf",
        description: "Gömülü sistemler için makine öğrenmesi giriş eğitimi.",
        courses: []
    },
    {
        id: 12,
        title: "Introduction to Python Programming for Data Science",
        issuer: "Dataquest",
        date: "February 2024",
        year: "2024",
        category: "software",
        image: "images/sertifikalar/dataquest_python.jpg",
        pdf: "certificates/dataquest_python.pdf",
        description: "Veri bilimi için Python programlama temelleri.",
        courses: [
            "Python Programming",
            "Programming Python Variables",
            "Python Data Types: Integers, Floats, Strings",
            "Python Lists"
        ]
    },
    {
        id: 13,
        title: "AI Chatbots: Large Language Models with Chandra",
        issuer: "Dataquest",
        date: "February 2024",
        year: "2024",
        category: "software",
        image: "images/sertifikalar/dataquest_ai_chatbots.jpg",
        pdf: "certificates/dataquest_ai_chatbots.pdf",
        description: "Büyük dil modelleri ve AI chatbot'lar üzerine eğitim.",
        courses: [
            "Introduction to AI Chatbots with Chandra",
            "Capabilities and Limitations of AI Chatbots",
            "Managing Effective Interactions with AI Chatbots"
        ]
    },
    // Yabancı Dil Sertifikaları
    {
        id: 14,
        title: "DELF - Fransız Dilinde Eğitim Diploması (A2)",
        issuer: "DELF",
        date: "2015",
        year: "2015",
        category: "language",
        image: "images/sertifikalar/delf_a2.jpg",
        pdf: "certificates/delf_a2.pdf",
        description: "Fransızca dil yeterlilik sertifikası A2 seviyesi.",
        courses: []
    },
    {
        id: 15,
        title: "Certificat de remerciement (participé de la francophonie)",
        issuer: "Francophonie",
        date: "2016",
        year: "2016",
        category: "language",
        image: "images/sertifikalar/francophonie.jpg",
        pdf: "certificates/francophonie.pdf",
        description: "Frankofoni etkinliğine katılım sertifikası.",
        courses: []
    },
    {
        id: 16,
        title: "Le plus grand concours scolaire du monde (Kangourou)",
        issuer: "Kangourou",
        date: "2018",
        year: "2018",
        category: "language",
        image: "images/sertifikalar/kangourou.jpg",
        pdf: "certificates/kangourou.pdf",
        description: "Kangourou matematik yarışması katılım sertifikası.",
        courses: []
    },
    // Sabancı Üniversitesi Yaz Okulu Sertifikaları - 2017
    {
        id: 17,
        title: "Sabancı Üniversitesi Yaz Okulu",
        issuer: "Sabancı Üniversitesi",
        date: "2017",
        year: "2017",
        category: "education",
        image: "images/sertifikalar/sabanci_2017.jpg",
        pdf: "certificates/sabanci_2017.pdf",
        description: "Sabancı Üniversitesi Yaz Okulu - 2017 yılında alınan dersler.",
        courses: [
            "Bağışıklık Sistemi ve Kanser İlaç Tasarımı",
            "Kozmoloji ve Evren",
            "Malzeme Bilimi ve Nano Mühendislik"
        ]
    },
    // Sabancı Üniversitesi Yaz Okulu Sertifikaları - 2018
    {
        id: 18,
        title: "Sabancı Üniversitesi Yaz Okulu",
        issuer: "Sabancı Üniversitesi",
        date: "2018",
        year: "2018",
        category: "education",
        image: "images/sertifikalar/sabanci_2018.jpg",
        pdf: "certificates/sabanci_2018.pdf",
        description: "Sabancı Üniversitesi Yaz Okulu - 2018 yılında alınan dersler.",
        courses: [
            "Cerrahi Robotlar ve Biyomedikal",
            "Endüstri Mühendisliğine Giriş"
        ]
    }
];

// Kategori isimleri
const categoryNames = {
    'all': 'Tümü',
    'software': 'Yazılım',
    'electrical-electronics': 'Elektrik-Elektronik',
    'management': 'Yönetim',
    'language': 'Yabancı Dil',
    'education': 'Eğitim',
    'image-processing': 'Görüntü İşleme'
};

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    initializeCertificates();
    setupFilters();
    setupSearch();
    updateStatistics();
});

// Tarih sıralama fonksiyonu
function sortByDate(certs) {
    return certs.sort((a, b) => {
        // Yılı ve ayı parse et
        const dateA = parseDate(a.date);
        const dateB = parseDate(b.date);
        return dateB - dateA; // Yeni tarihler önce
    });
}

// Tarih parse etme fonksiyonu
function parseDate(dateString) {
    const months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4, 'may': 5, 'june': 6,
        'july': 7, 'august': 8, 'september': 9, 'october': 10, 'november': 11, 'december': 12,
        'ocak': 1, 'şubat': 2, 'mart': 3, 'nisan': 4, 'mayıs': 5, 'haziran': 6,
        'temmuz': 7, 'ağustos': 8, 'eylül': 9, 'ekim': 10, 'kasım': 11, 'aralık': 12
    };
    
    // Tarih string'ini parse et
    const parts = dateString.toLowerCase().trim().split(' ');
    let month = 1;
    let year = new Date().getFullYear();
    
    // Ay ismini bul
    for (let i = 0; i < parts.length; i++) {
        if (months[parts[i]]) {
            month = months[parts[i]];
            // Bir sonraki parça yıl olabilir
            if (parts[i + 1] && !isNaN(parseInt(parts[i + 1]))) {
                year = parseInt(parts[i + 1]);
            }
            break;
        }
        // Direkt yıl olabilir
        if (!isNaN(parseInt(parts[i])) && parseInt(parts[i]) > 1900) {
            year = parseInt(parts[i]);
        }
    }
    
    return new Date(year, month - 1);
}

// Sertifikaları başlat
function initializeCertificates() {
    const categorySections = document.getElementById('categorySections');
    categorySections.innerHTML = '';
    
    // Tüm sertifikaları zamana göre sırala
    const sortedAllCerts = sortByDate([...certificatesData]);
    
    // "Tümü" için tek bir grid oluştur
    const allSection = document.createElement('div');
    allSection.className = 'category-section';
    allSection.id = 'category-all';
    
    const allGrid = document.createElement('div');
    allGrid.className = 'certificates-grid';
    allGrid.id = 'allCertificatesGrid';
    
    sortedAllCerts.forEach(cert => {
        const card = createCertificateCard(cert);
        allGrid.appendChild(card);
    });
    
    allSection.appendChild(allGrid);
    categorySections.appendChild(allSection);
    
    // Kategorilere göre grupla ve sırala
    const categories = ['software', 'electrical-electronics', 'management', 'language', 'education', 'image-processing'];
    
    categories.forEach(category => {
        const categoryCerts = certificatesData.filter(c => c.category === category);
        if (categoryCerts.length > 0) {
            const sortedCategoryCerts = sortByDate([...categoryCerts]);
            
            const section = document.createElement('div');
            section.className = 'category-section';
            section.id = `category-${category}`;
            section.style.display = 'none'; // Başlangıçta gizli
            
            const heading = document.createElement('h2');
            heading.className = 'category-heading';
            heading.textContent = categoryNames[category];
            section.appendChild(heading);
            
            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'certificates-grid';
            
            sortedCategoryCerts.forEach(cert => {
                const card = createCertificateCard(cert);
                categoryGrid.appendChild(card);
            });
            
            section.appendChild(categoryGrid);
            categorySections.appendChild(section);
        }
    });
}

// Sertifika kartı oluştur
function createCertificateCard(cert) {
    const card = document.createElement('div');
    card.className = `certificate-card ${cert.category}`;
    card.setAttribute('data-category', cert.category);
    card.setAttribute('data-title', cert.title.toLowerCase());
    card.setAttribute('data-issuer', cert.issuer.toLowerCase());
    
    card.innerHTML = `
        <div class="cert-card-image">
            <img src="${cert.image}" alt="${cert.title}">
            <span class="cert-category-badge">${categoryNames[cert.category].toUpperCase()}</span>
            <span class="cert-year-badge">${cert.year}</span>
        </div>
        <div class="cert-card-content">
            <h3 class="cert-card-title">${cert.title}</h3>
            <div class="cert-card-meta">
                <span class="cert-card-issuer">
                    <i class="fas fa-user"></i>
                    ${cert.issuer}
                </span>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => openModal(cert));
    
    return card;
}

// Modal aç
function openModal(cert) {
    const modal = document.getElementById('certificateModal');
    const modalImage = document.getElementById('modalImage');
    const modalCategory = document.getElementById('modalCategory');
    const modalTitle = document.getElementById('modalTitle');
    const modalIssuer = document.getElementById('modalIssuer');
    const modalDate = document.getElementById('modalDate');
    const modalDescription = document.getElementById('modalDescription');
    const modalCourses = document.getElementById('modalCourses');
    const verifyBtn = document.getElementById('verifyBtn');
    
    modalImage.src = cert.image;
    modalImage.alt = cert.title;
    modalCategory.textContent = categoryNames[cert.category].toUpperCase();
    modalCategory.className = `modal-category category-${cert.category}`;
    modalTitle.textContent = cert.title;
    modalIssuer.textContent = cert.issuer;
    modalDate.textContent = cert.date;
    modalDescription.textContent = cert.description;
    
    // Kursları göster
    if (cert.courses && cert.courses.length > 0) {
        modalCourses.innerHTML = '<h4>Kurs İçeriği:</h4><ul>';
        cert.courses.forEach(course => {
            modalCourses.innerHTML += `<li>${course}</li>`;
        });
        modalCourses.innerHTML += '</ul>';
    } else {
        modalCourses.innerHTML = '';
    }
    
    // Doğrulama butonu
    verifyBtn.onclick = () => {
        window.open(cert.pdf, '_blank');
    };
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Modal kapat
function closeModal() {
    const modal = document.getElementById('certificateModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Filtreleri ayarla
function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Aktif butonu güncelle
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.getAttribute('data-category');
            
            // Tüm kategori bölümlerini gizle
            const allSections = document.querySelectorAll('.category-section');
            allSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Seçili kategoriyi göster
            if (category === 'all') {
                const allSection = document.getElementById('category-all');
                if (allSection) {
                    allSection.style.display = 'block';
                }
                // En üste scroll
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            } else {
                const categorySection = document.getElementById(`category-${category}`);
                if (categorySection) {
                    categorySection.style.display = 'block';
                    // Kategoriye scroll yap
                    setTimeout(() => {
                        const headerOffset = 100;
                        const elementPosition = categorySection.getBoundingClientRect().top;
                        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }, 100);
                }
            }
            
            // Arama ile birlikte filtrele
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            filterCertificates(category, searchTerm);
        });
    });
}

// Sertifikaları filtrele
function filterCertificates(category, searchTerm = '') {
    const activeSection = category === 'all' 
        ? document.getElementById('category-all')
        : document.getElementById(`category-${category}`);
    
    if (!activeSection) return;
    
    const cards = activeSection.querySelectorAll('.certificate-card');
    
    // Kartları filtrele
    cards.forEach(card => {
        const cardTitle = card.getAttribute('data-title');
        const cardIssuer = card.getAttribute('data-issuer');
        
        const matchesSearch = !searchTerm || 
            cardTitle.includes(searchTerm) || 
            cardIssuer.includes(searchTerm);
        
        if (matchesSearch) {
            card.style.display = 'block';
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            }, 10);
        } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.8)';
            setTimeout(() => {
                card.style.display = 'none';
            }, 300);
        }
    });
}

// Arama ayarla
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    
    searchInput.addEventListener('input', (e) => {
        const activeFilter = document.querySelector('.filter-btn.active');
        const category = activeFilter ? activeFilter.getAttribute('data-category') : 'all';
        const searchTerm = e.target.value.toLowerCase();
        filterCertificates(category, searchTerm);
    });
}

// İstatistikleri güncelle
function updateStatistics() {
    const totalCertificates = certificatesData.length;
    const issuers = [...new Set(certificatesData.map(c => c.issuer))];
    const categories = [...new Set(certificatesData.map(c => c.category))];
    
    // Animasyonlu sayı gösterimi
    animateNumber('totalCertificates', totalCertificates);
    animateNumber('totalIssuers', issuers.length);
    animateNumber('totalCategories', categories.length);
}

// Sayı animasyonu
function animateNumber(elementId, target) {
    const element = document.getElementById(elementId);
    let current = 0;
    const increment = target / 30;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 30);
}

// Modal kapatma event'leri
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('certificateModal');
    const closeBtn = document.getElementById('closeModal');
    const overlay = document.querySelector('.modal-overlay');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
    
    // ESC tuşu ile kapat
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});

