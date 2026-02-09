import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function SharePage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function run() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`/api/recordings/public?id=${encodeURIComponent(id)}`);
        const data = await res.json();

        if (!data.ok) throw new Error(data.error || "Failed to load shared recording");
        setItem(data.item);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [id]);

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/record">Record</Link> {" | "}
        <Link to="/library">Library</Link>
      </div>

      <h1>Shared Recording</h1>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {item && (
        <>
          <p>
            <strong>{item.title}</strong>
          </p>

          <p style={{ opacity: 0.85 }}>
            By: {item.ownerName || "Unknown"} •{" "}
            {new Date(item.createdAt).toLocaleString()}
          </p>

          <audio controls src={item.url} style={{ display: "block", marginTop: 10 }} />
        </>
      )}
    </div>
  );
}