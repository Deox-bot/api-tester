const { contextBridge } = require('electron');
const path = require('path');

let version = '1.0.0';
try {
  version = require(path.join(__dirname, '../package.json')).version || '1.0.0';
} catch (e) {
  // ignore
}

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  version: version,
});
