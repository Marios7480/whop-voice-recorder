import { Routes, Route, Link, useLocation } from "react-router-dom";
import Recorder from "./pages/Recorder";
import Library from "./pages/Library";

export default function App() {
  const location = useLocation();

  return (
    <div style={{ padding: 20 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link to="/" style={{ marginRight: 10 }}>Record</Link>
        <Link to="/library">Library</Link>
      </nav>

      <Routes location={location}>
        <Route path="/" element={<Recorder />} />
        <Route path="/library" element={<Library />} />
      </Routes>
    </div>
  );
}