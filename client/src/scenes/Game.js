import { Scene } from 'phaser';

export class Game extends Scene
{
    trail = [];
    graphics;
    player;
    otherPlayers = [];
    socket;
    constructor ()
    {
        super('Game');
        this.socket = new WebSocket("ws://localhost:8000/ws");

    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x000000);
       

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        // Połączenie z WebSocket

        this.socket.onopen = () => {
            console.log("Połączono z serwerem WebSocket");
        };

        this.socket.onmessage = (event) => {
            const gameState = JSON.parse(event.data);
            switch (gameState.type) {
                case 'active_players':
                    console.log("Liczba aktywnych graczy: " + gameState.active_players.length);
                    this.otherPlayers = gameState.active_players;
                    break;
                case 'player_id':
                    console.log("Twój ID: " + gameState.player_id);
                    this.player.id = gameState.player_id;
                    break;
                case 'movement':
                    console.log(gameState);
                    this.updateOtherPlayer(gameState);
                    break;
            }
            // this.updateOtherPlayers(gameState);
        };

        this.player = this.add.rectangle(400, 300, 5, 5, 0xff0000);
        this.physics.add.existing(this.player);

        this.graphics = this.add.graphics();
        this.graphics.lineStyle(2, 0xff0000, 1);

        //Kod odpowiedzialny za wyswietlanie pozycji gracza
        // this.text = this.add.text(512, 38, "Ładowanie pozycji..", {
        //     fontFamily: 'Arial Black',
        //     fontSize: 38,
        //     color: '#ffffff',
        //     stroke: '#000000',
        //     strokeThickness: 8,
        //     align: 'center'
        // }).setOrigin(0.5);

        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(2, 0xffffff, 1);

        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;

        borderGraphics.strokeRect(0, 0, sceneWidth, sceneHeight);
    }

    update()
    {
        this.handlePlayerControls();
        this.updatePlayerMovement();
        //wyswietlanie pozycji gracza
        // this.updatePositionText();
        this.addTrailPoint();
        this.drawTrail();
        this.checkBoundaries();
        this.checkPlayerCollisionWithOwnTrail();
        this.sendPlayerMovement({ x: this.player.x, y: this.player.y, player_id: this.player.id }); //Jezeli bedzie za czesto utworzyć interval w create
    }

    checkBoundaries() {
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;

        if (this.player.x < 0 || this.player.x > sceneWidth ||
            this.player.y < 0 || this.player.y > sceneHeight) {
            this.trail = []
            this.scene.start('GameOver');
        }
    }

handlePlayerControls() {
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
    let velocityX = Math.cos(this.player.rotation) * 100;
    let velocityY = Math.sin(this.player.rotation) * 100;
    this.player.body.setVelocity(velocityX, velocityY);
}

updateOtherPlayer(data){
    const findPlayer = this.otherPlayers.find(p=> p === data.player_id)
    if(findPlayer){
         this.add.rectangle(data.x, data.y, 5, 5, 0xffa500);
    }else{
        console.log("Nie znalazłem gracza: ", data.player_id);
        console.log("Dodaję gracza: ", data.player_id);
        this.otherPlayers.push(data.player_id);
    }
}



updatePositionText() {
    this.text.text = `${this.player.x.toFixed()} : ${this.player.y.toFixed()}`;
}


addTrailPoint() {
    this.trail.push({ x: this.player.x, y: this.player.y });
}


drawTrail() {
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

drawOtherPlayersTrails() {
    this.otherPlayers.forEach(player => {
        this.graphics.lineStyle(5, 0x00ff00, 1);  // Kolor trailu innych graczy (zielony)
        for (let i = 1; i < player.trail.length; i++) {
            this.graphics.lineBetween(player.trail[i-1].x, player.trail[i-1].y, player.trail[i].x, player.trail[i].y);
        }
    });
}


checkPlayerCollisionWithOwnTrail() {
    for (let i = 0; i < this.trail.length - 100; i++) { // Pomijamy 100 pierwszych punktów żeby gracz nie umeirał od razu
        let trailPoint = this.trail[i];
        let distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, trailPoint.x, trailPoint.y);

        if (distance < 5) {
            this.scene.start('GameOver');
            this.trail = [];
        }
    }
}

}