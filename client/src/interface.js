const username = localStorage.getItem('username');
const socket = new WebSocket('ws://localhost:8000/interface');

if (!username) {
    alert('Nie podano nazwy uzytkownika! Zostaniesz przekierowany do strony logowania.');
    window.location.href = '/login.html';
}

const chatContainer = document.getElementById('chat');

            
const scoreboardList = document.getElementById('scoreboard-list');
const sendButton = document.getElementById('send-button');
const chatInput = document.getElementById('chat-input');
const chatClose = document.getElementById('chat-close');


window.addEventListener('load', () => {
    console.log("Wyslanie zapytania o tablice wynikow");
    socket.send(JSON.stringify({ type: 'scoreboard' }))

})



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

socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    alert('Wystapil blad polaczenia z serwerem. Sprobuj ponownie pozniej.');
}

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const chatMessages = document.getElementById('chat-messages');
    const newMessage = document.createElement('div');
    newMessage.className = 'chat-message';
    if (data.type === 'message') {
        newMessage.textContent = `${data.username}: ${data.message}`;
    } else if (data.type === 'system') {
        newMessage.textContent = data.message;
        newMessage.classList.add('system-message');
    } else if (data.type==='scoreboard'){

            scoreboardList.innerHTML = '';
            Object.entries(data.scores).sort((a, b) => b[1] - a[1]).forEach(([key, value]) => {
                const scoreItem = document.createElement('li');
                scoreItem.textContent = `${key}: ${value}`;
                scoreItem.className = 'scoreboard-item';
                scoreboardList.appendChild(scoreItem);
            });
            return;
    }
    chatMessages.appendChild(newMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

chatClose.addEventListener('click', () => {
    const chatContainer = document.getElementById('chat');
    chatContainer.classList.toggle('chat-closed');
});

console.log("Poprawnie wczytano interfejs");
console.log("Twoja nazwa uzytkownika: " + username);