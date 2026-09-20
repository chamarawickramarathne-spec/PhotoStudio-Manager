const path = require("path");
const fs = require("fs");
const { app, BrowserWindow, dialog, ipcMain, session, shell } = require("electron");

const { createStaticServer } = require("./static-server");
const { createUpdater } = require("./updater");

const WEB_ROOT = path.join(__dirname, "dist");
const UPDATE_REPO = process.env.PHOTOSTUDIO_UPDATE_REPO || "chamarawickramarathne-spec/PhotoStudio-Manager";
const ICON_PATH = path.join(__dirname, "build", "icon.png");
const PORT_FILE = path.join(app.getPath("userData"), "server-port.json");

const DESKTOP_POLISH_CSS = `
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator { opacity: 0.55; cursor: pointer; }
  input[type="date"]:focus::-webkit-calendar-picker-indicator,
  input[type="time"]:focus::-webkit-calendar-picker-indicator { opacity: 1; }
  input[type="date"]:disabled,
  input[type="time"]:disabled { opacity: 0.5; }
  :focus-visible { outline: 2px solid #A83524; outline-offset: 1px; }
`;

function readPreferredPort() {
  try {
    const port = JSON.parse(fs.readFileSync(PORT_FILE, "utf8")).port;
    return Number.isInteger(port) && port > 0 && port < 65536 ? port : 0;
  } catch {
    return 0;
  }
}

function writeServerPort(port) {
  try {
    fs.writeFileSync(PORT_FILE, JSON.stringify({ port }));
  } catch {
    void 0;
  }
}

let mainWindow = null;
let staticServer = null;
let pendingUpdate = null;

const updater = createUpdater({ repo: UPDATE_REPO, currentVersion: app.getVersion() });

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function summarize(result) {
  const { downloadUrl, checksumUrl, size, ...summary } = result;
  return summary;
}

async function applyPendingUpdate(result) {
  try {
    send("updater:status", { status: "downloading", latestVersion: result.latestVersion });
    const downloadDir = path.join(app.getPath("temp"), "photostudio-manager-update");
    const downloaded = await updater.download(result, downloadDir);
    if (downloaded.status !== "downloaded") {
      send("updater:status", downloaded);
      return downloaded;
    }
    send("updater:status", { status: "installing", latestVersion: result.latestVersion });
    updater.apply(downloaded.installerPath).unref();
    setTimeout(() => app.quit(), 500);
    return { status: "installing" };
  } catch (err) {
    const result_error = { status: "error", message: err.message };
    send("updater:status", result_error);
    return result_error;
  }
}

async function silentStartupCheck() {
  if (!UPDATE_REPO) return;
  const result = await updater.check();
  if (result.status !== "update-available") return;

  const { response } = await dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "Update available",
    message: `PhotoStudio Manager ${result.latestVersion} is available`,
    detail: `You are running v${result.currentVersion}.\n\nThe update is downloaded, verified, and installed automatically.`,
    buttons: ["Install Now", "Later"],
    defaultId: 0,
    cancelId: 1,
    noLink: true,
  });

  if (response === 0) {
    await applyPendingUpdate(result);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#FAF9F6",
    icon: ICON_PATH,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      spellcheck: false,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());

  const baseUrl = `http://127.0.0.1:${staticServer.port}/`;

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(baseUrl)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(baseUrl)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);

  void mainWindow.loadURL(baseUrl).then(() => {
    if (!mainWindow.isDestroyed()) {
      mainWindow.webContents.insertCSS(DESKTOP_POLISH_CSS).catch(() => void 0);
    }
  });
}

function registerIpc() {
  ipcMain.handle("app:get-version", () => app.getVersion());

  ipcMain.handle("updater:check", async () => {
    const result = await updater.check();
    if (result.status === "update-available") pendingUpdate = result;
    return summarize(result);
  });

  ipcMain.handle("updater:install", async () => {
    if (!pendingUpdate) return { status: "error", message: "No pending update." };
    return summarize(await applyPendingUpdate(pendingUpdate));
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    staticServer = await createStaticServer(WEB_ROOT).listen(readPreferredPort());
    writeServerPort(staticServer.port);
    registerIpc();
    createWindow();
    setTimeout(() => void silentStartupCheck(), 4000);

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}