// Sanctuary Studio Interactive Functionality

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
    const emailInput = document.getElementById('newsletter-email');
    const feedbackMsg = document.getElementById('newsletter-message');

    if (!emailInput || !feedbackMsg) return;

    feedbackMsg.textContent = 'Procesando registro...';
    feedbackMsg.className = 'form-feedback-message';

    setTimeout(() => {
        feedbackMsg.textContent = '¡Te has registrado con éxito! Pronto recibirás tus primeros assets gratis.';
        feedbackMsg.className = 'form-feedback-message success';
        emailInput.value = '';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            feedbackMsg.textContent = '';
        }, 5000);
    }, 1000);
}

function handleContactSubmit(event) {
    event.preventDefault();
    const feedbackMsg = document.getElementById('contact-message-feedback');
    const submitBtn = event.target.querySelector('button[type="submit"]');

    if (!feedbackMsg || !submitBtn) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando solicitud...';
    feedbackMsg.textContent = '';

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
