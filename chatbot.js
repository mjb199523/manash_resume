(function() {
    // Check if we are on the owner access page
    if (window.location.pathname.includes('owner-access') || window.location.pathname.includes('admin')) {
        return;
    }

    // Portfolio Context Data for Keyword Matching
    const KNOWLEDGE_BASE = [
        {
            keywords: ['education', 'study', 'college', 'university', 'mba', 'btech', 'degree'],
            answer: "Manashjyoti has an MBA in Marketing and HR (2020) and a B.Tech in Computer Science and Engineering (2018), both from Gauhati University."
        },
        {
            keywords: ['experience', 'work', 'job', 'career', 'history', 'company', 'convegenius', 'gt', 'grant thornton', 'wednesday', 'soulpage'],
            answer: "He has 6+ years of experience. Currently, he's a Product Delivery Manager at ConveGenius. Previously, he worked at Grant Thornton (Consultant), ibentos (Delivery Manager), Wednesday Solutions (Technical PM), and SoulpageIT (Business Analyst)."
        },
        {
            keywords: ['projects', 'built', 'portfolio', 'paath sohayok', 'airdraw', 'memory search', 'smartcomm', 'offstump'],
            answer: "His key projects include: 1. Paath Sohayok (GenAI EdTech), 2. AirDraw (Computer Vision Painting), 3. Memory Search (Semantic Retrieval), 4. SmartComm (AI Communication), and 5. OFFSTUMP (Sports Platform)."
        },
        {
            keywords: ['manashos', 'os', 'system', 'platform', 'games', 'experiments'],
            answer: "ManashOS is his personal operating system featuring 11 games (Typing, Memory, Logic) and 6 AI experiments (Web Scraping, Instagram Handler, Scheme Finder, etc.). It's where he combines product execution with AI."
        },
        {
            keywords: ['skills', 'capabilities', 'tech', 'tools', 'agile', 'scrum', 'pmp'],
            answer: "His core competencies include End-to-end Product Lifecycle Management, Agile/Scrum delivery, Requirements Engineering (PRD/SRS), Stakeholder Governance, and Digital Transformation Strategy."
        },
        {
            keywords: ['contact', 'email', 'phone', 'linkedin', 'github', 'reach out'],
            answer: "You can reach him at manashjyoti.barman07@gmail.com or call +91 8753912572. He's also active on LinkedIn and GitHub (mjb199523)."
        },
        {
            keywords: ['who are you', 'what is this', 'about me', 'manashjyoti'],
            answer: "I'm the portfolio assistant for Manashjyoti Barman, a Product Delivery Manager specializing in digital transformation and Agile execution."
        }
    ];

    const DEFAULT_FALLBACK = "I don't have the answer to your query.";

    // Inject HTML
    const chatbotHTML = `
        <div id="chatbot-launcher" title="Ask About Me">
            <i data-feather="message-square"></i>
        </div>
        <div id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <h3>Ask ManashOS</h3>
                    <p>Context Assistant</p>
                </div>
                <button class="chatbot-close" id="chatbot-close">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chat-message message-bot">
                    Hi! I'm your context-based assistant. Ask me about Manashjyoti's education, experience, or projects.
                </div>
                <div class="chatbot-suggestions">
                    <div class="suggestion-pill" data-query="Tell me about your education">Education</div>
                    <div class="suggestion-pill" data-query="What is your work experience?">Work</div>
                    <div class="suggestion-pill" data-query="What projects have you built?">Projects</div>
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Ask about my profile..." autocomplete="off">
                <button class="chatbot-send" id="chatbot-send">
                    <i data-feather="send"></i>
                </button>
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
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messagesContainer = document.getElementById('chatbot-messages');

    // Initialize Feather
    if (window.feather) { feather.replace(); }

    launcher.onclick = () => {
        windowEl.classList.toggle('active');
        if (windowEl.classList.contains('active')) input.focus();
    };

    closeBtn.onclick = () => windowEl.classList.remove('active');

    // Suggestions
    document.querySelectorAll('.suggestion-pill').forEach(pill => {
        pill.onclick = () => handleSend(pill.getAttribute('data-query'));
    });

    // Matching Engine
    function findBestAnswer(query) {
        const lowerQuery = query.toLowerCase();
        let bestMatch = null;
        let maxKeywords = 0;

        for (const item of KNOWLEDGE_BASE) {
            let matches = 0;
            for (const kw of item.keywords) {
                if (lowerQuery.includes(kw)) matches++;
            }
            if (matches > maxKeywords) {
                maxKeywords = matches;
                bestMatch = item.answer;
            }
        }
        return bestMatch || DEFAULT_FALLBACK;
    }

    async function handleSend(text) {
        if (!text) return;
        addMessage(text, 'user');
        input.value = '';
        
        // Simulate thinking for context assistant
        const typingId = addTypingIndicator();
        setTimeout(() => {
            removeTypingIndicator(typingId);
            const answer = findBestAnswer(text);
            addMessage(answer, 'bot');
        }, 600);
    }

    function addMessage(text, role) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-message message-${role}`;
        msgDiv.textContent = text;
        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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

    sendBtn.onclick = () => handleSend(input.value);
    input.onkeydown = (e) => { if (e.key === 'Enter') handleSend(input.value); };
})();
