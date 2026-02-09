import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

export default function LibraryPage() {
  const [items, setItems] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const origin = useMemo(() => window.location.origin, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/recordings/list");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setItems(data.items || []);
      setViewer(data.viewer || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleShare(id, shared) {
    setError("");
    try {
      const res = await fetch("/api/recordings/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, shared }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copyShareLink(id) {
    const link = `${origin}/share/${id}`;
    await navigator.clipboard.writeText(link);
    alert("Share link copied");
  }

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/record">Record</Link>{" "}
        <strong>Library</strong>
      </div>

      <h1>Library</h1>

      {viewer && (
        <p style={{ opacity: 0.8 }}>
          You: {viewer.name ? `${viewer.name} (${viewer.userId})` : viewer.userId}{" "}
          {viewer.isAdmin ? "• Admin" : ""}
        </p>
      )}

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !items.length && <p>No recordings yet.</p>}

      <ul style={{ paddingLeft: 16 }}>
        {items.map((r) => {
          const canShare = viewer?.isAdmin || viewer?.userId === r.ownerUserId;

          return (
            <li key={r.id} style={{ marginBottom: 16 }}>
              <div>
                <strong>{r.title}</strong>
              </div>

              <div style={{ fontSize: 14, opacity: 0.85 }}>
                By: {r.ownerName || r.ownerUserId}
                {" • "}
                {new Date(r.createdAt).toLocaleString()}
                {" • "}
                {r.shared ? "Shared" : "Private"}
              </div>

              <audio controls src={r.url} style={{ display: "block", marginTop: 8 }} />

              {canShare && (
                <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                  {!r.shared ? (
                    <button onClick={() => toggleShare(r.id, true)}>Enable Share</button>
                  ) : (
                    <>
                      <button onClick={() => toggleShare(r.id, false)}>Disable Share</button>
                      <button onClick={() => copyShareLink(r.id)}>Copy Share Link</button>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}