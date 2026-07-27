document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const welcomeSection = document.getElementById('welcomeSection');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const newChatBtn = document.querySelector('.new-chat-btn');

    // URL de ton serveur Flask local (Remplace 192.168.1.84 par ta propre IP locale si besoin)
    const API_URL = 'https://unsupercilious-carma-unsymbolized.ngrok-free.dev/';

    // --- 1. Gestion de la zone de texte et du bouton d'envoi ---
    userInput.addEventListener('input', () => {
        if (userInput.value.trim() !== "") {
            sendBtn.removeAttribute('disabled');
        } else {
            sendBtn.setAttribute('disabled', 'true');
        }

        userInput.style.height = 'auto';
        userInput.style.height = (userInput.scrollHeight) + 'px';
    });

    // --- 2. Fonction principale d'envoi de message ---
    async function sendMessage() {
        const text = userInput.value.trim();
        if (text === "") return;

        if (welcomeSection && welcomeSection.style.display !== 'none') {
            welcomeSection.style.display = 'none';
        }

        // Afficher le message de l'utilisateur
        appendMessage(text, 'user');

        userInput.value = "";
        userInput.style.height = 'auto';
        sendBtn.setAttribute('disabled', 'true');

        // Appeler l'API Flask
        await callVeyrosAPI(text);
    }

    // --- 3. Ajouter un message dans le conteneur de chat ---
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (sender === 'ai') {
            messageDiv.innerHTML = `<b>Veyros AI :</b> ${text}`;
        } else {
            messageDiv.textContent = text;
        }

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
    }

    // --- 4. Appel de l'API Flask locale ---
    async function callVeyrosAPI(promptText) {
        // Afficher un indicateur de chargement
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'ai');
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `<b>Veyros AI :</b> <i>Réflexion en cours...</i>`;
        chatContainer.appendChild(typingDiv);
        scrollToBottom();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                // On envoie "prompt" car Flask lit data.get("prompt")
                body: JSON.stringify({ prompt: promptText })
            });

            // Supprimer l'indicateur de chargement
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();

            if (!response.ok) {
                throw new Error(`Erreur HTTP : ${response.status}`);
            }

            const data = await response.json();
            
            // Récupérer le texte de réponse renvoyé par Flask
            const aiReply = data.response || data.message || "Réponse reçue de l'API.";
            
            appendMessage(aiReply, 'ai');

        } catch (error) {
            // Nettoyer l'indicateur s'il est toujours présent
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) typingIndicator.remove();
            
            appendMessage(`Erreur de connexion avec l'API : ${error.message}. Vérifie que ton serveur Flask (s.py) est bien actif sur le port 5000.`, 'ai');
        }
    }

    // --- 5. Faire défiler le chat vers le bas ---
    function scrollToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    // --- 6. Événements clavier et souris ---
    sendBtn.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // --- 7. Gestion de la barre latérale ---
    if (toggleSidebarBtn && sidebar) {
        toggleSidebarBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    // --- 8. Bouton Nouvelle discussion ---
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            const messages = chatContainer.querySelectorAll('.message');
            messages.forEach(msg => msg.remove());
            
            if (welcomeSection) {
                welcomeSection.style.display = 'flex';
            }
            userInput.value = "";
            userInput.style.height = 'auto';
            sendBtn.setAttribute('disabled', 'true');
        });
    }
});