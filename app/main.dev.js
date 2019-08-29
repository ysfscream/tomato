/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, Tray } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path'
import log from 'electron-log';
import MenuBuilder from './menu';

process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;
let tray = null;

const createMainWindow = () => {
  mainWindow = new BrowserWindow({
    // 顶部系统的操作按钮栏（全屏，缩小，关闭）
    frame: false,
    // 窗口是否可以改变尺寸
    resizable: true,
    // 使窗口透明. 默认值为 false
    // transparent: true,
    show: false,
    width: 240,
    height: 400,
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
};

const createTray = () => {
  const iconPath = path.join(__dirname, '../resources', 'tomato.png');
  tray = new Tray(iconPath);
  tray.on('click', () => {
    showWindow()
  });
};

const showWindow = () => {
  if (process.env.START_MINIMIZED && mainWindow) {
    mainWindow.minimize();
  } else {
    mainWindow.show();
    mainWindow.focus();
  }
};

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map(name => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  createMainWindow();
  createTray();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
});
