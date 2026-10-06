const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('stockWarsApp', {
  quit: () => ipcRenderer.invoke('app:quit')
});
contextBridge.exposeInMainWorld('stockWarsPresence', {
  claimNickname: nickname => ipcRenderer.invoke('presence:nickname', nickname),
  state: () => ipcRenderer.invoke('presence:state'),
  join: (channelId) => ipcRenderer.invoke('presence:join', channelId),
  leave: () => ipcRenderer.invoke('presence:leave'),
  position: pose => ipcRenderer.invoke('presence:position', pose)
});
contextBridge.exposeInMainWorld('stockWarsChat', {
  friends: (operation, targetId, options) => ipcRenderer.invoke('friends:command', operation, targetId, options),
  list: () => ipcRenderer.invoke('chat:list'),
  send: (text) => ipcRenderer.invoke('chat:send', text),
  room: (action, options) => ipcRenderer.invoke('chat:room', action, options)
});
