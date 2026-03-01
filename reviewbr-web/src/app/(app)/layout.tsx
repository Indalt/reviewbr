export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">Review<span>BR</span></div>
                </div>

                <nav className="sidebar-section">
                    <div className="sidebar-section-title">Menu</div>
                    <a href="/dashboard" className="sidebar-item active">
                        <span className="sidebar-item-icon">🏠</span>
                        Dashboard
                    </a>
                    <a href="/chat" className="sidebar-item">
                        <span className="sidebar-item-icon">💬</span>
                        Nova Conversa
                    </a>
                </nav>

                <nav className="sidebar-section">
                    <div className="sidebar-section-title">Projetos</div>
                    <a href="/chat?prompt=Abra o projeto Cajú" className="sidebar-item">
                        <span className="sidebar-item-icon">📁</span>
                        Cajú — Estado da Arte
                        <span className="sidebar-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: 'var(--error)' }}>●</span>
                    </a>
                    <a href="/chat?prompt=Abra o projeto Auditoria Lobão" className="sidebar-item">
                        <span className="sidebar-item-icon">📁</span>
                        Auditoria Lobão
                        <span className="sidebar-badge" style={{ background: 'rgba(124, 106, 255, 0.15)', color: 'var(--accent)' }}>●</span>
                    </a>
                    <a href="/chat?prompt=Abra o projeto Bebidas Alcoólicas" className="sidebar-item">
                        <span className="sidebar-item-icon">📁</span>
                        Bebidas Alcoólicas
                        <span className="sidebar-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--warning)' }}>●</span>
                    </a>
                </nav>

                <nav className="sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <a href="/setup" className="sidebar-item">
                        <span className="sidebar-item-icon">⚙️</span>
                        Configuração
                    </a>
                </nav>
            </aside>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
}
