import Button from "../ui/Button";
import Card from "../ui/Card";

export default function Discover() {
  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 24 }}>Voice Library</h1>

      <div style={{ display: "grid", gap: 16 }}>
        <Card>
          <h3>Record a new message</h3>
          <p style={{ color: "var(--muted)" }}>
            Capture thoughts, teachings, or voice notes.
          </p>
          <Button>Start Recording</Button>
        </Card>

        <Card>
          <h3>Browse Library</h3>
          <p style={{ color: "var(--muted)" }}>
            Listen to saved recordings from your community.
          </p>
          <Button variant="secondary">Open Library</Button>
        </Card>
      </div>
    </div>
  );
}