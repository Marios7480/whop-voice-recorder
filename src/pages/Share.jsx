import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function Share() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [err, setErr] = useState("");

  const shareUrl = useMemo(() => {
    if (!id) return "";
    return `${window.location.origin}/share/${id}`;
  }, [id]);

  useEffect(() => {
    async function load() {
      try {
        setErr("");
        const res = await fetch(`/api/recordings/get?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok || !data?.ok) throw new Error(data?.error || "Not found");
        setItem(data.item);
      } catch (e) {
        setErr(e.message);
      }
    }
    if (id) load();
  }, [id]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Share link copied.");
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <h1>Shared Recording</h1>
        <Link to="/library">← Library</Link>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}

      {!err && !item && <p>Loading…</p>}

      {item && (
        <div style={{ border: "1px solid #ddd", borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{item.title}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
            Recorded by: {item.ownerName || "Unknown"}
          </div>

          <div style={{ marginTop: 12 }}>
            <audio controls src={item.url} style={{ width: "100%" }} />
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={copyLink}>Copy Share Link</button>
            <a href={item.url} target="_blank" rel="noreferrer">
              <button>Open Audio</button>
            </a>
          </div>

          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.7 }}>
            Share URL: <span style={{ wordBreak: "break-all" }}>{shareUrl}</span>
          </div>
        </div>
      )}
    </div>
  );
}