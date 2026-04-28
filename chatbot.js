(function() {
    // 1. Placement Rules & Auth Check
    if (window.location.pathname.includes('owner-access') || window.location.pathname.includes('admin')) {
        return;
    }

    // 2. Knowledge Base & Menu Definitions
    const MENU_DATA = {
        main: {
            label: "Main Menu",
            options: [
                { id: 'profile', label: "Who is Manashjyoti?", icon: 'user' },
                { id: 'experience', label: "Career Timeline", icon: 'briefcase' },
                { id: 'skills', label: "Skills & Capabilities", icon: 'award' },
                { id: 'projects', label: "Featured Projects", icon: 'code' },
                { id: 'manashos', label: "ManashOS Platform", icon: 'cpu' },
                { id: 'education', label: "Academic Background", icon: 'book' },
                { id: 'contact', label: "Get in Touch", icon: 'mail' }
            ]
        },
        experience: {
            label: "Experience",
            options: [
                { id: 'exp_conve', label: "ConveGenius (Current)", icon: 'zap' },
                { id: 'exp_gt', label: "Grant Thornton", icon: 'layers' },
                { id: 'exp_wed', label: "Wednesday Solutions", icon: 'settings' },
                { id: 'exp_soul', label: "SoulpageIT", icon: 'users' },
                { id: 'exp_gov', label: "Govt of Assam", icon: 'flag' },
                { id: 'main', label: "← Back to Main Menu", icon: 'arrow-left' }
            ]
        },
        manashos: {
            label: "ManashOS",
            options: [
                { id: 'os_overview', label: "What is ManashOS?", icon: 'info' },
                { id: 'os_games', label: "11 Interactive Games", icon: 'play' },
                { id: 'os_experiments', label: "6 AI Experiments", icon: 'flask-conical' },
                { id: 'os_journey', label: "Narrative Journey", icon: 'trending-up' },
                { id: 'main', label: "← Back to Main Menu", icon: 'arrow-left' }
            ]
        },
        projects: {
            label: "Projects",
            options: [
                { id: 'proj_paath', label: "Paath Sohayok", icon: 'file-text' },
                { id: 'proj_airdraw', label: "AirDraw", icon: 'edit-3' },
                { id: 'proj_memory', label: "Memory Search", icon: 'search' },
                { id: 'proj_smart', label: "SmartComm", icon: 'message-circle' },
                { id: 'proj_off', label: "OFFSTUMP", icon: 'globe' },
                { id: 'main', label: "← Back to Main Menu", icon: 'arrow-left' }
            ]
        }
    };

    const CONTENT_ANSWERS = {
        profile: "Manashjyoti Barman is a Product Delivery Manager & Consultant with 6+ years of experience in digital transformation, Agile execution, and large-scale government consulting. He specializes in translating complex policy into scalable technical systems.",
        exp_conve: "Currently (since Jan 2026), he is the Product Delivery Manager at ConveGenius, leading the Assam State Vidya Samiksha Kendra (VSK) operation and delivery.",
        exp_gt: "At Grant Thornton (2024-2025), he served as a Project Management Consultant, directing digital transformation initiatives and advising on state-level IT modernization policies.",
        exp_wed: "At Wednesday Solutions (2.0 years), he was a Technical Project Manager leading end-to-end Agile product delivery, facilitating Scrum ceremonies, and owning product backlogs using Jira.",
        exp_soul: "At SoulpageIT (1.1 years), he was an Associate Business Analyst managing Scrum execution, gathering requirements (BRDs/SRS), and designing wireframes in Balsamiq.",
        exp_gov: "With the Govt of Assam (1.8 years), he spearheaded the setup of a specialized educational institution for visually impaired students, handling recruitment, operations, and governance.",
        skills: "Core Competencies:\n• Product Discovery & Scale (Discovery → MVP → Scale)\n• Agile Delivery (Scrum, Velocity, Sprint Planning)\n• Strategy (SWOT, Process Optimization, KPI Tracking)\n• Governance (Stakeholder Management, Risk Resolution)\n• Tools (Jira, Confluence, SQL, Balsamiq)",
        proj_paath: "Paath Sohayok: A GenAI-powered EdTech portal that generates lesson plans, PPTs, and assessments instantly. Built with LLM integration for bilingual education.",
        proj_airdraw: "AirDraw: An interactive virtual painting app using Computer Vision and spatial hand gesture tracking to allow real-time digital creation.",
        proj_memory: "Memory Search: A semantic retrieval system that uses natural language processing (NLP) to discover documents without needing exact keyword matches.",
        proj_smart: "SmartComm: A professional productivity tool that refines unrefined textual thoughts into polished, executive-ready communication.",
        proj_off: "OFFSTUMP: A full digital presence implementation for a premium indoor sports facility, mapping online traffic to physical footfall.",
        os_overview: "ManashOS is a 'Personal Operating System'—a unified dashboard for browsing blogs, managing tasks, taking notes, and exploring interactive experiments. It brings system-level thinking to personal productivity.",
        os_games: "The OS features 11 mini-games including Typing Speed Test, Reaction Time, Pattern Memory, Word Scramble, Speed Decision, Sequence Logic, Quick Math, and Visual Memory.",
        os_experiments: "There are 6 live AI experiments: Web Scraping Agent, AI Agent Instagram Handler, Assam Scheme Finder, Electricity Calculator, CRM Tool, and BMI Calculator.",
        os_journey: "The journey covers his evolution from public sector systems (The Start/Climb) to building AI-driven products (The Shift) and focusing on AI + Product execution (The Horizon).",
        education: "Academic Background:\n• MBA (Marketing & HR), Gauhati University (2020)\n• B.Tech (Computer Science), Gauhati University (2018)",
        contact: "Contact Info:\n• Email: manashjyoti.barman07@gmail.com\n• Phone: +91 8753912572\n• Socials: LinkedIn, GitHub, Instagram (mjb199523)"
    };

    // 3. Storage & Auto-Clear Logic (1 Hour)
    const STORAGE_KEY = 'manashos_chat_session';
    const SESSION_TIMEOUT = 3600000; // 1 hour

    function getSession() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return null;
        const session = JSON.parse(saved);
        if (Date.now() - session.timestamp > SESSION_TIMEOUT) {
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }
        return session;
    }

    function saveSession(history) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            history: history,
            timestamp: Date.now()
        }));
    }

    // 4. UI Injection
    const chatbotHTML = `
        <div id="chatbot-launcher" title="Ask ManashOS">
            <i data-feather="message-square"></i>
        </div>
        <div id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <h3>Ask ManashOS</h3>
                    <p>Selection Assistant</p>
                </div>
                <div class="chatbot-header-actions">
                    <button class="chatbot-action-btn" id="chatbot-clear" title="Clear Conversation">
                        <i data-feather="trash-2"></i>
                    </button>
                    <button class="chatbot-action-btn" id="chatbot-close">
                        <i data-feather="x"></i>
                    </button>
                </div>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <!-- Messages populated by JS -->
            </div>
            <div class="chatbot-menu-container">
                <span class="menu-label" id="menu-label">Select a topic</span>
                <div class="chatbot-menu-grid" id="chatbot-menu-grid">
                    <!-- Options populated by JS -->
                </div>
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = chatbotHTML;
    document.body.appendChild(div);

    // Elements
    const launcher = document.getElementById('chatbot-launcher');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('chatbot-close');
    const clearBtn = document.getElementById('chatbot-clear');
    const messagesContainer = document.getElementById('chatbot-messages');
    const menuGrid = document.getElementById('chatbot-menu-grid');
    const menuLabel = document.getElementById('menu-label');

    let history = [];

    // 5. App Logic
    function init() {
        const session = getSession();
        if (session) {
            history = session.history;
            history.forEach(msg => addMessageUI(msg.text, msg.role, false));
        } else {
            addMessageUI("Hi! I'm your ManashOS Assistant. Please select a topic below to learn more about my profile and projects.", 'bot');
        }
        renderMenu('main');
        if (window.feather) feather.replace();
    }

    function renderMenu(menuId) {
        const menu = MENU_DATA[menuId] || MENU_DATA.main;
        menuLabel.textContent = menu.label;
        menuGrid.innerHTML = '';
        
        menu.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'menu-option';
            btn.innerHTML = `<i data-feather="${opt.icon}"></i> ${opt.label}`;
            btn.onclick = () => handleSelection(opt.id, opt.label);
            menuGrid.appendChild(btn);
        });
        
        if (window.feather) feather.replace();
    }

    function handleSelection(id, label) {
        // 1. Show user choice
        addMessageUI(label, 'user');
        
        // 2. Handle Logic
        if (MENU_DATA[id]) {
            // Submenu navigation
            const typingId = addTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator(typingId);
                addMessageUI(`Sure, what specifically about ${label} would you like to know?`, 'bot');
                renderMenu(id);
            }, 400);
        } else if (id === 'main') {
            // Back to main
            renderMenu('main');
        } else {
            // Answer output
            const answer = CONTENT_ANSWERS[id] || "I don't have detailed information on that topic yet.";
            const typingId = addTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator(typingId);
                addMessageUI(answer, 'bot');
                // Auto-return to main menu after answering, or keep the current sub-menu?
                // Let's stay in the current sub-menu but ensure there is a back button.
            }, 600);
        }
    }

    function addMessageUI(text, role, shouldSave = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message message-${role}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        if (shouldSave) {
            history.push({ text, role });
            saveSession(history);
        }
    }

    function addTypingIndicator() {
        const id = 'typing-' + Date.now();
        const indicator = document.createElement('div');
        indicator.id = id;
        indicator.className = 'chat-message message-bot';
        indicator.innerHTML = `<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>`;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // 6. Listeners
    launcher.onclick = () => windowEl.classList.toggle('active');
    closeBtn.onclick = () => windowEl.classList.remove('active');
    clearBtn.onclick = () => {
        if (confirm('Clear entire conversation?')) {
            localStorage.removeItem(STORAGE_KEY);
            messagesContainer.innerHTML = '';
            history = [];
            addMessageUI("Conversation cleared. How can I help you?", 'bot');
            renderMenu('main');
        }
    };

    // Check for auto-clear on window focus
    window.onfocus = () => {
        if (!getSession()) {
            messagesContainer.innerHTML = '';
            history = [];
            init();
        }
    };

    init();
})();
