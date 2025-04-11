import { Scene } from 'phaser';

export class Game extends Scene
{
    trail = [];
    graphics;
    player;
    otherPlayers = [];
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x000000);
        this.player = this.add.rectangle(400, 300, 5, 5, 0xff0000);
        this.physics.add.existing(this.player);

        this.graphics = this.add.graphics();
        this.graphics.lineStyle(2, 0xff0000, 1);

        this.text = this.add.text(512, 38, "Ładowanie pozycji..", {
            fontFamily: 'Arial Black',
            fontSize: 38,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('GameOver');
        });

        this.cursors = this.input.keyboard.createCursorKeys();

        // Połączenie z WebSocket
        this.socket = new WebSocket("ws://localhost:8000/ws");

        this.socket.onopen = () => {
            console.log("Połączono z serwerem WebSocket");
        };

        this.socket.onmessage = (event) => {
            const gameState = JSON.parse(event.data);
            this.updateOtherPlayers(gameState.players);
        };

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
        this.updatePositionText();
        this.addTrailPoint();
        this.drawTrail();
        this.checkBoundaries();
        this.checkPlayerCollisionWithOwnTrail();
        this.drawOtherPlayersTrails();
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
        sendPlayerMovement({ direction: 'left', x: this.player.x, y: this.player.y });
    }
    if (this.cursors.right.isDown) {
        this.player.body.rotation += 1.5;
        sendPlayerMovement({ direction: 'right', x: this.player.x, y: this.player.y });
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

updateOtherPlayers(players) {
    players.forEach(playerData => {
        // Sprawdź, czy gracz już istnieje
        let player = this.otherPlayers.find(p => p.id === playerData.id);

        if (player) {
            // Zaktualizuj pozycję gracza
            player.setPosition(playerData.x, playerData.y);

            // Zaktualizuj jego trail
            player.trail.push({ x: playerData.x, y: playerData.y });

        } else {
            // Jeśli gracza nie ma, dodaj go do gry
            player = this.add.rectangle(playerData.x, playerData.y, 5, 5, 0x00ff00);
            player.id = playerData.id;
            player.trail = [{ x: playerData.x, y: playerData.y }];  // Pierwszy punkt traila
            this.otherPlayers.push(player);
        }
    });
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