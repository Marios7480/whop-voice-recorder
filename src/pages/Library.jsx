import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Library() {
  const [items, setItems] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [err, setErr] = useState("");

  async function load() {
    try {
      setErr("");
      const res = await fetch("/api/recordings/list");
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Failed to load");
      setItems(data.items || []);
      setViewer(data.viewer || null);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function deleteRecording(id) {
    try {
      setErr("");
      const res = await fetch("/api/recordings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Delete failed");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function shareRecording(r) {
    // ✅ This is the simplest Whop share: a public URL to the audio file
    const shareText = `${r.title}\nRecorded by: ${r.ownerName || "Unknown"}\n${r.url}`;
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Share text copied (paste into Whop).");
    } catch {
      window.prompt("Copy this and paste into Whop:", shareText);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1>Library</h1>
        <Link to="/record">+ Record</Link>
      </div>

      {viewer && (
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 12 }}>
          Signed in as: <b>{viewer.userId}</b>
          {viewer.isAdmin ? " (admin)" : ""}
        </div>
      )}

      {err && <p style={{ color: "red" }}>{err}</p>}

      {items.length === 0 ? (
        <p>No recordings yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((r) => (
            <div
              key={r.id}
              style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8 }}
            >
              <div style={{ fontWeight: 700 }}>{r.title}</div>

              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                Recorded by: {r.ownerName || "Unknown"}
              </div>

              <div style={{ marginTop: 10 }}>
                <audio controls src={r.url} style={{ width: "100%" }} />
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button onClick={() => shareRecording(r)}>Share</button>

                {r.canDelete ? (
                  <button onClick={() => deleteRecording(r.id)}>Delete</button>
                ) : (
                  <button disabled title="You can only delete your own recordings">
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}