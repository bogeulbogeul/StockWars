import { setPlayerCharacterStyle } from './components/CharacterSprite.js';
import { OnlineSocialSync } from './app/OnlineSocialSync.js';
import { installItemGameplay } from './app/ItemGameplay.js';
import { marketEngine } from './engine/marketEngine.js';
import { PlayerSocial } from './components/PlayerSocial.js';
import './app/GameViewport.js';
import { worldNavigation } from './app/WorldNavigation.js';
import { applicationActions } from './app/ApplicationActions.js';
import { initInterface } from './app/initInterface.js';
import { initWorld } from './app/initWorld.js';
import { initTutorial } from './app/initTutorial.js';

class StockWarsApplication {
    constructor() {
        this.appContainer = document.getElementById('app') || document.body;
        this.userProfile = null;
        this.initComponents();
        this.playerSocial = new PlayerSocial(this);
        installItemGameplay(this, marketEngine);
        setPlayerCharacterStyle(this.userProfile?.styleId);
        this.bindEngine();
        this.onlineSocialSync=new OnlineSocialSync(this);
        if (!document.body.classList.contains('ui-paused')) void this.enterGame();
    }

    initComponents() {
        initInterface.call(this);
        initWorld.call(this);
        initTutorial.call(this);
    }
}
Object.assign(StockWarsApplication.prototype, worldNavigation, applicationActions);
document.addEventListener('DOMContentLoaded', () => {
    window.stockWarsApp = new StockWarsApplication();
});
