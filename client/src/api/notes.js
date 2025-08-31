const API_URL = "http://127.0.0.1:8001";

// Fetch notes with JWT
export async function fetchNotes() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");

  try {
    const res = await fetch(`${API_URL}/notes/`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Error response:", error);
      throw new Error(`Failed to fetch notes: ${res.status} ${error}`);
    }

    const data = await res.json();
    console.log("Fetched notes:", data); // Add this for debugging
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error in fetchNotes:", error);
    throw error;
  }
}
// Add a new note with JWT
export async function addNote({ title, content, userId }) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");
  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  try {
    const res = await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        title, 
        content, 
        timestamp: new Date().toISOString(),
        userId 
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Error adding note:", error);
      throw new Error(`Failed to add note: ${res.status} ${error}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error in addNote:", error);
    throw error;
  }
}


// Delete a note with JWT
export async function deleteNote(noteId) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");

  try {
    const res = await fetch(`${API_URL}/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const error = await res.text();
      console.error("Error deleting note:", error);
      throw new Error(`Failed to delete note: ${res.status} ${error}`);
    }

    const data = await res.json();
    console.log("Deleted note:", noteId, data);
    return data;
  } catch (error) {
    console.error("Error in deleteNote:", error);
    throw error;
  }
}
