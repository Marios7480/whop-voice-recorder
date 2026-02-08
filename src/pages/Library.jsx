import { useEffect, useMemo, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function Library() {
  const [items, setItems] = useState([]);
  const [viewer, setViewer] = useState(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    const r = await fetch("/api/recordings/list", { credentials: "include" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j?.error || "Could not load library");
      return;
    }
    setViewer(j.viewer || null);
    setItems(j.items || []);
  }

  async function del(id) {
    setErr("");
    const r = await fetch("/api/recordings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j?.error || "Delete failed");
      return;
    }
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => (x.title || "").toLowerCase().includes(s));
  }, [items, q]);

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Library</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <Button onClick={load}>Refresh</Button>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search..."
          style={{ flex: 1, padding: 10, borderRadius: 10 }}
        />
      </div>

      {err ? <div style={{ color: "tomato", marginBottom: 12 }}>{err}</div> : null}

      <div style={{ display: "grid", gap: 12 }}>
        {filtered.map((x) => (
          <Card key={x.id}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{x.title}</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {x.createdAt ? new Date(x.createdAt).toLocaleString() : ""}
                </div>
              </div>

              {x.canDelete ? (
                <Button variant="secondary" onClick={() => del(x.id)}>
                  Delete
                </Button>
              ) : null}
            </div>

            {x.url ? (
              <audio controls src={x.url} style={{ width: "100%", marginTop: 10 }} />
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}