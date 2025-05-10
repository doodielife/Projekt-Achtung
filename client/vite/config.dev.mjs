import { defineConfig } from 'vite';
import { resolve } from 'path';
export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            input:{
        game: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
            },
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 5173
    }
});
