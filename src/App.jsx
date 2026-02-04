import { useEffect, useMemo, useState } from "react";
import { Link, Routes, Route, useLocation } from "react-router-dom";

import Discover from "./pages/Discover";
import Recorder from "./pages/Recorder";
import Library from "./pages/Library";

/** Detect if we're running inside an iframe (Whop embeds apps in an iframe). */
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function StandaloneGate() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Open inside Whop</h2>
      <p>
        This app runs inside your Whop community.  
        Please open it from within Whop.
      </p>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const embedded = useMemo(() => isInIframe(), []);
  const standalone = !embedded;

  const [whop, setWhop] = useState({
    loading: false,
    ok: false,
    data: null,
  });

  async function testWhop() {
    setWhop({ loading: true, ok: false, data: null });

    try {
      const res = await fetch("/api/me");
      const data = await res.json();

      setWhop({
        loading: false,
        ok: res.ok,
        data,
      });
    } catch (err) {
      setWhop({
        loading: false,
        ok: false,
        data: { error: err.message },
      });
    }
  }

  const isProtectedRoute =
    location.pathname === "/record" || location.pathname === "/library";

  return (
    <>
      {/* NAV */}
      <nav style={{ padding: 12, display: "flex", gap: 16 }}>
        <Link to="/">Home</Link>
        <Link to="/record">Record</Link>
        <Link to="/library">Library</Link>

        {/* 🔴 THIS IS THE IMPORTANT PART */}
        <button onClick={testWhop} style={{ marginLeft: "auto" }}>
          Test /api/me
        </button>
      </nav>

      {/* DEBUG PANEL */}
      {whop.data && (
        <pre
          style={{
            margin: 12,
            padding: 12,
            background: "#111",
            color: "#0f0",
            fontSize: 12,
            maxWidth: 900,
            overflow: "auto",
          }}
        >
          {JSON.stringify(whop, null, 2)}
        </pre>
      )}

      {/* ROUTES */}
      {standalone && isProtectedRoute ? (
        <StandaloneGate />
      ) : (
        <Routes>
          <Route path="/" element={<Discover whop={whop} />} />
          <Route path="/record" element={<Recorder whop={whop} />} />
          <Route path="/library" element={<Library whop={whop} />} />
        </Routes>
      )}
    </>
  );
}