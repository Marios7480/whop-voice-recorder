// src/pages/LibraryPage.jsx  (FULL REPLACEMENT WITH ADMIN DELETE UI)
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [me, setMe] = useState({ userId: "", isAdmin: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const res = await fetch("/api/me", { method: "GET" });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load /api/me");
    const data = JSON.parse(text);
    if (!data.ok) throw new Error(data.error || "Failed to load /api/me");
    return { userId: data.userId, isAdmin: !!data.isAdmin };
  }

  async function loadList() {
    const res = await fetch("/api/recordings/list", { method: "GET" });
    const text = await res.text();
    if (!res.ok) throw new Error(text || "Failed to load recordings");
    const data = JSON.parse(text);
    if (!data.ok) throw new Error(data.error || "Failed to load recordings");
    return Array.isArray(data.items) ? data.items : [];
  }

  async function load() {
    setError("");
    setLoading(true);
    try {
      const [meInfo, list] = await Promise.all([loadMe(), loadList()]);
      setMe(meInfo);
      setItems(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [items]);

  async function deleteRecording(id) {
    setError("");
    try {
      const res = await fetch("/api/recordings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text || "Delete failed");

      const data = JSON.parse(text);
      if (!data.ok) throw new Error(data.error || "Delete failed");

      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  }

  // UI policy:
  // - Admin: can delete anyone (show button for all)
  // - User: can delete only their own (show button only when owner matches)
  function canShowDelete(item) {
    if (me.isAdmin) return true;
    if (!me.userId) return false;
    return item.ownerUserId === me.userId;
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Link to="/record">Record</Link>{" "}
        <strong style={{ marginLeft: 8 }}>Library</strong>
      </div>

      <h1>Library</h1>

      <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 12 }}>
        Signed in as: <code>{me.userId || "unknown"}</code>{" "}
        {me.isAdmin ? "(admin)" : ""}
      </div>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && sorted.length === 0 && <p>No recordings yet.</p>}

      <ul style={{ paddingLeft: 18 }}>
        {sorted.map((r) => (
          <li key={r.id} style={{ marginBottom: 14 }}>
            <div>
              <strong>{r.title}</strong>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Owner: {r.ownerUserId || "unknown"}{" "}
                {r.createdAt ? `• ${new Date(r.createdAt).toLocaleString()}` : ""}
              </div>
            </div>

            {r.url ? (
              <audio
                controls
                src={r.url}
                style={{ marginTop: 8, display: "block" }}
              />
            ) : (
              <p style={{ marginTop: 8 }}>Missing audio URL</p>
            )}

            {canShowDelete(r) && (
              <button style={{ marginTop: 8 }} onClick={() => deleteRecording(r.id)}>
                🗑 Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}