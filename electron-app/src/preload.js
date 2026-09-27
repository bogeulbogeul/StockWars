const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('stockWarsPresence', {
  state: () => ipcRenderer.invoke('presence:state'),
  join: (channelId) => ipcRenderer.invoke('presence:join', channelId),
  leave: () => ipcRenderer.invoke('presence:leave')
});
