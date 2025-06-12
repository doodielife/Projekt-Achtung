const form = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

form.addEventListener('submit', (event) => {
    event.preventDefault();
    const username = document.getElementById('username').value;
    if (username.trim() === '') {
        errorMessage.textContent = 'Proszę wprowadzić nazwę gracza.';
        return;
    }
    sessionStorage.setItem('username', username);
    window.location.href = './game.html';
});


console.log("Załadowano skrypt logowania");