import type { Metadata } from "next";
import Link from "next/link";
import "./../legal.css";

export const metadata: Metadata = {
  title: "Política de Cookies | ClínicaMente",
  description:
    "Saiba como a ClínicaMente utiliza cookies e tecnologias similares para melhorar sua experiência.",
};

export default function PoliticaCookiesPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <Link href="/" className="legal-logo">
          <span className="landing-logo-mark" />
          <span className="landing-logo-text">
            Clínica<span>Mente</span>
          </span>
        </Link>
      </header>

      <main className="legal-content">
        <h1>Política de Cookies</h1>
        <p className="legal-updated">Última atualização: Fevereiro de 2026</p>

        <section>
          <h2>1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto que são armazenados no seu
            dispositivo (computador, tablet, smartphone) quando você visita um
            site. Eles permitem que o site reconheça seu dispositivo elembre de
            informações sobre sua visita, como seu idioma preferido, login e outras
            configurações.
          </p>
        </section>

        <section>
          <h2>2. Por que utilizamos Cookies?</h2>
          <p>A ClínicaMente utiliza cookies para:</p>
          <ul>
            <li>
              <strong>Funcionalidade essencial:</strong> Garantir o funcionamento
              adequado da Plataforma, incluindo autenticação e segurança
            </li>
            <li>
              <strong>Preferências:</strong> Lembrar suas configurações e
              preferências
            </li>
            <li>
              <strong>Desempenho:</strong> Analisar como você utiliza a Plataforma
              para melhorar nossos serviços
            </li>
            <li>
              <strong>Personalização:</strong> Oferecer conteúdo e funcionalidades
              adaptadas aos seus interesses
            </li>
            <li>
              <strong>Marketing:</strong> Apresentar anúncios relevantes (quando
              aplicável)
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Tipos de Cookies que Utilizamos</h2>
          
          <h3>3.1 Cookies Essenciais</h3>
          <p>
            São necessários para o funcionamento básico da Plataforma. Sem eles,
            você não conseguirá acessar áreas seguras ou usar serviços essenciais.
          </p>
          <ul>
            <li>Autenticação de usuários</li>
            <li>Controle de sessão</li>
            <li>Segurança da plataforma</li>
            <li>Balanceamento de carga</li>
          </ul>

          <h3>3.2 Cookies de Funcionalidade</h3>
          <p>
            Permitem lembrar escolhas que você faz e personalizar sua experiência.
          </p>
          <ul>
            <li>Idioma preferido</li>
            <li>Configurações de acessibilidade</li>
            <li>Preferências de tema</li>
          </ul>

          <h3>3.3 Cookies de Desempenho/Analíticos</h3>
          <p>
            Coletam informações sobre como você utiliza a Plataforma, helping us
            a melhorar seu desempenho.
          </p>
          <ul>
            <li>Páginas mais visitadas</li>
            <li>Tempo de permanência nas páginas</li>
            <li>Erros encontrados</li>
            <li>Origem do tráfego</li>
          </ul>

          <h3>3.4 Cookies de Marketing/Publicidade</h3>
          <p>
            Utilizados para apresentar anúncios relevantes e medir a eficácia de
            campanhas.
          </p>
          <ul>
            <li>Perfis de interesse</li>
            <li>Anúncios visualizados</li>
            <li>Interações com anúncios</li>
          </ul>
        </section>

        <section>
          <h2>4. Cookies de Terceiros</h2>
          <p>
            Alguns cookies são definidos por serviços de terceiros que aparecem em
            nossas páginas. Esses terceiros incluem:
          </p>
          <ul>
            <li>
              <strong>Google Analytics:</strong> Para análise de audiência e
              desempenho
            </li>
            <li>
              <strong>Stripe:</strong> Para processamento de pagamentos
            </li>
            <li>
              <strong>Supabase:</strong> Para infraestrutura de banco de dados e
              autenticação
            </li>
          </ul>
          <p>
            Não temos controle sobre esses cookies de terceiros. Recomendamos que
            você consulte as políticas de privacidade desses provedores.
          </p>
        </section>

        <section>
          <h2>5. Gerenciamento de Cookies</h2>
          <p>
            Você pode controlar e/or gerenciar os cookies de várias formas. Observe
            que a remoção ou bloqueio de cookies pode impactar sua experiência de
            uso da Plataforma.
          </p>

          <h3>5.1 Através do nosso Banner de Cookies</h3>
          <p>
            Ao acessar a Plataforma pela primeira vez, você verá um banner de cookies
            onde poderá:
          </p>
          <ul>
            <li>Aceitar todos os cookies</li>
            <li>Rejeitar cookies não essenciais</li>
            <li>Personalizar suas preferências</li>
          </ul>

          <h3>5.2 Através do navegador</h3>
          <p>
            A maioria dos navegadores permite que você recuse ou aceite cookies, e
            delete cookies existentes. Veja como fazer em alguns navegadores comuns:
          </p>
          <ul>
            <li>
              <strong>Chrome:</strong> Configurações → Privacidade e segurança →
              Cookies
            </li>
            <li>
              <strong>Firefox:</strong> Preferências → Privacidade → Cookies
            </li>
            <li>
              <strong>Safari:</strong> Preferências → Privacidade → Cookies
            </li>
            <li>
              <strong>Edge:</strong> Configurações → Permissões de site → Cookies
            </li>
          </ul>

          <h3>5.3 Ferramentas de Opt-out</h3>
          <p>
            Você também pode optar por não ser rastreado por serviços analíticos:
          </p>
          <ul>
            <li>
              <a
                href="https://tools.google.com/dlpage/gaoptout"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google Analytics Opt-out
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Categorias de Cookies que Utilizamos</h2>
          <table className="cookies-table">
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Tipo</th>
                <th>Finalidade</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Essencial</td>
                <td>Session</td>
                <td>Autenticação e segurança</td>
                <td>Durante sessão</td>
              </tr>
              <tr>
                <td>Essencial</td>
                <td>Persistent</td>
                <td>Preferências de idioma</td>
                <td>1 ano</td>
              </tr>
              <tr>
                <td>Funcionalidade</td>
                <td>Persistent</td>
                <td>Configurações do usuário</td>
                <td>1 ano</td>
              </tr>
              <tr>
                <td>Analítico</td>
                <td>Persistent</td>
                <td>Análise de audiência</td>
                <td>2 anos</td>
              </tr>
              <tr>
                <td>Marketing</td>
                <td>Persistent</td>
                <td>Personalização de anúncios</td>
                <td>90 dias</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2>7. Atualizações desta Política</h2>
          <p>
            Podemos atualizar esta Política de Cookies periodicamente. Em caso de
            alterações significativas,通知aremos através da Plataforma. A versão
            mais recente estará sempre disponível nesta página.
          </p>
        </section>

        <section>
          <h2>8. Contato</h2>
          <p>
            Para questões sobre esta Política de Cookies, entre em contato:
          </p>
          <div className="legal-contact">
            <p>
              <strong>E-mail:</strong> privacidade@clinicamente.com.br
            </p>
          </div>
        </section>
      </main>

      <footer className="legal-footer">
        <Link href="/">Voltar para a página inicial</Link>
        <p>
          © {new Date().getFullYear()} ClínicaMente. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
