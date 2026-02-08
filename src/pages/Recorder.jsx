import { useRef, useState } from "react";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function Recorder() {
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [title, setTitle] = useState("");
  const [blobUrl, setBlobUrl] = useState(null);
  const [blob, setBlob] = useState(null);
  const [status, setStatus] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  async function start() {
    setStatus("");
    setBlob(null);
    setBlobUrl(null);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });

    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      const b = new Blob(chunksRef.current, { type: "audio/webm" });
      setBlob(b);
      setBlobUrl(URL.createObjectURL(b));
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current = mr;
    mr.start();
    setIsRecording(true);
  }

  function stop() {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }

  async function save() {
    setStatus("");
    if (!title.trim()) {
      setStatus("You must title the recording before saving.");
      return;
    }
    if (!blob) {
      setStatus("Record audio first.");
      return;
    }

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("audio", blob, "recording.webm");

    const r = await fetch("/api/recordings/create", {
      method: "POST",
      body: fd,
      credentials: "include",
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setStatus(j?.error || "Upload failed");
      return;
    }

    setStatus("Saved ✅");
    setTitle("");
    setBlob(null);
    setBlobUrl(null);
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Record</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Button onClick={start} disabled={isRecording}>Start</Button>
        <Button onClick={stop} disabled={!isRecording} variant="secondary">Stop</Button>
        <Button onClick={save} disabled={!blob} variant="secondary">Save to Library</Button>
      </div>

      {status ? (
        <div style={{ marginBottom: 12, color: status.includes("✅") ? "inherit" : "tomato" }}>
          {status}
        </div>
      ) : null}

      <Card>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>Title (required)</div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Week 1 reflection"
            style={{ width: "100%", padding: 10, borderRadius: 8 }}
          />
        </div>

        {blobUrl ? (
          <audio controls src={blobUrl} style={{ width: "100%" }} />
        ) : (
          <div style={{ opacity: 0.8 }}>Record something and press Stop.</div>
        )}
      </Card>
    </div>
  );
}