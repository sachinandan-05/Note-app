import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  // Window control
  resizeWindow: (mode) => ipcRenderer.send("resize-window", mode),

  // Notes related IPC methods
  send: (channel, data) => {
    const validChannels = [
      "notes:fetch",
      "notes:add",
      "notes:update",
      "notes:delete"
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  receive: (channel, callback) => {
    const validChannels = [
      "notes:fetched",
      "notes:added",
      "notes:updated",
      "notes:deleted",
      "notes:error"
    ];
    if (validChannels.includes(channel)) {
      const listener = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, listener);

      // Return a function to remove this specific listener
      return () => ipcRenderer.removeListener(channel, listener);
    }
  },

  // Remove all listeners for a channel
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
