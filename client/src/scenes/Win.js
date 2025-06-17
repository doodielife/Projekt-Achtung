import { Scene } from 'phaser';

export class Win extends Scene {
    constructor() {
        super('Win');
    }

    create() {
        // Czarne tło
        this.cameras.main.setBackgroundColor(0x000000);

        // Dodanie efektu cząsteczek konfetti

        this.add.particles(0, 0, 'spark', {
    x: { min: 0, max: 1024 },
    y: 0,
    lifespan: 2000,
    speedY: { min: 200, max: 400 },
    scale: { start: 0.5, end: 0 },
    quantity: 2,
    blendMode: 'ADD'
});


        // Błyszczący, pulsujący tekst zwycięstwa
        const winText = this.add.text(512, 300, '🎉 WYGRANA!!! 🎉', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffcc00',
            stroke: '#ffffff',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: winText,
            scale: { from: 1, to: 1.1 },
            duration: 600,
            yoyo: true,
            repeat: -1
        });

        // Tekst do kliknięcia z emotkami
        const clickText = this.add.text(512, 420, 'Kliknij, aby zagrać ponownie 👉🖱️', {
            fontFamily: 'Arial',
            fontSize: 28,
            color: '#ffffff',
            stroke: '#ff00ff',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);

        // Interakcja
        this.input.once('pointerdown', () => {
            this.scene.start('Game');
        });

        // Dźwięk zwycięstwa (opcjonalnie)
        // this.sound.play('win-sound'); // Załaduj wcześniej dźwięk o nazwie 'win-sound'
    }
}
