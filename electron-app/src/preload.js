const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('stockWarsPresence', {
  state: () => ipcRenderer.invoke('presence:state'),
  join: (channelId) => ipcRenderer.invoke('presence:join', channelId),
  leave: () => ipcRenderer.invoke('presence:leave')
});
contextBridge.exposeInMainWorld('stockWarsChat', {
  list: () => ipcRenderer.invoke('chat:list'),
  send: (text) => ipcRenderer.invoke('chat:send', text),
  room: (action, options) => ipcRenderer.invoke('chat:room', action, options)
});
