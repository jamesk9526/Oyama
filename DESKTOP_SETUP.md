# Oyama Desktop Setup Guide

This guide covers setting up and running Oyama as a desktop application using Electron.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Windows 7+ (for building Windows distributables)

## Development Setup

### 1. Install Dependencies

Dependencies have already been installed. If needed, run:

```bash
npm install
```

This installs:
- `electron` - Core Electron framework
- `electron-builder` - Build and packaging tool for Electron
- `electron-is-dev` - Development environment detection
- `concurrently` - Run multiple processes simultaneously
- `wait-on` - Wait for services to be available
- `sharp` - Image processing for icons

### 2. Run Electron Development Mode

Start the Electron app in development mode:

```bash
npm run dev:electron
```

This command:
1. Generates the application icon (SVG to PNG conversion)
2. Starts the Next.js dev server on http://localhost:3000
3. Waits for the server to be ready
4. Launches the Electron application
5. Opens developer tools automatically

The desktop app will:
- Display the Oyama interface in a window (1400x900px)
- Hot-reload when you make changes to web files
- Show developer console for debugging

### 3. Project Structure for Desktop

```
oyama/
├── electron/
│   ├── main.js              # Main Electron process (handles app lifecycle)
│   └── preload.cjs          # Preload script (IPC bridge for security)
├── assets/
│   ├── icon.svg             # Source icon (SVG)
│   └── icon.png             # Generated icon (PNG, 256x256)
├── scripts/
│   └── generate-icon.js     # Script to convert icon SVG to PNG
└── package.json             # Contains Electron configuration
```

## Building for Distribution

### Build Windows Installer & Portable

```bash
npm run build:desktop:win
```

This creates:
- **NSIS Installer** - Traditional installer with uninstall option
  - Output: `dist/Oyama-0.1.0.exe`
  - Features: Custom installation directory, desktop shortcut, start menu entry
  - Size: ~150MB

- **Portable Executable** - Standalone executable (no installation required)
  - Output: `dist/Oyama-0.1.0-portable.exe`
  - Features: Run directly from USB or downloads folder
  - Size: ~150MB

### Build for All Platforms

```bash
npm run build:desktop
```

(Note: Building for macOS requires a Mac, and Linux requires different build tools)

## Build Output

After running `npm run build:desktop:win`, check the `dist/` folder:

```
dist/
├── Oyama-0.1.0.exe                    # NSIS Installer
├── Oyama-0.1.0-portable.exe          # Portable version
├── builder-effective-config.yaml      # Build configuration (for reference)
└── ... (other build artifacts)
```

## Configuration

### Application Settings

The Electron configuration is defined in `package.json` under the `"build"` object:

```json
{
  "build": {
    "appId": "com.oyama.app",
    "productName": "Oyama",
    "win": {
      "target": ["nsis", "portable"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    }
  }
}
```

### Customize Window Size

Edit `electron/main.js`:

```javascript
const mainWindow = new BrowserWindow({
  width: 1400,        // Change window width
  height: 900,        // Change window height
  minWidth: 800,      // Minimum window width
  minHeight: 600,     // Minimum window height
  // ...
});
```

### Customize Icon

1. Replace `assets/icon.svg` with your own SVG icon
2. Run `npm run generate:icon` to convert to PNG
3. The PNG will be automatically used in builds

## Development Features

### IPC (Inter-Process Communication)

The app has built-in IPC handlers for:

- **File Operations**
  - `window.electron.openFileDialog(options)` - Open file picker
  - `window.electron.saveFileDialog(options)` - Save file dialog

- **App Information**
  - `window.electron.getAppVersion()` - Get app version
  - `window.electron.getAppPath()` - Get app installation path

- **User Interaction**
  - `window.electron.showMessageBox(options)` - Show message dialogs

### Example Usage in React Component

```typescript
const openFile = async () => {
  const result = await window.electron.openFileDialog({
    filters: [
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  console.log(result.filePaths);
};
```

## Troubleshooting

### Port 3000 Already in Use

If you get an error about port 3000:

```bash
# Kill process using port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Icon Not Appearing

```bash
# Regenerate the icon
npm run generate:icon
```

### Electron Not Starting

1. Check if Next.js dev server is running on http://localhost:3000
2. Clear cache and restart:
   ```bash
   rm -rf node_modules/.cache
   npm run dev:electron
   ```

### Build Fails on Windows

Ensure you have:
- Python 3.9+ (required by some build tools)
- Visual Studio Build Tools installed
- Administrator privileges for terminal

## Next Steps

1. **Connect to LLM**: Implement Ollama/OpenAI integration in chat
2. **Database**: Set up SQLite persistence
3. **Auto-Updates**: Implement electron-updater for automatic updates
4. **Code Signing**: Sign executables for distribution (requires certificate)
5. **CI/CD**: Set up GitHub Actions to build on commit

## Useful Commands

```bash
# Development
npm run dev              # Web dev server only
npm run dev:electron    # Web + Electron desktop app

# Building
npm run build           # Web build only
npm run build:desktop   # Full desktop build (all platforms)
npm run build:desktop:win  # Windows only (faster)

# Utilities
npm run generate:icon   # Regenerate app icon
npm run lint            # Check code quality
```

## Additional Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Docs](https://www.electron.build/)
- [IPC in Electron](https://www.electronjs.org/docs/tutorial/ipc)
- [Creating Electron Apps](https://www.electronjs.org/docs/tutorial/first-app)

## Support

For issues or questions:
1. Check the [Electron troubleshooting guide](https://www.electronjs.org/docs/tutorial/troubleshooting)
2. Review the electron-builder [documentation](https://www.electron.build)
3. Check package.json for version information
