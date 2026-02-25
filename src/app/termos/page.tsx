import type { Metadata } from "next";
import Link from "next/link";
import "./../legal.css";

export const metadata: Metadata = {
  title: "Termos de Uso | ClínicaMente",
  description:
    "Termos e condições de uso da plataforma ClínicaMente. Leia antes de utilizar nossos serviços.",
};

export default function TermosPage() {
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
        <h1>Termos de Uso</h1>
        <p className="legal-updated">Última atualização: Fevereiro de 2026</p>

        <section>
          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e utilizar a plataforma ClínicaMente ("Plataforma"), você
            ("Usuário") concorda em cumprir e estar vinculado a estes Termos de Uso
            ("Termos"). Se você não concordar com qualquer parte destes Termos, não
            deverá utilizar a Plataforma.
          </p>
        </section>

        <section>
          <h2>2. Descrição do Serviço</h2>
          <p>
            A ClínicaMente é uma plataforma digital de gestão para consultórios de
            psicologia que oferece as seguintes funcionalidades principais:
          </p>
          <ul>
            <li>Agenda online e sistema de agendamento</li>
            <li>Prontuário eletrônico</li>
            <li>Gestão financeira</li>
            <li>Sistema de lembretes automáticos</li>
            <li>Portal do paciente</li>
            <li>Controle de acesso e permissões</li>
          </ul>
        </section>

        <section>
          <h2>3. Elegibilidade</h2>
          <p>
            Para utilizar a Plataforma, você deve:
          </p>
          <ul>
            <li>Ter pelo menos 18 anos de idade</li>
            <li>
              Possuir capacidade jurídica para celebrar contratos
            </li>
            <li>
              Ser profissional de psicologia registrado no CRP (Conselho Regional de
              Psicologia) ou estar devidamente autorizado a exercer a profissão
            </li>
            <li>
              Fornecer informações verdadeiras, precisas e completas
            </li>
          </ul>
        </section>

        <section>
          <h2>4. Cadastro e Conta</h2>
          <p>
            Para acessar certain funcionalidades da Plataforma, você precisará criar
            uma conta. Você concorda em:
          </p>
          <ul>
            <li>Manter suas informações de cadastro atualizadas</li>
            <li>
              Manter a confidencialidade de sua senha e informações de acesso
            </li>
            <li>
              Ser responsável por todas as atividades realizadas em sua conta
            </li>
            <li>
              Notificar imediatamente sobre qualquer uso não autorizado de sua conta
            </li>
          </ul>
          <p>
            Reservamo-nos o direito de suspender ou encerrar contas que violem estes
            Termos.
          </p>
        </section>

        <section>
          <h2>5. Responsabilidades do Psicólogo</h2>
          <p>Ao utilizar a Plataforma, o psicólogo/usuário concorda em:</p>
          <ul>
            <li>
              Cumprir o Código de Ética Profissional do Psicólogo
            </li>
            <li>
              Obter consentimento expresso dos pacientes para tratamento de dados
            </li>
            <li>
              Manter sigilo profissional sobre todas as informações dos pacientes
            </li>
            <li>
              Garantir que possui autorização legal para exercer a profissão
            </li>
            <li>
              Utilizar a Plataforma apenas para fins profissionais legítimos
            </li>
            <li>
              Respeitar a privacidade e proteção de dados dos pacientes
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Dados dos Pacientes e Sigilo Profissional</h2>
          <p>
            O psicólogo é o único responsável pela gestão dos dados de seus pacientes
            inseridos na Plataforma. A ClínicaMente atua apenas como fornecedora
            de infraestrutura tecnológica.
          </p>
          <p>
            Você reconhece que:
          </p>
          <ul>
            <li>
              É responsável por obter todos os consentimentos necessários dos
              pacientes
            </li>
            <li>
              Deve informar aos pacientes sobre o tratamento de seus dados
            </li>
            <li>
              Deve garantir conformidade com a LGPD e outras leis aplicáveis
            </li>
            <li>
              É responsável pela segurança e confidencialidade dos dados dos
              pacientes
            </li>
          </ul>
        </section>

        <section>
          <h2>7. Assinatura e Pagamento</h2>
          <p>
            Alguns recursos da Plataforma são disponibilizados mediante assinatura
            paga. Ao contratar um plano pago, você concorda em:
          </p>
          <ul>
            <li>Pagar as taxas de assinatura conforme o plano escolhido</li>
            <li>
              Fornecer informações de pagamento válidas e atualizadas
            </li>
            <li>
              Autorizar a cobrança automática das taxas de assinatura
            </li>
          </ul>
          <p>
            As taxas de assinatura podem ser alteradas a qualquer momento, mediante
            aviso prévio. O uso contínuo da assinatura paga após alterações
            constitui aceitação das novas condições.
          </p>
        </section>

        <section>
          <h2>8. Propriedade Intelectual</h2>
          <p>
            A Plataforma e todo seu conteúdo, funcionalidades e design são de
            propriedade exclusiva da ClínicaMente e estão protegidos por direitos
            autorais, marcas registradas e outras leis de propriedade intelectual.
          </p>
          <p>Você não pode:</p>
          <ul>
            <li>Copiar, modificar ou distribuir o conteúdo da Plataforma</li>
            <li>Usar a marca ClínicaMente sem autorização prévia</li>
            <li>Realizar engenharia reversa ou descompilar a Plataforma</li>
            <li>Remover avisos de direitos autorais ou marcas</li>
          </ul>
        </section>

        <section>
          <h2>9. Uso Proibido</h2>
          <p>Você não pode utilizar a Plataforma para:</p>
          <ul>
            <li>Atividades ilegais ou fraudulentas</li>
            <li>
              Violar direitos de terceiros (incluindo direitos de privacidade e
              propriedade intelectual)
            </li>
            <li>
              Armazenar ou transmitir conteúdo malicioso ou prejudicial
            </li>
            <li>Interferir ou interromper o funcionamento da Plataforma</li>
            <li>
              Acessar sistemas ou dados não autorizados
            </li>
            <li>
              Praticar qualquer atividade que possa prejudicar a ClínicaMente ou
              seus usuários
            </li>
          </ul>
        </section>

        <section>
          <h2>10. Limitação de Responsabilidade</h2>
          <p>
            A Plataforma é fornecida "como está" e "conforme disponível". A
            ClínicaMente não garante que a Plataforma será ininterrupta, segura ou
            livre de erros.
          </p>
          <p>
            Em nenhuma circunstância a ClínicaMente será responsável por danos
            indiretos, incidentais, especiais, consequenciais ou punitivos,
            incluindo perda de lucros, dados, uso, oportunidade de negócio ou outros
            danos intangíveis.
          </p>
        </section>

        <section>
          <h2>11. Indenização</h2>
          <p>
            Você concorda em indenizar, defender e isentar a ClínicaMente e suas
            afiliadas, diretores, funcionários e agentes de qualquer reclamação,
            demanda, ação, dano, perda, custo ou despesa decorrente de:
          </p>
          <ul>
            <li>Seu uso da Plataforma</li>
            <li>Sua violação destes Termos</li>
            <li>Sua violação de direitos de terceiros</li>
            <li>Seu conteúdo inserido na Plataforma</li>
          </ul>
        </section>

        <section>
          <h2>12. Suspensão e Encerramento</h2>
          <p>
            Reservamo-nos o direito de suspender ou encerrar seu acesso à Plataforma
            a qualquer tempo, sem aviso prévio, se:
          </p>
          <ul>
            <li>Você violar estes Termos</li>
            <li>
              Seu uso da Plataforma representar risco ou dano à segurança
            </li>
            <li>
              For requerido por lei ou ordem judicial
            </li>
            <li>
              Decidirmos descontinuar a Plataforma (no todo ou em parte)
            </li>
          </ul>
        </section>

        <section>
          <h2>13. links de Terceiros</h2>
          <p>
            A Plataforma pode conter links para sites, serviços ou recursos de
            terceiros. Não somos responsáveis pelo conteúdo, precisão ou práticas
            desses sites de terceiros. A inclusão de qualquer link não implica
            endosso por nossa parte.
          </p>
        </section>

        <section>
          <h2>14. Privacidade</h2>
          <p>
            Sua privacidade é importante para nós. O uso de suas informações pessoais
            é regido pela nossa Política de Privacidade, que está incorporada a
            estes Termos por referência. Ao utilizar a Plataforma, você concorda
            com as práticas descritas na{" "}
            <Link href="/privacidade">Política de Privacidade</Link>.
          </p>
        </section>

        <section>
          <h2>15. Alterações nos Termos</h2>
          <p>
            Podemos modificar estes Termos a qualquer tempo. As alterações entrarão
            em vigor quando publicadas. O uso contínuo da Plataforma após a
            publicação das alterações constitui aceitação dos novos Termos.
          </p>
        </section>

        <section>
          <h2>16. Lei Aplicável e Resolução de Conflitos</h2>
          <p>
            Estes Termos são regidos pelas leis da República Federativa do Brasil.
            Qualquer disputa decorrente ou relacionada a estes Termos será resolvida
            no foro da Comarca de São Paulo, SP, com exclusão de qualquer outro,
            por mais privilegiado que seja.
          </p>
        </section>

        <section>
          <h2>17. Disposições Gerais</h2>
          <ul>
            <li>
              Se qualquer disposição destes Termos for considerada inválida ou
              inexequível, as demais disposições permanecerão em vigor.
            </li>
            <li>
              Nossa falha em aplicar qualquer direito ou disposição destes Termos
              não constitui renúncia a tal direito.
            </li>
            <li>
              Você não pode transferir seus direitos ou obrigações sob estes Termos
              sem nosso consentimento prévio por escrito.
            </li>
          </ul>
        </section>

        <section>
          <h2>18. Contato</h2>
          <p>
            Para questões sobre estes Termos de Uso, entre em contato:
          </p>
          <div className="legal-contact">
            <p>
              <strong>E-mail:</strong> juridico@clinicamente.com.br
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
