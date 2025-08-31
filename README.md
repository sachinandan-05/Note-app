Notes Application

A full-stack notes application with real-time collaboration features, built with React, FastAPI, and WebSockets.

🛠️ Setup Instructions
Prerequisites

Python 3.7+

Node.js 16+ and npm

MongoDB (for data storage)

Redis (for WebSocket connections)

Backend Setup

Navigate to the backend directory:

cd pyserver


Create and activate a virtual environment:

python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate


Install Python dependencies:

pip install -r requirements.txt


Create a .env file in the pyserver directory with:

MONGODB_URL=mongodb://localhost:27017/notesapp
SECRET_KEY=your-secret-key-here

Frontend Setup

Navigate to the frontend directory:

cd ../client


Install Node.js dependencies:

npm install

🚀 Running the Application
Development Mode

Start the backend server:

cd pyserver
uvicorn main:app --reload


In a new terminal, start the frontend:

cd client
npm run dev


Access the application at http://localhost:5173

Running the Windows Installer

Build the application using the provided build.py script:

python build.py


The installer will be available in the dist directory as NotesApp_Setup.exe.

Run the installer and follow the on-screen instructions.

Launch the application from the Start Menu or desktop shortcut.

🏗️ Design Choices & Architecture
Frontend (React)

Built with Vite for fast development and optimized production builds

State management using React Context API

Real-time updates via WebSocket connections

Responsive design with modern CSS

Backend (FastAPI)

Asynchronous API endpoints for better performance

JWT-based authentication

WebSocket support for real-time features

MongoDB for flexible document storage

Data Flow

Users interact with the React frontend

REST API handles CRUD operations for notes

WebSockets enable real-time collaboration

Data is persisted in MongoDB

⚠️ Limitations
Current Limitations

Offline Support: Limited functionality

File Attachments: No support for uploads

Scalability: Needs optimization for large numbers of concurrent users

Security: Basic authentication only; OAuth recommended for production

Known Issues

Race conditions may occur with rapid concurrent edits

No built-in backup system

Limited error handling in edge cases

🚀 Future Improvements
Core Features

End-to-end encryption for notes

Support for Markdown formatting

File attachments and image uploads

Note version history

Performance

Pagination for large note collections

Optimize WebSocket message handling

Database indexing for faster searches

User Experience


Keyboard shortcuts

Rich text editor with formatting

Note categories and tags

📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

📚 Documentation

For detailed packaging and deployment instructions, see [PACKAGING_GUIDE.md](./PACKAGING_GUIDE.md).