document.addEventListener('DOMContentLoaded', () => {
    // Initialize Feather Icons
    feather.replace();

    // Theme toggle functionality
    const themeBtn = document.getElementById('theme-toggle');
    const root = document.documentElement;
    
    // Check saved theme or system preference
    const savedTheme = localStorage.getItem('theme');
    let isDark = savedTheme === 'dark';
    
    if(!savedTheme) {
        // Optional system preference fallback
        // isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function applyTheme() {
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        themeBtn.innerHTML = isDark ? '<i data-feather="moon" class="icon-sm"></i>' : '<i data-feather="sun" class="icon-sm"></i>';
        feather.replace();
    }
    
    applyTheme();

    themeBtn.addEventListener('click', () => {
        isDark = !isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        applyTheme();
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('open');
            // Change icon
            const icon = menuToggle.querySelector('i');
            if (navMenu.classList.contains('open')) {
                icon.setAttribute('data-feather', 'x');
            } else {
                icon.setAttribute('data-feather', 'menu');
            }
            feather.replace();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navMenu.classList.contains('open') && !navMenu.contains(e.target) && e.target !== menuToggle) {
                navMenu.classList.remove('open');
                menuToggle.querySelector('i').setAttribute('data-feather', 'menu');
                feather.replace();
            }
        });
    }

    // Nav active state logic based on scroll position
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section, .hero-section');

    const updateActiveNav = () => {
        let current = '';
        const scrollPos = window.scrollY || document.documentElement.scrollTop;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            if (scrollPos >= sectionTop - 160 && scrollPos < sectionTop + sectionHeight - 160) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            const href = item.getAttribute('href');
            if (href.includes(current) && current !== '') {
                item.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', () => {
        updateActiveNav();
        
        // Scroll Progress Bar logic
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            progressBar.style.width = scrollPercentage + '%';
        }
    });

    // Manual click override for smooth scroll UX and Clean URLs
    const scrollLinks = document.querySelectorAll('.nav-item[href^="#"], .hero-buttons .btn[href^="#"]');
    scrollLinks.forEach(item => {
        item.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href.startsWith('#')) return; // Handle non-anchor links if any

            e.preventDefault();
            const targetId = href.replace('#', '');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('open')) {
                    navMenu.classList.remove('open');
                    const toggleIcon = menuToggle.querySelector('i');
                    if (toggleIcon) toggleIcon.setAttribute('data-feather', 'menu');
                    feather.replace();
                }

                // Scroll to section accurately
                const offset = 100;
                const bodyRect = document.body.getBoundingClientRect().top;
                const elementRect = targetElement.getBoundingClientRect().top;
                const elementPosition = elementRect - bodyRect;
                const offsetPosition = elementPosition - offset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Update URL cleanly
                const cleanPath = targetId === 'home' ? '/' : `/${targetId}`;
                history.pushState(null, null, cleanPath);
                
                // Update active state
                navItems.forEach(n => n.classList.remove('active'));
                const correspondingNav = document.querySelector(`.nav-item[href="#${targetId}"]`);
                if (correspondingNav) correspondingNav.classList.add('active');
            }
        });
    });

    // Initialize tsParticles for the background connection effect
    tsParticles.load("tsparticles", {
        fpsLimit: 60,
        particles: {
            color: {
                value: "#8a7df4"
            },
            links: {
                color: "#8a7df4",
                distance: 120,
                enable: true,
                opacity: 0.2,
                width: 1
            },
            move: {
                enable: true,
                speed: 0.8,
                direction: "none",
                random: false,
                straight: false,
                outModes: "out"
            },
            number: {
                density: {
                    enable: true,
                    area: 800
                },
                value: 30
            },
            opacity: {
                value: 0.2
            },
            shape: {
                type: "circle"
            },
            size: {
                value: { min: 1, max: 2 }
            }
        },
        detectRetina: true
    }).then(() => {
        console.log("tsParticles loaded successfully");
    }).catch((error) => {
        console.error("Error loading tsParticles:", error);
    });

    // Handle initial entry via clean URL (SPA routing fallback)
    // This allows bookmarks to /experience or /contact to work if the server is configured for SPA
    const currentPath = window.location.pathname.replace('/', '');
    if (currentPath && currentPath !== '') {
        setTimeout(() => {
            const target = document.getElementById(currentPath);
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 100,
                    behavior: 'auto'
                });
            }
        }, 100);
    }
    // Visitor Count Logic (1-Hour Session Based)
    async function trackUniqueVisitor() {
        const lastVisitStr = localStorage.getItem('os_visitor_timestamp');
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (lastVisitStr) {
            const lastVisit = parseInt(lastVisitStr, 10);
            if (now - lastVisit < oneHour) {
                // Less than 1 hour since last counted visit
                return;
            }
        }
        
        try {
            localStorage.setItem('os_visitor_timestamp', now.toString());
            try {
                const response = await fetch('/api/visit');
                if (!response.ok) throw new Error("Proxy response not ok");
            } catch (err) {
                await fetch('https://abacus.jasoncameron.dev/hit/mjb-resume-2026/visits');
            }
        } catch (error) {
            console.error('Visitor tracking error:', error);
            localStorage.removeItem('os_visitor_timestamp'); // retry next time
        }
    }

    trackUniqueVisitor();

    // --- CAL.COM SCHEDULER ---
    (function (C, A, L) {
        let p = function (a, ar) { a.q.push(ar); };
        let d = C.document; C.Cal = C.Cal || function () {
            let cal = C.Cal; let ar = arguments;
            if (!cal.loaded) { cal.q = cal.q || []; cal.loaded = true; }
            d.head.appendChild(d.createElement("script")).src = A; p(cal, ar);
        };
        d.head.appendChild(d.createElement("script")).src = A;
        C.Cal("init", { origin: L });
        C.Cal("ui", { "styles": { "branding": { "brandColor": "#6366f1" } }, "hideEventTypeDetails": false, "layout": "month_view" });
    }(window, "https://app.cal.com/embed/embed.js", "https://app.cal.com"));

    const scheduleBtn = document.getElementById('schedule-call-btn');
    if (scheduleBtn) {
        scheduleBtn.addEventListener('click', () => {
            Cal("modal", {
                calLink: "manashjyoti-barman-bgywvt/15min",
                config: { "layout": "month_view" }
            });
        });
    }
});

// Hide Loader when everything is loaded
window.addEventListener('load', () => {
    const loader = document.getElementById('loader-wrapper');
    if (loader) {
        // Minimum display time for the loader to ensure smooth transition
        setTimeout(() => {
            document.body.classList.add('loaded');
        }, 500); // Reduced from 1500ms for better performance
    }
});
