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
import { showTitleScreen } from './app/TitleScreen.js';
import { resumeDemoEnd } from './app/DemoLifecycle.js';

class StockWarsApplication {
    constructor() {
        this.appContainer = document.getElementById('app') || document.body;
        this.userProfile = null;
        marketEngine.targetRent = 2000;
        this.initComponents();
        this.playerSocial = new PlayerSocial(this);
        installItemGameplay(this, marketEngine);
        setPlayerCharacterStyle(this.userProfile?.styleId);
        this.bindEngine();
        this.onlineSocialSync=new OnlineSocialSync(this);
        showTitleScreen(() => {
            // The current 3D town is already mounted; retain the active session.
        });
    }

    initComponents() {
        initInterface.call(this);
        initWorld.call(this);
        initTutorial.call(this);
    }
}
Object.assign(StockWarsApplication.prototype, worldNavigation, applicationActions);
document.addEventListener('DOMContentLoaded', async () => {
    if (await resumeDemoEnd()) return;
    window.stockWarsApp = new StockWarsApplication();
});
