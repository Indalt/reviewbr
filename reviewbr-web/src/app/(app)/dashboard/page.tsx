"use client";

export default function DashboardPage() {
    const quickActions = [
        { icon: "🧭", title: "Planejar Trilha de Pesquisa", desc: "A IA sugere bases, termos e estratégias", href: "/chat?prompt=Quero planejar uma trilha de pesquisa sobre " },
        { icon: "📥", title: "Importar Dados", desc: "Upload de RIS, CSV (BVS) ou JSON", href: "/chat?prompt=Quero importar meu dataset. Tenho um arquivo em formato " },
        { icon: "🧹", title: "Deduplicar", desc: "Remover artigos repetidos por DOI e título", href: "/chat?prompt=Remova duplicatas do meu dataset" },
        { icon: "📋", title: "Triagem IA", desc: "Classificação automática por critérios", href: "/chat?prompt=Faça a triagem dos artigos usando os seguintes critérios: " },
        { icon: "🔎", title: "Auditoria Metodológica", desc: "Validar pesquisa já concluída (Post-Hoc)", href: "/chat?prompt=Quero auditar a metodologia da minha pesquisa já feita" },
        { icon: "📚", title: "Zotero", desc: "Exportar para biblioteca acadêmica", href: "/chat?prompt=Exporte os artigos incluídos para o Zotero" },
        { icon: "📊", title: "Exportar Dados", desc: "CSV, Markdown ou JSON", href: "/chat?prompt=Exporte o dataset em formato " },
        { icon: "📁", title: "Novo Projeto", desc: "Criar revisão sistemática ou exploratória", href: "/chat?prompt=Quero iniciar um novo projeto de " },
    ];

    const recentProjects = [
        { name: "Estado da Arte — Cajú", type: "systematic_review", status: "locked", date: "28/02/2026" },
        { name: "Auditoria — Tese Lobão", type: "methodological_audit", status: "audit", date: "28/02/2026" },
        { name: "Bebidas Alcoólicas", type: "exploratory", status: "draft", date: "14/02/2026" },
    ];

    const statusLabels: Record<string, string> = {
        draft: "Rascunho",
        planning: "Planejamento",
        locked: "Execução Travada",
        audit: "Auditoria",
    };

    return (
        <>
            <header className="main-header">
                <h1>Dashboard</h1>
            </header>

            <div className="main-body">
                <section className="welcome-section">
                    <h2 className="welcome-title">Bem-vindo ao ReviewBR</h2>
                    <p className="welcome-subtitle">Selecione uma ação ou converse com a IA no chat para iniciar.</p>
                </section>

                <section>
                    <div className="section-header">
                        <h3 className="section-title">Ações Rápidas</h3>
                    </div>
                    <div className="cards-grid">
                        {quickActions.map((action) => (
                            <a key={action.title} href={action.href} className="card" style={{ textDecoration: 'none' }}>
                                <span className="card-icon">{action.icon}</span>
                                <div className="card-title">{action.title}</div>
                                <div className="card-description">{action.desc}</div>
                            </a>
                        ))}
                    </div>
                </section>

                <section style={{ marginTop: 32 }}>
                    <div className="section-header">
                        <h3 className="section-title">Projetos Recentes</h3>
                    </div>
                    <div className="projects-list">
                        {recentProjects.map((project) => (
                            <div key={project.name} className="project-item">
                                <div style={{ flex: 1 }}>
                                    <div className="project-item-name">{project.name}</div>
                                    <div className="project-item-meta">{project.date}</div>
                                </div>
                                <span className={`status-badge ${project.status}`}>
                                    {statusLabels[project.status]}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
