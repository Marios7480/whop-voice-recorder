import React, { useMemo, useState } from "react";
import { Routes, Route, Navigate, Link, useParams } from "react-router-dom";

export default function App() {
  return (
    <div style={styles.app}>
      <Routes>
        <Route path="/" element={<Navigate to="/discover" replace />} />

        <Route path="/discover" element={<Discover />} />
        <Route path="/dashboard/:companyId" element={<Dashboard />} />
        <Route path="/experience/:experienceId" element={<Experience />} />

        {/* Safety */}
        <Route path="*" element={<Navigate to="/discover" replace />} />
      </Routes>
    </div>
  );
}

function Discover() {
  return (
    <Page
      title="Discover"
      subtitle="Entry screen for Whop review. Use the buttons below to test core flows."
    >
      <div style={{ display: "grid", gap: 12, maxWidth: 520 }}>
        <Card>
          <div style={{ fontSize: 14, opacity: 0.85, marginBottom: 10 }}>
            Quick test links:
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <LinkButton to="/dashboard/456">Open Dashboard (companyId=456)</LinkButton>
            <LinkButton to="/experience/123">Open Experience (experienceId=123)</LinkButton>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 14, opacity: 0.85 }}>What review can test:</div>
          <ul style={{ marginTop: 8, lineHeight: 1.6 }}>
            <li>Dashboard: add/remove mock recordings (UI updates)</li>
            <li>Experience: start + save simulated recording flow</li>
            <li>Routes render in production (no placeholder-only screens)</li>
          </ul>
        </Card>
      </div>
    </Page>
  );
}

function Dashboard() {
  const { companyId } = useParams();
  const [items, setItems] = useState([
    { id: "rec-1", name: "Recording 1 (mock)" },
    { id: "rec-2", name: "Recording 2 (mock)" },
  ]);

  function addMock() {
    const next = items.length + 1;
    setItems((prev) => [
      ...prev,
      { id: `rec-${Date.now()}`, name: `Recording ${next} (mock)` },
    ]);
  }

  function remove(id) {
    setItems((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <Page
      title="Dashboard"
      subtitle={`Company: ${companyId} — reviewer can test adding/removing items and see UI updates.`}
    >
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <Card>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.button} onClick={addMock}>
              Add Mock Recording
            </button>
            <LinkButton to="/discover">Back to Discover</LinkButton>
          </div>
        </Card>

        <Card>
          <div style={{ fontSize: 16, marginBottom: 10 }}>Recordings</div>
          {items.length === 0 ? (
            <div style={{ opacity: 0.8 }}>
              No recordings yet. Click “Add Mock Recording”.
            </div>
          ) : (
            <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8 }}>
              {items.map((x) => (
                <li key={x.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{x.name}</span>
                  <button style={styles.smallButton} onClick={() => remove(x.id)}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  );
}

function Experience() {
  const { experienceId } = useParams();
  const [status, setStatus] = useState("idle"); // idle | recording | saved
  const canSave = status === "recording";

  const statusText = useMemo(() => {
    if (status === "idle") return "Ready";
    if (status === "recording") return "Recording… (simulated)";
    if (status === "saved") return "Recording saved successfully (simulated)";
    return "";
  }, [status]);

  function start() {
    setStatus("recording");
  }

  function save() {
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <Page
      title="Voice Experience"
      subtitle={`Experience: ${experienceId} — functional test flow for Whop review.`}
    >
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        <Card>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={styles.button} onClick={start}>
              Start Recording
            </button>
            <button
              style={{ ...styles.button, opacity: canSave ? 1 : 0.45 }}
              onClick={save}
              disabled={!canSave}
            >
              Save Recording
            </button>
            <LinkButton to="/discover">Back to Discover</LinkButton>
          </div>

          <div style={{ marginTop: 14, opacity: 0.9 }}>
            Status: <strong>{statusText}</strong>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            (Simulated so review can test end-to-end without mic permissions.)
          </div>
        </Card>
      </div>
    </Page>
  );
}

/** UI bits */

function Page({ title, subtitle, children }) {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.h1}>{title}</div>
        <div style={styles.subtitle}>{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function Card({ children }) {
  return <div style={styles.card}>{children}</div>;
}

function LinkButton({ to, children }) {
  return (
    <Link to={to} style={styles.linkButton}>
      {children}
    </Link>
  );
}

const styles = {
  app: { minHeight: "100vh" },
  page: { padding: 28 },
  header: { marginBottom: 18 },
  h1: { fontSize: 54, fontWeight: 800, marginBottom: 10 },
  subtitle: { fontSize: 16, opacity: 0.85, lineHeight: 1.4, maxWidth: 900 },
  card: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 14,
    padding: 16,
  },
  button: {
    background: "rgba(255,255,255,0.10)",
    border: "1px solid rgba(255,255,255,0.16)",
    color: "white",
    padding: "12px 16px",
    borderRadius: 12,
    cursor: "pointer",
    fontSize: 16,
  },
  smallButton: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "white",
    padding: "6px 10px",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 13,
  },
  linkButton: {
    display: "inline-block",
    textDecoration: "none",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.14)",
    color: "white",
    padding: "12px 16px",
    borderRadius: 12,
    fontSize: 16,
  },
};