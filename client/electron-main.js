import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Load Vite dev server or production build
    const startURL = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, "dist", "index.html")}`;
    console.log("Loading URL:", startURL);
    mainWindow.loadURL(startURL);

    mainWindow.on("closed", () => {
      mainWindow = null;
    });
  } catch (err) {
    console.error("Error creating window:", err);
  }
}

// App lifecycle
app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (!mainWindow) createWindow();
});

// IPC handlers
ipcMain.on("resize-window", (event, mode) => {
  if (!mainWindow) return;
  if (mode === "compact") mainWindow.setSize(400, 300);
  else mainWindow.setSize(1200, 800);
});

ipcMain.handle("notes:fetch", async (event, { skip, limit }) => {
  try {
    // Forward request to renderer (React will call FastAPI directly)
    return { success: true, data: { skip, limit } };
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("auth:login", async (event, { email, password }) => {
  try {
    // Just pass data around or call backend here via node-fetch if needed
    return { success: true, token: "dummy-token", email };
  } catch (error) {
    console.error("Login failed:", error);
    return { success: false, error: error.message };
  }
});

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (mainWindow) {
    mainWindow.webContents.send("app:error", error.message);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  if (mainWindow) {
    mainWindow.webContents.send("app:error", reason?.message || "Unknown error");
  }
});

