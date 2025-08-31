import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchNotes, addNote, deleteNote as deleteNoteApi } from "../api/notes";

function Dashboard() {
  const [state, setState] = useState({
    notes: [],
    title: "",
    content: "",
    skip: 0,
    isLoading: false,
    searchTerm: "",
    selectedNote: null,
    viewMode: "grid", // grid or list
    hasMore: true,
    error: null
  });
  
  const { notes, title, content, skip, isLoading, searchTerm, selectedNote, viewMode, hasMore, error } = state;
  const limit = 20;

  // Define loadNotes first
  const loadNotes = useCallback(async (reset = false) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      const data = await fetchNotes(reset ? 0 : skip, limit);
      const newNotes = Array.isArray(data) ? data : data.notes || [];
      console.log("New notes:", newNotes);
      
      setState(prev => ({
        ...prev,
        notes: reset ? newNotes : [...prev.notes, ...newNotes],
        skip: reset ? newNotes.length : prev.notes.length + newNotes.length,
        isLoading: false,
        hasMore: newNotes.length === limit
      }));
    } catch (error) {
      console.error("Failed to load notes:", error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to load notes. Please try again.'
      }));
    }
  }, [skip, limit]);

  const handleDeleteNote = useCallback(async (noteId, e) => {
    e?.stopPropagation(); // Prevent triggering note selection
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteNoteApi(noteId);
      setState(prev => ({
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId),
        selectedNote: prev.selectedNote?.id === noteId ? null : prev.selectedNote
      }));
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert('Failed to delete note. Please try again.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialNotes = async () => {
      try {
        await loadNotes(true);
      } catch (error) {
        if (isMounted) {
          console.error("Error loading initial notes:", error);
        }
      }
    };
    
    loadInitialNotes();
    
    return () => {
      isMounted = true;
    };
  }, [loadNotes]);


  const handleAddNote = useCallback(async () => {
    if (!title.trim() || !content.trim()) return;
    
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      await addNote(title, content);
      setState(prev => ({
        ...prev,
        title: "",
        content: "",
        skip: 0,
        isLoading: false
      }));
      loadNotes(true); // reload notes from start
    } catch (error) {
      console.error("Failed to add note:", error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [title, content, loadNotes]);

  const handleResizeWindow = useCallback((mode) => {
    if (window.electronAPI) {
      window.electronAPI.send("resize-window", mode);
    } else if (window.ipcRenderer) {
      window.ipcRenderer.send("resize-window", mode);
    } else {
      console.warn("Electron API not available");
    }
  }, []);

  const filteredNotes = useMemo(() => 
    notes.filter(note => 
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [notes, searchTerm]
  );

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const truncateContent = useCallback((text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }, []);

  const handleInputChange = useCallback((field) => (e) => {
    setState(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const toggleViewMode = useCallback((mode) => {
    setState(prev => ({ ...prev, viewMode: mode }));
  }, []);

  const toggleNoteSelection = useCallback((note) => {
    setState(prev => ({
      ...prev,
      selectedNote: prev.selectedNote?.id === note.id ? null : note
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">
              My Notes
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              </span>
              <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                <button
                  onClick={() => toggleViewMode("grid")}
                  className={`p-2 rounded transition-all ${
                    viewMode === "grid"
                      ? "bg-blue-500 text-white"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => toggleViewMode("list")}
                  className={`p-2 rounded transition-all ${
                    viewMode === "list"
                      ? "bg-blue-500 text-white"
                      : "text-slate-600 hover:text-slate-800"
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={handleInputChange("searchTerm")}
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Add Note Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Create New Note
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={title}
                  onChange={handleInputChange("title")}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl"
                />
                <textarea
                  rows={6}
                  placeholder="Write your note..."
                  value={content}
                  onChange={handleInputChange("content")}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={isLoading || !title.trim() || !content.trim()}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {isLoading ? "Adding..." : "Add Note"}
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">
                  Window Controls
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleResizeWindow("compact")}
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => handleResizeWindow("expand")}
                    className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                  >
                    Expand
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Display */}
          <div className="lg:col-span-2">
            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
                <h3 className="text-xl font-semibold text-slate-600 mb-2">
                  {searchTerm ? "No matching notes found" : "No notes yet"}
                </h3>
                <p className="text-slate-500">
                  {searchTerm
                    ? "Try a different search term"
                    : "Create your first note to get started"}
                </p>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"}>
                  {filteredNotes.map((note, idx) => (
                    <div key={note.id || idx} className="relative group h-full">
                      <div
                        onClick={() => toggleNoteSelection(note)}
                        className={`bg-white rounded-2xl shadow-lg border p-6 cursor-pointer transition-all hover:shadow-xl h-full flex flex-col ${
                          selectedNote?.id === note.id ? "ring-2 ring-blue-500" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-slate-800">
                            {note.title || "Untitled Note"}
                          </h3>
                          <button
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete note"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </button>
                        </div>
                        <p className="text-slate-600 mb-4 flex-grow">
                          {selectedNote?.id === note.id
                            ? note.content
                            : truncateContent(note.content)}
                        </p>
                        <div className="text-sm text-slate-500 flex justify-between mt-2">
                          <span>{formatDate(note.createdAt || new Date())}</span>
                          <span>{note.content?.length || 0} chars</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {!searchTerm && hasMore && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => loadNotes(false)}
                      disabled={isLoading}
                      className="bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all"
                    >
                      {isLoading ? "Loading..." : "Load More Notes"}
                    </button>
                  </div>
                )}
                {error && (
                  <div className="mt-4 text-center text-red-500">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
