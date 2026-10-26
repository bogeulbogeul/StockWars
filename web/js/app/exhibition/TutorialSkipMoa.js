import { leaveBankAfterMoa } from './BankExit.js';
import { sendMoaToPlazaBench } from './MoaPlazaRest.js';
import { startMoaReturn } from './MoaReturn.js';

// Completion flags alone do not transfer the indoor/outdoor Moa actors.
export async function prepareMoaAfterSkip(app, range) {
    const scenes = app.scenes, town = scenes.townModelScene;
    if (range.id === 'support' && app.state.flags.moaReturn) {
        void startMoaReturn(scenes).catch(error => console.error('Skipped Moa return:', error));
    }
    if (range.id === 'arrival') await town.sleepingAnna.setAwake(true, { immediate: true });
    if (range.id === 'bank' && scenes.place === 'bank') {
        await leaveBankAfterMoa(scenes);
    }
    if (app.state.flags.phoneReady && ['bank', 'packing', 'stock'].includes(range.id)) {
        const moa = town.sleepingAnna;
        moa.root.visible = true;
        if (!scenes.moaRestingAtPlaza) {
            // A resolved or failed old promise must not prevent a new trip.
            if (!moa.root.userData.tourWalking) scenes.moaBenchJourney = null;
            scenes.moaBenchJourney ||= sendMoaToPlazaBench(scenes).catch(error => {
                scenes.moaBenchJourney = null; console.error('Skipped tutorial Moa journey:', error);
            });
        }
    }
    if (app.plan[app.state.cursor]?.place === 'information') {
        const room = await scenes.prepareRoom('information');
        await room.room.userData.seatMoa();
        room.room.userData.moa.root.visible = true;
    }
}
