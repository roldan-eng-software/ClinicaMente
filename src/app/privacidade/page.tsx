import type { Metadata } from "next";
import Link from "next/link";
import "./../legal.css";

export const metadata: Metadata = {
  title: "Política de Privacidade - LGPD | ClínicaMente",
  description:
    "Política de Privacidade da ClínicaMente em conformidade com a Lei Geral de Proteção de Dados (LGPD). Veja como protegemos seus dados pessoais.",
};

export default function PrivacidadePage() {
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
        <h1>Política de Privacidade</h1>
        <p className="legal-updated">Última atualização: Fevereiro de 2026</p>

        <section>
          <h2>1. Introdução</h2>
          <p>
            A ClínicaMente ("nós", "nosso" ou "nossa") está comprometida em proteger
            a privacidade e os dados pessoais dos usuários ("você" ou "usuário") da
            nossa plataforma. Esta Política de Privacidade descreve como coletamos,
            usamos, armazenamos, compartilhamos e protegemos suas informações pessoais
            em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 -
            LGPD).
          </p>
          <p>
            Ao utilizar a Plataforma ClínicaMente, você reconhece que leu, compreendeu
            e concorda com as práticas descritas nesta política.
          </p>
        </section>

        <section>
          <h2>2. Dados Pessoais que Coletamos</h2>
          <p>Coletamos os seguintes tipos de dados pessoais:</p>
          <ul>
            <li>
              <strong>Dados de cadastro:</strong> Nome completo, CPF, endereço de
              e-mail, telefone, data de nascimento, informações profissionais (CRO,
              especialização).
            </li>
            <li>
              <strong>Dados de pacientes:</strong> Nome, CPF, endereço, telefone,
              e-mail, data de nascimento, histórico médico, informações de saúde mental,
              dados de sessões, prontuário eletrônico.
            </li>
            <li>
              <strong>Dados financeiros:</strong> Informações de pagamento, histórico
              de transações, dados bancários (quando aplicável).
            </li>
            <li>
              <strong>Dados de acesso:</strong> Endereço IP, tipo de navegador,
              dispositivo, páginas acessadas, data e horário de acesso.
            </li>
            <li>
              <strong>Dados de consentimento:</strong> Registros de aceitação de
              termos e políticas, preferências de comunicação.
            </li>
          </ul>
        </section>

        <section>
          <h2>3. Finalidade do Tratamento</h2>
          <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
          <ul>
            <li>Prestação de serviços de gestão de consultório psicológico</li>
            <li>Agendamento e gestão de consultas</li>
            <li>Manutenção de prontuários eletrônicos</li>
            <li>Envio de lembretes e comunicações sobre consultas</li>
            <li>Processamento de pagamentos</li>
            <li>Geração de relatórios e análises</li>
            <li>Cumprimento de obrigações legais e regulatórias</li>
            <li>Suporte ao usuário e atendimento técnico</li>
            <li>Melhoria contínua da plataforma</li>
          </ul>
        </section>

        <section>
          <h2>4. Base Legal para o Tratamento</h2>
          <p>O tratamento de seus dados pessoais é realizado com base nas seguintes
            hipóteses legais previstas na LGPD:</p>
          <ul>
            <li>
              <strong>Execução de contrato:</strong> Para prestação dos serviços
              solicitados
            </li>
            <li>
              <strong>Consentimento:</strong> Para finalidades específicas mediante
              sua autorização
            </li>
            <li>
              <strong>Obrigação legal:</strong> Para cumprimento de disposições legais
              e regulatórias
            </li>
            <li>
              <strong>Legítimo interesse:</strong> Para melhorias e segurança da
              plataforma
            </li>
            <li>
              <strong>Proteção da vida:</strong> Em situações de emergência
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Compartilhamento de Dados</h2>
          <p>
            Podemos compartilhar seus dados pessoais com terceiros nas seguintes
            circunstâncias:
          </p>
          <ul>
            <li>
              <strong>Fornecedores de serviços:</strong> Empresas que nos auxiliam na
              operação da plataforma (hospedagem, processamento de pagamento,
              envio de e-mails)
            </li>
            <li>
              <strong>Autoridades legais:</strong> Quando exigido por lei, ordem
              judicial ou regulatório
            </li>
            <li>
              <strong>Psicólogos usuários:</strong> Dados de pacientes são compartilhados
              exclusivamente com o psicólogo responsável pelo atendimento
            </li>
          </ul>
          <p>
            Não vendemos seus dados pessoais a terceiros.
          </p>
        </section>

        <section>
          <h2>6. Armazenamento e Segurança</h2>
          <p>
            Armazenamos seus dados em servidores seguros com medidas de proteção
            adequadas, incluindo:
          </p>
          <ul>
            <li>Criptografia de dados em trânsito e em repouso</li>
            <li>Controle de acesso autenticado</li>
            <li>Backup regular e redundância</li>
            <li>Monitoramento de segurança contínuo</li>
            <li>Acesso restrito apenas a pessoas autorizadas</li>
          </ul>
          <p>
            Os dados são armazenados pelo período necessário para cumprir as
            finalidades descritas nesta política, respeitando os prazos legais de
            retenção.
          </p>
        </section>

        <section>
          <h2>7. Seus Direitos (LGPD)</h2>
          <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
          <ul>
            <li>
              <strong>Confirmação:</strong> Confirmar se seus dados são tratados
            </li>
            <li>
              <strong>Acesso:</strong> Obter cópia dos seus dados pessoais
            </li>
            <li>
              <strong>Correção:</strong> Solicitar correção de dados incorretos
            </li>
            <li>
              <strong>Anonimização:</strong> Solicitar anonimização de dados
            </li>
            <li>
              <strong>Exclusão:</strong> Solicitar exclusão de dados (quando aplicável)
            </li>
            <li>
              <strong>Portabilidade:</strong> Receber seus dados em formato legível
            </li>
            <li>
              <strong>Revogação:</strong> Revogar consentimento a qualquer tempo
            </li>
            <li>
              <strong>Informação:</strong> Saber com quem compartilhamos seus dados
            </li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato através do e-mail:
            <strong> privacidade@clinicamente.com.br</strong>
          </p>
        </section>

        <section>
          <h2>8. Dados de Menores de Idade</h2>
          <p>
            A plataforma não é direcionada a menores de 18 anos. Caso identifiquemos
            dados de menores, eles serão imediatamente eliminados. Psicólogos são
            responsáveis por obter consentimento dos responsáveis legais para
            tratamento de dados de pacientes menores.
          </p>
        </section>

        <section>
          <h2>9. Cookies e Tecnologias Semelhantes</h2>
          <p>
            Utilizamos cookies e tecnologias similares para melhorar sua experiência
            na plataforma. Para mais detalhes, consulte nossa{" "}
            <Link href="/politica-cookies">Política de Cookies</Link>.
          </p>
        </section>

        <section>
          <h2>10. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Em caso
            de alterações significativas,通知emos através do site ou por e-mail.
            A versão mais recente estará sempre disponível nesta página.
          </p>
        </section>

        <section>
          <h2>11. Contato</h2>
          <p>
            Para questões sobre esta Política de Privacidade ou para exercer seus
            direitos, entre em contato:
          </p>
          <div className="legal-contact">
            <p>
              <strong>E-mail:</strong> privacidade@clinicamente.com.br
            </p>
            <p>
              <strong>Encarregado de Dados (DPO):</strong> dpo@clinicamente.com.br
            </p>
          </div>
        </section>

        <section>
          <h2>12. Legislação Aplicável</h2>
          <p>
            Esta política é regida pela legislação brasileira, especialmente pela
            Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
          </p>
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
