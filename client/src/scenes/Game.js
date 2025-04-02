import { Scene } from 'phaser';

export class Game extends Scene
{
    trail = [];
    graphics;

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
        this.checkBoundaries()
    }

    checkBoundaries() {
        const sceneWidth = this.cameras.main.width;
        const sceneHeight = this.cameras.main.height;
    
        if (this.player.x < 0 || this.player.x > sceneWidth || 
            this.player.y < 0 || this.player.y > sceneHeight) {
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


updatePlayerMovement() {
    let velocityX = Math.cos(this.player.rotation) * 100;
    let velocityY = Math.sin(this.player.rotation) * 100;
    this.player.body.setVelocity(velocityX, velocityY);
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

}