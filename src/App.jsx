import { Routes, Route, Navigate } from "react-router-dom";
import RecordPage from "./pages/Recorder.jsx";
import Library from "./pages/Library.jsx";
import Share from "./pages/Share.jsx";
import Discover from "./pages/Discover.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/record" replace />} />
      <Route path="/record" element={<RecordPage />} />
      <Route path="/library" element={<Library />} />
      <Route path="/share/:id" element={<Share />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="*" element={<Navigate to="/record" replace />} />
    </Routes>
  );
}