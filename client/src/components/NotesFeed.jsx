import React, { useState, useEffect } from 'react';
import { useWebSocket, useWebSocketMessages } from '../contexts/WebSocketContext';

const NotesFeed = () => {
  const [notes, setNotes] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const { sendMessage } = useWebSocket();
  
  // Handle incoming messages
  const handleMessage = (message) => {
    switch (message.event) {
      case 'note_created':
        setNotes(prevNotes => [message.data, ...prevNotes]);
        break;
      case 'note_updated':
        setNotes(prevNotes => 
          prevNotes.map(note => 
            note.id === message.data.id ? { ...note, ...message.data } : note
          )
        );
        break;
      case 'note_deleted':
        setNotes(prevNotes => 
          prevNotes.filter(note => note.id !== message.id)
        );
        break;
      default:
        console.log('Unhandled message type:', message.event);
    }
  };

  // Subscribe to WebSocket messages
  useWebSocketMessages(handleMessage);

  // Check connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(ws.current?.readyState === WebSocket.OPEN);
    };
    
    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  // Example: Send a new note
  const createNote = (content) => {
    sendMessage({
      type: 'create_note',
      content,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="notes-feed">
      <div className="connection-status">
        Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <div className="notes-list">
        {notes.map(note => (
          <div key={note.id} className="note">
            <p>{note.content}</p>
            <small>{new Date(note.timestamp).toLocaleString()}</small>
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => createNote('New note at ' + new Date().toLocaleTimeString())}
        disabled={!isConnected}
      >
        Add Test Note
      </button>
    </div>
  );
};

export default NotesFeed;
