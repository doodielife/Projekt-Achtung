import { Scene } from 'phaser';

export class Win extends Scene
{
    constructor ()
    {
        super('Win');
    }

    create ()
    {
        this.cameras.main.setBackgroundColor(0x000000);

      
        this.add.text(512, 384, 'Wygrana!!! \n Kliknij aby rozpocząć ponownie', {
            fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
            stroke: '#000000', strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {

            this.scene.start('MainMenu');

        });
    }
}
