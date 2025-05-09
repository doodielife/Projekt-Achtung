const urlParams = new URLSearchParams(window.location.search);
const username = urlParams.get('username');
const socket = new WebSocket('ws://localhost:8000/chat');

const chatContainer = document.getElementById('chat');

chatContainer.innerHTML = `
            <div class="username" id="username">Wiadomosci</div>
            <div class="chat-messages" id="chat-messages"></div>
            <div class="chat-input-container">
                <input type="text" id="chat-input" placeholder="Napisz wiadomosc" />
                <button class="send-button" id="send-button">Wyslij</button>
            </div>
            `;

const sendButton = document.getElementById('send-button');
const chatInput = document.getElementById('chat-input');
sendButton.addEventListener('click', () => {
    const message = chatInput.value;
    if (message.trim() !== '') {
        const chatMessages = document.getElementById('chat-messages');
        const newMessage = document.createElement('div');
        newMessage.className = 'chat-message';
        newMessage.textContent = `${username}: ${message}`;
        chatMessages.appendChild(newMessage);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;
        socket.send(JSON.stringify({ username: username, message: message, type: 'message' }));
    }
})

socket.onmessage = (event) => {
    const firstParse = JSON.parse(event.data);
    const data = JSON.parse(firstParse);
    console.log(data)
    const chatMessages = document.getElementById('chat-messages');
    const newMessage = document.createElement('div');
    newMessage.className = 'chat-message';
    if (data.type === 'message') {
        newMessage.textContent = `${data.username}: ${data.message}`;
    } else if (data.type === 'system') {
        newMessage.textContent = data.message;
        newMessage.classList.add('system-message');
    }
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

console.log("Poprawnie wczytano chat.js");
console.log("Nazwa uzytkownika: " + username);