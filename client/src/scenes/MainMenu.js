import { Scene } from 'phaser';

export class MainMenu extends Scene {
    constructor() {
        super('MainMenu');
    }

    create() {
        // Tło jednolite
        this.cameras.main.setBackgroundColor(0x000022);

        // Efekt cząsteczek – podobnie jak w Twoim przykładzie Win
        this.add.particles(0, 0, 'spark', {
            x: { min: 0, max: 1024 },
            y: 0,
            lifespan: 2000,
            speedY: { min: 100, max: 300 },
            scale: { start: 0.3, end: 0 },
            quantity: 2,
            blendMode: 'ADD'
        });

        // Pulsujący tekst
        const startText = this.add.text(512, 384, 'Kliknij aby rozpocząć 👉🖱️', {
            fontFamily: 'Poppins, Arial Black',
            fontSize: 42,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: startText,
            scale: { from: 1, to: 1.1 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Po kliknięciu przejdź do gry
        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });
    }
}
