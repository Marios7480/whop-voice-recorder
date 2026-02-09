import { useRef, useState } from "react";

export default function RecordPage() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  const [blob, setBlob] = useState(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [recording, setRecording] = useState(false);
  const [saving, setSaving] = useState(false);

  async function startRecording() {
    setError("");
    setBlob(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Safari can be picky—this keeps it stable.
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const b = new Blob(chunksRef.current, { type: mimeType });
        setBlob(b);
        if (audioRef.current) audioRef.current.src = URL.createObjectURL(b);

        // stop mic
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError(e?.message || "Mic permission failed");
    }
  }

  function stopRecording() {
    try {
      recorderRef.current?.stop();
      setRecording(false);
    } catch (e) {
      setError(e?.message || "Failed to stop recording");
    }
  }

  async function saveRecording() {
    setError("");

    if (!blob) return setError("No recording");
    if (!title.trim()) return setError("Title required");

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("file", blob, "recording.webm");

    setSaving(true);

    try {
      const res = await fetch("/api/recordings/create", {
        method: "POST",
        body: fd,
        credentials: "include" // ✅ critical inside embedded/iframe contexts
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(text || `Upload failed (${res.status})`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || "Server returned non-JSON response");
      }

      if (!data.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setBlob(null);
      setTitle("");
      if (audioRef.current) audioRef.current.src = "";
      alert("Recording saved");
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Record</h1>

      {!recording ? (
        <button onClick={startRecording}>🎙 Start Recording</button>
      ) : (
        <button onClick={stopRecording}>⏹ Stop Recording</button>
      )}

      <br />
      <br />

      <audio ref={audioRef} controls />

      <br />
      <br />

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
      />

      <br />
      <br />

      <button onClick={saveRecording} disabled={saving}>
        💾 {saving ? "Saving..." : "Save Recording"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}