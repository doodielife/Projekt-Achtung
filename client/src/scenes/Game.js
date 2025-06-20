import { Scene } from 'phaser';

export class Game extends Scene
{
    trail = [];                  // Lista punktów śladu gracza
    graphics;                    // Obiekt do rysowania śladów
    player;                      // Obiekt gracza (prostokąt)
    otherPlayers = [];          // Lista ID innych graczy
    socket;                      // Połączenie WebSocket
    otherPlayersTrails = {};
    start = false;
    countdownText; // tekst odliczania
    countdownStarted = false;
    points = 0;
    username = sessionStorage.getItem('username') || 'Gracz'; // Pobranie nazwy gracza z localStorage lub ustawienie domyślnej
    lets_go = false;



    constructor ()
    {
        super('Game');
        this.socket = new WebSocket(`ws://localhost:8000/ws?username=${encodeURIComponent(this.username)}`); // Inicjalizacja WebSocket

    }







    create ()
    {
        this.socket.send(JSON.stringify({ type: 'scoreboard',username: this.username }));

        // Ustawienie koloru tła
        this.cameras.main.setBackgroundColor(0x000000);


        // Obsługa klawiatury – strzałki
        this.cursors = this.input.keyboard.createCursorKeys();

        // Obsługa połączenia WebSocket
        this.socket.onopen = () => {
            console.log("Połączono z serwerem WebSocket");
        };

        // Obsługa wiadomości od serwera WebSocket
        this.socket.onmessage = (event) => {
            const gameState = JSON.parse(event.data);
            switch (gameState.type) {
                case 'active_players':
                    // Otrzymano listę aktywnych graczy
                   // console.log("Liczba aktywnych graczy: " + gameState.active_players.length);
                    this.otherPlayers = gameState.active_players;
                    break;
                case 'player':
                    // Otrzymano unikalne ID gracza
                  //  console.log("Twój ID: " + gameState.player_id);
                    console.log("Napisz coś ")
                    this.player.id = gameState.player_id;
                    console.log("Player id: ", this.player.id)
                    break;
                case 'movement':
                    // Pozycja innego gracza
                   // console.log(gameState);
                   if(this.lets_go === true){
                    this.updateOtherPlayer(gameState);
                    }
                    break;
                case 'countdown':
                    //pokazuje licznik
                    this.graphics.clear();
                    this.countdownText.setVisible(true);
                    this.countdownText.setText(gameState.value)
                    break;
                case 'start_game':
                    //START
                    this.trail = [];
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                    }
                    this.graphics.clear(); // wyczyść rysunki graficzne
                    this.countdownText.setText("START!");
                    this.time.delayedCall(1000, () => {
                        this.countdownText.setVisible(false);
                        this.start = true;
                    });
                    this.lets_go = true;
                    break;
               case 'new_game':
                    this.player.body.setVelocity(0, 0);
                    this.start = false;
                    this.lets_go = false;
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                    }
                    this.graphics.clear();
                    this.scene.restart();
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                      }
                break;
                case 'winner':
                    if(gameState.place === "first"){
                    console.log("Wygrałeś")
                    this.start = false;
                    this.lets_go = false;
                    this.player.body.setVelocity(0, 0);
                    this.trail = [];
                    alert("Wygrałeś!");
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                      }
                    this.scene.start('Win');

                    }
                    else if(gameState.place === "second"){
                    console.log("Nie wygrałeś")
                    this.start = false;
                    this.lets_go = false;
                    this.player.body.setVelocity(0, 0);
                    this.trail = [];
                    alert("Zająłeś drugie miejsce!");
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                      }
                    this.scene.start('MainMenu');
                    }
                    else{
                    this.start = false;
                    this.lets_go = false;
                    this.player.body.setVelocity(0, 0);
                    this.trail = [];
                    alert("Zająłeś trzecie miejsce!");
                    for (let playerId in this.otherPlayersTrails) {
                        this.otherPlayersTrails[playerId] = [];
                      }
                    this.scene.start('MainMenu');
                    }
                    break;
            }
        };



        // Tworzenie obiektu gracza
        const min = 100;
        const max = 700;
        const losowaLiczbaX = Math.floor(Math.random() * (max - min + 1)) + min;
        const losowaLiczbaY = Math.floor(Math.random() * (max - min + 1)) + min;



        this.player = this.add.rectangle(losowaLiczbaX, losowaLiczbaY, 5, 5, 0xff0000);
        this.physics.add.existing(this.player); // Dodanie fizyki
        this.player.rotation = Phaser.Math.FloatBetween(0, Math.PI * 2);

        // Obiekt graficzny do rysowania śladów
        this.graphics = this.add.graphics();
        this.graphics.lineStyle(2, 0xff0000, 1);
        // Rysowanie ramki gry
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(2, 0xffffff, 1);
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;
        borderGraphics.strokeRect(0, 0, sceneWidth, sceneHeight);


    this.countdownText = this.add.text(500, 400, '', {
    fontFamily: '"Orbitron", sans-serif',
    fontSize: '128px',
    color: '#ffffff',
    stroke: '#00ffff',
    strokeThickness: 6,
    shadow: {
        offsetX: 4,
        offsetY: 4,
        color: '#000000',
        blur: 5,
        fill: true
    },
    align: 'center'
}).setOrigin(0.5);

    this.socket.send(JSON.stringify({
        type: 'player_ready',
     //   player_id: this.player.id
        }));

}



    update()
    {
        // Główna pętla gry – wykonuje się co klatkę
        this.socket.send(JSON.stringify({ type: 'scoreboard',username: this.username }));

        if(this.start){

        this.handlePlayerControls();                     // Obsługa ruchu gracza (obrót)
        this.updatePlayerMovement();                     // Aktualizacja prędkości gracza
        this.addTrailPoint();                            // Dodanie punktu śladu
        this.drawTrail();                                // Rysowanie śladu
        this.checkBoundaries();                          // Sprawdzenie czy gracz wyszedł poza ekran
        this.checkPlayerCollisionWithOwnTrail();         // Sprawdzenie kolizji ze swoim śladem
        this.checkPlayerCollisionWithOtherTrails();

        this.sendPlayerMovement({                        // Wysłanie pozycji do serwera
            x: this.player.x,
            y: this.player.y,
            player_id: this.player.id
        });

        }
    }


    reset(){
        this.start = false;
        this.trail = [];
        this.otherPlayersTrails = {};
        const min = 100;
        const max = 700;
        const losowaLiczbaX = Math.floor(Math.random() * (max - min + 1)) + min;
        const losowaLiczbaY = Math.floor(Math.random() * (max - min + 1)) + min;

        this.player = this.add.rectangle(losowaLiczbaX, losowaLiczbaY, 5, 5, 0xff0000);
    }

    checkBoundaries() {
        // Jeżeli gracz wyjdzie poza ekran, restart gry
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;

        if (this.player.x < 0 || this.player.x > sceneWidth ||
            this.player.y < 0 || this.player.y > sceneHeight) {

            this.player.body.setVelocity(0, 0);
            this.start = false;
            console.log("Wysyłam wiadomość LOSS do serwera...");
            this.socket.send(JSON.stringify({ type: 'loss', }));
            console.log("Wiadomość LOSS została wysłana.");
            this.trail = [];
        }
    }

    handlePlayerControls() {
        // Obracanie gracza strzałkami
        if (this.cursors.left.isDown) {
            this.player.body.rotation -= 1.5;
        }
        if (this.cursors.right.isDown) {
            this.player.body.rotation += 1.5;
        }
    }



    sendPlayerMovement(movement) {
         this.socket.send(JSON.stringify(movement));
    }





    updatePlayerMovement() {
        // Obliczanie kierunku i prędkości ruchu gracza
        let velocityX = Math.cos(this.player.rotation) * 100;
        let velocityY = Math.sin(this.player.rotation) * 100;
        this.player.body.setVelocity(velocityX, velocityY);
    }




    addTrailPoint() {
        // Dodaj aktualną pozycję gracza do śladu
        this.trail.push({ x: this.player.x, y: this.player.y });
    }





    drawTrail() {
        // Rysuj linię między ostatnimi dwoma punktami śladu
        this.graphics.lineStyle(5, 0xff0000, 1);
        if (this.trail.length > 1) {
            const lastIndex = this.trail.length - 1;
            this.graphics.lineBetween(
                this.trail[lastIndex - 1].x,
                this.trail[lastIndex - 1].y,
                this.trail[lastIndex].x,
                this.trail[lastIndex].y
            );
        }
    }


      checkPlayerCollisionWithOwnTrail() {
        // Sprawdzenie czy gracz nie dotknął własnego śladu
        for (let i = 0; i < this.trail.length - 100; i++) {
            let trailPoint = this.trail[i];
            let distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, trailPoint.x, trailPoint.y
            );

            if (distance < 5) {

                this.player.body.setVelocity(0, 0);
                this.start = false;
                console.log("Wysyłam wiadomość LOSS do serwera...");
                this.socket.send(JSON.stringify({ type: 'loss', }));
                console.log("Wiadomość LOSS została wysłana.");
                this.trail = [];

            }
        }
    }




    updatePositionText() {
        // Aktualizacja tekstu pozycji gracza
        this.text.text = `${this.player.x.toFixed()} : ${this.player.y.toFixed()}`;
    }




    updateOtherPlayer(data) {
    // Jeśli gracz nie istnieje, dodaj go
    if (!this.otherPlayers.includes(data.player_id)) {
        this.otherPlayers.push(data.player_id);
        this.otherPlayersTrails[data.player_id] = [];
    }

    // Jeśli gracz istnieje, upewnij się, że jego trail istnieje
    if (!this.otherPlayersTrails[data.player_id]) {
        this.otherPlayersTrails[data.player_id] = [];
    }

    // Rysuj gracza i dodawaj jego ślad tylko jeśli gra trwa
        this.add.rectangle(data.x, data.y, 5, 5, 0xffa500);
        this.otherPlayersTrails[data.player_id].push({ x: data.x, y: data.y });
}

    checkPlayerCollisionWithOtherTrails(){
        for (const playerId in this.otherPlayersTrails) {
        const trail = this.otherPlayersTrails[playerId];
        for (let i = 0; i < trail.length; i++) {
            let point = trail[i];
            let distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y, point.x, point.y
            );

            if (distance < 5) {

                this.player.body.setVelocity(0, 0);
                this.start = false;
                console.log("Wysyłam wiadomość LOSS do serwera...");
                this.socket.send(JSON.stringify({ type: 'loss', }));
                console.log("Wiadomość LOSS została wysłana.");
                this.trail = [];


              //  this.scene.start('GameOver');
                return;
            }
        }
    }
    }


}