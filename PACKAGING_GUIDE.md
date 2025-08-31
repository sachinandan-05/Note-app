# Notes App - Packaging Guide

This guide explains how to package the Notes App into a Windows executable (.exe) and create an installer.

## Prerequisites

1. **Python 3.7+** - For running the build script
2. **Node.js and npm** - For building the frontend
3. **PyInstaller** - For packaging the Python backend
4. **Inno Setup** (optional) - For creating a Windows installer

## Building the Application

1. **Install Dependencies**
   ```bash
   # Install Python dependencies
   cd pyserver
   pip install -r requirements.txt
   
   # Install frontend dependencies
   cd ../client
   npm install
   cd ..
   ```

2. **Run the Build Script**
   ```bash
   python build.py
   ```

   This will:
   - Build the React frontend
   - Package the Python backend
   - Create a Windows installer (if Inno Setup is installed)

## Output Files

- The packaged application will be in the `dist/NotesApp` directory
- The Windows installer will be in the `dist` directory (if Inno Setup is installed)

## Manual Packaging (Alternative)

If the build script doesn't work, you can package the application manually:

1. **Build the Frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Package the Backend**
   ```bash
   cd ../pyserver
   pyinstaller --clean --noconfirm --distpath ../dist/NotesApp --workpath build notes_app.spec
   ```

3. **Copy Frontend to Distribution**
   - Copy the contents of `client/dist` to `dist/NotesApp/static`

## Creating a Windows Installer

1. Install Inno Setup from https://jrsoftware.org/isdl.php
2. Run the build script which will automatically create the installer
   - Or run: `iscc setup.iss`

## Distribution

The application can be distributed as:
- A portable version: The entire `NotesApp` folder
- An installer: The `NotesApp_Setup.exe` file

## Troubleshooting

- If you get an error about missing DLLs, make sure all dependencies are installed
- Check the build logs in the `build` directory
- Ensure all required files are included in the PyInstaller spec file

## Notes

- The backend runs on port 8000 by default
- The application requires write permissions to store notes
- Make sure to include any environment variables or configuration files needed by the application
