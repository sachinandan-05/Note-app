import React, { useState, useEffect, useCallback, useMemo } from "react";
import { fetchNotes, addNote, deleteNote as deleteNoteApi } from "../api/notes";
import { webSocketService } from "../api/websocket";

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

  const {
    notes,
    title,
    content,
    skip,
    isLoading,
    searchTerm,
    selectedNote,
    viewMode,
    hasMore,
    error
  } = state;
  const limit = 20;

  const loadNotes = useCallback(
    async (reset = false) => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const offset = reset ? 0 : skip;
        const data = await fetchNotes(offset, limit);
        const newNotes = Array.isArray(data) ? data : data?.notes || [];

        setState(prev => {
          const merged = reset ? newNotes : [...prev.notes, ...newNotes];
          return {
            ...prev,
            notes: merged,
            skip: merged.length,
            isLoading: false,
            hasMore: newNotes.length === limit
          };
        });
      } catch (err) {
        console.error("Failed to load notes:", err);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: "Failed to load notes. Please try again."
        }));
      }
    },
    // keep limit static - skip is destructured above so update occurs when skip changes
    [skip, limit]
  );

  // simple helper in case the Electron window resizing hook isn't present
  const handleResizeWindow = useCallback((mode) => {
    // If running inside Electron and you have ipcRenderer attached to window
    if (typeof window !== "undefined" && window?.ipcRenderer?.send) {
      window.ipcRenderer.send("resize-window", mode);
    } else {
      // fallback - no-op but helpful log for debugging
      console.log("Resize window requested:", mode);
    }
  }, []);

  // WebSocket effect for real-time updates (robust message handling)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userData");
    const userId = userData ? JSON.parse(userData)?._id : null;
    console.log("[Dashboard] WebSocket connection params:", { token, userId });

    if (!token || !userId) {
      console.error("[Dashboard] Missing token or userId, skipping WS connect");
      // Still load initial notes even without WS
      loadNotes(true);
      return;
    }

    console.log("[Dashboard] Connecting WebSocket…");
    webSocketService.connect(userId, token);

    const handleMessage = (raw) => {
      // Accept string or already-parsed objects
      let message = raw;
      if (typeof raw === "string") {
        try {
          message = JSON.parse(raw);
        } catch (e) {
          console.warn("[Dashboard] Received non-JSON WS message:", raw);
          return;
        }
      }

      // Normalize message shape: accept either { type, data } or { event, id } (server variations)
      const typeRaw = message?.type ?? message?.event ?? "";
      const type = String(typeRaw).toLowerCase();
      const data =
        message?.data ?? (message?.id ? { id: message.id } : message?.payload ?? null);

      if (!type) return;

      switch (type) {
        case "note_added":
        case "note_add":
          if (!data) return;
          setState((prev) => {
            const exists = prev.notes.some((n) => n.id === data.id);
            if (exists) return prev;
            const updated = [data, ...prev.notes];
            return { ...prev, notes: updated, skip: updated.length };
          });
          break;

        case "note_updated":
        case "note_update":
          if (!data) return;
          setState((prev) => ({
            ...prev,
            notes: prev.notes.map((n) => (n.id === data.id ? data : n))
          }));
          break;

        case "note_deleted":
        case "note_delete":
          if (!data) return;
          setState((prev) => {
            const filtered = prev.notes.filter((n) => n.id !== data.id);
            return {
              ...prev,
              notes: filtered,
              skip: Math.max(0, filtered.length)
            };
          });
          break;

        default:
          console.warn("[Dashboard] Unknown WS message type:", type, message);
      }
    };

    // Register handler (webSocketService.addMessageHandler should return a remove function)
    const removeHandler = webSocketService.addMessageHandler(handleMessage);

    // Load first batch of notes on mount
    loadNotes(true);

    return () => {
      console.log("[Dashboard] Cleaning up WebSocket");
      try {
        if (typeof removeHandler === "function") removeHandler();
      } catch (e) {
        console.warn("Error removing WS handler:", e);
      }
      try {
        webSocketService.disconnect();
      } catch (e) {
        console.warn("Error disconnecting WS:", e);
      }
    };
  }, [loadNotes]);

  const handleDeleteNote = useCallback(async (noteId, e) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteNoteApi(noteId);
      // local removal (server should also broadcast delete to other clients)
      setState((prev) => {
        const filtered = prev.notes.filter((n) => n.id !== noteId);
        return { ...prev, notes: filtered, skip: Math.max(0, filtered.length) };
      });
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Failed to delete note. Please try again.");
    }
  }, []);

  const handleAddNote = useCallback(async () => {
    if (!title.trim() || !content.trim() || isLoading) return;
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await addNote({ title: title.trim(), content: content.trim() });
      // Clear the form — WS will add the note on successful creation
      setState(prev => ({ ...prev, title: "", content: "", isLoading: false }));
    } catch (err) {
      console.error("Failed to add note:", err);
      alert("Failed to add note. Please try again.");
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [title, content, isLoading]);

  const filteredNotes = useMemo(
    () =>
      notes.filter((note) =>
        (note.title ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.content ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [notes, searchTerm]
  );

  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }, []);

  const truncateContent = useCallback((text, maxLength = 150) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  }, []);

  const handleInputChange = useCallback((field) => (e) => {
    const val = e.target.value;
    setState(prev => ({ ...prev, [field]: val }));
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
            <h1 className="text-4xl font-bold text-slate-800 tracking-tight">My Notes</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm">
                {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
              </span>
              <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
                <button
                  onClick={() => toggleViewMode("grid")}
                  className={`p-2 rounded transition-all ${viewMode === "grid" ? "bg-blue-500 text-white" : "text-slate-600 hover:text-slate-800"}`}
                >
                  Grid
                </button>
                <button
                  onClick={() => toggleViewMode("list")}
                  className={`p-2 rounded transition-all ${viewMode === "list" ? "bg-blue-500 text-white" : "text-slate-600 hover:text-slate-800"}`}
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
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Create New Note</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Enter note title..." value={title} onChange={handleInputChange("title")} className="w-full px-4 py-3 border border-slate-200 rounded-xl" />
                <textarea rows={6} placeholder="Write your note..." value={content} onChange={handleInputChange("content")} className="w-full px-4 py-3 border border-slate-200 rounded-xl resize-none" />
                <button onClick={handleAddNote} disabled={isLoading || !title.trim() || !content.trim()} className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold shadow hover:shadow-lg disabled:opacity-50 transition-all">
                  {isLoading ? "Adding..." : "Add Note"}
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Window Controls</h3>
                <div className="flex space-x-2">
                  <button onClick={() => handleResizeWindow("compact")} className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors">Compact</button>
                  <button onClick={() => handleResizeWindow("expand")} className="flex-1 px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded transition-colors">Expand</button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Display */}
          <div className="lg:col-span-2">
            {filteredNotes.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border p-12 text-center">
                <h3 className="text-xl font-semibold text-slate-600 mb-2">{searchTerm ? "No matching notes found" : "No notes yet"}</h3>
                <p className="text-slate-500">{searchTerm ? "Try a different search term" : "Create your first note to get started"}</p>
              </div>
            ) : (
              <>
                <div className={viewMode === "grid" ? "grid md:grid-cols-2 gap-6" : "space-y-4"}>
                  {filteredNotes.map((note, idx) => (
                    <div key={note.id || idx} className="relative group h-full">
                      <div onClick={() => toggleNoteSelection(note)} className={`bg-white rounded-2xl shadow-lg border p-6 cursor-pointer transition-all hover:shadow-xl h-full flex flex-col ${selectedNote?.id === note.id ? "ring-2 ring-blue-500" : ""}`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold text-slate-800">{note.title || "Untitled Note"}</h3>
                          <button onClick={(e) => handleDeleteNote(note.id, e)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete note">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-slate-600 mb-4 flex-grow">{selectedNote?.id === note.id ? note.content : truncateContent(note.content)}</p>
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
                    <button onClick={() => loadNotes(false)} disabled={isLoading} className="bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 transition-all">
                      {isLoading ? "Loading..." : "Load More Notes"}
                    </button>
                  </div>
                )}

                {error && <div className="mt-4 text-center text-red-500">{error}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
