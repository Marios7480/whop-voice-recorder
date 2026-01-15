export default function Card({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow">
      {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
      {subtitle && <p className="mt-1 text-zinc-400">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  );
}