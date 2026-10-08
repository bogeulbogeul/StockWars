const {app,BrowserWindow}=require('electron');
const path=require('node:path');
app.setPath('userData',require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'stockwars-history-test-')));
app.whenReady().then(async()=>{
    const win=new BrowserWindow({show:false,width:1280,height:800,webPreferences:{offscreen:true,backgroundThrottling:false,contextIsolation:true,nodeIntegration:false,sandbox:true}});
    await win.loadFile(path.resolve(__dirname,'../../web/tests/tradeHistory.browser.html'));
    const result=await win.webContents.executeJavaScript("document.querySelector('#results').textContent");
    console.log(result || 'FAIL no test results');
    app.exit(!result || result.includes('FAIL') ? 1 : 0);
}).catch(error=>{console.error(error);app.exit(1);});
