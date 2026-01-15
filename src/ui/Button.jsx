export default function Button({ children, variant = "primary", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-500"
      : "bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700";

  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
}