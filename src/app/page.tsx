import type { Metadata } from "next";
import Link from "next/link";
import "./landing.css";
import CookieBanner from "@/components/CookieBanner";
import PricingPlans from "@/components/PricingPlans";

export const metadata: Metadata = {
  title:
    "Software de gestão para psicólogos com agenda online e prontuário eletrônico",
  description:
    "Conheça a ClínicaMente, a plataforma de gestão para psicólogos com agenda online, prontuário eletrônico, finanças e lembretes automáticos para reduzir faltas e organizar seu consultório.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "ClínicaMente",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "pt-BR",
      description:
        "Software de gestão para psicólogos com agenda online, prontuário eletrônico, controle financeiro e lembretes automáticos para pacientes.",
    },
    {
      "@type": "Organization",
      name: "ClínicaMente",
      description:
        "Plataforma de gestão para consultórios de psicologia e profissionais da saúde mental.",
      address: {
        "@type": "PostalAddress",
        addressCountry: "BR",
      },
    },
  ],
};

export default function Home() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-logo">
          <span className="landing-logo-mark" />
          <span className="landing-logo-text">
            Clínica<span>Mente</span>
          </span>
        </div>

        <nav className="landing-nav">
          <a href="#features">Funcionalidades</a>
          <a href="#how-it-works">Como funciona</a>
          <a href="#benefits">Benefícios</a>
          <a href="#pricing">Planos</a>
        </nav>

        <div className="landing-header-actions">
          <Link href="/login" className="landing-login-link">
            Entrar
          </Link>
          <Link href="/signup" className="landing-cta-button landing-cta-button--outline">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-pill">
              <span className="landing-pill-dot" />
              Plataforma completa de gestão para psicólogos
            </div>

            <h1>
              Organize sua clínica,
              <span> cuide mais dos seus pacientes.</span>
            </h1>

            <p>
              Agendamentos online, prontuários seguros, finanças em um só lugar e lembretes
              automáticos. Tudo pensado para o dia a dia do psicólogo moderno.
            </p>

            <div className="landing-hero-actions">
              <Link href="/signup" className="landing-cta-button">
                Começar agora
              </Link>
              <Link href="/login" className="landing-secondary-link">
                Já tenho conta
              </Link>
            </div>

            <div className="landing-hero-metas">
              <div>
                <strong>Menos no-show</strong>
                <span>com lembretes automáticos por e-mail</span>
              </div>
              <div>
                <strong>Dados protegidos</strong>
                <span>segurança pensada para sigilo profissional</span>
              </div>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="landing-hero-card landing-hero-card--primary">
              <div className="landing-hero-card-header">
                <span className="landing-badge">Agenda de hoje</span>
                <span className="landing-status-dot" />
              </div>
              <ul className="landing-appointments">
                <li>
                  <span className="time">09:00</span>
                  <span className="name">Ana Paula</span>
                  <span className="type">Online</span>
                </li>
                <li>
                  <span className="time">11:00</span>
                  <span className="name">Carlos Silva</span>
                  <span className="type">Presencial</span>
                </li>
                <li>
                  <span className="time">15:30</span>
                  <span className="name">Mariana Souza</span>
                  <span className="type">Online</span>
                </li>
              </ul>
            </div>

            <div className="landing-hero-card landing-hero-card--secondary">
              <p className="landing-metric-title">Visão geral do mês</p>
              <div className="landing-metrics">
                <div>
                  <span className="label">Sessões realizadas</span>
                  <span className="value">42</span>
                </div>
                <div>
                  <span className="label">Taxa de presença</span>
                  <span className="value">96%</span>
                </div>
                <div>
                  <span className="label">Receita prevista</span>
                  <span className="value">R$ 7.480</span>
                </div>
              </div>
            </div>

            <div className="landing-orbit landing-orbit--one" />
            <div className="landing-orbit landing-orbit--two" />
          </div>
        </section>

        <section id="features" className="landing-section">
          <div className="landing-section-header">
            <h2>Funcionalidades que simplificam sua rotina</h2>
            <p>
              Da primeira consulta ao acompanhamento financeiro, a ClínicaMente cuida dos detalhes
              para você focar no cuidado com as pessoas.
            </p>
          </div>

          <div className="landing-grid">
            <article className="landing-feature-card">
              <div className="icon icon--schedule" />
              <h3>Agenda inteligente</h3>
              <p>
                Visualize sua semana em segundos, crie horários recorrentes e receba agendamentos
                online sem perder o controle.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="icon icon--patients" />
              <h3>Prontuários organizados</h3>
              <p>
                Registros clínicos estruturados, histórico de sessões e observações importantes em
                um só lugar.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="icon icon--finance" />
              <h3>Finanças descomplicadas</h3>
              <p>
                Acompanhe recebimentos, pendências e faturamento mensal sem planilhas complicadas.
              </p>
            </article>

            <article className="landing-feature-card">
              <div className="icon icon--reminders" />
              <h3>Lembretes automáticos</h3>
              <p>
                Reduza faltas com mensagens automáticas de confirmação e lembrete para seus
                pacientes.
              </p>
            </article>
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-section--muted">
          <div className="landing-section-header">
            <h2>Comece em poucos minutos</h2>
            <p>
              Sem instalação, sem complicação. Crie sua conta, personalize sua clínica e comece a
              atender com mais organização hoje mesmo.
            </p>
          </div>

          <ol className="landing-steps">
            <li>
              <span className="step-number">1</span>
              <div>
                <h3>Crie sua conta</h3>
                <p>Cadastro rápido pensado para profissionais da psicologia.</p>
              </div>
            </li>
            <li>
              <span className="step-number">2</span>
              <div>
                <h3>Configure sua agenda</h3>
                <p>Defina dias, horários, modalidades e valores das sessões.</p>
              </div>
            </li>
            <li>
              <span className="step-number">3</span>
              <div>
                <h3>Compartilhe o link com pacientes</h3>
                <p>Permita que novos pacientes agendem diretamente com você.</p>
              </div>
            </li>
          </ol>
        </section>

        <section id="benefits" className="landing-section landing-section--columns">
          <div className="landing-section-header">
            <h2>Feito por quem entende a rotina de consultório</h2>
            <p>
              A ClínicaMente nasceu para apoiar psicólogos em todas as etapas do atendimento, do
              primeiro contato ao acompanhamento contínuo.
            </p>
          </div>

          <div className="landing-benefits">
            <div className="landing-benefit">
              <p className="highlight">+ tempo com pacientes</p>
              <p>Menos tempo em tarefas administrativas e mais foco no que importa.</p>
            </div>
            <div className="landing-benefit">
              <p className="highlight">+ previsibilidade financeira</p>
              <p>Visão clara de recebimentos e próximos atendimentos.</p>
            </div>
            <div className="landing-benefit">
              <p className="highlight">+ profissionalismo</p>
              <p>Experiência moderna e organizada para quem chega até sua clínica.</p>
            </div>
          </div>
        </section>

        <PricingPlans />

        <section className="landing-section landing-cta-section">
          <div className="landing-cta-panel">
            <div>
              <h2>Pronto para dar o próximo passo na gestão da sua clínica?</h2>
              <p>
                Crie sua conta em poucos minutos e experimente uma rotina mais leve, com tecnologia
                pensada para o seu consultório.
              </p>
            </div>
            <div className="landing-cta-actions">
              <Link href="/signup" className="landing-cta-button landing-cta-button--large">
                Criar conta gratuita
              </Link>
              <Link href="/login" className="landing-secondary-link">
                Já sou cliente
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo-text">
              Clínica<span>Mente</span>
            </span>
            <span className="landing-footer-note">
              Gestão moderna para consultórios de psicologia.
            </span>
          </div>
          <div className="landing-footer-links">
            <Link href="/login">Acessar sistema</Link>
            <Link href="/signup">Criar conta</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/termos">Termos de Uso</Link>
            <Link href="/politica-cookies">Cookies</Link>
          </div>
        </div>
        <p className="landing-footer-copy">
          © {new Date().getFullYear()} ClínicaMente. Todos os direitos reservados.
        </p>
      </footer>
      <CookieBanner />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
