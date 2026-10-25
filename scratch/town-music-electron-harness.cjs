// Isolated local-file smoke test; never launches production save-reset/presence code.
const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.disableHardwareAcceleration();
app.whenReady().then(()=>{
 const win=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false,partition:'town-music-check'}});
 win.webContents.on('render-process-gone',(_event,details)=>console.error('Renderer exit',JSON.stringify(details)));
 if (process.env.STOCKWARS_AUDIO_BASELINE === '1') {
  win.loadFile(path.resolve('output/town-time-music-game-v1/electron-audio-baseline.html'));
 } else {
  win.loadFile(path.resolve('electron-app/dist/win-unpacked/resources/web/index.html'),{query:process.env.STOCKWARS_TITLE_CHECK==='1'?{}:{demo:'first-day',skipOpening:'1'}});
 }
});
app.on('window-all-closed',()=>app.quit());
