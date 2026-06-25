// Die Brucke Atelier Interactive Functionality

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Initialize Scroll Animations
    initScrollAnimations();

    // Initialize Theme Toggle
    initThemeToggle();

    // Initialize Navigation drawer
    initNavigationDrawer();

    // Initialize Catalog Filter & Search
    initCatalogFilter();

    // Initialize Carousel
    initCarousel();

    // Initialize Product Carousels
    initProductCarousels();

    // Initialize Story Carousel
    initStoryCarousel();

    // Initialize Hero Carousel
    initHeroCarousel();

    // Initialize Download Lead Modal
    initDownloadModal();

    // Initialize Coffee Donation Button
    initCoffeeButton();

    // Initialize Analytics
    initAnalytics();
});

/* ==========================================================================
   1. Theme Toggle (Dark / Light Mode)
   ========================================================================== */
function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeToggleMobile = document.getElementById('theme-toggle-mobile');
    const body = document.body;

    const sunIcons = document.querySelectorAll('.sun-icon');
    const moonIcons = document.querySelectorAll('.moon-icon');

    // Retrieve theme preference from LocalStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    function setTheme(theme) {
        if (theme === 'dark') {
            body.classList.add('dark-mode');
            body.classList.remove('light-mode');
            
            sunIcons.forEach(i => i.style.display = 'block');
            moonIcons.forEach(i => i.style.display = 'none');
            if (themeToggleMobile) {
                themeToggleMobile.innerHTML = '<i class="moon-icon" data-lucide="sun"></i> Claro';
            }
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            
            sunIcons.forEach(i => i.style.display = 'none');
            moonIcons.forEach(i => i.style.display = 'block');
            if (themeToggleMobile) {
                themeToggleMobile.innerHTML = '<i class="moon-icon" data-lucide="moon"></i> Oscuro';
            }
        }
        localStorage.setItem('theme', theme);
        lucide.createIcons();
    }

    function toggleTheme() {
        const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    if (themeToggleMobile) {
        themeToggleMobile.addEventListener('click', toggleTheme);
    }
}

/* ==========================================================================
   2. Navigation Drawer (Mobile)
   ========================================================================== */
function initNavigationDrawer() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');

    function openDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.add('open');
        if (mobileDrawerBackdrop) {
            mobileDrawerBackdrop.classList.add('open');
        }
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'true');
        }
        document.body.classList.add('drawer-open');
    }

    function closeDrawer() {
        if (!mobileDrawer) return;
        mobileDrawer.classList.remove('open');
        if (mobileDrawerBackdrop) {
            mobileDrawerBackdrop.classList.remove('open');
        }
        if (mobileMenuBtn) {
            mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
        document.body.classList.remove('drawer-open');
    }

    if (mobileMenuBtn && mobileDrawer) {
        mobileMenuBtn.addEventListener('click', openDrawer);
    }

    if (closeDrawerBtn && mobileDrawer) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
    }

    if (mobileDrawerBackdrop) {
        mobileDrawerBackdrop.addEventListener('click', closeDrawer);
    }

    if (mobileDrawer) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeDrawer();
            }
        });

        document.addEventListener('click', (event) => {
            const clickedOutsideDrawer = !mobileDrawer.contains(event.target);
            const clickedMenuButton = mobileMenuBtn && mobileMenuBtn.contains(event.target);
            if (mobileDrawer.classList.contains('open') && clickedOutsideDrawer && !clickedMenuButton) {
                closeDrawer();
            }
        });
    }
}

function toggleDrawer() {
    const mobileDrawer = document.getElementById('mobile-drawer');
    const mobileDrawerBackdrop = document.getElementById('mobile-drawer-backdrop');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileDrawer) {
        mobileDrawer.classList.remove('open');
        document.body.classList.remove('drawer-open');
    }
    if (mobileDrawerBackdrop) {
        mobileDrawerBackdrop.classList.remove('open');
    }
    if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
    }
}

/* ==========================================================================
   3. Catalog Filtering & Searching
   ========================================================================== */
function initCatalogFilter() {
    const searchInput = document.getElementById('catalog-search');
    const filterChips = document.querySelectorAll('.filter-chips .chip');
    const cards = document.querySelectorAll('.catalog-card');

    let currentFilter = 'Todos';
    let searchQuery = '';

    function filterCatalog() {
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category') || '';
            const cardCategories = cardCategory.toLowerCase().split(/\s+/);
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();
            const cardDesc = card.querySelector('.card-desc').textContent.toLowerCase();
            
            const filterLower = currentFilter.toLowerCase();
            const categoryMatch = filterLower === 'all' || 
                                  filterLower === 'todos' || 
                                  cardCategories.includes(filterLower);
            const searchMatch = cardTitle.includes(searchQuery) || cardDesc.includes(searchQuery);

            if (categoryMatch && searchMatch) {
                card.style.display = 'flex';
                // Trigger reflow for fade-in effect
                card.style.opacity = '1';
                card.style.transform = 'scale(1)';
            } else {
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    if (card.style.opacity === '0') {
                        card.style.display = 'none';
                    }
                }, 200);
            }
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            filterCatalog();
        });
    }

    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            currentFilter = chip.getAttribute('data-filter');
            filterCatalog();
        });
    });
}

/* ==========================================================================
   4. Showcase Slider/Carousel
   ========================================================================== */
function initCarousel() {
    const carousel = document.getElementById('carousel');
    const prevBtn = document.getElementById('carousel-prev');
    const nextBtn = document.getElementById('carousel-next');
    const dots = document.querySelectorAll('#carousel-dots .dot');
    
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    let currentSlide = 0;
    let autoSlideInterval;

    function showSlide(index) {
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        slides.forEach((slide, i) => {
            if (i === currentSlide) {
                slide.classList.add('active');
            } else {
                slide.classList.remove('active');
            }
        });

        dots.forEach((dot, i) => {
            if (i === currentSlide) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function prevSlide() {
        showSlide(currentSlide - 1);
    }

    if (prevBtn) prevBtn.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
    });

    if (nextBtn) nextBtn.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
    });

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            resetAutoSlide();
        });
    });

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 7000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Touch Swipe Support for mobile
    addSwipeSupport(carousel, () => {
        nextSlide();
        resetAutoSlide();
    }, () => {
        prevSlide();
        resetAutoSlide();
    });

    startAutoSlide();
}

/* ==========================================================================
   5. Modals (Purchase, Story, Help/FAQ)
   ========================================================================== */
function openPurchaseModal(itemName, itemPrice) {
    const modal = document.getElementById('purchase-modal');
    const modalItemName = document.getElementById('modal-item-name');
    const modalItemPrice = document.getElementById('modal-item-price');

    if (modal && modalItemName && modalItemPrice) {
        modalItemName.textContent = itemName;
        modalItemPrice.textContent = itemPrice;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closePurchaseModal() {
    const modal = document.getElementById('purchase-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function toggleCardDetails(paymentMethod) {
    const cardFields = document.getElementById('card-fields');
    const cardNumberInput = document.getElementById('card-number');
    const cardExpiryInput = document.getElementById('card-expiry');
    const cardCvcInput = document.getElementById('card-cvc');

    if (cardFields) {
        if (paymentMethod === 'card') {
            cardFields.style.display = 'block';
            cardNumberInput.setAttribute('required', 'true');
            cardExpiryInput.setAttribute('required', 'true');
            cardCvcInput.setAttribute('required', 'true');
        } else {
            cardFields.style.display = 'none';
            cardNumberInput.removeAttribute('required');
            cardExpiryInput.removeAttribute('required');
            cardCvcInput.removeAttribute('required');
        }
    }
}

function handlePurchaseSubmit(event) {
    event.preventDefault();
    const email = document.getElementById('purchase-email').value;
    const itemName = document.getElementById('modal-item-name').textContent;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Procesando pedido...';

    // Mock API call
    setTimeout(() => {
        submitBtn.textContent = '¡Pedido Confirmado!';
        alert(`¡Gracias por tu compra de ${itemName}! Hemos enviado los links de descarga instantánea y tu factura de compra a: ${email}`);
        closePurchaseModal();
        event.target.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirmar Pedido & Obtener Descarga';
    }, 1500);
}

// Story Modal
function openStoryModal() {
    const modal = document.getElementById('story-modal');
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }
}

function closeStoryModal() {
    const modal = document.getElementById('story-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

// Help Modal (FAQ / Terms / Privacy)
function openHelpModal(type) {
    const modal = document.getElementById('help-modal');
    const title = document.getElementById('help-modal-title');
    const content = document.getElementById('help-modal-content');

    if (!modal || !title || !content) return;

    let modalTitle = '';
    let modalHTML = '';

    if (type === 'faq') {
        modalTitle = 'Preguntas Frecuentes';
        modalHTML = `
            <div class="faq-list">
                <div class="faq-item" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 6px; color: var(--accent);">¿En qué formatos vienen los archivos?</h4>
                    <p>Los planos CAD están en formato vectorial .DWG compatibles con AutoCAD 2013 en adelante. Las texturas son en alta definición .JPG/.PNG con sus respectivos mapas normales y de relieve para renderizado PBR. Los modelos 3D se entregan en .FBX y .OBJ.</p>
                </div>
                <div class="faq-item" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 6px; color: var(--accent);">¿Puedo usar los assets en proyectos comerciales?</h4>
                    <p>Sí, todos los recursos adquiridos incluyen una licencia comercial para renderizado, presentaciones técnicas y ejecución de obra.</p>
                </div>
                <div class="faq-item" style="margin-bottom: 20px;">
                    <h4 style="margin-bottom: 6px; color: var(--accent);">¿Cómo es el envío de los archivos?</h4>
                    <p>El envío es instantáneo y automatizado. Una vez completado el pago, recibirás un correo con el link de descarga directo a tu cuenta de Google Drive o servidor Sanctuary.</p>
                </div>
            </div>
        `;
    } else if (type === 'terms') {
        modalTitle = 'Términos de Servicio';
        modalHTML = `
            <div style="font-size: 0.9rem; line-height: 1.5;">
                <p style="margin-bottom: 12px;">Al descargar o adquirir cualquier recurso técnico o de diseño en Sanctuary Studio, aceptas los siguientes términos:</p>
                <h4 style="margin-bottom: 6px;">Uso de Licencia</h4>
                <p style="margin-bottom: 12px;">Se te otorga una licencia de uso personal y comercial no transferible. Está prohibida la reventa, redistribución o sublicenciamiento de los archivos crudos en otras plataformas de venta digital.</p>
                <h4 style="margin-bottom: 6px;">Responsabilidad Técnica</h4>
                <p>Nuestros planos CAD son maquetas y guías de diseño que deben ser visadas, revisadas y validadas por un profesional local matriculado antes de ser presentados en entes municipales o ejecutados en obra.</p>
            </div>
        `;
    } else if (type === 'privacy') {
        modalTitle = 'Política de Privacidad';
        modalHTML = `
            <div style="font-size: 0.9rem; line-height: 1.5;">
                <p style="margin-bottom: 12px;">En Sanctuary Studio valoramos tu privacidad. Tus datos personales recopilados se utilizan únicamente para procesar tu compra y enviarte las descargas.</p>
                <p style="margin-bottom: 12px;"><strong>Datos Recopilados:</strong> Tu nombre, correo electrónico y método de pago elegido (procesado mediante encriptación bancaria directa).</p>
                <p>No compartimos tus datos con terceros y puedes solicitar la baja de nuestro boletín en cualquier momento presionando el enlace al pie de los correos electrónicos.</p>
            </div>
        `;
    }

    title.textContent = modalTitle;
    content.innerHTML = modalHTML;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeHelpModal() {
    const modal = document.getElementById('help-modal');
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

/* ==========================================================================
   6. Form Submissions (Newsletter, Contact)
   ========================================================================== */
function handleNewsletterSubmit(event) {
    event.preventDefault();
    const nameInput = document.getElementById('newsletter-name');
    const emailInput = document.getElementById('newsletter-email');
    const feedbackMsg = document.getElementById('newsletter-message');

    if (!nameInput || !emailInput || !feedbackMsg) return;

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    feedbackMsg.textContent = 'Procesando registro...';
    feedbackMsg.className = 'form-feedback-message';

    sendToN8N({
        name: name,
        email: email,
        source: 'newsletter'
    });

    setTimeout(() => {
        feedbackMsg.textContent = '¡Te has registrado con éxito! Pronto recibirás tus primeros assets gratis.';
        feedbackMsg.className = 'form-feedback-message success';
        nameInput.value = '';
        emailInput.value = '';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            feedbackMsg.textContent = '';
        }, 5000);
    }, 1000);
}

/* ==========================================================================
   n8n Webhook Integration
   ========================================================================== */
function sendToN8N(data, isPurchase = false) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Purchases webhook URLs (product-3.html & product-8.html)
    const purchasesWebhookUrl = isLocal
        ? 'https://n8n.srv1202174.hstgr.cloud/webhook-test/65debfa2-2837-4f6b-8052-093144fcc2d8'
        : 'https://n8n.srv1202174.hstgr.cloud/webhook/65debfa2-2837-4f6b-8052-093144fcc2d8';
        
    // Free downloads webhook URLs
    const freeDownloadsWebhookUrl = isLocal
        ? 'https://n8n.srv1202174.hstgr.cloud/webhook-test/5b5a033b-6e72-489d-9bc7-2f80fdc86d56'
        : 'https://n8n.srv1202174.hstgr.cloud/webhook/5b5a033b-6e72-489d-9bc7-2f80fdc86d56';

    const webhookUrl = isPurchase ? purchasesWebhookUrl : freeDownloadsWebhookUrl;

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...data,
            submittedAt: new Date().toISOString(),
            environment: isLocal ? 'test' : 'production',
            pageUrl: (() => {
                let url = window.location.origin + window.location.pathname;
                if (!url.endsWith('.html') && (url.endsWith('/product-3') || url.endsWith('/product-8'))) {
                    url = url + '.html';
                }
                return url;
            })()
        })
    })
    .then(response => {
        if (!response.ok) {
            console.warn('n8n Webhook response was not ok:', response.statusText);
        }
    })
    .catch(error => {
        console.error('Error sending data to n8n webhook:', error);
    });
}

function handleContactSubmit(event) {
    event.preventDefault();
    const feedbackMsg = document.getElementById('contact-message-feedback');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    if (!feedbackMsg || !submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando solicitud...';
    feedbackMsg.textContent = '';

    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const phone = document.getElementById('contact-phone') ? document.getElementById('contact-phone').value.trim() : '';
    const projectType = document.getElementById('contact-project-type').value;
    const message = document.getElementById('contact-message').value.trim();

    sendToN8N({
        name: name,
        email: email,
        phone: phone,
        projectType: projectType,
        message: message,
        source: 'contact_form'
    });

    setTimeout(() => {
        feedbackMsg.textContent = '¡Solicitud enviada con éxito! Magdalena revisará tus especificaciones y te contactará en las próximas 24 horas.';
        feedbackMsg.className = 'form-feedback-message success';
        event.target.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Solicitud';

        setTimeout(() => {
            feedbackMsg.textContent = '';
        }, 6000);
    }, 1500);
}

/* ==========================================================================
    7. Intersection Observer for Fade-in Scroll Animations
    ========================================================================== */
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target); // Animates only once
                }
            });
        }, {
            threshold: 0.15
        });

        animatedElements.forEach(el => {
            observer.observe(el);
        });
    } else {
        // Fallback for older browsers
        animatedElements.forEach(el => el.classList.add('animated'));
    }
}

/* ==========================================================================
   8. Product Carousels in Catalog
   ========================================================================== */
function initProductCarousels() {
    const carousels = document.querySelectorAll('.product-carousel');
    
    carousels.forEach((carousel) => {
        const slides = carousel.querySelectorAll('.product-carousel-slides img');
        const prevBtn = carousel.querySelector('.prod-carousel-btn.prev');
        const nextBtn = carousel.querySelector('.prod-carousel-btn.next');
        const dots = carousel.querySelectorAll('.prod-carousel-dots .prod-dot');
        
        if (slides.length === 0) return;
        
        let currentIdx = 0;
        
        function showSlide(idx) {
            if (idx < 0) {
                currentIdx = slides.length - 1;
            } else if (idx >= slides.length) {
                currentIdx = 0;
            } else {
                currentIdx = idx;
            }
            
            slides.forEach((slide, i) => {
                slide.classList.toggle('active', i === currentIdx);
            });
            
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIdx);
            });
        }
        
        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSlide(currentIdx - 1);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSlide(currentIdx + 1);
            });
        }
        
        dots.forEach((dot, dotIdx) => {
            dot.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSlide(dotIdx);
            });
        });

        // Touch Swipe Support for mobile
        addSwipeSupport(carousel, () => {
            showSlide(currentIdx + 1);
        }, () => {
            showSlide(currentIdx - 1);
        });
    });
}

/* ==========================================================================
   8.5. Story Carousel (Historia de Magdalena)
   ========================================================================== */
function initStoryCarousel() {
    const carousel = document.querySelector('.story-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.story-carousel-slides img');
    const dots = carousel.querySelectorAll('.story-carousel-dots .story-dot');
    let currentSlide = 0;
    let autoSlideInterval;

    function showSlide(index) {
        if (index < 0) {
            currentSlide = slides.length - 1;
        } else if (index >= slides.length) {
            currentSlide = 0;
        } else {
            currentSlide = index;
        }

        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentSlide);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentSlide);
        });
    }

    function nextSlide() {
        showSlide(currentSlide + 1);
    }

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 4000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Add click event to dots
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            resetAutoSlide();
        });
    });

    // Touch Swipe Support for mobile
    addSwipeSupport(carousel, () => {
        showSlide(currentSlide + 1);
        resetAutoSlide();
    }, () => {
        showSlide(currentSlide - 1);
        resetAutoSlide();
    });

    startAutoSlide();
}

/* ==========================================================================
   8.6. Hero Carousel
   ========================================================================== */
function initHeroCarousel() {
    const carousel = document.querySelector('.hero-carousel');
    if (!carousel) return;

    const slides = carousel.querySelectorAll('.hero-carousel-slides img');
    const prevBtn = carousel.querySelector('.hero-carousel-btn.prev');
    const nextBtn = carousel.querySelector('.hero-carousel-btn.next');
    const dots = carousel.querySelectorAll('.hero-carousel-dots .hero-dot');
    
    if (slides.length === 0) return;

    let currentIdx = 0;
    let autoSlideInterval;

    function showSlide(idx) {
        if (idx < 0) {
            currentIdx = slides.length - 1;
        } else if (idx >= slides.length) {
            currentIdx = 0;
        } else {
            currentIdx = idx;
        }

        slides.forEach((slide, i) => {
            slide.classList.toggle('active', i === currentIdx);
        });

        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIdx);
        });
    }

    function nextSlide() {
        showSlide(currentIdx + 1);
    }

    function prevSlide() {
        showSlide(currentIdx - 1);
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevSlide();
            resetAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextSlide();
            resetAutoSlide();
        });
    }

    dots.forEach((dot, dotIdx) => {
        dot.addEventListener('click', (e) => {
            e.preventDefault();
            showSlide(dotIdx);
            resetAutoSlide();
        });
    });

    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Touch Swipe Support for mobile
    addSwipeSupport(carousel, () => {
        nextSlide();
        resetAutoSlide();
    }, () => {
        prevSlide();
        resetAutoSlide();
    });

    startAutoSlide();
}

/* ==========================================================================
   9. Download Lead Modal & Export System
   ========================================================================== */
function initDownloadModal() {
    const downloadBtns = document.querySelectorAll('.product-actions .btn-primary');
    const urlParams = new URLSearchParams(window.location.search);
    const hasStatus = urlParams.has('status') || urlParams.has('collection_status');

    if (downloadBtns.length === 0 && !hasStatus) return;

    // Inject modal HTML if not already in document
    if (!document.getElementById('download-modal')) {
        const modalHTML = `
            <div class="modal-overlay" id="download-modal" style="display: none;">
                <style>
                    #download-modal .modal-card {
                        border-top: 4px solid var(--accent);
                        max-width: 440px;
                        overflow: visible;
                    }
                    .download-modal-brand {
                        font-family: var(--font-display);
                        font-size: 0.72rem;
                        font-weight: 700;
                        letter-spacing: 0.12em;
                        color: var(--accent);
                        text-transform: uppercase;
                        margin-bottom: 2px;
                        display: block;
                    }
                    .download-input-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                        width: 100%;
                    }
                    .download-input-wrapper input {
                        padding-left: 44px !important;
                    }
                    .download-input-wrapper svg {
                        position: absolute;
                        left: 16px;
                        color: var(--tertiary);
                        width: 18px;
                        height: 18px;
                        pointer-events: none;
                        transition: var(--transition-smooth);
                    }
                    .download-input-wrapper input:focus + svg {
                        color: var(--accent);
                    }
                    .download-modal-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.72rem;
                        color: var(--text-muted);
                        margin-top: 16px;
                        border-top: 1px solid var(--border);
                        padding-top: 14px;
                    }
                    .download-secure-badge {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                    }
                    .download-secure-badge svg {
                        width: 12px;
                        height: 12px;
                        color: var(--accent);
                    }
                    .download-success-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 32px 16px;
                        animation: downloadModalScaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    }
                    .success-icon-circle {
                        width: 64px;
                        height: 64px;
                        border-radius: 50%;
                        background-color: rgba(196, 164, 124, 0.12);
                        border: 2px solid var(--accent);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        color: var(--accent);
                    }
                    .success-icon-circle svg {
                        width: 28px;
                        height: 28px;
                    }
                    .success-title {
                        font-family: var(--font-display);
                        font-size: 1.6rem;
                        color: var(--text);
                        margin-bottom: 8px;
                    }
                    .success-text {
                        font-size: 0.92rem;
                        color: var(--text-muted);
                        margin-bottom: 24px;
                        line-height: 1.5;
                    }
                    @keyframes downloadModalScaleUp {
                        from {
                            opacity: 0;
                            transform: scale(0.92);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    body.dark-mode .success-icon-circle {
                        background-color: rgba(227, 193, 151, 0.12);
                    }
                    .donation-option-buttons {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 12px;
                        width: 100%;
                        margin: 20px 0;
                    }
                    .btn-donate {
                        background: var(--surface-low);
                        border: 1px solid var(--border);
                        color: var(--text);
                        padding: 10px 14px;
                        border-radius: var(--radius-md);
                        font-family: var(--font-display);
                        font-weight: 600;
                        font-size: 0.88rem;
                        cursor: pointer;
                        transition: var(--transition-smooth);
                        text-align: center;
                    }
                    .btn-donate:hover {
                        border-color: var(--accent);
                        background: rgba(196, 164, 124, 0.08);
                        transform: translateY(-2px);
                    }
                    .btn-donate:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .btn-skip-donate {
                        background: transparent;
                        border: 1px solid var(--border);
                        color: var(--text-muted);
                        padding: 10px 14px;
                        border-radius: var(--radius-md);
                        font-family: var(--font-body);
                        font-weight: 500;
                        font-size: 0.84rem;
                        cursor: pointer;
                        width: 100%;
                        transition: var(--transition-smooth);
                        text-align: center;
                        margin-top: 8px;
                    }
                    .btn-skip-donate:hover {
                        color: var(--text);
                        border-color: var(--text-muted);
                    }
                    body.dark-mode .btn-donate:hover {
                        background: rgba(227, 193, 151, 0.08);
                    }
                </style>
                <div class="modal-card">
                    <!-- Form Container -->
                    <div id="download-modal-form-container">
                        <div class="modal-header">
                            <div>
                                <span class="download-modal-brand">Die Brücke Atelier</span>
                                <h3 style="margin-top: 4px;" id="download-modal-title">Descarga Gratuita</h3>
                            </div>
                            <button class="close-modal" id="close-download-modal" aria-label="Cerrar modal">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <p class="download-modal-lead" style="color: var(--text-muted); font-size: 0.92rem; margin-bottom: 20px; line-height: 1.5;">
                                Ingresá tus datos para descargar inmediatamente: <br>
                                <strong id="download-modal-prod-name" style="color: var(--accent); font-family: var(--font-display); font-size: 1.15rem; display: block; margin-top: 4px;"></strong>
                            </p>
                            <form id="download-lead-form">
                                <div class="form-group">
                                    <label for="download-name">Nombre Completo</label>
                                    <div class="download-input-wrapper">
                                        <input type="text" id="download-name" required placeholder="Ej: Juan Pérez">
                                        <i data-lucide="user"></i>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="download-email">Correo Electrónico</label>
                                    <div class="download-input-wrapper">
                                        <input type="email" id="download-email" required placeholder="ejemplo@correo.com">
                                        <i data-lucide="mail"></i>
                                    </div>
                                    <span class="help-text" id="download-modal-help-text">El archivo PDF se descargará automáticamente al confirmar.</span>
                                </div>
                                <button type="submit" id="download-modal-submit-btn" class="btn-primary w-full" style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <span id="download-modal-submit-text">Confirmar y Descargar</span>
                                    <i id="download-modal-submit-icon" data-lucide="download" style="width: 16px; height: 16px;"></i>
                                </button>
                            </form>
                            <div class="download-modal-footer">
                                <div class="download-secure-badge">
                                    <i data-lucide="shield-check"></i>
                                    <span>Descarga 100% segura</span>
                                </div>
                                <span>Formatos: PDF, JPG, SVG</span>
                            </div>
                        </div>
                    </div>

                    <!-- Donation Container -->
                    <div id="download-modal-donation-container" style="display: none;">
                        <div class="download-success-state">
                            <div class="success-icon-circle" style="background-color: rgba(196, 164, 124, 0.08); border-color: var(--accent);">
                                <i data-lucide="heart" style="color: var(--accent); width: 28px; height: 28px;"></i>
                            </div>
                            <h3 class="success-title">¿Querés apoyar mi trabajo?</h3>
                            <p class="success-text" style="margin-bottom: 12px; line-height: 1.5;">
                                Este recurso digital es gratuito. Si valorás el tiempo y esfuerzo dedicado al atelier, podés realizar una contribución voluntaria para apoyarlo:
                            </p>
                            <div class="donation-option-buttons">
                                <button class="btn-donate" data-amount="500">Contribuir $500</button>
                                <button class="btn-donate" data-amount="1000">Contribuir $1.000</button>
                                <button class="btn-donate" data-amount="2000">Contribuir $2.000</button>
                                <button class="btn-donate" data-amount="5000">Contribuir $5.000</button>
                            </div>
                            <button id="skip-donation-btn" class="btn-skip-donate">No donar, iniciar descarga gratuita</button>
                        </div>
                    </div>

                    <!-- Success State Container -->
                    <div id="download-modal-success-container" style="display: none;">
                        <div class="download-success-state">
                            <div class="success-icon-circle">
                                <i data-lucide="check"></i>
                            </div>
                            <h3 class="success-title">¡Descarga Iniciada!</h3>
                            <p class="success-text" id="download-success-message">
                                Gracias. Tu archivo comenzará a descargarse de forma automática en breve.
                            </p>
                            <button id="success-close-btn" class="btn-primary" style="min-width: 140px;">Entendido</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();
    }

    const modal = document.getElementById('download-modal');
    const closeBtn = document.getElementById('close-download-modal');
    const successCloseBtn = document.getElementById('success-close-btn');
    const form = document.getElementById('download-lead-form');
    const modalProdName = document.getElementById('download-modal-prod-name');

    let activeDownloadUrl = '';
    let activeDownloadFilename = '';
    let activeProductName = '';
    let activeProductPrice = 0;

    function openModal(prodName, url, filename, price = 0) {
        if (localStorage.getItem('adminMode') === 'true') {
            const prodLink = document.createElement('a');
            prodLink.href = url;
            prodLink.download = filename;
            document.body.appendChild(prodLink);
            prodLink.click();
            document.body.removeChild(prodLink);
            console.log(`[Admin Bypass] Descargando: ${prodName}`);
            return;
        }

        activeProductName = prodName;
        activeDownloadUrl = url;
        activeDownloadFilename = filename;
        activeProductPrice = price;

        modalProdName.textContent = prodName;

        // Dynamically update form content based on whether it is paid or free
        const titleEl = document.getElementById('download-modal-title');
        const helpTextEl = document.getElementById('download-modal-help-text');
        const submitBtnTextEl = document.getElementById('download-modal-submit-text');
        const submitBtnIconEl = document.getElementById('download-modal-submit-icon');

        if (activeProductPrice > 0) {
            if (titleEl) titleEl.textContent = 'Adquirir Recurso';
            if (helpTextEl) helpTextEl.textContent = `Serás redirigido a Mercado Pago para realizar el pago de $${activeProductPrice.toLocaleString('es-AR')}.`;
            if (submitBtnTextEl) submitBtnTextEl.textContent = `Proceder al Pago ($${activeProductPrice.toLocaleString('es-AR')})`;
            if (submitBtnIconEl) {
                submitBtnIconEl.setAttribute('data-lucide', 'credit-card');
            }
        } else {
            if (titleEl) titleEl.textContent = 'Descarga Gratuita';
            if (helpTextEl) helpTextEl.textContent = 'El archivo PDF se descargará automáticamente al confirmar.';
            if (submitBtnTextEl) submitBtnTextEl.textContent = 'Confirmar y Descargar';
            if (submitBtnIconEl) {
                submitBtnIconEl.setAttribute('data-lucide', 'download');
            }
        }
        lucide.createIcons();

        modal.style.display = 'flex';
        modal.offsetHeight; // Reflow
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
                // Reset containers for next opening
                document.getElementById('download-modal-form-container').style.display = 'block';
                document.getElementById('download-modal-donation-container').style.display = 'none';
                document.getElementById('download-modal-success-container').style.display = 'none';

                // Reset success icon circle to default check state
                const successCircle = document.querySelector('#download-modal-success-container .success-icon-circle');
                if (successCircle) {
                    successCircle.innerHTML = '<i data-lucide="check"></i>';
                    successCircle.style.borderColor = '';
                    successCircle.style.backgroundColor = '';
                }
                const titleEl = document.getElementById('download-modal-title');
                if (titleEl) {
                    titleEl.textContent = 'Descarga Gratuita';
                }
            }
        }, 300);
        form.reset();
    }

    closeBtn.addEventListener('click', closeModal);
    if (successCloseBtn) {
        successCloseBtn.addEventListener('click', closeModal);
    }
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    downloadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const href = btn.getAttribute('href');
            if (href && (href.endsWith('.pdf') || btn.hasAttribute('download'))) {
                e.preventDefault();
                const prodName = btn.getAttribute('data-product-name') || document.title.split('|')[0].trim();
                const filename = btn.getAttribute('download') || 'recurso.pdf';
                const price = Number(btn.getAttribute('data-product-price')) || 0;
                openModal(prodName, href, filename, price);
            }
        });
    });

    // Helper function to trigger actual file download
    function triggerDownload() {
        const prodLink = document.createElement('a');
        prodLink.href = activeDownloadUrl;
        prodLink.download = activeDownloadFilename;
        document.body.appendChild(prodLink);
        prodLink.click();
        document.body.removeChild(prodLink);
    }

    // Helper function to show final success state
    function showSuccessState(name) {
        document.getElementById('download-modal-form-container').style.display = 'none';
        document.getElementById('download-modal-donation-container').style.display = 'none';
        document.getElementById('download-success-message').innerHTML = `¡Gracias, <strong>${name}</strong>!<br>La descarga de <strong>"${activeProductName}"</strong> ha comenzado automáticamente.`;
        document.getElementById('download-modal-success-container').style.display = 'block';
        lucide.createIcons();
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('download-name').value.trim();
        const email = document.getElementById('download-email').value.trim();

        if (!name || !email) return;

        // Send lead info to n8n in the background (only for free products on form submit)
        const isPurchase = activeProductPrice > 0;
        if (!isPurchase) {
            sendToN8N({
                name: name,
                email: email,
                productName: activeProductName,
                downloadUrl: activeDownloadUrl,
                filename: activeDownloadFilename,
                source: 'download_modal'
            }, false);
        }

        if (activeProductPrice > 0) {
            // Save state in localStorage to retrieve upon redirect back
            localStorage.setItem('pending_download_name', name);
            localStorage.setItem('pending_download_email', email);
            localStorage.setItem('pending_download_prod_name', activeProductName);
            localStorage.setItem('pending_download_url', activeDownloadUrl);
            localStorage.setItem('pending_download_filename', activeDownloadFilename);

            // Disable submit button during payment processing
            const submitBtn = document.getElementById('download-modal-submit-btn');
            const submitText = document.getElementById('download-modal-submit-text');
            if (submitBtn) submitBtn.disabled = true;
            if (submitText) submitText.textContent = 'Redirigiendo a Mercado Pago...';

            try {
                // Call the Vercel serverless function endpoint to create preference
                const response = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: Number(activeProductPrice),
                        title: `Pago - ${activeProductName}`,
                        email: email,
                        name: name,
                        downloadUrl: activeDownloadUrl,
                        filename: activeDownloadFilename
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.error('API error details:', errData);
                    throw new Error(errData.message || 'API error creating preference');
                }

                const data = await response.json();
                
                // Redirect current window to Mercado Pago checkout
                if (data.init_point) {
                    window.location.href = data.init_point;
                } else {
                    console.error('No init_point returned', data);
                    alert('No se pudo iniciar el pago. Por favor, intenta de nuevo.');
                    if (submitBtn) submitBtn.disabled = false;
                    if (submitText) submitText.textContent = 'Proceder al Pago';
                }

            } catch (error) {
                console.error('Error initiating payment:', error);
                alert('Hubo un inconveniente al conectar con Mercado Pago. Por favor, intenta de nuevo.');
                if (submitBtn) submitBtn.disabled = false;
                if (submitText) submitText.textContent = 'Proceder al Pago';
            }
        } else {
            // Hide form and show donation panel for free products
            document.getElementById('download-modal-form-container').style.display = 'none';
            document.getElementById('download-modal-donation-container').style.display = 'block';
            lucide.createIcons(); // Render heart icon
        }
    });

    // Handle Skip Donation (Free download)
    const skipBtn = document.getElementById('skip-donation-btn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            const name = document.getElementById('download-name').value.trim();
            const emailInput = document.getElementById('download-email');
            const email = emailInput ? emailInput.value.trim() : '';
            
            // Track free download in Supabase
            const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbG9jcXNyeXV2aGN3bWpqYmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ5MjMsImV4cCI6MjA5NzkxMDkyM30.uinZ-RlDIuQ7ZQlknhCmLef7Rzcb1DCWuxvwywkEFuw';
            fetch('https://uelocqsryuvhcwmjjbho.supabase.co/rest/v1/payment_records', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': apiKey,
                    'Authorization': 'Bearer ' + apiKey
                },
                body: JSON.stringify({
                    amount: 0,
                    status: 'free_download',
                    product_name: activeProductName,
                    client_email: email,
                    client_name: name,
                    preference_id: 'free_' + Date.now(), // in case it's required
                    payment_id: 'free_' + Date.now()
                })
            }).catch(e => console.error('Tracking error', e));

            triggerDownload();
            showSuccessState(name);
        });
    }

    // Handle Donation Buttons (Mercado Pago API)
    const donationBtns = document.querySelectorAll('.btn-donate');
    donationBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const amount = btn.getAttribute('data-amount');
            const name = document.getElementById('download-name').value.trim();

            // Disable buttons during API request
            donationBtns.forEach(b => b.disabled = true);
            const originalText = btn.textContent;
            btn.textContent = 'Procesando...';

            // Also disable the skip button
            if (skipBtn) skipBtn.disabled = true;

            try {
                const emailInput = document.getElementById('download-email');
                const email = emailInput ? emailInput.value.trim() : '';

                // Call the Vercel serverless function endpoint to create preference
                const response = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: Number(amount),
                        title: `Contribución voluntaria - ${activeProductName}`,
                        email: email,
                        name: name,
                        downloadUrl: activeDownloadUrl,
                        filename: activeDownloadFilename
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.error('API error details:', errData);
                    throw new Error(errData.message || 'API error creating preference');
                }

                const data = await response.json();
                
                // Open Mercado Pago checkout in a new window/tab
                if (data.init_point) {
                    // Save state in localStorage to retrieve upon redirect back
                    localStorage.setItem('pending_download_name', name);
                    const emailInput = document.getElementById('download-email');
                    localStorage.setItem('pending_download_email', emailInput ? emailInput.value.trim() : '');
                    localStorage.setItem('pending_download_prod_name', `Donación (${activeProductName}) - $${amount}`);
                    localStorage.setItem('pending_download_url', activeDownloadUrl);
                    localStorage.setItem('pending_download_filename', activeDownloadFilename);

                    window.open(data.init_point, '_blank');
                } else {
                    console.error('No init_point returned', data);
                }

            } catch (error) {
                console.error('Error initiating donation:', error);
                alert('Hubo un inconveniente al conectar con Mercado Pago. Iniciando la descarga gratuita de todos modos.');
            } finally {
                // Restore button states
                btn.textContent = originalText;
                donationBtns.forEach(b => b.disabled = false);
                if (skipBtn) skipBtn.disabled = false;

                // Download the file anyway
                triggerDownload();
                // Show final success screen
                showSuccessState(name);
            }
        });
    });

    // Check payment status from URL redirect
    function checkPaymentStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get('status') || urlParams.get('collection_status');
        
        if (status) {
            // Retrieve product details from localStorage or fallback to page button
            const savedName = localStorage.getItem('pending_download_name') || 'Cliente';
            const savedEmail = localStorage.getItem('pending_download_email') || '';
            let savedProdName = localStorage.getItem('pending_download_prod_name');
            let savedUrl = localStorage.getItem('pending_download_url');
            let savedFilename = localStorage.getItem('pending_download_filename');

            // Fallback if localStorage was cleared or not set
            if (!savedUrl) {
                const firstBtn = document.querySelector('.product-actions .btn-primary');
                if (firstBtn) {
                    savedProdName = firstBtn.getAttribute('data-product-name') || document.title.split('|')[0].trim();
                    savedUrl = firstBtn.getAttribute('href');
                    savedFilename = firstBtn.getAttribute('download') || 'recurso.pdf';
                }
            }

            activeProductName = savedProdName || 'Recurso';
            activeDownloadUrl = savedUrl;
            activeDownloadFilename = savedFilename;

            if (status === 'approved') {
                // El webhook se envía de forma segura desde el backend (api/payment-webhook.js) para evitar duplicados.
                // Ya no llamamos a sendToN8N desde el frontend para compras aprobadas.

                // Trigger download
                if (activeDownloadUrl) {
                    triggerDownload();
                }
                // Show success modal
                showSuccessState(savedName);

                // Open the modal overlay visually
                modal.style.display = 'flex';
                modal.offsetHeight; // Reflow
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
                
                // Clean up query params from URL so reloading doesn't trigger download again
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
                
                // Clear localStorage
                localStorage.removeItem('pending_download_name');
                localStorage.removeItem('pending_download_email');
                localStorage.removeItem('pending_download_prod_name');
                localStorage.removeItem('pending_download_url');
                localStorage.removeItem('pending_download_filename');
            } else if (status === 'pending') {
                // Call webhook with pending payment details (only if email is available)
                if (savedEmail) {
                    sendToN8N({
                        name: savedName,
                        email: savedEmail,
                        productName: activeProductName,
                        downloadUrl: activeDownloadUrl,
                        filename: activeDownloadFilename,
                        paymentId: urlParams.get('payment_id') || urlParams.get('collection_id') || '',
                        preferenceId: urlParams.get('preference_id') || '',
                        status: status,
                        source: 'payment_pending'
                    }, true);
                }

                // Show pending state in modal
                document.getElementById('download-modal-form-container').style.display = 'none';
                document.getElementById('download-modal-donation-container').style.display = 'none';
                document.getElementById('download-success-message').innerHTML = `¡Gracias, <strong>${savedName}</strong>!<br>Tu pago de <strong>"${activeProductName}"</strong> está pendiente de acreditación. La descarga comenzará automáticamente una vez acreditado.`;
                document.getElementById('download-modal-success-container').style.display = 'block';
                
                const titleEl = document.getElementById('download-modal-title');
                if (titleEl) titleEl.textContent = 'Pago Pendiente';
                
                modal.style.display = 'flex';
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';

                // Clean up query params
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                // Clear localStorage
                localStorage.removeItem('pending_download_name');
                localStorage.removeItem('pending_download_email');
                localStorage.removeItem('pending_download_prod_name');
                localStorage.removeItem('pending_download_url');
                localStorage.removeItem('pending_download_filename');
            } else if (status === 'failure') {
                // Call webhook with failure payment details (only if email is available)
                if (savedEmail) {
                    sendToN8N({
                        name: savedName,
                        email: savedEmail,
                        productName: activeProductName,
                        downloadUrl: activeDownloadUrl,
                        filename: activeDownloadFilename,
                        paymentId: urlParams.get('payment_id') || urlParams.get('collection_id') || '',
                        preferenceId: urlParams.get('preference_id') || '',
                        status: status,
                        source: 'payment_failure'
                    }, true);
                }

                // Show error state in modal
                document.getElementById('download-modal-form-container').style.display = 'none';
                document.getElementById('download-modal-donation-container').style.display = 'none';
                document.getElementById('download-success-message').innerHTML = `El pago para <strong>"${activeProductName}"</strong> no pudo completarse. Por favor, intentá realizar la operación nuevamente.`;
                document.getElementById('download-modal-success-container').style.display = 'block';
                
                const titleEl = document.getElementById('download-modal-title');
                if (titleEl) titleEl.textContent = 'Pago Rechazado';
                
                // Change check icon to an error icon
                const successCircle = document.querySelector('#download-modal-success-container .success-icon-circle');
                if (successCircle) {
                    successCircle.innerHTML = '<i data-lucide="alert-circle" style="color: #e53e3e;"></i>';
                    successCircle.style.borderColor = '#e53e3e';
                    successCircle.style.backgroundColor = 'rgba(229, 62, 62, 0.08)';
                }
                
                modal.style.display = 'flex';
                modal.classList.add('open');
                document.body.style.overflow = 'hidden';
                lucide.createIcons();

                // Clean up query params
                const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

                // Clear localStorage
                localStorage.removeItem('pending_download_name');
                localStorage.removeItem('pending_download_email');
                localStorage.removeItem('pending_download_prod_name');
                localStorage.removeItem('pending_download_url');
                localStorage.removeItem('pending_download_filename');
            }
        }
    }

    // Run check on initialization
    checkPaymentStatus();
}

/* ==========================================================================
   10. Coffee Donation Button
   ========================================================================== */
function initCoffeeButton() {
    const coffeeBtn = document.getElementById('buy-coffee-btn');
    if (!coffeeBtn) return;

    // Inject coffee modal if it doesn't exist
    if (!document.getElementById('coffee-modal')) {
        const modalHTML = `
            <div class="modal-overlay" id="coffee-modal" style="display: none;">
                <style>
                    #coffee-modal .modal-card {
                        border-top: 4px solid var(--accent);
                        max-width: 400px;
                        overflow: visible;
                    }
                    .coffee-quick-options {
                        display: grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                        margin: 18px 0;
                    }
                    .btn-coffee-option {
                        background: var(--surface-low);
                        border: 1px solid var(--border);
                        color: var(--text);
                        padding: 12px 10px;
                        border-radius: var(--radius-md);
                        font-family: var(--font-display);
                        font-weight: 600;
                        font-size: 0.95rem;
                        cursor: pointer;
                        transition: var(--transition-smooth);
                        text-align: center;
                    }
                    .btn-coffee-option:hover,
                    .btn-coffee-option.active {
                        border-color: var(--accent);
                        background: rgba(196, 164, 124, 0.08);
                        transform: translateY(-2px);
                    }
                    body.dark-mode .btn-coffee-option:hover,
                    body.dark-mode .btn-coffee-option.active {
                        background: rgba(227, 193, 151, 0.08);
                    }
                    .custom-amount-group {
                        margin-bottom: 24px;
                    }
                    .custom-amount-input-wrapper {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }
                    .custom-amount-input-wrapper span {
                        position: absolute;
                        left: 16px;
                        color: var(--text-muted);
                        font-weight: 600;
                        font-size: 1.1rem;
                    }
                    .custom-amount-input-wrapper input {
                        width: 100%;
                        padding: 12px 16px 12px 34px !important;
                        border: 1px solid var(--border);
                        border-radius: var(--radius-md);
                        background: var(--surface);
                        font-size: 1.1rem;
                        font-weight: 600;
                        transition: var(--transition-smooth);
                    }
                    .custom-amount-input-wrapper input:focus {
                        border-color: var(--accent);
                    }
                    .custom-amount-input-wrapper input::-webkit-outer-spin-button,
                    .custom-amount-input-wrapper input::-webkit-inner-spin-button {
                        -webkit-appearance: none;
                        margin: 0;
                    }
                    .custom-amount-input-wrapper input[type=number] {
                        -moz-appearance: textfield;
                    }
                </style>
                <div class="modal-card">
                    <div class="modal-header">
                        <div>
                            <span class="download-modal-brand">Apoya el Atelier</span>
                            <h3 style="margin-top: 4px;">Invitame un Cafecito ☕</h3>
                        </div>
                        <button class="close-modal" id="close-coffee-modal" aria-label="Cerrar modal">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p style="color: var(--text-muted); font-size: 0.92rem; line-height: 1.5; margin-bottom: 12px;">
                            Si valorás mi trabajo y querés contribuir, podés realizar una contribución voluntaria para apoyar el atelier:
                        </p>
                        
                        <div class="coffee-quick-options">
                            <button class="btn-coffee-option active" data-val="500">$500</button>
                            <button class="btn-coffee-option" data-val="2000">$2.000</button>
                            <button class="btn-coffee-option" data-val="5000">$5.000</button>
                        </div>

                        <div class="form-group custom-amount-group">
                            <label for="coffee-custom-amount" style="font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; display: block; color: var(--text-muted);">Otro monto a tu consideración (ARS)</label>
                            <div class="custom-amount-input-wrapper">
                                <span>$</span>
                                <input type="number" id="coffee-custom-amount" min="10" placeholder="Ej: 1500" value="500">
                            </div>
                        </div>

                        <button id="confirm-coffee-btn" class="btn-primary w-full" style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <span>Confirmar y Contribuir</span>
                            <i data-lucide="heart" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        lucide.createIcons();
    }

    const modal = document.getElementById('coffee-modal');
    const closeBtn = document.getElementById('close-coffee-modal');
    const quickOptions = modal.querySelectorAll('.btn-coffee-option');
    const customInput = document.getElementById('coffee-custom-amount');
    const confirmBtn = document.getElementById('confirm-coffee-btn');

    function openModal() {
        modal.style.display = 'flex';
        modal.offsetHeight; // Reflow
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (!modal.classList.contains('open')) {
                modal.style.display = 'none';
            }
        }, 300);
    }

    // Bind trigger button
    coffeeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Quick option selections
    quickOptions.forEach(btn => {
        btn.addEventListener('click', () => {
            quickOptions.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const value = btn.getAttribute('data-val');
            if (customInput) {
                customInput.value = value;
            }
        });
    });

    // Deselect quick options when custom input is edited manually
    if (customInput) {
        customInput.addEventListener('input', () => {
            const currentVal = customInput.value;
            quickOptions.forEach(b => {
                const optVal = b.getAttribute('data-val');
                if (optVal === currentVal) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
        });
    }

    // Confirm Payment
    if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
            const amountVal = customInput ? Number(customInput.value) : 500;
            if (!amountVal || isNaN(amountVal) || amountVal < 10) {
                alert('Por favor ingresá un monto válido (mínimo $10 ARS).');
                return;
            }

            confirmBtn.disabled = true;
            const originalText = confirmBtn.querySelector('span').textContent;
            confirmBtn.querySelector('span').textContent = 'Procesando...';

            try {
                const response = await fetch('/api/create-preference', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        amount: amountVal,
                        title: 'Invitame un cafecito ☕'
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.error('API error details:', errData);
                    throw new Error(errData.message || 'API error creating preference');
                }

                const data = await response.json();
                if (data.init_point) {
                    // Save state in localStorage to retrieve upon redirect back
                    localStorage.setItem('pending_download_name', 'Donante Cafecito');
                    localStorage.setItem('pending_download_email', '');
                    localStorage.setItem('pending_download_prod_name', `Cafecito ☕ ($${amountVal})`);
                    localStorage.setItem('pending_download_url', '');
                    localStorage.setItem('pending_download_filename', '');

                    window.open(data.init_point, '_blank');
                    closeModal();
                } else {
                    console.error('No init_point returned', data);
                    alert('No se pudo iniciar el pago.');
                }
            } catch (error) {
                console.error('Error creating coffee payment:', error);
                alert('Hubo un inconveniente al conectar con Mercado Pago. Por favor intenta más tarde.');
            } finally {
                confirmBtn.querySelector('span').textContent = originalText;
                confirmBtn.disabled = false;
            }
        });
    }
}

/* ==========================================================================
   11. Swipe Gesture Support for Touch Screens
   ========================================================================== */
function addSwipeSupport(element, onSwipeLeft, onSwipeRight) {
    let startX = 0;
    let startY = 0;
    
    element.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    
    element.addEventListener('touchend', (e) => {
        if (!startX || !startY) return;
        
        let diffX = e.changedTouches[0].clientX - startX;
        let diffY = e.changedTouches[0].clientY - startY;
        
        // Threshold: 50px horizontal and more horizontal than vertical movement
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                if (typeof onSwipeRight === 'function') onSwipeRight();
            } else {
                if (typeof onSwipeLeft === 'function') onSwipeLeft();
            }
        }
        
        startX = 0;
        startY = 0;
    }, { passive: true });
}

/* ==========================================================================
   12. Web Analytics Tracking
   ========================================================================== */
function initAnalytics() {
    // Check if we are in admin mode to not track admin actions
    if (localStorage.getItem('adminMode') === 'true') {
        return;
    }

    let clientId = localStorage.getItem('client_id');
    if (!clientId) {
        clientId = 'client_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('client_id', clientId);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const data = {
        path: window.location.pathname,
        user_agent: navigator.userAgent,
        referrer: document.referrer || '',
        utm_source: urlParams.get('utm_source') || '',
        utm_medium: urlParams.get('utm_medium') || '',
        utm_campaign: urlParams.get('utm_campaign') || '',
        client_id: clientId
    };

    const sessionStartTime = Date.now();
    const apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlbG9jcXNyeXV2aGN3bWpqYmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzQ5MjMsImV4cCI6MjA5NzkxMDkyM30.uinZ-RlDIuQ7ZQlknhCmLef7Rzcb1DCWuxvwywkEFuw';

    fetch('https://uelocqsryuvhcwmjjbho.supabase.co/rest/v1/web_metrics', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
            'apikey': apiKey,
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(rows => {
        if (rows && rows.length > 0) {
            const metricId = rows[0].id;
            
            // Track when user leaves page
            window.addEventListener('beforeunload', () => {
                const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
                
                fetch(`https://uelocqsryuvhcwmjjbho.supabase.co/rest/v1/web_metrics?id=eq.${metricId}`, {
                    method: 'PATCH',
                    keepalive: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': apiKey,
                        'Authorization': 'Bearer ' + apiKey
                    },
                    body: JSON.stringify({ duration_seconds: durationSeconds })
                });
            });
        }
    })
    .catch(err => console.error('Analytics tracking error', err));
}

