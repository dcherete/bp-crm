export default function Layout({ title, actions, children }) {
  return (
    <>
      <div className="topbar">
        <h1>{title}</h1>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      <div className="content">
        {children}
      </div>
    </>
  );
}
