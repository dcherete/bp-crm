export function Loading() {
  return <div className="loading"><div className="spin" /> Carregando...</div>;
}

export function Empty({ icon, title, desc }) {
  return (
    <div className="empty">
      {icon}
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
    </div>
  );
}
