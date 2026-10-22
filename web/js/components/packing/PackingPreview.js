import { PackingGame } from './PackingGame.js?v=whole-loaf-20261022';

const game = new PackingGame();
document.getElementById('packing-open').addEventListener('click', () => game.open());
game.open();
