export default function Badge({ children }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 8px",
        borderRadius: 6,
        background: "#1f2937",
        color: "var(--muted)",
      }}
    >
      {children}
    </span>
  );
}