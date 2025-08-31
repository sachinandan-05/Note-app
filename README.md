# 📝 Notes Application

A modern, full-stack notes application with real-time collaboration features, built with React, FastAPI, and WebSockets. Organize your thoughts, collaborate in real-time, and access your notes from anywhere.

## ✨ Features

- **Real-time Collaboration**: Work on notes simultaneously with others
- **Responsive Design**: Access your notes on any device
- **Secure Authentication**: JWT-based user authentication
- **Markdown Support**: Format your notes with Markdown
- **Search Functionality**: Quickly find your notes
- **WebSocket Integration**: Instant updates across all connected clients

## 🛠️ Prerequisites

- Python 3.7+
- Node.js 16+ and npm
- MongoDB (for data storage)
- Redis (for WebSocket connections)

## 🚀 Quick Start

### Backend Setup

```bash
# Navigate to backend directory
cd pyserver

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd ../client

# Install dependencies
npm install
```

## 🏃 Running the Application

### Development Mode

Start the backend server:
```bash
cd pyserver
uvicorn main:app --reload
```

In a new terminal, start the frontend:
```bash
cd client
npm run dev
```

Access the application at http://localhost:5173

### Production Build

```bash
# Build the application
python build.py

# The installer will be available in the dist/ directory
```

## 🏗️ Architecture

### Frontend (React)
- **Framework**: React with Vite
- **State Management**: React Context API
- **Real-time**: WebSocket integration
- **Styling**: Modern CSS with responsive design

### Backend (FastAPI)
- **Framework**: FastAPI
- **Database**: MongoDB with PyMongo
- **Authentication**: JWT
- **Real-time**: WebSocket support

## 📋 Project Flow

```
┌─────────────────┐
│   Electron UI   │ ←── User Interface
└─────────┬───────┘
          │
    1️⃣ User Login (REST API)
          │
          ▼
┌─────────────────┐
│   Node.js       │ ←── Authentication Server
│  Auth Server    │
└─────────┬───────┘
          │
    Returns JWT + userId
          │
          ▼
┌─────────────────┐
│ Electron Client │ ←── Opens WebSocket Connection
│ WebSocket Init  │
└─────────┬───────┘
          │
    2️⃣ WebSocket Authentication
          │     (using JWT token)
          ▼
┌─────────────────┐
│  Python Server  │ ←── Notes Management + WebSocket
│  FastAPI + WS   │
└─────────┬───────┘
          │
    3️⃣ Create/Update Note
          │     (REST POST/PUT)
          ▼
┌─────────────────┐
│    MongoDB      │ ←── Data Persistence
│   Database      │
└─────────┬───────┘
          │
    4️⃣ Real-time Broadcasting
          │
          ▼
┌─────────────────┐
│ All Connected   │ ←── Live Updates
│   Clients       │     (via WebSocket)
└─────────────────┘
```

### Flow Description

1. **User Authentication**: User logs in through the Electron frontend, which communicates with the Node.js authentication server via REST API
2. **JWT Token**: Authentication server validates credentials and returns a JWT token along with user ID
3. **WebSocket Connection**: Electron client establishes a WebSocket connection with the Python server using the JWT for authentication
4. **Note Operations**: User creates, updates, or deletes notes through REST API calls to the Python server
5. **Data Persistence**: Python server saves all changes to MongoDB database
6. **Real-time Broadcasting**: Server broadcasts note changes to all connected WebSocket clients for that user
7. **Live Updates**: All connected clients receive instant updates, ensuring real-time collaboration

## 📦 Deployment

For detailed packaging and deployment instructions, see [PACKAGING_GUIDE.md](./PACKAGING_GUIDE.md).

## 🔧 Troubleshooting

- **Connection Issues**: Ensure MongoDB and Redis are running
- **Dependency Errors**: Try deleting `node_modules` and `venv` then reinstall
- **Environment Variables**: Verify all required variables are set in `.env`
- **WebSocket Issues**: Check firewall settings and ensure ports are open
- **Authentication Problems**: Verify JWT secret keys match between services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [React](https://reactjs.org/) - Frontend library
- [MongoDB](https://www.mongodb.com/) - Database
- [Vite](https://vitejs.dev/) - Frontend tooling
- [Electron](https://www.electronjs.org/) - Desktop application framework