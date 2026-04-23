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

    // Nav active state logic based on scroll position
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section, .hero-section');

    const updateActiveNav = () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (scrollY >= sectionTop - 150) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href').includes(current)) {
                item.classList.add('active');
            }
        });
    };

    window.addEventListener('scroll', () => {
        updateActiveNav();
        
        // Scroll Progress Bar logic
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercentage = Math.min((scrollTop / scrollHeight) * 100, 100);
        const progressBar = document.getElementById('scroll-progress');
        if (progressBar) {
            progressBar.style.width = scrollPercentage + '%';
        }
    });

    // Manual click override for smooth scroll UX and Clean URLs
    const scrollLinks = document.querySelectorAll('.nav-item, .hero-buttons .btn[href^="#"]');
    scrollLinks.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            const targetId = href.replace('#', '');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                // Scroll to section
                window.scrollTo({
                    top: targetElement.offsetTop - 100, // Account for sticky header
                    behavior: 'smooth'
                });

                // Update URL cleanly without the hash (SPA feel)
                const cleanPath = targetId === 'home' ? '/' : `/${targetId}`;
                history.pushState(null, null, cleanPath);
                
                // Update active state in nav
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
    // Visitor Count Logic
    async function updateVisitorCount() {
        const countElement = document.getElementById('visitor-count-value');
        if (!countElement) return;

        try {
            // Updated to a cleaner namespace
            const response = await fetch('https://api.counterapi.dev/v1/manash-resume-official/visits/up');
            const data = await response.json();
            
            if (data && typeof data.count === 'number') {
                // Formatting the real count from zero
                countElement.innerText = data.count.toLocaleString();
            } else {
                countElement.innerText = '1'; 
            }
        } catch (error) {
            console.error('Visitor count error:', error);
            // Default to 1 if API fails (representing the current user)
            countElement.innerText = '1';
        }
    }

    updateVisitorCount();
});
