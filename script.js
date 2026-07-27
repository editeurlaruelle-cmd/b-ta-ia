document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const welcomeSection = document.getElementById('welcomeSection');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const newChatBtn = document.querySelector('.new-chat-btn');
    
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const filePreviewContainer = document.getElementById('filePreviewContainer');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const removeFileBtn = document.getElementById('removeFileBtn');
    
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const API_URL = 'https://unsupercilious-carma-unsymbolized.ngrok-free.dev/';

    let selectedFile = null;

    userInput.addEventListener('input', () => {
        toggleSendButton();
        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });

    function toggleSendButton() {
        if (userInput.value.trim() !== "" || selectedFile !== null) {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }
    }

    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileNameDisplay.textContent = selectedFile.name;
            filePreviewContainer.style.display = 'flex';
            toggleSendButton();
        }
    });

    removeFileBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        toggleSendButton();
    });

    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    async function sendMessage() {
        const text = userInput.value.trim();
        if (text === "" && !selectedFile) return;

        if (welcomeSection && welcomeSection.style.display !== 'none') {
            welcomeSection.style.display = 'none';
        }

        let displayContent = text;
        if (selectedFile) {
            displayContent += `<br><small style="color: var(--text-secondary);">📁 Fichier joint : ${selectedFile.name}</small>`;
        }
        appendMessage(displayContent, 'user', true);

        const currentFile = selectedFile;
        userInput.value = "";
        userInput.style.height = 'auto';
        selectedFile = null;
        fileInput.value = '';
        filePreviewContainer.style.display = 'none';
        sendBtn.setAttribute('disabled', 'true');

        await callVeyrosAPI(text, currentFile);
    }

    function appendMessage(text, sender, isHtml = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (sender === 'ai') {
            messageDiv.innerHTML = `<b>Veyros AI :</b> ${text}`;
        } else {
            if (isHtml) {
                messageDiv.innerHTML = text;
            } else {
                messageDiv.textContent = text;
            }
        }

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    async function callVeyrosAPI(promptText, file) {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'ai');
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `<b>Veyros AI :</b> <span class="typing-dots"><i>Réflexion en cours...</i></span>`;
        chatContainer.appendChild(typingDiv);
        scrollToBottom();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: promptText,
                    fileName: file ? file.name : null
                })
            });

            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();

            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const data = await response.json();
            const aiReply = data.response || data.message || "Réponse reçue de l'API.";
            
            appendMessage(aiReply, 'ai');

        } catch (error) {
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();
            
            appendMessage(`Erreur de connexion avec l'API : ${error.message}.`, 'ai');
        }
    }

    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            const messages = chatContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            
            if (welcomeSection) {
                welcomeSection.style.display = 'flex';
            }
            userInput.value = "";
            userInput.style.height = 'auto';
            selectedFile = null;
            fileInput.value = '';
            filePreviewContainer.style.display = 'none';
            sendBtn.setAttribute('disabled', 'true');
        });
    }
});
