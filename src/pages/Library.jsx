import { useEffect, useMemo, useState } from "react";

export default function Library({ whop }) {
  const ready = Boolean(whop?.ok);
  const viewerUserId = whop?.data?.userId || null;

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    try {
      setLoading(true);
      setStatus("");

      const r = await fetch("/api/recordings/list", { credentials: "include" });
      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        setStatus(`❌ Could not load library: ${data?.error || r.statusText || "unknown error"}`);
        setItems([]);
        setLoading(false);
        return;
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setLoading(false);
    } catch (e) {
      setStatus(`❌ Could not load library: ${e?.message || "unknown error"}`);
      setItems([]);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!ready) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x.title || "").toLowerCase().includes(s));
  }, [items, q]);

  async function deleteRecording(item) {
    if (!item?.id) return;
    if (busyId) return;

    const ok = confirm(`Delete this recording?\n\n"${item.title || "Untitled"}"`);
    if (!ok) return;

    try {
      setBusyId(item.id);
      setStatus("");

      const r = await fetch("/api/recordings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: item.id }),
      });

      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        setStatus(`❌ Delete failed: ${data?.error || r.statusText || "unknown error"}`);
        setBusyId(null);
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setStatus("✅ Deleted.");
      setBusyId(null);
    } catch (e) {
      setStatus(`❌ Delete failed: ${e?.message || "unknown error"}`);
      setBusyId(null);
    }
  }

  if (!ready) {
    return (
      <div style={{ padding: 16 }}>
        <h2>Library</h2>
        <p>Open this app inside Whop (session not detected).</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Library</h2>

      <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={refresh} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          style={{
            width: 260,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "rgba(255,255,255,0.92)",
          }}
        />
      </div>

      {status && <div style={{ marginTop: 10 }}>{status}</div>}

      {!loading && !status && filtered.length === 0 && (
        <div style={{ marginTop: 12, opacity: 0.85 }}>
          No recordings yet. Go to <b>Record</b>, give it a title, and save it.
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gap: 12, maxWidth: 900 }}>
        {filtered.map((item) => {
          const ownerUserId = item.ownerUserId || item.userId || null;
          const isOwner = viewerUserId && ownerUserId && viewerUserId === ownerUserId;
          const canDelete = Boolean(item.canDelete || isOwner); // supports both server + fallback

          return (
            <div
              key={item.id}
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 14,
                padding: 12,
                background: "rgba(0,0,0,0.20)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.title || "Untitled"}</div>

                {canDelete && (
                  <button
                    onClick={() => deleteRecording(item)}
                    disabled={busyId === item.id}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,80,80,0.15)",
                      color: "rgba(255,255,255,0.92)",
                      cursor: "pointer",
                      fontWeight: 700,
                      height: 36,
                    }}
                  >
                    {busyId === item.id ? "Deleting…" : "Delete"}
                  </button>
                )}
              </div>

              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
                {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                {ownerUserId ? ` · Owner: ${ownerUserId}` : " · Owner: (missing)"}
              </div>

              <audio controls src={item.url} style={{ width: "100%" }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}