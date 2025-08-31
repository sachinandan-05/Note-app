import os
import shutil
import subprocess
import sys
from pathlib import Path

def build_frontend():
    """Build the React frontend."""
    print("Building frontend...")
    try:
        # Install frontend dependencies if needed
        subprocess.run(["npm", "install"], cwd="client", check=True)
        # Build the React app
        subprocess.run(["npm", "run", "build"], cwd="client", check=True)
        print("Frontend built successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
        return False

def package_backend():
    """Package the Python backend using PyInstaller."""
    print("Packaging backend...")
    try:
        # Install PyInstaller if not already installed
        subprocess.run([sys.executable, "-m", "pip", "install", "pyinstaller"], check=True)
        
        # Create the build directory if it doesn't exist
        os.makedirs("dist", exist_ok=True)
        
        # Run PyInstaller
        subprocess.run([
            sys.executable, "-m", "PyInstaller",
            "--clean",
            "--noconfirm",
            "--distpath", "dist/NotesApp",
            "--workpath", "build",
            "notes_app.spec"
        ], cwd="pyserver", check=True)
        
        print("Backend packaged successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error packaging backend: {e}")
        return False

def copy_frontend_to_dist():
    """Copy the built frontend to the distribution directory."""
    print("Copying frontend to distribution...")
    try:
        frontend_build = Path("client/dist")
        backend_dist = Path("dist/NotesApp")
        
        # Create static directory if it doesn't exist
        static_dir = backend_dist / "static"
        static_dir.mkdir(parents=True, exist_ok=True)
        
        # Copy frontend files
        if frontend_build.exists():
            for item in frontend_build.glob("*"):
                if item.is_dir():
                    shutil.copytree(item, static_dir / item.name, dirs_exist_ok=True)
                else:
                    shutil.copy2(item, static_dir)
        
        print("Frontend copied to distribution directory!")
        return True
    except Exception as e:
        print(f"Error copying frontend: {e}")
        return False

def create_windows_installer():
    """Create a Windows installer using Inno Setup."""
    print("Creating Windows installer...")
    try:
        # Create the Inno Setup script
        iss_content = """
        #define MyAppName "Notes App"
        #define MyAppVersion "1.0"
        #define MyAppPublisher "Your Company"
        #define MyAppURL "https://example.com/"
        #define MyAppExeName "NotesApp.exe"

        [Setup]
        AppId={{\{{A1B2C3D4-E5F6-47G8-H9I0-J1K2L3M4N5O6P}}
        AppName={#MyAppName}
        AppVersion={#MyAppVersion}
        AppVerName={#MyAppName} {#MyAppVersion}
        AppPublisher={#MyAppPublisher}
        AppPublisherURL={#MyAppURL}
        AppSupportURL={#MyAppURL}
        AppUpdatesURL={#MyAppURL}
        DefaultDirName={{autopf}}\\{#MyAppName}
        DisableProgramGroupPage=yes
        OutputDir=.\\dist
        OutputBaseFilename=NotesApp_Setup
        Compression=lzma
        SolidCompression=yes
        WizardStyle=modern

        [Languages]
        Name: "english"; MessagesFile: "compiler:Default.isl"

        [Tasks]
        Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

        [Files]
        Source: ".\\dist\\NotesApp\\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
        
        [Icons]
        Name: "{autoprograms}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"
        Name: "{autodesktop}\\{#MyAppName}"; Filename: "{app}\\{#MyAppExeName}"; Tasks: desktopicon

        [Run]
        Filename: "{app}\\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
        """
        
        # Write the Inno Setup script
        with open("setup.iss", "w") as f:
            f.write(iss_content)
        
        # Check if Inno Setup is installed
        try:
            subprocess.run(["iscc", "/?"], capture_output=True, check=True)
            # Build the installer
            subprocess.run(["iscc", "setup.iss"], check=True)
            print("Windows installer created successfully!")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("Inno Setup not found. Please install Inno Setup to create a Windows installer.")
            print("Download from: https://jrsoftware.org/isdl.php")
            return False
            
    except Exception as e:
        print(f"Error creating Windows installer: {e}")
        return False

def main():
    print("Starting build process...")
    
    # Build the frontend
    if not build_frontend():
        print("Frontend build failed. Exiting...")
        return
    
    # Package the backend
    if not package_backend():
        print("Backend packaging failed. Exiting...")
        return
    
    # Copy frontend to distribution
    if not copy_frontend_to_dist():
        print("Failed to copy frontend. Exiting...")
        return
    
    # Create Windows installer
    create_windows_installer()
    
    print("\nBuild process completed!")
    print("The application is ready in the 'dist/NotesApp' directory.")
    print("The Windows installer is available in the 'dist' directory.")

if __name__ == "__main__":
    main()
