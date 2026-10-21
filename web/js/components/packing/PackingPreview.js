import { PackingGame } from './PackingGame.js?v=first-grab-1';

const game = new PackingGame();
document.getElementById('packing-open').addEventListener('click', () => game.open());
game.open();
