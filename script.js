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

    // Initialize Download Lead Modal
    initDownloadModal();
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

    let currentFilter = 'all';
    let searchQuery = '';

    function filterCatalog() {
        cards.forEach(card => {
            const cardCategory = card.getAttribute('data-category');
            const cardTitle = card.querySelector('h3').textContent.toLowerCase();
            const cardDesc = card.querySelector('.card-desc').textContent.toLowerCase();
            
            const categoryMatch = currentFilter === 'all' || cardCategory === currentFilter;
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
function sendToN8N(data) {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const webhookUrl = isLocal 
        ? 'https://n8n.srv1202174.hstgr.cloud/webhook-test/65debfa2-2837-4f6b-8052-093144fcc2c8'
        : 'https://n8n.srv1202174.hstgr.cloud/webhook/65debfa2-2837-4f6b-8052-093144fcc2c8';

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            ...data,
            submittedAt: new Date().toISOString(),
            environment: isLocal ? 'test' : 'production',
            pageUrl: window.location.href
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
    const projectType = document.getElementById('contact-project-type').value;
    const message = document.getElementById('contact-message').value.trim();

    sendToN8N({
        name: name,
        email: email,
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

    startAutoSlide();
}

/* ==========================================================================
   9. Download Lead Modal & Export System
   ========================================================================== */
function initDownloadModal() {
    const downloadBtns = document.querySelectorAll('.product-actions .btn-primary');
    if (downloadBtns.length === 0) return;

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
                </style>
                <div class="modal-card">
                    <!-- Form Container -->
                    <div id="download-modal-form-container">
                        <div class="modal-header">
                            <div>
                                <span class="download-modal-brand">Die Brücke Atelier</span>
                                <h3 style="margin-top: 4px;">Descarga Gratuita</h3>
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
                                    <span class="help-text">El archivo PDF se descargará automáticamente al confirmar.</span>
                                </div>
                                <button type="submit" class="btn-primary w-full" style="margin-top: 10px; display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <span>Confirmar y Descargar</span>
                                    <i data-lucide="download" style="width: 16px; height: 16px;"></i>
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

    function openModal(prodName, url, filename) {
        activeProductName = prodName;
        activeDownloadUrl = url;
        activeDownloadFilename = filename;

        modalProdName.textContent = prodName;
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
                document.getElementById('download-modal-success-container').style.display = 'none';
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
                openModal(prodName, href, filename);
            }
        });
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('download-name').value.trim();
        const email = document.getElementById('download-email').value.trim();

        if (!name || !email) return;

        // Send to n8n webhook
        sendToN8N({
            name: name,
            email: email,
            productName: activeProductName,
            downloadUrl: activeDownloadUrl,
            filename: activeDownloadFilename,
            source: 'download_modal'
        });

        // Trigger product download
        const prodLink = document.createElement('a');
        prodLink.href = activeDownloadUrl;
        prodLink.download = activeDownloadFilename;
        document.body.appendChild(prodLink);
        prodLink.click();
        document.body.removeChild(prodLink);

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Iniciando descarga...';

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Transition modal to success view
            document.getElementById('download-modal-form-container').style.display = 'none';
            document.getElementById('download-success-message').innerHTML = `¡Gracias, <strong>${name}</strong>!<br>La descarga de <strong>"${activeProductName}"</strong> ha comenzado automáticamente.`;
            document.getElementById('download-modal-success-container').style.display = 'block';
            lucide.createIcons(); // Render check icon inside circle
        }, 800);
    });
}
