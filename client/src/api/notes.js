const API_URL = "http://127.0.0.1:8001";

// Fetch notes with JWT
export async function fetchNotes(skip = 0, limit = 20) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");

  const res = await fetch(`${API_URL}/notes/?skip=${skip}&limit=${limit}`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to fetch notes: ${res.status} ${error}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : data.notes || [];
}

// Add a new note with JWT
export async function addNote(title, content) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");

  const res = await fetch(`${API_URL}/notes/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ title, content }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to add note: ${res.status} ${error}`);
  }

  return res.json();
}

// Delete a note with JWT
export async function deleteNote(noteId) {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("No authentication token found. Please log in.");

  const res = await fetch(`${API_URL}/notes/${noteId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to delete note: ${res.status} ${error}`);
  }

  return res.json();
}
