export default function Discover() {
  return (
    <div className="page">
      <div className="bgGlow" />

      <header className="header">
        <h1 className="title">Voice Library</h1>
        <p className="subtitle">
          Record, save, and browse voice notes for your community.
        </p>
      </header>

      <main className="stack">
        <section className="card">
          <h2 className="cardTitle">Record a new message</h2>
          <p className="cardText">Capture thoughts, teachings, or voice notes.</p>

          <button className="btnPrimary">Start Recording</button>
        </section>

        <section className="card">
          <h2 className="cardTitle">Browse Library</h2>
          <p className="cardText">Listen to saved recordings from your community.</p>

          <button className="btnGhost">Open Library</button>
        </section>
      </main>
    </div>
  );
}