/**
 * samsunwebtasarim.com - Admin Dashboard Panel Logic (admin.js)
 * Implements: Tab navigation, Supabase settings forms, SQL Helper templates, leads inbox CRUD, and Database configurations.
 */

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
       1. INITIAL DEFAULT CONFIGURATIONS (FALLBACKS)
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

    const defaultEmailConfig = {
        serviceId: 'service_kbx2enj',
        templateId: 'template_8up3cvy',
        publicKey: 'caD61I97xZ-4HVP-j'
    };

    // Preload LocalStorage structures as offline fallbacks
    if (!localStorage.getItem('pricing_config')) {
        localStorage.setItem('pricing_config', JSON.stringify(defaultPricing));
    }
    if (!localStorage.getItem('services_config')) {
        localStorage.setItem('services_config', JSON.stringify(defaultServices));
    }
    if (!localStorage.getItem('email_config')) {
        localStorage.setItem('email_config', JSON.stringify(defaultEmailConfig));
    }
    if (!localStorage.getItem('leads_data')) {
        const dummyLeads = [
            {
                id: 'lead_1',
                clientName: 'Samsun Un Fabrikası A.Ş.',
                phone: '0532 111 22 33',
                email: 'info@samsunun.com.tr',
                type: 'corporate',
                scale: 'medium',
                extras: 'Özgün Tasarım, Profesyonel SEO & GEO',
                notes: 'Yurt dışı ihracat odaklı, modern ve hızlı bir kurumsal tanıtım sayfası istiyoruz.',
                price: '27.500 ₺',
                duration: '13-16 İş Günü',
                date: '2026-07-14T10:15:30Z',
                status: 'new'
            },
            {
                id: 'lead_2',
                clientName: 'Derya Çiçekçilik İlkadım',
                phone: '0544 999 88 77',
                email: 'derya@cicek.com',
                type: 'contact',
                scale: 'N/A',
                extras: 'N/A',
                notes: 'Merhaba, e-ticaret siteleri hakkında bilgi almak istiyoruz. Samsun ofisinize gelip detaylı görüşebilir miyiz?',
                price: 'N/A',
                duration: 'N/A',
                date: '2026-07-13T16:40:00Z',
                status: 'read'
            }
        ];
        localStorage.setItem('leads_data', JSON.stringify(dummyLeads));
    }


    /* ==========================================================================
       2. TAB NAVIGATION
       ========================================================================== */
    const menuLinks = document.querySelectorAll('.admin-menu-link');
    const tabPanels = document.querySelectorAll('.admin-tab-panel');
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');

    const tabMeta = {
        dashboard: { title: 'Genel Bakış', sub: 'Web Samsun Tasarım platform ayarları ve veritabanı durum özeti.' },
        pricing: { title: 'Teklif Fiyat Ayarları', sub: 'Teklif Sihirbazı proje modüllerinin birim ücretleri ve teslim süreleri.' },
        'services-admin': { title: 'Hizmet Yönetimi', sub: 'Ana sayfadaki 4 ana hizmet kartının başlık ve metin içerikleri.' },
        leads: { title: 'Gelen Talepler', sub: 'Teklif sihirbazından ve iletişim formundan gelen müşteri kayıtları.' }
    };

    menuLinks.forEach(link => {
        link.addEventListener('click', async () => {
            const targetTab = link.getAttribute('data-tab');

            menuLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                if (panel.getAttribute('id') === `tab-${targetTab}`) {
                    panel.classList.add('active');
                }
            });

            pageTitle.textContent = tabMeta[targetTab].title;
            pageSubtitle.textContent = tabMeta[targetTab].sub;

            if (targetTab === 'dashboard') {
                await calculateDashboardStats();
                renderDatabaseBadge();
            } else if (targetTab === 'leads') {
                await renderLeadsTable();
            }
        });
    });


    /* ==========================================================================
       3. TOAST MESSAGES & DB BADGE
       ========================================================================== */
    const adminToast = document.getElementById('adminToast');
    const toastMessage = document.getElementById('toastMessage');

    const showToast = (message, isSuccess = true) => {
        toastMessage.textContent = message;
        adminToast.style.borderLeftColor = isSuccess ? 'var(--color-success)' : 'var(--color-accent)';
        const icon = adminToast.querySelector('i');
        if (icon) {
            icon.className = isSuccess ? 'bi bi-check-circle-fill' : 'bi-exclamation-triangle-fill';
            icon.style.color = isSuccess ? 'var(--color-success)' : 'var(--color-accent)';
        }
        adminToast.classList.add('active');
        setTimeout(() => {
            adminToast.classList.remove('active');
        }, 3000);
    };

    const renderDatabaseBadge = () => {
        const badge = document.getElementById('dbBadgeStatus');
        if (!badge) return;

        const active = SupabaseService.isActive();
        badge.className = active ? 'badge-webbeyaz' : 'badge-webbeyaz inactive';
        badge.innerHTML = `
            <span class="badge-dot" style="background-color: ${active ? 'var(--color-success)' : 'var(--color-accent)'};"></span>
            ${active ? 'Supabase Bağlantısı Aktif' : 'Bulut Çevrimdışı (Yerel Bellek Modu)'}
        `;
    };


    /* ==========================================================================
       4. BINDING & SAVING CONFIG: PRICING (Supabase Sync)
       ========================================================================== */
    const pricingForm = document.getElementById('pricingConfigForm');

    const loadPricingInputs = async () => {
        const config = await SupabaseService.getSettings('pricing_config', defaultPricing);

        // Base types
        document.getElementById('pCorporatePrice').value = config.corporate.price;
        document.getElementById('pCorporateDays').value = config.corporate.days;
        document.getElementById('pEcommercePrice').value = config.ecommerce.price;
        document.getElementById('pEcommerceDays').value = config.ecommerce.days;
        document.getElementById('pLandingPrice').value = config.landing.price;
        document.getElementById('pLandingDays').value = config.landing.days;
        document.getElementById('pCustomPrice').value = config.custom.price;
        document.getElementById('pCustomDays').value = config.custom.days;

        // Extras
        document.getElementById('extDesignPrice').value = config.extras['custom-design'].price;
        document.getElementById('extDesignDays').value = config.extras['custom-design'].days;
        document.getElementById('extSeoPrice').value = config.extras['advanced-seo'].price;
        document.getElementById('extSeoDays').value = config.extras['advanced-seo'].days;
        document.getElementById('extBrandPrice').value = config.extras['logo-branding'].price;
        document.getElementById('extBrandDays').value = config.extras['logo-branding'].days;
        document.getElementById('extLangPrice').value = config.extras['multilang'].price;
        document.getElementById('extLangDays').value = config.extras['multilang'].days;

        // Scale
        document.getElementById('scaleSmallPrice').value = config.scale.small.price;
        document.getElementById('scaleSmallDays').value = config.scale.small.days;
        document.getElementById('scaleMediumPrice').value = config.scale.medium.price;
        document.getElementById('scaleMediumDays').value = config.scale.medium.days;
        document.getElementById('scaleLargePrice').value = config.scale.large.price;
        document.getElementById('scaleLargeDays').value = config.scale.large.days;
    };

    await loadPricingInputs();

    pricingForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedConfig = {
            corporate: {
                price: parseFloat(document.getElementById('pCorporatePrice').value),
                days: parseInt(document.getElementById('pCorporateDays').value)
            },
            ecommerce: {
                price: parseFloat(document.getElementById('pEcommercePrice').value),
                days: parseInt(document.getElementById('pEcommerceDays').value)
            },
            landing: {
                price: parseFloat(document.getElementById('pLandingPrice').value),
                days: parseInt(document.getElementById('pLandingDays').value)
            },
            custom: {
                price: parseFloat(document.getElementById('pCustomPrice').value),
                days: parseInt(document.getElementById('pCustomDays').value)
            },
            extras: {
                'custom-design': {
                    price: parseFloat(document.getElementById('extDesignPrice').value),
                    days: parseInt(document.getElementById('extDesignDays').value)
                },
                'advanced-seo': {
                    price: parseFloat(document.getElementById('extSeoPrice').value),
                    days: parseInt(document.getElementById('extSeoDays').value)
                },
                'logo-branding': {
                    price: parseFloat(document.getElementById('extBrandPrice').value),
                    days: parseInt(document.getElementById('extBrandDays').value)
                },
                'multilang': {
                    price: parseFloat(document.getElementById('extLangPrice').value),
                    days: parseInt(document.getElementById('extLangDays').value)
                }
            },
            scale: {
                onesingle: { price: 0, days: 0 },
                small: {
                    price: parseFloat(document.getElementById('scaleSmallPrice').value),
                    days: parseInt(document.getElementById('scaleSmallDays').value)
                },
                medium: {
                    price: parseFloat(document.getElementById('scaleMediumPrice').value),
                    days: parseInt(document.getElementById('scaleMediumDays').value)
                },
                large: {
                    price: parseFloat(document.getElementById('scaleLargePrice').value),
                    days: parseInt(document.getElementById('scaleLargeDays').value)
                }
            }
        };

        const success = await SupabaseService.saveSettings('pricing_config', updatedConfig);
        if (success) {
            showToast('Fiyat ayarları veritabanına kaydedildi!');
        } else {
            showToast('Lokal kaydedildi, ancak veritabanı yazma hatası!', false);
        }
    });
    const emailConfigForm = document.getElementById('emailConfigForm');
    let currentEmailConfig = {};

    const loadEmailConfig = async () => {
        const config = await SupabaseService.getSettings('email_config', defaultEmailConfig);
        currentEmailConfig = JSON.parse(JSON.stringify(config));

        const serviceIdInput = document.getElementById('emailServiceId');
        const templateIdInput = document.getElementById('emailTemplateId');
        const publicKeyInput = document.getElementById('emailPublicKey');

        if (serviceIdInput) serviceIdInput.value = config.serviceId || '';
        if (templateIdInput) templateIdInput.value = config.templateId || '';
        if (publicKeyInput) publicKeyInput.value = config.publicKey || '';
    };

    if (emailConfigForm) {
        emailConfigForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updatedConfig = {
                serviceId: document.getElementById('emailServiceId').value.trim(),
                templateId: document.getElementById('emailTemplateId').value.trim(),
                publicKey: document.getElementById('emailPublicKey').value.trim()
            };

            const success = await SupabaseService.saveSettings('email_config', updatedConfig);
            if (success) {
                currentEmailConfig = updatedConfig;
                showToast('E-Posta ayarları veritabanına kaydedildi!');
            } else {
                showToast('Lokal kaydedildi, ancak veritabanına kaydedilemedi.', false);
            }
        });
    }

    /* ==========================================================================
       5. BINDING & SAVING CONFIG: SERVICES (Supabase Sync)
       ========================================================================== */
    const servicesForm = document.getElementById('servicesConfigForm');
    const servicesEditorContainer = document.getElementById('servicesEditorContainer');
    let currentServicesData = {};

    const renderServicesEditor = () => {
        if (!servicesEditorContainer) return;
        servicesEditorContainer.innerHTML = '';

        const keys = Object.keys(currentServicesData);
        if (keys.length === 0) {
            servicesEditorContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 30px; border: 1px dashed var(--border-color); border-radius: var(--border-radius-lg); margin-bottom: 20px;">
                    Henüz kayıtlı bir hizmet bulunmamaktadır. Yeni hizmet eklemek için sağ üstteki butonu kullanın.
                </div>
            `;
            return;
        }

        keys.forEach((key, index) => {
            const service = currentServicesData[key];
            if (!service) return;
            const items = service.items || [];

            const itemHtml = `
                <div class="admin-service-editor-item" data-key="${key}" style="border: 1px solid var(--border-color); padding: 24px; border-radius: var(--border-radius-lg); margin-bottom: 24px; position: relative; background: rgba(255,255,255,0.01);">
                    <button type="button" class="btn-delete-service" data-key="${key}" style="position: absolute; top: 18px; right: 18px; background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; padding: 6px 12px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 600; transition: background 0.2s;">
                        <i class="bi bi-trash"></i> Sil
                    </button>
                    <h3 style="margin-bottom: 20px; font-size: 16px; font-weight: 700; color: var(--color-primary);">Hizmet Kartı #${index + 1}</h3>
                    
                    <div class="admin-form-row">
                        <div class="admin-form-group col-full">
                            <label>Hizmet Başlığı</label>
                            <input type="text" class="service-title-input" value="${escapeHTML(service.title || '')}" required style="width: 100%;">
                        </div>
                    </div>
                    <div class="admin-form-row">
                        <div class="admin-form-group col-full">
                            <label>Açıklama Metni</label>
                            <textarea class="service-desc-input" rows="2" required style="width: 100%; min-height: 60px; font-family: inherit;">${escapeHTML(service.desc || '')}</textarea>
                        </div>
                    </div>
                    <div class="admin-form-row">
                        <div class="admin-form-group">
                            <label>Özellik 1</label>
                            <input type="text" class="service-item-input-0" value="${escapeHTML(items[0] || '')}" required style="width: 100%;">
                        </div>
                        <div class="admin-form-group">
                            <label>Özellik 2</label>
                            <input type="text" class="service-item-input-1" value="${escapeHTML(items[1] || '')}" style="width: 100%;">
                        </div>
                        <div class="admin-form-group">
                            <label>Özellik 3</label>
                            <input type="text" class="service-item-input-2" value="${escapeHTML(items[2] || '')}" style="width: 100%;">
                        </div>
                    </div>
                </div>
            `;
            servicesEditorContainer.insertAdjacentHTML('beforeend', itemHtml);
        });

        // Attach delete events
        document.querySelectorAll('.btn-delete-service').forEach(btn => {
            btn.addEventListener('click', async () => {
                const keyToDelete = btn.getAttribute('data-key');
                if (confirm('Bu hizmet kartını silmek istediğinize emin misiniz?')) {
                    delete currentServicesData[keyToDelete];
                    renderServicesEditor();

                    const success = await SupabaseService.saveSettings('services_config', currentServicesData);
                    if (success) {
                        showToast('Hizmet kartı başarıyla silindi ve veritabanı güncellendi!');
                    } else {
                        showToast('Lokal olarak silindi, ancak veritabanına kaydedilemedi.', false);
                    }
                }
            });
        });
    };

    const loadServicesInputs = async () => {
        const services = await SupabaseService.getSettings('services_config', defaultServices);
        currentServicesData = JSON.parse(JSON.stringify(services)); // Deep clone
        renderServicesEditor();
    };

    try {
        await loadServicesInputs();
    } catch (e) {
        console.error("Services failed to load:", e);
    }

    // Add New Service button listener
    const btnAddNewService = document.getElementById('btnAddNewService');
    if (btnAddNewService) {
        btnAddNewService.addEventListener('click', () => {
            const newKey = 's_' + Date.now();
            currentServicesData[newKey] = {
                title: 'Yeni Hizmet Başlığı',
                desc: 'Hizmetiniz hakkında kısa açıklama.',
                items: ['', '', '']
            };
            renderServicesEditor();
            // Scroll to the newly added service card
            const newCard = servicesEditorContainer.lastElementChild;
            if (newCard) {
                newCard.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Reset services to defaults listener
    const btnResetServices = document.getElementById('btnResetServices');
    if (btnResetServices) {
        btnResetServices.addEventListener('click', async () => {
            if (confirm('Tüm hizmet kartlarını varsayılan ayarlara sıfırlamak istediğinize emin misiniz? Mevcut tüm özelleştirmeleriniz silinecektir.')) {
                currentServicesData = JSON.parse(JSON.stringify(defaultServices));
                renderServicesEditor();
                const success = await SupabaseService.saveSettings('services_config', currentServicesData);
                if (success) {
                    showToast('Hizmetler varsayılana sıfırlandı ve veritabanı güncellendi!');
                } else {
                    showToast('Lokal sıfırlandı, ancak veritabanına kaydedilemedi.', false);
                }
            }
        });
    }

    if (servicesForm) {
        servicesForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const updatedServices = {};
            const editorItems = document.querySelectorAll('.admin-service-editor-item');

            editorItems.forEach(item => {
                const key = item.getAttribute('data-key');
                const title = item.querySelector('.service-title-input').value;
                const desc = item.querySelector('.service-desc-input').value;
                const i1 = item.querySelector('.service-item-input-0').value;
                const i2 = item.querySelector('.service-item-input-1').value;
                const i3 = item.querySelector('.service-item-input-2').value;

                updatedServices[key] = {
                    title: title,
                    desc: desc,
                    items: [i1, i2, i3].filter(Boolean)
                };
            });

            const success = await SupabaseService.saveSettings('services_config', updatedServices);
            if (success) {
                currentServicesData = updatedServices;
                showToast('Hizmet içerikleri veritabanına kaydedildi!');
            } else {
                showToast('Lokal kaydedildi, ancak veritabanı yazma hatası!', false);
            }
        });
    }


    /* ==========================================================================
       6. LEADS LIST INBOX MANAGEMENT (Supabase Sync)
       ========================================================================== */
    const leadsTableBody = document.getElementById('leadsTableBody');

    const typeLabels = {
        corporate: 'Kurumsal Web',
        ecommerce: 'E-Ticaret',
        landing: 'Tek Sayfa (Landing)',
        custom: 'Özel Yazılım',
        contact: 'İletişim Formu'
    };

    const renderLeadsTable = async () => {
        if (!leadsTableBody) return;

        // Fetch from Supabase (gracefully falling back to local)
        const leads = await SupabaseService.getLeads();
        leadsTableBody.innerHTML = '';

        if (leads.length === 0) {
            leadsTableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted);">
                        Henüz gelen bir müşteri talebi bulunmamaktadır.
                    </td>
                </tr>`;
            return;
        }

        leads.forEach(lead => {
            const rowDate = new Date(lead.date);
            const formattedDate = rowDate.toLocaleDateString('tr-TR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });

            const tr = document.createElement('tr');
            tr.id = `lead-tr-${lead.id}`;
            tr.innerHTML = `
                <td>
                    <span class="lead-name">${escapeHTML(lead.clientName)}</span>
                    <div class="lead-meta"><i class="bi bi-telephone"></i> ${escapeHTML(lead.phone)} | <i class="bi bi-envelope"></i> ${escapeHTML(lead.email)}</div>
                </td>
                <td>
                    <span class="badge-type ${lead.type}">${typeLabels[lead.type] || lead.type}</span>
                </td>
                <td>
                    <strong>${lead.price !== 'N/A' ? lead.price : 'Bilgi Talebi'}</strong>
                </td>
                <td>
                    ${formattedDate}
                </td>
                <td>
                    <span class="badge-status ${lead.status}" id="status-badge-${lead.id}">${lead.status === 'new' ? 'Yeni' : 'Okundu'}</span>
                </td>
                <td>
                    <div class="table-actions" style="justify-content: flex-end;">
                        <button class="btn-table-action read-toggle" data-id="${lead.id}" title="Okundu/Okunmadı İşaretle">
                            <i class="bi ${lead.status === 'new' ? 'bi-check2' : 'bi-envelope'}"></i>
                        </button>
                        <button class="btn-table-action view-details" data-id="${lead.id}" title="Detayları Göster">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn-table-action delete" data-id="${lead.id}" title="Sil">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            leadsTableBody.appendChild(tr);

            const detailTr = document.createElement('tr');
            detailTr.id = `lead-details-${lead.id}`;
            detailTr.className = 'lead-details-row';
            detailTr.style.display = 'none';
            detailTr.innerHTML = `
                <td colspan="6" style="padding: 0;">
                    <div class="lead-details-box">
                        <div style="margin-bottom: 12px;">
                            <h4>Müşteri Notu / Talep Detayı</h4>
                            <p style="white-space: pre-wrap;">${escapeHTML(lead.notes || 'Herhangi bir ek not belirtilmedi.')}</p>
                        </div>
                        ${lead.type !== 'contact' ? `
                            <div style="margin-bottom: 10px;">
                                <h4>Hesaplama Kapsamı</h4>
                                <p style="font-size: 13px;">Sayfa Sayısı: <strong>${lead.scale}</strong> | Teslim Süresi: <strong>${lead.duration}</strong></p>
                            </div>
                            <div>
                                <h4>Seçilen Ek Hizmetler</h4>
                                <ul>
                                    ${lead.extras ? lead.extras.split(', ').map(ex => `<li>${escapeHTML(ex)}</li>`).join('') : '<li>Seçilmedi</li>'}
                                </ul>
                            </div>
                        ` : ''}

                        <!-- Reply Section -->
                        <div class="lead-reply-section" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                            <h4 style="margin-bottom: 12px;"><i class="bi bi-reply-fill"></i> Talebe E-Posta ile Cevap Ver</h4>
                            <div class="admin-form-row">
                                <div class="admin-form-group col-full">
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">Konu</label>
                                    <input type="text" id="reply-subject-${lead.id}" value="Web Samsun Tasarım - Talebiniz Hakkında" style="width: 100%; padding: 10px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; color: #fff;">
                                </div>
                            </div>
                            <div class="admin-form-row" style="margin-top: 12px;">
                                <div class="admin-form-group col-full">
                                    <label style="font-size: 12px; color: var(--text-secondary); margin-bottom: 6px; display: block;">Cevap Mesajınız</label>
                                    <textarea id="reply-body-${lead.id}" rows="4" placeholder="Müşteriye göndermek istediğiniz cevap metnini buraya yazın..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-color); border-radius: 8px; color: #fff; font-family: inherit; resize: vertical; min-height: 80px;"></textarea>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 12px;">
                                <button class="btn-reply-send" data-id="${lead.id}" data-email="${lead.email}" data-name="${lead.clientName}" style="background: var(--gradient-hero); border: none; color: #fff; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 700; display: flex; align-items: center; gap: 6px;">
                                    <i class="bi bi-send-fill"></i> E-Posta Gönder
                                </button>
                            </div>
                        </div>
                    </div>
                </td>
            `;
            leadsTableBody.appendChild(detailTr);
        });

        attachLeadActionEvents();
    };

    const attachLeadActionEvents = () => {
        document.querySelectorAll('.view-details').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const detailsRow = document.getElementById(`lead-details-${id}`);
                const tr = document.getElementById(`lead-tr-${id}`);

                if (detailsRow.style.display === 'none') {
                    detailsRow.style.display = 'table-row';
                    tr.style.backgroundColor = 'rgba(255,255,255,0.02)';

                    // Automatically mark as read on open
                    await markLeadStatus(id, 'read');
                } else {
                    detailsRow.style.display = 'none';
                    tr.style.backgroundColor = '';
                }
            });
        });

        document.querySelectorAll('.read-toggle').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const leads = await SupabaseService.getLeads();
                const lead = leads.find(l => l.id === id);

                if (lead) {
                    const currentStatus = lead.status;
                    const nextStatus = currentStatus === 'new' ? 'read' : 'new';
                    await markLeadStatus(id, nextStatus);
                    showToast(nextStatus === 'read' ? 'Talep okundu olarak işaretlendi.' : 'Talep yeni olarak işaretlendi.');
                }
            });
        });

        document.querySelectorAll('.delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Bu müşteri talebini silmek istediğinize emin misiniz?')) {
                    const id = btn.getAttribute('data-id');
                    await deleteLead(id);
                }
            });
        });

        document.querySelectorAll('.btn-reply-send').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const recipientEmail = btn.getAttribute('data-email');
                const recipientName = btn.getAttribute('data-name');
                const subject = document.getElementById(`reply-subject-${id}`).value.trim();
                const body = document.getElementById(`reply-body-${id}`).value.trim();

                if (!body) {
                    alert('Lütfen bir cevap mesajı yazın!');
                    return;
                }

                btn.disabled = true;
                const originalInnerHTML = btn.innerHTML;
                btn.innerHTML = '<i class="bi bi-arrow-repeat spin"></i> Gönderiliyor...';

                // Check if EmailJS is configured
                const serviceId = currentEmailConfig.serviceId;
                const templateId = currentEmailConfig.templateId;
                const publicKey = currentEmailConfig.publicKey;

                if (serviceId && templateId && publicKey) {
                    try {
                        // Initialize EmailJS
                        emailjs.init(publicKey);

                        // Send email via template variables
                        const templateParams = {
                            to_name: recipientName,
                            to_email: recipientEmail,
                            reply_to: 'info@websamsuntasarim.com',
                            subject: subject,
                            message: body,
                            name: recipientName,
                            time: new Date().toLocaleString('tr-TR', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })
                        };

                        const response = await emailjs.send(serviceId, templateId, templateParams);
                        if (response.status === 200) {
                            showToast('E-Posta başarıyla gönderildi!');
                            // Mark status as replied/read
                            await markLeadStatus(id, 'read');
                            document.getElementById(`reply-body-${id}`).value = ''; // clear textarea
                        } else {
                            throw new Error('Gönderim hatası (EmailJS)');
                        }
                    } catch (err) {
                        console.error('EmailJS failed:', err);
                        alert('E-posta otomatik gönderilemedi: ' + (err.text || err.message || err) + '\n\nAlternatif olarak varsayılan e-posta uygulamanız açılıyor...');
                        // Fallback to mailto
                        window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    }
                } else {
                    // Fallback to mailto if not configured
                    alert('EmailJS ayarları yapılmadığı için e-posta istemciniz (Mail, Outlook vb.) açılıyor...');
                    window.location.href = `mailto:${recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }

                btn.disabled = false;
                btn.innerHTML = originalInnerHTML;
            });
        });
    };

    const markLeadStatus = async (id, status) => {
        const success = await SupabaseService.updateLeadStatus(id, status);
        if (success) {
            const badge = document.getElementById(`status-badge-${id}`);
            if (badge) {
                badge.className = `badge-status ${status}`;
                badge.textContent = status === 'new' ? 'Yeni' : 'Okundu';
            }

            const btn = document.querySelector(`.read-toggle[data-id="${id}"]`);
            if (btn) {
                btn.innerHTML = `<i class="bi ${status === 'new' ? 'bi-check2' : 'bi-envelope'}"></i>`;
            }

            await calculateDashboardStats();
        } else {
            showToast('Talep durumu güncellenemedi.', false);
        }
    };

    const deleteLead = async (id) => {
        const success = await SupabaseService.deleteLead(id);
        if (success) {
            showToast('Müşteri talebi başarıyla silindi.');
            await renderLeadsTable();
            await calculateDashboardStats();
        } else {
            showToast('Talep silinemedi.', false);
        }
    };


    /* ==========================================================================
       7. CALCULATE DASHBOARD STATS
       ========================================================================== */
    const statTotalLeads = document.getElementById('statTotalLeads');
    const statNewLeads = document.getElementById('statNewLeads');
    const statVolume = document.getElementById('statVolume');

    const calculateDashboardStats = async () => {
        const leads = await SupabaseService.getLeads();

        const total = leads.length;
        const pending = leads.filter(l => l.status === 'new').length;

        let totalVal = 0;
        leads.forEach(l => {
            if (l.price && l.price !== 'N/A') {
                const num = parseInt(l.price.replace(/[^\d]/g, ''), 10);
                if (!isNaN(num)) {
                    totalVal += num;
                }
            }
        });

        if (statTotalLeads) statTotalLeads.textContent = total;
        if (statNewLeads) statNewLeads.textContent = pending;
        if (statVolume) {
            statVolume.textContent = new Intl.NumberFormat('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                maximumFractionDigits: 0
            }).format(totalVal);
        }
    };

    try {
        await loadEmailConfig();
    } catch (e) {
        console.error("Email configuration failed to load:", e);
    }

    try {
        await calculateDashboardStats();
    } catch (e) {
        console.error("Dashboard stats failed to load:", e);
    }

    try {
        renderDatabaseBadge();
    } catch (e) {
        console.error("Database status badge failed to load:", e);
    }

    // Oturumu Kapatma (Sign Out)
    const btnLogout = document.getElementById('btnAdminLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
                await SupabaseService.signOut();
                window.location.href = 'login.html';
            }
        });
    }


    const defaultProjects = [
        {
            id: 'proj_1',
            number: '01',
            name: 'Nextlevel Studio',
            category: 'Müşteri Projesi • E-Ticaret & Web App',
            img1: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85',
            img2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85',
            visible: true,
            img3: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85',
            link: '#wizard-section'
        },
        {
            id: 'proj_2',
            number: '02',
            name: 'Aura Brand Identity',
            category: 'Ajans Projesi • Kurumsal & UI/UX',
            visible: true,
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
            visible: true,
            img1: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85',
            img2: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85',
            img3: 'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a692ef1ee.png&w=1280&q=85',
            link: '#wizard-section'
        }
    ];

    /* ==========================================================================
       PROJECT MANAGEMENT CRUD (PROJELER)
       ========================================================================== */
    let currentProjects = [];

    async function loadProjectsAdmin() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;

        try {
            currentProjects = await SupabaseService.getSettings('projects_config', defaultProjects);
            if (!Array.isArray(currentProjects) || currentProjects.length === 0) {
                currentProjects = defaultProjects;
            }
        } catch (err) {
            console.error("Projects fetch error:", err);
            currentProjects = defaultProjects;
        }

        renderProjectsTable();
        initProjectDropzones();
    }

    function renderProjectsTable() {
        const tbody = document.getElementById('projectsTableBody');
        if (!tbody) return;

        if (!currentProjects || currentProjects.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted);">
                        Henüz kayıtlı bir proje bulunmamaktadır.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = currentProjects.map((p, idx) => `
            <tr>
                <td><strong style="color: #FE2000;">${escapeHTML(p.number || ('0' + (idx + 1)))}</strong></td>
                <td><strong style="color: #fff;">${escapeHTML(p.name)}</strong></td>
                <td><span style="font-size: 13px; color: #8E929E;">${escapeHTML(p.category || 'Müşteri Projesi')}</span></td>
                <td>
                    ${p.visible !== false 
                        ? `<button type="button" class="btn-toggle-visible" data-id="${p.id}" style="background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;"><i class="bi bi-eye-fill"></i> Yayında</button>` 
                        : `<button type="button" class="btn-toggle-visible" data-id="${p.id}" style="background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer;"><i class="bi bi-eye-slash-fill"></i> Pasif</button>`
                    }
                </td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <img src="${escapeHTML(p.img1)}" style="width: 32px; height: 24px; object-fit: cover; border-radius: 4px;">
                        <img src="${escapeHTML(p.img2)}" style="width: 32px; height: 24px; object-fit: cover; border-radius: 4px;">
                        <img src="${escapeHTML(p.img3)}" style="width: 32px; height: 24px; object-fit: cover; border-radius: 4px;">
                    </div>
                </td>
                <td style="text-align: right;">
                    <button type="button" class="btn-edit-project" data-id="${p.id}" style="background: rgba(255,255,255,0.08); border: none; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; margin-right: 6px;">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button type="button" class="btn-delete-project" data-id="${p.id}" style="background: rgba(239,68,68,0.15); border: none; color: #ef4444; padding: 6px 12px; border-radius: 6px; cursor: pointer;">
                        <i class="bi bi-trash-fill"></i>
                    </button>
                </td>
            </tr>
        `).join('');

        tbody.querySelectorAll('.btn-toggle-visible').forEach(btn => {
            btn.addEventListener('click', async () => {
                const projId = btn.getAttribute('data-id');
                const proj = currentProjects.find(item => item.id === projId);
                if (proj) {
                    proj.visible = (proj.visible === false) ? true : false;
                    await saveProjectsAdmin();
                    renderProjectsTable();
                    showToast(proj.visible ? "Proje sitede yayınlandı!" : "Proje yayından kaldırıldı (Pasif).");
                }
            });
        });

        tbody.querySelectorAll('.btn-edit-project').forEach(btn => {
            btn.addEventListener('click', () => {
                const projId = btn.getAttribute('data-id');
                const proj = currentProjects.find(item => item.id === projId);
                if (proj) openProjectModal(proj);
            });
        });

        tbody.querySelectorAll('.btn-delete-project').forEach(btn => {
            btn.addEventListener('click', async () => {
                const projId = btn.getAttribute('data-id');
                if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
                    currentProjects = currentProjects.filter(item => item.id !== projId);
                    await saveProjectsAdmin();
                    renderProjectsTable();
                    showToast("Proje başarıyla silindi!");
                }
            });
        });
    }

    /* ==========================================================================
       DRAG & DROP IMAGE UPLOAD HELPER LOGIC
       ========================================================================== */
    function initDropzone(dropzoneId, hiddenInputId, previewImgId) {
        const dropzone = document.getElementById(dropzoneId);
        const hiddenInput = document.getElementById(hiddenInputId);
        const previewImg = document.getElementById(previewImgId);
        if (!dropzone || !hiddenInput) return;

        const fileInput = dropzone.querySelector('.dropzone-file-input');

        dropzone.addEventListener('click', (e) => {
            if (e.target !== fileInput && fileInput) {
                fileInput.click();
            }
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = '#FE2000';
                dropzone.style.background = 'rgba(254, 32, 0, 0.08)';
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropzone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
                dropzone.style.borderColor = 'rgba(255,255,255,0.15)';
                dropzone.style.background = 'rgba(255,255,255,0.02)';
            }, false);
        });

        dropzone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
        });

        if (fileInput) {
            fileInput.addEventListener('change', () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    handleFile(fileInput.files[0]);
                }
            });
        }

        hiddenInput.addEventListener('input', () => {
            const val = hiddenInput.value.trim();
            if (val && previewImg) {
                previewImg.src = val;
                previewImg.style.display = 'block';
            } else if (previewImg) {
                previewImg.style.display = 'none';
            }
        });

        function handleFile(file) {
            if (!file.type.startsWith('image/')) {
                alert('Lütfen geçerli bir görsel dosyası seçin (PNG, JPG, WEBP, GIF).');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                hiddenInput.value = dataUrl;
                if (previewImg) {
                    previewImg.src = dataUrl;
                    previewImg.style.display = 'block';
                }
            };
            reader.readAsDataURL(file);
        }
    }

    function initProjectDropzones() {
        initDropzone('dropzoneImg1', 'projectImg1', 'previewImg1');
        initDropzone('dropzoneImg2', 'projectImg2', 'previewImg2');
        initDropzone('dropzoneImg3', 'projectImg3', 'previewImg3');
    }

    async function saveProjectsAdmin() {
        localStorage.setItem('projects_config', JSON.stringify(currentProjects));
        await SupabaseService.saveSettings('projects_config', currentProjects);
    }

    const projectModalOverlay = document.getElementById('projectModalOverlay');
    const projectForm = document.getElementById('projectForm');
    const btnAddNewProject = document.getElementById('btnAddNewProject');
    const btnCloseProjectModal = document.getElementById('btnCloseProjectModal');
    const btnCancelProjectModal = document.getElementById('btnCancelProjectModal');
    const btnResetProjects = document.getElementById('btnResetProjects');

    function updatePreviewState(inputId, previewId) {
        const inp = document.getElementById(inputId);
        const prev = document.getElementById(previewId);
        if (inp && prev && inp.value.trim()) {
            prev.src = inp.value.trim();
            prev.style.display = 'block';
        } else if (prev) {
            prev.style.display = 'none';
        }
    }

    function openProjectModal(proj = null) {
        if (!projectModalOverlay) return;
        projectModalOverlay.style.display = 'flex';

        if (proj) {
            document.getElementById('projectModalTitle').textContent = 'Proje Düzenle';
            document.getElementById('projectId').value = proj.id;
            document.getElementById('projectVisible').checked = proj.visible !== false;
            document.getElementById('projectNumber').value = proj.number || '01';
            document.getElementById('projectName').value = proj.name || '';
            document.getElementById('projectCategory').value = proj.category || '';
            document.getElementById('projectImg1').value = proj.img1 || '';
            document.getElementById('projectImg2').value = proj.img2 || '';
            document.getElementById('projectImg3').value = proj.img3 || '';
            document.getElementById('projectLink').value = proj.link || '#wizard-section';
        } else {
            document.getElementById('projectModalTitle').textContent = 'Yeni Proje Ekle';
            document.getElementById('projectId').value = '';
            document.getElementById('projectVisible').checked = true;
            document.getElementById('projectNumber').value = '0' + (currentProjects.length + 1);
            document.getElementById('projectName').value = '';
            document.getElementById('projectCategory').value = 'Müşteri Projesi • E-Ticaret & Web App';
            document.getElementById('projectImg1').value = '';
            document.getElementById('projectImg2').value = '';
            document.getElementById('projectImg3').value = '';
            document.getElementById('projectLink').value = '#wizard-section';
        }

        updatePreviewState('projectImg1', 'previewImg1');
        updatePreviewState('projectImg2', 'previewImg2');
        updatePreviewState('projectImg3', 'previewImg3');
    }

    function closeProjectModal() {
        if (projectModalOverlay) projectModalOverlay.style.display = 'none';
    }

    if (btnAddNewProject) btnAddNewProject.addEventListener('click', () => openProjectModal());
    if (btnCloseProjectModal) btnCloseProjectModal.addEventListener('click', closeProjectModal);
    if (btnCancelProjectModal) btnCancelProjectModal.addEventListener('click', closeProjectModal);

    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('projectId').value || ('proj_' + Date.now());
            const visible = document.getElementById('projectVisible').checked;
            const number = document.getElementById('projectNumber').value.trim();
            const name = document.getElementById('projectName').value.trim();
            const category = document.getElementById('projectCategory').value.trim();
            const img1 = document.getElementById('projectImg1').value.trim();
            const img2 = document.getElementById('projectImg2').value.trim();
            const img3 = document.getElementById('projectImg3').value.trim();
            const link = document.getElementById('projectLink').value.trim() || '#wizard-section';

            const newProj = { id, number, name, category, visible, img1, img2, img3, link };

            const existingIdx = currentProjects.findIndex(p => p.id === id);
            if (existingIdx >= 0) {
                currentProjects[existingIdx] = newProj;
            } else {
                currentProjects.push(newProj);
            }

            await saveProjectsAdmin();
            renderProjectsTable();
            closeProjectModal();
            showToast("Proje verileri başarıyla kaydedildi!");
        });
    }

    if (btnResetProjects) {
        btnResetProjects.addEventListener('click', async () => {
            if (confirm('Varsayılan projeleri geri yüklemek istediğinize emin misiniz? Mevcut değişiklikler sıfırlanacaktır.')) {
                currentProjects = defaultProjects;
                await saveProjectsAdmin();
                renderProjectsTable();
                showToast("Varsayılan projeler yüklendi!");
            }
        });
    }

    try {
        await loadProjectsAdmin();
    } catch (e) {
        console.error("Projects load failed:", e);
    }

    /* ==========================================================================
       MARQUEE SHOWCASE IMAGE MANAGEMENT CRUD
       ========================================================================== */
    const defaultMarqueeConfig = {
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

    let currentMarquee = { row1: [], row2: [] };

    async function loadMarqueeAdmin() {
        const row1Container = document.getElementById('marqueeRow1Container');
        const row2Container = document.getElementById('marqueeRow2Container');
        if (!row1Container || !row2Container) return;

        try {
            const data = await SupabaseService.getSettings('marquee_config', defaultMarqueeConfig);
            if (data && Array.isArray(data.row1) && Array.isArray(data.row2)) {
                currentMarquee = data;
            } else {
                currentMarquee = defaultMarqueeConfig;
            }
        } catch (e) {
            console.error("Marquee fetch error:", e);
            currentMarquee = defaultMarqueeConfig;
        }

        renderMarqueeAdminLists();
    }

    function renderMarqueeAdminLists() {
        const r1Cont = document.getElementById('marqueeRow1Container');
        const r2Cont = document.getElementById('marqueeRow2Container');
        if (!r1Cont || !r2Cont) return;

        r1Cont.innerHTML = (currentMarquee.row1 || []).map((url, i) => `
            <div class="marquee-item-row" data-index="${i}" data-row="1" style="display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1); transition: all 0.2s ease;">
                <div class="marquee-thumb-box" style="position: relative; width: 44px; height: 32px; flex-shrink: 0; cursor: pointer;" title="Resim değiştirmek için tıklayın veya sürükleyin">
                    <img src="${escapeHTML(url)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
                    <input type="file" class="marquee-item-file" accept="image/*" style="display: none;">
                    <div class="thumb-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; border-radius: 4px;">
                        <i class="bi bi-cloud-arrow-up-fill" style="color: #fff; font-size: 14px;"></i>
                    </div>
                </div>
                <input type="text" class="form-input marquee-row1-input" data-index="${i}" value="${escapeHTML(url)}" placeholder="Resim URL veya Sürükle & Bırak..." style="flex: 1; padding: 6px 10px; font-size: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: #fff;">
                <button type="button" class="btn-del-marquee-r1" data-index="${i}" style="background: rgba(239,68,68,0.15); border: none; color: #ef4444; padding: 6px 10px; border-radius: 6px; cursor: pointer;" title="Sil">&times;</button>
            </div>
        `).join('');

        r2Cont.innerHTML = (currentMarquee.row2 || []).map((url, i) => `
            <div class="marquee-item-row" data-index="${i}" data-row="2" style="display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,0.02); padding: 6px 8px; border-radius: 8px; border: 1px dashed rgba(255,255,255,0.1); transition: all 0.2s ease;">
                <div class="marquee-thumb-box" style="position: relative; width: 44px; height: 32px; flex-shrink: 0; cursor: pointer;" title="Resim değiştirmek için tıklayın veya sürükleyin">
                    <img src="${escapeHTML(url)}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
                    <input type="file" class="marquee-item-file" accept="image/*" style="display: none;">
                    <div class="thumb-overlay" style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s ease; border-radius: 4px;">
                        <i class="bi bi-cloud-arrow-up-fill" style="color: #fff; font-size: 14px;"></i>
                    </div>
                </div>
                <input type="text" class="form-input marquee-row2-input" data-index="${i}" value="${escapeHTML(url)}" placeholder="Resim URL veya Sürükle & Bırak..." style="flex: 1; padding: 6px 10px; font-size: 12px; border-radius: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-color); color: #fff;">
                <button type="button" class="btn-del-marquee-r2" data-index="${i}" style="background: rgba(239,68,68,0.15); border: none; color: #ef4444; padding: 6px 10px; border-radius: 6px; cursor: pointer;" title="Sil">&times;</button>
            </div>
        `).join('');

        setupMarqueeRowDragAndDrop(r1Cont, 1);
        setupMarqueeRowDragAndDrop(r2Cont, 2);
    }

    function setupMarqueeRowDragAndDrop(container, rowNum) {
        const targetArray = (rowNum === 1) ? currentMarquee.row1 : currentMarquee.row2;

        ['dragenter', 'dragover'].forEach(evt => {
            container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.style.borderColor = '#FE2000';
                container.style.background = 'rgba(254, 32, 0, 0.05)';
            });
        });

        ['dragleave', 'drop'].forEach(evt => {
            container.addEventListener(evt, (e) => {
                e.preventDefault();
                e.stopPropagation();
                container.style.borderColor = 'transparent';
                container.style.background = 'transparent';
            });
        });

        container.addEventListener('drop', (e) => {
            const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
            if (files.length > 0) {
                let loadedCount = 0;
                files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        targetArray.push(re.target.result);
                        loadedCount++;
                        if (loadedCount === files.length) {
                            renderMarqueeAdminLists();
                            showToast(`${loadedCount} adet yeni görsel Marquee Sıra ${rowNum}'e eklendi!`);
                        }
                    };
                    reader.readAsDataURL(file);
                });
            }
        });

        container.querySelectorAll('.marquee-item-row').forEach(rowEl => {
            const idx = parseInt(rowEl.getAttribute('data-index'), 10);
            const thumbBox = rowEl.querySelector('.marquee-thumb-box');
            const fileInput = rowEl.querySelector('.marquee-item-file');
            const textInput = rowEl.querySelector('.form-input');
            const thumbOverlay = rowEl.querySelector('.thumb-overlay');

            if (thumbBox && fileInput) {
                thumbBox.addEventListener('mouseenter', () => thumbOverlay.style.opacity = '1');
                thumbBox.addEventListener('mouseleave', () => thumbOverlay.style.opacity = '0');
                thumbBox.addEventListener('click', () => fileInput.click());

                fileInput.addEventListener('change', () => {
                    if (fileInput.files && fileInput.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            targetArray[idx] = e.target.result;
                            renderMarqueeAdminLists();
                        };
                        reader.readAsDataURL(fileInput.files[0]);
                    }
                });
            }

            if (textInput) {
                textInput.addEventListener('input', (e) => {
                    targetArray[idx] = e.target.value.trim();
                });
            }

            ['dragenter', 'dragover'].forEach(evt => {
                rowEl.addEventListener(evt, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    rowEl.style.borderColor = '#FE2000';
                    rowEl.style.background = 'rgba(254,32,0,0.1)';
                });
            });

            ['dragleave', 'drop'].forEach(evt => {
                rowEl.addEventListener(evt, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    rowEl.style.borderColor = 'rgba(255,255,255,0.1)';
                    rowEl.style.background = 'rgba(255,255,255,0.02)';
                });
            });

            rowEl.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files && files[0] && files[0].type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                        targetArray[idx] = re.target.result;
                        renderMarqueeAdminLists();
                    };
                    reader.readAsDataURL(files[0]);
                }
            });
        });

        const delClass = (rowNum === 1) ? '.btn-del-marquee-r1' : '.btn-del-marquee-r2';
        container.querySelectorAll(delClass).forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.getAttribute('data-index'), 10);
                targetArray.splice(idx, 1);
                renderMarqueeAdminLists();
            });
        });
    }

    const btnAddMarqueeRow1 = document.getElementById('btnAddMarqueeRow1');
    const btnAddMarqueeRow2 = document.getElementById('btnAddMarqueeRow2');
    const btnSaveMarquee = document.getElementById('btnSaveMarquee');
    const btnResetMarquee = document.getElementById('btnResetMarquee');

    if (btnAddMarqueeRow1) {
        btnAddMarqueeRow1.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.onchange = () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    let loadedCount = 0;
                    Array.from(fileInput.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            if (!currentMarquee.row1) currentMarquee.row1 = [];
                            currentMarquee.row1.push(re.target.result);
                            loadedCount++;
                            if (loadedCount === fileInput.files.length) {
                                renderMarqueeAdminLists();
                                showToast(`${loadedCount} adet görsel Sıra 1'e eklendi!`);
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                }
            };
            fileInput.click();
        });
    }

    if (btnAddMarqueeRow2) {
        btnAddMarqueeRow2.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.multiple = true;
            fileInput.onchange = () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    let loadedCount = 0;
                    Array.from(fileInput.files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            if (!currentMarquee.row2) currentMarquee.row2 = [];
                            currentMarquee.row2.push(re.target.result);
                            loadedCount++;
                            if (loadedCount === fileInput.files.length) {
                                renderMarqueeAdminLists();
                                showToast(`${loadedCount} adet görsel Sıra 2'ye eklendi!`);
                            }
                        };
                        reader.readAsDataURL(file);
                    });
                }
            };
            fileInput.click();
        });
    }

    if (btnSaveMarquee) {
        btnSaveMarquee.addEventListener('click', async () => {
            currentMarquee.row1 = currentMarquee.row1.filter(u => u && u.length > 0);
            currentMarquee.row2 = currentMarquee.row2.filter(u => u && u.length > 0);
            localStorage.setItem('marquee_config', JSON.stringify(currentMarquee));
            await SupabaseService.saveSettings('marquee_config', currentMarquee);
            renderMarqueeAdminLists();
            showToast("Kayan vitrin görselleri kaydedildi!");
        });
    }

    if (btnResetMarquee) {
        btnResetMarquee.addEventListener('click', async () => {
            if (confirm('Varsayılan Marquee görsellerini yüklemek istediğinize emin misiniz?')) {
                currentMarquee = JSON.parse(JSON.stringify(defaultMarqueeConfig));
                localStorage.setItem('marquee_config', JSON.stringify(currentMarquee));
                await SupabaseService.saveSettings('marquee_config', currentMarquee);
                renderMarqueeAdminLists();
                showToast("Varsayılan vitrin görselleri yüklendi!");
            }
        });
    }

    try {
        await loadMarqueeAdmin();
    } catch (e) {
        console.error("Marquee load error:", e);
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
