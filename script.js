document.addEventListener('DOMContentLoaded', () => {
    const userInput = document.getElementById('userInput');
    const sendBtn = document.getElementById('sendBtn');
    const chatContainer = document.getElementById('chatContainer');
    const welcomeSection = document.getElementById('welcomeSection');
    const toggleSidebarBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');
    const newChatBtn = document.querySelector('.new-chat-btn');

    // URL de votre serveur Ngrok ou Flask local
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

        // Appeler l'API Flask avec support du Streaming
        await callVeyrosAPI(text);
    }

    // --- 3. Ajouter un message dans le conteneur de chat ---
    function appendMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);

        if (sender === 'ai') {
            messageDiv.innerHTML = `<b>Veyros AI :</b> <div class="ai-content">${formaterReponse(text)}</div>`;
        } else {
            messageDiv.textContent = text;
        }

        chatContainer.appendChild(messageDiv);
        scrollToBottom();
        return messageDiv.querySelector('.ai-content') || messageDiv;
    }

    // --- 3.1 Formatage des blocs de code, du gras, des puces et du HTML ---
    function formaterReponse(texte) {
        // 1. Convertir les blocs de code
        let html = texte.replace(/```([a-zA-Z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const escapedCode = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const codeId = 'code_' + Math.random().toString(36).substr(2, 9);
            return `<div class="code-box-wrapper" style="background:#090d16; border:1px solid #334155; border-radius:6px; margin:10px 0; overflow:hidden;">
                <div class="code-header" style="background:#162032; padding:6px 12px; display:flex; justify-content:space-between; align-items:center; font-size:12px; color:#94a3b8;">
                    <span>${lang ? lang.toUpperCase() : 'CODE'}</span>
                    <button class="copy-btn" onclick="copierCode('${codeId}')" style="background:#334155; color:white; border:none; padding:3px 8px; border-radius:4px; font-size:11px; cursor:pointer;">Copier</button>
                </div>
                <pre><code id="${codeId}" style="font-family:'Courier New',Courier,monospace; display:block; padding:12px; overflow-x:auto; color:#38bdf8; font-size:14px; margin:0;">${escapedCode}</code></pre>
            </div>`;
        });

        // 2. Convertir le texte en gras (**texte**)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 3. Convertir les puces (- ou •) en listes HTML propres
        html = html.replace(/^[•\-]\s+(.*)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul style="margin: 5px 0 5px 20px; padding-left: 0;">$1</ul>');
        html = html.replace(/<\/ul>\s*<ul[^>]*>/g, '');

        // 4. Convertir les retours à la ligne par des <br>
        html = html.replace(/\n/g, '<br>');

        return html;
    }

    // --- 4. Appel de l'API Flask (Support JSON + NDJSON Streaming) ---
    async function callVeyrosAPI(promptText) {
        const aiContentDiv = appendMessage('...', 'ai');
        let texteComplet = "";

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: promptText })
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                const errText = await response.
