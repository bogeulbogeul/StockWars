import { PackingGame } from './PackingGame.js?v=result-exit-only-20261025';

const game = new PackingGame();
document.getElementById('packing-open').addEventListener('click', () => game.open());
game.open();

// Open the intermediate completion card directly for visual review.
if (['result', 'done'].includes(new URLSearchParams(location.search).get('preview'))) {
    game.session.completed = new URLSearchParams(location.search).get('preview') === 'done' ? game.session.orders.length : 1;
    game.session.awaitingNext = true;
    game.render();
    game.focusStart();
}

