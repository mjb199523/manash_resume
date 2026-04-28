(function() {
    // Check if we are on the owner access page
    if (window.location.pathname.includes('owner-access') || window.location.pathname.includes('admin')) {
        return;
    }

    // Inject HTML
    const chatbotHTML = `
        <div id="chatbot-launcher" title="Ask About Me">
            <i data-feather="message-square"></i>
        </div>
        <div id="chatbot-window">
            <div class="chatbot-header">
                <div class="chatbot-header-info">
                    <h3>Ask ManashOS</h3>
                    <p>Portfolio Assistant</p>
                </div>
                <button class="chatbot-close" id="chatbot-close">
                    <i data-feather="x"></i>
                </button>
            </div>
            <div class="chatbot-messages" id="chatbot-messages">
                <div class="chat-message message-bot">
                    Hi! I'm ManashOS Assistant. Ask me anything about Manashjyoti's career, projects, or education.
                </div>
                <div class="chatbot-suggestions">
                    <div class="suggestion-pill" data-query="What is his education?">Education?</div>
                    <div class="suggestion-pill" data-query="What projects has he built?">Projects?</div>
                    <div class="suggestion-pill" data-query="What is ManashOS?">ManashOS?</div>
                    <div class="suggestion-pill" data-query="Current focus?">Focus?</div>
                </div>
            </div>
            <div class="chatbot-input-container">
                <input type="text" class="chatbot-input" id="chatbot-input" placeholder="Type a message..." autocomplete="off">
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

    let isTyping = false;
    let chatHistory = [];

    // Initialize Feather
    if (window.feather) {
        feather.replace();
    }

    // Toggle Window
    launcher.onclick = () => {
        windowEl.classList.toggle('active');
        if (windowEl.classList.contains('active')) {
            input.focus();
        }
    };

    closeBtn.onclick = () => {
        windowEl.classList.remove('active');
    };

    // Suggestions
    document.querySelectorAll('.suggestion-pill').forEach(pill => {
        pill.onclick = () => {
            const query = pill.getAttribute('data-query');
            handleSend(query);
            // Hide suggestions after first use to keep UI clean
            pill.parentElement.style.display = 'none';
        };
    });

    // Handle Send
    async function handleSend(text) {
        if (!text || isTyping) return;
        
        // Add User Message
        addMessage(text, 'user');
        input.value = '';
        
        // Show Typing Indicator
        const typingId = addTypingIndicator();
        isTyping = true;
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: [
                        ...chatHistory,
                        { role: 'user', content: text }
                    ]
                })
            });

            const data = await response.json();
            removeTypingIndicator(typingId);
            
            if (data.reply) {
                addMessage(data.reply, 'bot');
                chatHistory.push({ role: 'user', content: text });
                chatHistory.push({ role: 'assistant', content: data.reply });
                // Keep history manageable
                if (chatHistory.length > 10) chatHistory = chatHistory.slice(-10);
            } else {
                addMessage("I'm having trouble connecting right now. Please try again later.", 'bot');
            }
        } catch (error) {
            console.error('Chat Error:', error);
            removeTypingIndicator(typingId);
            addMessage("I don't have the answer to your query.", 'bot');
        } finally {
            isTyping = false;
        }
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
        indicator.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    // Input Listeners
    sendBtn.onclick = () => handleSend(input.value);
    input.onkeydown = (e) => {
        if (e.key === 'Enter') handleSend(input.value);
    };

})();
