// Chatbot functionality
class MedicalChatbot {
  constructor() {
    this.apiUrl = `${window.API_BASE_URL}/api/chatbot`;
    this.conversationId = null;
    this.isOpen = false;
    this.isListening = false;
    this.isSpeaking = false;
    this.voiceEnabled = true;
    
    // Initialize Web Speech API
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.initSpeechRecognition();
    
    this.init();
  }
  
  initSpeechRecognition() {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      // Support both English and Marathi
      this.recognition.lang = 'en-US'; // Can be changed to 'mr-IN' for Marathi
      
      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chatbot-input');
        input.value = transcript;
        this.stopListening();
        this.sendMessage();
      };
      
      this.recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        this.stopListening();
      };
      
      this.recognition.onend = () => {
        this.stopListening();
      };
    } else {
      console.warn('Speech Recognition not supported in this browser');
      this.voiceEnabled = false;
    }
  }

  init() {
    this.createChatbotUI();
    this.attachEventListeners();
    this.addWelcomeMessage();
  }

  createChatbotUI() {
    // Create chatbot toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'chatbot-toggle';
    toggleBtn.id = 'chatbot-toggle';
    toggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
        <circle cx="8" cy="10" r="1.5"/>
        <circle cx="12" cy="10" r="1.5"/>
        <circle cx="16" cy="10" r="1.5"/>
      </svg>
    `;

    // Create chatbot container
    const container = document.createElement('div');
    container.className = 'chatbot-container';
    container.id = 'chatbot-container';
    container.innerHTML = `
      <div class="chatbot-header">
        <div class="chatbot-header-content">
          <div class="chatbot-avatar">🏥</div>
          <div class="chatbot-title">
            <h3>Medical Assistant</h3>
            <p>Online • Ready to help</p>
          </div>
        </div>
        <button class="chatbot-close" id="chatbot-close">✕</button>
      </div>
      
      <div class="chatbot-messages" id="chatbot-messages">
        <!-- Messages will be added here -->
      </div>
      
      <div class="chatbot-input-area">
        <button class="chatbot-voice-btn" id="chatbot-voice" title="Voice input">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
        <input 
          type="text" 
          class="chatbot-input" 
          id="chatbot-input" 
          placeholder="Type or speak your message..."
          autocomplete="off"
        />
        <button class="chatbot-speaker-btn" id="chatbot-speaker" title="Toggle voice output">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
          </svg>
        </button>
        <button class="chatbot-send-btn" id="chatbot-send">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    `;

    document.body.appendChild(toggleBtn);
    document.body.appendChild(container);
  }

  attachEventListeners() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send');
    const voiceBtn = document.getElementById('chatbot-voice');
    const speakerBtn = document.getElementById('chatbot-speaker');
    const input = document.getElementById('chatbot-input');

    toggleBtn.addEventListener('click', () => this.toggleChat());
    closeBtn.addEventListener('click', () => this.toggleChat());
    sendBtn.addEventListener('click', () => this.sendMessage());
    voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
    speakerBtn.addEventListener('click', () => this.toggleVoiceOutput());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });
  }
  
  toggleVoiceInput() {
    if (!this.recognition) {
      alert('Voice input is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }
  
  startListening() {
    try {
      this.recognition.start();
      this.isListening = true;
      const voiceBtn = document.getElementById('chatbot-voice');
      voiceBtn.classList.add('listening');
      document.getElementById('chatbot-input').placeholder = 'Listening...';
    } catch (error) {
      console.error('Error starting voice recognition:', error);
    }
  }
  
  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      const voiceBtn = document.getElementById('chatbot-voice');
      voiceBtn.classList.remove('listening');
      document.getElementById('chatbot-input').placeholder = 'Type or speak your message...';
    }
  }
  
  toggleVoiceOutput() {
    this.voiceEnabled = !this.voiceEnabled;
    const speakerBtn = document.getElementById('chatbot-speaker');
    
    if (this.voiceEnabled) {
      speakerBtn.classList.remove('muted');
      speakerBtn.title = 'Voice output enabled';
    } else {
      speakerBtn.classList.add('muted');
      speakerBtn.title = 'Voice output disabled';
      this.stopSpeaking();
    }
  }
  
  speak(text) {
    if (!this.voiceEnabled || !this.synthesis) return;
    
    // Stop any ongoing speech
    this.stopSpeaking();
    
    // Clean text for speech (remove markdown and special characters)
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/[#•]/g, '')
      .replace(/\n/g, '. ')
      .replace(/ℹ️|💡|⚠️|❌|✅/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => {
      this.isSpeaking = true;
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
    };
    
    this.synthesis.speak(utterance);
  }
  
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  toggleChat() {
    const container = document.getElementById('chatbot-container');
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      container.classList.add('active');
      document.getElementById('chatbot-input').focus();
    } else {
      container.classList.remove('active');
    }
  }

  addWelcomeMessage() {
    const welcomeMsg = {
      type: 'bot',
      content: `👋 Hello! I'm your Medical Assistant.\n\nI can help you with:\n• Common symptoms and conditions\n• Medication information\n• System features and navigation\n\nHow can I assist you today?`,
      suggestions: [
        'What is fever?',
        'How to use paracetamol?',
        'How do I create a prescription?',
        'Tell me about X-ray feature'
      ]
    };
    this.addMessage(welcomeMsg);
  }

  addMessage(message) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    
    if (message.emergency) {
      messageDiv.classList.add('emergency');
    }

    const avatar = message.type === 'bot' ? '🏥' : '👤';
    
    // Format message content (handle markdown-style formatting)
    let formattedContent = message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    messageDiv.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">${formattedContent}</div>
    `;

    messagesContainer.appendChild(messageDiv);

    // Add suggestions if available
    if (message.suggestions && message.suggestions.length > 0) {
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'message bot';
      suggestionsDiv.innerHTML = `
        <div class="message-avatar"></div>
        <div class="suggestions">
          ${message.suggestions.map(s => 
            `<span class="suggestion-chip" onclick="chatbot.sendSuggestion('${s.replace(/'/g, "\\'")}')">${s}</span>`
          ).join('')}
        </div>
      `;
      messagesContainer.appendChild(suggestionsDiv);
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbot-messages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-avatar">🏥</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  removeTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async sendMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addMessage({
      type: 'user',
      content: message
    });

    // Clear input
    input.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      const response = await fetch(`${this.apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message,
          conversationId: this.conversationId
        })
      });

      const data = await response.json();

      // Remove typing indicator
      this.removeTypingIndicator();

      if (data.success) {
        // Update conversation ID
        if (data.conversationId) {
          this.conversationId = data.conversationId;
        }

        // Add bot response
        this.addMessage({
          type: 'bot',
          content: data.response,
          suggestions: data.suggestions,
          emergency: data.type === 'emergency'
        });
        
        // Handle navigation requests
        if (data.type === 'navigation' && data.action === 'navigate' && data.page) {
          setTimeout(() => {
            this.navigateToPage(data.page);
          }, 1500); // Wait 1.5 seconds before navigating
        }
        
        // Speak the response if voice is enabled
        this.speak(data.response);
      } else {
        this.addMessage({
          type: 'bot',
          content: '❌ Sorry, I encountered an error. Please try again.'
        });
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      this.removeTypingIndicator();
      this.addMessage({
        type: 'bot',
        content: '❌ Unable to connect to the server. Please check your connection and try again.'
      });
    }
  }

  sendSuggestion(suggestion) {
    const input = document.getElementById('chatbot-input');
    input.value = suggestion;
    this.sendMessage();
  }

  navigateToPage(page) {
    // Define page mappings
    const pageMap = {
      'analytics': 'analytics.html',
      'prescription': 'prescription.html',
      'history': 'history.html',
      'xray': 'xray.html',
      'profile': 'profile.html',
      'medicine': 'medicine.html',
      'index': 'index.html'
    };

    const targetPage = pageMap[page];
    if (targetPage) {
      // Add a loading message
      this.addMessage({
        type: 'bot',
        content: `🔄 **Navigating to ${page.charAt(0).toUpperCase() + page.slice(1)}...**\n\nTaking you there now! ✨`
      });

      // Navigate after a short delay
      setTimeout(() => {
        window.location.href = targetPage;
      }, 1000);
    } else {
      this.addMessage({
        type: 'bot',
        content: `❌ **Navigation Error**\n\nSorry, I couldn't find the page "${page}". Please try asking differently or use the navigation menu.`
      });
    }
  }
}

// Initialize chatbot when DOM is loaded
let chatbot;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    chatbot = new MedicalChatbot();
  });
} else {
  chatbot = new MedicalChatbot();
}
