export default function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: 8,
        background: "#0b0c10",
        border: "1px solid var(--border)",
        color: "var(--text)",
        outline: "none",
      }}
    />
  );
}