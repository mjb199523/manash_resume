(function () {
    // 1. Safety & Placement
    if (window.location.pathname.includes('owner-access') || window.location.pathname.includes('admin')) {
        return;
    }

    // 2. Knowledge Base & Hierarchical Menus
    const MENU_DATA = {
        main: {
            label: "Explore Options",
            message: "What would you like to explore today?",
            options: [
                { id: 'profile', label: "About Me", icon: 'user' },
                { id: 'experience', label: "Career", icon: 'package' },
                { id: 'skills', label: "Skills", icon: 'award' },
                { id: 'projects', label: "Projects", icon: 'code' },
                { id: 'manashos', label: "ManashOS", icon: 'cpu' },
                { id: 'education', label: "Education", icon: 'book' },
                { id: 'contact', label: "Contact", icon: 'mail' }
            ]
        },
        experience: {
            label: "Timeline Highlights",
            message: "I've organized his career by company. Which one would you like to see?",
            options: [
                { id: 'exp_conve', label: "ConveGenius", icon: 'zap' },
                { id: 'exp_gt', label: "Grant Thornton", icon: 'layers' },
                { id: 'exp_wed', label: "Wednesday", icon: 'settings' },
                { id: 'exp_soul', label: "SoulpageIT", icon: 'users' },
                { id: 'exp_gov', label: "Govt Assam", icon: 'flag' },
                { id: 'main', label: "← Back", icon: 'arrow-left' }
            ]
        },
        manashos: {
            label: "ManashOS Ecosystem",
            message: "ManashOS is a full productivity environment. What interests you most?",
            options: [
                { id: 'os_overview', label: "Overview", icon: 'info' },
                { id: 'os_games', label: "11 Games", icon: 'play' },
                { id: 'os_experiments', label: "6 AI Labs", icon: 'flask-conical' },
                { id: 'os_journey', label: "Journey", icon: 'trending-up' },
                { id: 'main', label: "← Back", icon: 'arrow-left' }
            ]
        },
        projects: {
            label: "Project Portfolio",
            message: "Here are some featured builds. Which one should we dive into?",
            options: [
                { id: 'proj_paath', label: "PaathSohayok", icon: 'file-text' },
                { id: 'proj_airdraw', label: "AirDraw", icon: 'edit-3' },
                { id: 'proj_memory', label: "MemorySearch", icon: 'search' },
                { id: 'proj_smart', label: "SmartComm", icon: 'message-circle' },
                { id: 'proj_off', label: "OFFSTUMP", icon: 'globe' },
                { id: 'main', label: "← Back", icon: 'arrow-left' }
            ]
        }
    };

    const CONTENT_ANSWERS = {
        profile: "Manashjyoti Barman is a seasoned Product Delivery Manager and Project Management Consultant. With over 6 years of experience, he excels at bridging the gap between complex policy requirements and scalable digital solutions.",
        exp_conve: "Currently, Manashjyoti leads the Assam State Vidya Samiksha Kendra (VSK) operation at ConveGenius, focusing on data-driven educational delivery at scale.",
        exp_gt: "At Grant Thornton, he advised on digital governance and IT modernization policies, leading strategic consulting for large-scale public sector initiatives.",
        exp_wed: "During his time at Wednesday Solutions, he managed end-to-end Agile product streams, optimizing sprint velocity and release management via CI/CD pipelines.",
        exp_soul: "At SoulpageIT, he focused on requirement engineering and wireframing, ensuring that product discovery aligned perfectly with user needs.",
        exp_gov: "His role with the Govt of Assam involved setting up specialized institutions, where he scaled operational capacity and integrated government welfare schemes.",
        skills: "He specializes in Product Discovery (MVP to Scale), Agile Delivery (Scrum), Requirements Engineering (PRD/SRS), and Stakeholder Governance. He's also adept with tools like Jira, SQL, and Balsamiq.",
        proj_paath: "Paath Sohayok is a GenAI EdTech portal that instantly generates lesson plans and assessments. It's a prime example of his work in AI-driven product design.",
        proj_airdraw: "AirDraw uses Computer Vision to track hand gestures for virtual painting, showcasing his interest in deep learning and interactive interfaces.",
        proj_memory: "Memory Search is a semantic retrieval engine that finds documents based on meaning rather than just keywords—perfect for unstructured data.",
        proj_smart: "SmartComm acts as an AI executive assistant, transforming rough notes into polished, professional communication.",
        proj_off: "OFFSTUMP provided a premium sports facility with a complete digital presence, effectively converting online engagement into physical footfall.",
        os_overview: "ManashOS is a personal productivity system—a unified dashboard for blogs, tasks, and notes, built to minimize the friction between idea and execution.",
        os_games: "The platform hosts 11 interactive games designed to test typing speed, memory, and cognitive logic.",
        os_experiments: "Currently, 6 experiments are live, ranging from Web Scraping agents to AI Instagram handlers and local utility calculators.",
        os_journey: "His journey tracks his growth from building public sector systems to designing AI-driven personal ecosystems like ManashOS.",
        education: "He holds an MBA in Marketing & HR and a B.Tech in Computer Science & Engineering, both from Gauhati University.",
        contact: "You can reach Manashjyoti at:\nPhone No.: +918753912572 \nEmail: manashjyoti.barman07@gmail.com"
    };

    // 3. Session & Storage Logic
    const STORAGE_KEY = 'ask_manashos_session';
    const SESSION_EXPIRY = 3600000; // 1 hour

    function getSession() {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return null;
        const session = JSON.parse(data);
        if (Date.now() - session.timestamp > SESSION_EXPIRY) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return session;
    }

    function saveSession(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            history,
            timestamp: Date.now()
        }));
    }

    // 4. Component Injection
    const htmlSnippet = `
        <button id="chatbot-launcher" aria-label="Ask ManashOS">
            <i data-feather="message-circle"></i>
        </button>
        <div id="chatbot-window">
            <header class="chatbot-header">
                <div class="chatbot-header-info">
                    <h3>Ask ManashOS</h3>
                    <p>Selection Assistant</p>
                </div>
                <div class="chatbot-header-actions">
                    <button class="chatbot-action-btn" id="chatbot-reset" title="Reset Session">
                        <i data-feather="trash-2"></i>
                    </button>
                    <button class="chatbot-action-btn" id="chatbot-close" title="Close">
                        <i data-feather="x"></i>
                    </button>
                </div>
            </header>
            <div class="chatbot-messages" id="chatbot-messages"></div>
            <div class="chatbot-menu-container">
                <span class="menu-label" id="menu-label">Select a Topic</span>
                <div class="chatbot-menu-grid" id="chatbot-menu-grid"></div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlSnippet;
    document.body.appendChild(container);

    const launcher = document.getElementById('chatbot-launcher');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const resetBtn = document.getElementById('chatbot-reset');
    const messagesEl = document.getElementById('chatbot-messages');
    const menuGrid = document.getElementById('chatbot-menu-grid');
    const menuLabel = document.getElementById('menu-label');

    let chatHistory = [];

    // 5. Core Engine
    function init() {
        const session = getSession();
        if (session) {
            chatHistory = session.history;
            chatHistory.forEach(msg => addMessageToUI(msg.text, msg.role, false));
            renderMenu('main'); // Always default to main menu options for selection
        } else {
            showInitialGreeting();
        }
        if (window.feather) feather.replace();
    }

    function showInitialGreeting() {
        addMessageToUI("Hi! I'm your assistant. What would you like to explore today?", 'bot');
        renderMenu('main');
    }

    function renderMenu(menuId) {
        const menu = MENU_DATA[menuId] || MENU_DATA.main;
        menuLabel.textContent = menu.label;
        menuGrid.innerHTML = '';

        menu.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'menu-option';
            btn.innerHTML = `<i data-feather="${opt.icon}"></i> ${opt.label}`;
            btn.onclick = () => handleChoice(opt.id, opt.label);
            menuGrid.appendChild(btn);
        });

        if (window.feather) feather.replace();
    }

    function handleChoice(id, label) {
        // Add user bubble
        addMessageToUI(label, 'user');

        const typingId = showTyping();

        setTimeout(() => {
            hideTyping(typingId);

            if (MENU_DATA[id]) {
                // It's a submenu
                const sub = MENU_DATA[id];
                addMessageToUI(sub.message, 'bot');
                renderMenu(id);
            } else if (id === 'main') {
                // Back to start
                addMessageToUI(MENU_DATA.main.message, 'bot');
                renderMenu('main');
            } else {
                // Answer
                const answer = CONTENT_ANSWERS[id] || "I don't have that information yet.";
                addMessageToUI(answer, 'bot');
                // Stay in current menu (it has a back button)
            }
        }, 600);
    }

    function addMessageToUI(text, role, save = true) {
        const div = document.createElement('div');
        div.className = `chat-message message-${role}`;
        div.textContent = text;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        if (save) {
            chatHistory.push({ text, role });
            saveSession(chatHistory);
        }
    }

    function showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-message message-bot';
        div.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        messagesEl.appendChild(div);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        return id;
    }

    function hideTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // 6. Listeners
    launcher.onclick = () => windowEl.classList.toggle('active');
    closeBtn.onclick = () => windowEl.classList.remove('active');
    resetBtn.onclick = () => {
        if (confirm('Reset conversation?')) {
            localStorage.removeItem(STORAGE_KEY);
            messagesEl.innerHTML = '';
            chatHistory = [];
            showInitialGreeting();
        }
    };

    // Auto-clear logic on focus
    window.onfocus = () => {
        if (!getSession()) {
            messagesEl.innerHTML = '';
            chatHistory = [];
            init();
        }
    };

    init();
})();
