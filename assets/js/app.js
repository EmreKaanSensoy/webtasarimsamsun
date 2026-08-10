// Unregister any active service workers from previous localhost projects to prevent console errors
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
            registration.unregister();
            console.log('Eski Servis Çalışanı temizlendi.');
        }
    }).catch(err => {
        console.warn('Servis çalışanı devredışı bırakılamadı:', err);
    });
}

document.addEventListener('DOMContentLoaded', async () => {

    /* ==========================================================================
       0. INITIAL DEFAULT CONFIGURATIONS (FALLBACKS)
       ========================================================================== */
    const defaultPricing = {
        corporate: { price: 18000, days: 8 },
        ecommerce: { price: 28000, days: 15 },
        landing: { price: 10000, days: 4 },
        custom: { price: 45000, days: 25 },
        
        extras: {
            'custom-design': { price: 6000, days: 3 },
            'advanced-seo': { price: 5000, days: 2 },
            'logo-branding': { price: 4000, days: 0 },
            'multilang': { price: 4500, days: 2 }
        },
        
        scale: {
            onesingle: { price: 0, days: 0 },
            small: { price: 1500, days: 2 },
            medium: { price: 4500, days: 5 },
            large: { price: 9000, days: 10 }
        }
    };

    const defaultServices = {
        s1: {
            title: 'Kurumsal Web Tasarım',
            desc: 'Markanızın prestijini artıran, yüksek hızlı, tamamen size özel olarak kodlanmış, mobil uyumlu ve kolay yönetim panelli kurumsal web siteleri.',
            items: ['Özgün UI/UX Arayüz Tasarımı', 'WordPress veya Özel Panel Seçenekleri', 'SEO Altyapısı Hazır']
        },
        s2: {
            title: 'E-Ticaret Sistemleri',
            desc: 'Güvenli ödeme altyapıları, gelişmiş sipariş/stok yönetim paneli ve pazaryeri entegrasyonlarıyla donatılmış satış odaklı online mağazalar.',
            items: ['Sanal POS & Kargo Entegrasyonları', 'Trendyol/Hepsiburada Entegrasyonu', 'Hızlı ve Güvenli Sepet Deneyimi']
        },
        s3: {
            title: 'SEO & Yapay Zekâ Görünürlüğü',
            desc: 'Sadece Google değil; ChatGPT, Gemini ve Claude gibi yapay zekâ motorlarında (GEO/AEO) markanızın en üstte görünmesini sağlayan modern optimizasyon.',
            items: ['Google Arama Optimizasyonu (SEO)', 'Üretken Motor Optimizasyonu (GEO)', 'Teknik ve İçeriksel SEO Yönetimi']
        },
        s4: {
            title: 'Grafik Tasarım & Kurumsal Kimlik',
            desc: 'Dijital ve fiziksel mecralarda markanızı profesyonelce temsil edecek logo, kurumsal kimlik rehberi, sosyal medya şablonları ve görsel tasarımlar.',
            items: ['Modern Logo ve Amblem Tasarımı', 'Kartvizit, Antetli Kağıt ve Dosya', 'Sosyal Medya Tasarım Şablonları']
        }
    };


    /* ==========================================================================
       1. THEME SWITCHER (DARK / LIGHT MODE)
       ========================================================================== */
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const bodyElement = document.body;

    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    bodyElement.className = savedTheme;

    themeToggleBtn.addEventListener('click', () => {
        if (bodyElement.classList.contains('dark-theme')) {
            bodyElement.classList.replace('dark-theme', 'light-theme');
            localStorage.setItem('theme', 'light-theme');
        } else {
            bodyElement.classList.replace('light-theme', 'dark-theme');
            localStorage.setItem('theme', 'dark-theme');
        }
    });


    /* ==========================================================================
       2. STICKY HEADER & SCROLL SPY
       ========================================================================== */
    const siteHeader = document.getElementById('siteHeader');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.desktop-nav .nav-link');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }

        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });


    /* ==========================================================================
       3. MOBILE MENU OVERLAY
       ========================================================================== */
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    const openMobileMenu = () => {
        mobileMenuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    };

    const closeMobileMenu = () => {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    mobileMenuBtn.addEventListener('click', openMobileMenu);
    mobileCloseBtn.addEventListener('click', closeMobileMenu);
    
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });


    /* ==========================================================================
       4. DYNAMIC SERVICES CARD RENDERING (Supabase Sync)
       ========================================================================== */
    const servicesGrid = document.getElementById('servicesGrid');

    const renderServices = async () => {
        if (!servicesGrid) return;
        
        // Fetch services config from Supabase (or fallback to local)
        const services = await SupabaseService.getSettings('services_config', defaultServices);
        
        const serviceLayout = [
            { icon: 'bi-window-fullscreen', grad: 'grad-1' },
            { icon: 'bi-cart3', grad: 'grad-2' },
            { icon: 'bi-search-heart', grad: 'grad-3' },
            { icon: 'bi-palette', grad: 'grad-4' }
        ];

        servicesGrid.innerHTML = '';

        const keys = Object.keys(services);
        keys.forEach((key, index) => {
            const data = services[key];
            if (!data) return;

            const card = document.createElement('div');
            card.className = 'service-card';
            
            const layout = serviceLayout[index % serviceLayout.length] || { icon: 'bi-window-fullscreen', grad: 'grad-1' };
            const listItemsHtml = (data.items || []).map(item => `<li><i class="bi bi-patch-check"></i> ${escapeHTML(item)}</li>`).join('');

            card.innerHTML = `
                <div class="service-icon-wrapper ${layout.grad}">
                    <i class="bi ${layout.icon}"></i>
                </div>
                <h3 class="service-card-title">${escapeHTML(data.title)}</h3>
                <p class="service-card-text">${escapeHTML(data.desc)}</p>
                <ul class="service-list">
                    ${listItemsHtml}
                </ul>
            `;
            servicesGrid.appendChild(card);
        });
    };

    await renderServices();


    /* ==========================================================================
       5. FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        
        questionBtn.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });

            if (!isActive) {
                item.classList.add('active');
            }
        });
    });


    /* ==========================================================================
       6. INTERACTIVE PROJE TEKLİF SİHİRBAZI (QUOTE WIZARD - Supabase Integrations)
       ========================================================================== */
    let currentStep = 1;
    const totalSteps = 5;

    // Elements
    const wizPrevBtn = document.getElementById('wizPrevBtn');
    const wizNextBtn = document.getElementById('wizNextBtn');
    const wizSubmitBtn = document.getElementById('wizSubmitBtn');
    const wizardProgressBar = document.getElementById('wizardProgressBar');
    const indicators = document.querySelectorAll('.step-indicator');

    // Input elements
    const projectTypeInputs = document.getElementsByName('projectType');
    const extraCheckboxes = document.getElementsByName('extras');
    const projectScaleInputs = document.getElementsByName('projectScale');
    
    // Step 4 fields
    const wizName = document.getElementById('wizName');
    const wizPhone = document.getElementById('wizPhone');
    const wizEmail = document.getElementById('wizEmail');
    const wizNotes = document.getElementById('wizNotes');

    // Step 5 display elements
    const resProjectType = document.getElementById('resProjectType');
    const resScale = document.getElementById('resScale');
    const resExtras = document.getElementById('resExtras');
    const resDuration = document.getElementById('resDuration');
    const resPrice = document.getElementById('resPrice');

    // Update wizard steps & progress bar UI
    const updateWizardUI = () => {
        for (let i = 1; i <= totalSteps; i++) {
            const stepElement = document.getElementById(`step${i}`);
            if (i === currentStep) {
                stepElement.classList.add('active');
            } else {
                stepElement.classList.remove('active');
            }
        }

        indicators.forEach((indicator, index) => {
            const stepNum = index + 1;
            indicator.classList.remove('active', 'completed');
            if (stepNum === currentStep) {
                indicator.classList.add('active');
            } else if (stepNum < currentStep) {
                indicator.classList.add('completed');
            }
        });

        const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        wizardProgressBar.style.width = `${progressPercentage}%`;

        if (currentStep === 1) {
            wizPrevBtn.disabled = true;
        } else {
            wizPrevBtn.disabled = false;
        }

        if (currentStep === totalSteps - 1) {
            wizNextBtn.style.display = 'none';
            wizSubmitBtn.style.display = 'inline-flex';
        } else if (currentStep === totalSteps) {
            wizPrevBtn.style.display = 'none';
            wizNextBtn.style.display = 'none';
            wizSubmitBtn.style.display = 'none';
        } else {
            wizPrevBtn.style.display = 'inline-flex';
            wizNextBtn.style.display = 'inline-flex';
            wizSubmitBtn.style.display = 'none';
        }
    };

    // Calculate project cost & time frame
    const calculateProposal = async () => {
        // Load Pricing Config from Supabase
        const pricing = await SupabaseService.getSettings('pricing_config', defaultPricing);

        // 1. Get Radio values
        let typeVal = 'corporate';
        projectTypeInputs.forEach(input => {
            if (input.checked) typeVal = input.value;
        });

        let scaleVal = 'small';
        projectScaleInputs.forEach(input => {
            if (input.checked) scaleVal = input.value;
        });

        // 2. Base pricing & duration matrices
        let basePrice = pricing.corporate.price;
        let baseDays = pricing.corporate.days;
        let typeName = 'Kurumsal Web Sitesi';

        switch (typeVal) {
            case 'corporate':
                basePrice = pricing.corporate.price;
                baseDays = pricing.corporate.days;
                typeName = 'Kurumsal Web Sitesi';
                break;
            case 'ecommerce':
                basePrice = pricing.ecommerce.price;
                baseDays = pricing.ecommerce.days;
                typeName = 'E-Ticaret Sitesi';
                break;
            case 'landing':
                basePrice = pricing.landing.price;
                baseDays = pricing.landing.days;
                typeName = 'Tek Sayfa (Landing Page)';
                break;
            case 'custom':
                basePrice = pricing.custom.price;
                baseDays = pricing.custom.days;
                typeName = 'Özel Web Yazılımı';
                break;
        }

        // 3. Page Scale impact
        let scalePrice = pricing.scale[scaleVal] ? pricing.scale[scaleVal].price : 0;
        let scaleDays = pricing.scale[scaleVal] ? pricing.scale[scaleVal].days : 0;
        let scaleName = 'Standart Kapsam (2-5 Sayfa)';

        switch (scaleVal) {
            case 'onesingle':
                scaleName = 'Tek Sayfa';
                break;
            case 'small':
                scaleName = 'Standart Kapsam (2-5 Sayfa)';
                break;
            case 'medium':
                scaleName = 'Orta Kapsam (5-15 Sayfa)';
                break;
            case 'large':
                scaleName = 'Geniş Kapsam (15+ Sayfa)';
                break;
        }

        // 4. Extras selections
        let extrasPrice = 0;
        let extrasDays = 0;
        const selectedExtrasList = [];

        extraCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const exKey = checkbox.value;
                if (pricing.extras[exKey]) {
                    extrasPrice += pricing.extras[exKey].price;
                    extrasDays += pricing.extras[exKey].days;
                }
                
                switch (exKey) {
                    case 'custom-design':
                        selectedExtrasList.push('Özgün Tasarım');
                        break;
                    case 'advanced-seo':
                        selectedExtrasList.push('Profesyonel SEO & GEO');
                        break;
                    case 'logo-branding':
                        selectedExtrasList.push('Logo & Kurumsal Kimlik');
                        break;
                    case 'multilang':
                        selectedExtrasList.push('Çoklu Dil Desteği');
                        break;
                }
            }
        });

        // 5. Total Calculations
        const totalPrice = basePrice + scalePrice + extrasPrice;
        const totalMinDays = baseDays + scaleDays + extrasDays;
        const totalMaxDays = Math.round(totalMinDays * 1.3);

        // 6. Formatting Outputs
        resProjectType.textContent = typeName;
        resScale.textContent = scaleName;
        resExtras.textContent = selectedExtrasList.length > 0 ? selectedExtrasList.join(', ') : 'Yok';
        resDuration.textContent = `${totalMinDays}-${totalMaxDays} İş Günü`;
        
        resPrice.textContent = new Intl.NumberFormat('tr-TR', {
            style: 'currency',
            currency: 'TRY',
            maximumFractionDigits: 0
        }).format(totalPrice);
    };

    // Validation for step 4 (contact inputs)
    const validateStep4 = () => {
        if (!wizName.value.trim()) {
            alert('Lütfen adınızı/firma adınızı giriniz.');
            wizName.focus();
            return false;
        }
        const wizPhoneDigits = wizPhone.value.replace(/\D/g, '');
        if (wizPhoneDigits.length !== 11) {
            alert('Lütfen 11 haneli telefon numaranızı giriniz (örn: 0555 555 55 55).');
            wizPhone.focus();
            return false;
        }
        if (!wizEmail.value.trim() || !wizEmail.value.includes('@')) {
            alert('Lütfen geçerli bir e-posta adresi giriniz.');
            wizEmail.focus();
            return false;
        }
        return true;
    };

    // Wizard navigation triggers
    wizNextBtn.addEventListener('click', async () => {
        if (currentStep < totalSteps - 1) {
            currentStep++;
            updateWizardUI();
        } else if (currentStep === totalSteps - 1) {
            if (validateStep4()) {
                await calculateProposal();
                currentStep++;
                updateWizardUI();
            }
        }
    });

    wizPrevBtn.addEventListener('click', () => {
        if (currentStep > 1) {
            currentStep--;
            updateWizardUI();
        }
    });

    // Handle Wizard Final Submit
    wizSubmitBtn.addEventListener('click', async () => {
        if (validateStep4()) {
            await calculateProposal();
            currentStep = 5;
            updateWizardUI();
            
            // Gather wizard data
            let scaleVal = 'small';
            projectScaleInputs.forEach(input => {
                if (input.checked) scaleVal = input.value;
            });
            let typeVal = 'corporate';
            projectTypeInputs.forEach(input => {
                if (input.checked) typeVal = input.value;
            });

            const newLead = {
                id: 'lead_' + Date.now(),
                clientName: wizName.value,
                phone: wizPhone.value,
                email: wizEmail.value,
                type: typeVal,
                scale: resScale.textContent,
                extras: resExtras.textContent,
                notes: wizNotes.value,
                price: resPrice.textContent,
                duration: resDuration.textContent,
                date: new Date().toISOString(),
                status: 'new'
            };

            // Write to database (Supabase with Local fallback)
            await SupabaseService.insertLead(newLead);

            console.log('Teklif Sihirbazı Talebi Kaydedildi:', newLead);
        }
    });


    /* ==========================================================================
       7. CONTACT FORM SUBMISSION
       ========================================================================== */
    const contactForm = document.getElementById('contactForm');
    const formSuccessOverlay = document.getElementById('formSuccessOverlay');
    const btnResetForm = document.getElementById('btnResetForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phoneInput = document.getElementById('phone');
            const phone = phoneInput.value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            if (!name.trim() || !phone.trim() || !message.trim()) {
                alert('Lütfen zorunlu alanları (*) doldurunuz.');
                return;
            }

            const phoneDigits = phone.replace(/\D/g, '');
            if (phoneDigits.length !== 11) {
                alert('Lütfen 11 haneli telefon numaranızı giriniz (örn: 0545 832 39 29).');
                phoneInput.focus();
                return;
            }

            const newContactLead = {
                id: 'lead_' + Date.now(),
                clientName: name,
                phone: phone,
                email: email || 'N/A',
                type: 'contact',
                scale: 'N/A',
                extras: 'N/A',
                notes: message,
                price: 'N/A',
                duration: 'N/A',
                date: new Date().toISOString(),
                status: 'new'
            };

            // Write to database (Supabase with Local fallback)
            await SupabaseService.insertLead(newContactLead);

            console.log('İletişim Formu Talebi Kaydedildi:', newContactLead);

            formSuccessOverlay.classList.add('active');
        });
    }

    if (btnResetForm) {
        btnResetForm.addEventListener('click', () => {
            contactForm.reset();
            formSuccessOverlay.classList.remove('active');
        });
    }

    // Telephone number dynamic formatting (05XX XXX XX XX)
    function formatPhoneNumber(value) {
        const cleaned = value.replace(/\D/g, '');
        const limited = cleaned.substring(0, 11);
        let formatted = '';
        if (limited.length > 0) {
            formatted += limited.substring(0, 4);
        }
        if (limited.length > 4) {
            formatted += ' ' + limited.substring(4, 7);
        }
        if (limited.length > 7) {
            formatted += ' ' + limited.substring(7, 9);
        }
        if (limited.length > 9) {
            formatted += ' ' + limited.substring(9, 11);
        }
        return formatted;
    }

    const setupPhoneFormatting = (inputElement) => {
        if (!inputElement) return;
        inputElement.addEventListener('input', (e) => {
            const selectionStart = e.target.selectionStart;
            const previousValueLength = e.target.value.length;
            const formatted = formatPhoneNumber(e.target.value);
            e.target.value = formatted;
            if (selectionStart < previousValueLength) {
                e.target.setSelectionRange(selectionStart, selectionStart);
            }
        });
    };

    setupPhoneFormatting(wizPhone);
    setupPhoneFormatting(document.getElementById('phone'));


    /* ==========================================================================
       DYNAMIC PROJECTS SHOWCASE LOADER
       ========================================================================== */
    const defaultProjectsList = [
        {
            id: 'proj_1',
            number: '01',
            name: 'Nextlevel Studio',
            category: 'Müşteri Projesi • E-Ticaret & Web App',
            img1: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85',
            img2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85',
            img3: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85',
            link: '#wizard-section'
        },
        {
            id: 'proj_2',
            number: '02',
            name: 'Aura Brand Identity',
            category: 'Ajans Projesi • Kurumsal & UI/UX',
            img1: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85',
            img2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85',
            img3: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85',
            link: '#wizard-section'
        },
        {
            id: 'proj_3',
            number: '03',
            name: 'Solaris Digital',
            category: 'Özel Proje • SEO & Dijital Dönüşüm',
            img1: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85',
            img2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85',
            img3: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85',
            link: '#wizard-section'
        }
    ];

    async function renderDynamicProjects() {
        const container = document.getElementById('projectsContainer');
        if (!container) return;

        let projects = defaultProjectsList;
        try {
            if (typeof SupabaseService !== 'undefined') {
                const dbProjects = await SupabaseService.getSettings('projects_config', defaultProjectsList);
                if (Array.isArray(dbProjects) && dbProjects.length > 0) {
                    projects = dbProjects;
                }
            }
        } catch (e) {
            console.warn("Could not fetch projects from Supabase:", e);
        }

        // Filter out hidden/inactive projects
        projects = projects.filter(proj => proj.visible !== false);

        container.innerHTML = projects.map((proj, idx) => `
            <div class="sticky-project-card">
                <div class="card-top-row">
                    <div class="d-flex align-items-center gap-3">
                        <span class="card-number-badge">${escapeHTML(proj.number || ('0' + (idx + 1)))}</span>
                        <div class="card-title-group">
                            <span class="card-category">${escapeHTML(proj.category || 'Müşteri Projesi')}</span>
                            <h3 class="card-project-name">${escapeHTML(proj.name)}</h3>
                        </div>
                    </div>
                    <a href="${escapeHTML(proj.link || '#wizard-section')}" class="btn-live-project">Projeyi İncele <i class="bi bi-arrow-up-right"></i></a>
                </div>
                <div class="card-grid-images">
                    <div class="col-left-stacked">
                        <div class="card-img-box img-left-top">
                            <img src="${escapeHTML(proj.img1)}" alt="${escapeHTML(proj.name)} Top Mockup" loading="lazy">
                        </div>
                        <div class="card-img-box img-left-bottom">
                            <img src="${escapeHTML(proj.img2)}" alt="${escapeHTML(proj.name)} Bottom Mockup" loading="lazy">
                        </div>
                    </div>
                    <div class="card-img-box img-right-tall">
                        <img src="${escapeHTML(proj.img3)}" alt="${escapeHTML(proj.name)} Main Mockup" loading="lazy">
                    </div>
                </div>
            </div>
        `).join('');

        if (window.ScrollMotion && typeof window.ScrollMotion.init === 'function') {
            window.ScrollMotion.init();
        }
    }

    try {
        await renderDynamicProjects();
    } catch (e) {
        console.error("Dynamic projects rendering failed:", e);
    }

    /* ==========================================================================
       DYNAMIC MARQUEE SHOWCASE LOADER
       ========================================================================== */
    const defaultMarqueeList = {
        row1: [
            'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
            'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
            'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
            'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
            'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
            'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
            'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
            'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
            'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
            'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
            'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif'
        ],
        row2: [
            'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
            'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
            'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
            'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
            'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
            'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
            'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
            'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
            'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
            'https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif'
        ]
    };

    async function renderDynamicMarquee() {
        const row1El = document.querySelector('.marquee-row-1');
        const row2El = document.querySelector('.marquee-row-2');
        if (!row1El || !row2El) return;

        let marqueeConfig = defaultMarqueeList;
        try {
            if (typeof SupabaseService !== 'undefined') {
                const dbData = await SupabaseService.getSettings('marquee_config', defaultMarqueeList);
                if (dbData && Array.isArray(dbData.row1) && Array.isArray(dbData.row2)) {
                    marqueeConfig = dbData;
                }
            }
        } catch (e) {
            console.warn("Could not fetch marquee config from Supabase:", e);
        }

        const row1Items = [...marqueeConfig.row1, ...marqueeConfig.row1, ...marqueeConfig.row1];
        const row2Items = [...marqueeConfig.row2, ...marqueeConfig.row2, ...marqueeConfig.row2];

        row1El.innerHTML = row1Items.map(url => `
            <div class="marquee-tile"><img src="${escapeHTML(url)}" alt="Showcase" loading="lazy"></div>
        `).join('');

        row2El.innerHTML = row2Items.map(url => `
            <div class="marquee-tile"><img src="${escapeHTML(url)}" alt="Showcase" loading="lazy"></div>
        `).join('');

        if (window.ScrollMotion && typeof window.ScrollMotion.init === 'function') {
            window.ScrollMotion.init();
        }
    }

    try {
        await renderDynamicMarquee();
    } catch (e) {
        console.error("Dynamic marquee rendering failed:", e);
    }

    /* ==========================================================================
       HELPERS
       ========================================================================== */
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

});
