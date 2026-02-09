import { Routes, Route, Navigate } from "react-router-dom";

import Recorder from "./pages/Recorder.jsx";
import LibraryPage from "./pages/LibraryPage.jsx";
import SharePage from "./pages/SharePage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/record" replace />} />

      {/* Core pages */}
      <Route path="/record" element={<Recorder />} />
      <Route path="/library" element={<LibraryPage />} />

      {/* Public share page */}
      <Route path="/share/:id" element={<SharePage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/record" replace />} />
    </Routes>
  );
}