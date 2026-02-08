{item.canDelete && (
  <button
    onClick={async () => {
      await fetch("/api/recordings/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
        credentials: "include",
      });
      load(); // refresh list
    }}
  >
    🗑 Delete
  </button>
)}