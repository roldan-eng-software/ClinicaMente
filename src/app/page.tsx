import Image from "next/image";
import Link from "next/link";
import CookieBanner from "@/components/CookieBanner";

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  const projectName = "ClínicaMente";

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      
      {/* 1. NAVBAR */}
      <header className="fixed top-0 w-full bg-white/90 backdrop-blur-md shadow-sm z-50 transition-all border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          
          {/* Esquerda: Favicon e Logotipo em PNG */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image src="/favicon.ico" alt="Ícone" fill className="object-contain" />
            </div>
            <div className="relative w-28 h-8 hidden sm:block">
              {/* <Image src="/logotipo.png" alt="Logotipo do Projeto" fill className="object-contain" /> */}
              <span className="font-bold text-lg text-blue-700">ClínicaMente</span>
            </div>
          </div>

          {/* Centro: Nome do Projeto */}
          <div className="absolute left-1/2 transform -translate-x-1/2 font-bold text-xl text-gray-800 tracking-tight hidden md:block">
            {projectName}
          </div>

          {/* Direita: Botão Entrar */}
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-all shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Entrar
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION Larga e Reativa */}
      <section className="relative w-full h-screen min-h-[600px] flex items-center justify-center mt-16">
        <div className="absolute inset-0 -z-10 bg-blue-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 opacity-90" />
        </div>
        
        <div className="text-center px-4 max-w-4xl mx-auto z-10 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-blue-800/50 backdrop-blur-sm border border-blue-700 text-blue-100 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Mais de 500 психólogos confiam em nós
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
            Organize sua clínica, <span className="text-blue-300">cuide mais dos seus pacientes.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Agendamentos online, prontuários seguros, finanças em um só lugar e lembretes automáticos. Tudo pensado para o dia a dia do psicólogo moderno.
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
             <Link href="/signup" className="bg-white text-blue-800 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:scale-105">
                Começar agora grátis
             </Link>
             <Link href="#como-funciona" className="border border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold transition-all">
                Ver como funciona
             </Link>
          </div>
          <div className="flex items-center justify-center gap-8 opacity-70">
            <span className="text-gray-300 text-sm font-medium">Utilizado por clínicas parceiras:</span>
            <div className="flex gap-4 items-center">
              <div className="w-20 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-white/70">CRP-SP</div>
              <div className="w-20 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-white/70">CRP-RJ</div>
              <div className="w-20 h-8 bg-white/10 rounded flex items-center justify-center text-xs text-white/70">SBP</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 STATS ROW */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600 mt-1">Psicólogos ativos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">50.000+</div>
              <div className="text-gray-600 mt-1">Consultas agendadas</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">98%</div>
              <div className="text-gray-600 mt-1">Redução de faltosos</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-600">4.9</div>
              <div className="text-gray-600 mt-1">Nota média</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PADRÃO APRESENTAÇÃO DE SERVIÇOS */}
      <main className="flex-grow bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Funcionalidades que simplificam sua rotina</h2>
            <p className="mt-4 text-gray-600">Da primeira consulta ao acompanhamento financeiro, a ClínicaMente cuida dos detalhes.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                📅
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Agenda Inteligente</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Visualize sua semana em segundos, crie horários recorrentes e receba agendamentos online sem perder o controle.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 group">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                🔒
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Prontuários Seguros</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Registros clínicos estruturados, histórico de sessões e observações importantes em um só lugar.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 group">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                💰
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Finanças Descomplicadas</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                 Acompanhe recebimentos, pendências e faturamento mensal sem planilhas complicadas.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 border border-gray-100 group">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-2xl">
                🔔
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lembretes Automáticos</h3>
              <p className="text-gray-600 leading-relaxed text-sm">
                Reduza faltas com mensagens automáticas de confirmação e lembrete para seus pacientes.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 2.6 COMO FUNCIONA / PROBLEMA-SOLUÇÃO */}
      <section id="como-funciona" className="bg-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Como a ClínicaMente transforma sua rotina</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">Em apenas 3 passos, você tem toda a gestão da sua clínica automatizada</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cadastre suas informações</h3>
              <p className="text-gray-600">Configure seus horários, valores de sessão e preferências em poucos minutos. Nossa interface intuitiva guiding você em cada etapa.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compartilhe seu link</h3>
              <p className="text-gray-600">Receba um link personalizado para seus pacientes agendarem sozinho, a qualquer hora. Sem intermediários, sem trocas de mensagem.</p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-6">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Tudo automatizado</h3>
              <p className="text-gray-600">Lembretes automáticos, prontuários digitais, controle financeiro e relatórios. Você foca no atendimento, nós cuidamos do resto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CARROSSEL INFINITO (MARQUEE) */}
      <section className="w-full bg-gray-100 overflow-hidden relative border-y border-gray-200">
        <div className="flex w-[200%] animate-marquee">
          {/* Loop de 10 imagens (5 originais + 5 duplicadas para efeito infinito) */}
          {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((idx, i) => (
            <div 
              key={`${idx}-${i}`} 
              className="w-full md:w-1/2 lg:w-1/3 flex-none relative h-[400px] sm:h-[450px] bg-slate-300 border-r border-white"
            >
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-bold opacity-50 text-2xl">
                 Foto do Sistema {idx}
              </div>
              
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-24 text-center">
                <p className="text-white text-base md:text-lg font-medium drop-shadow-md">
                   {idx === 1 && "Agenda dinâmica e intuitiva para não perder nenhum horário."}
                   {idx === 2 && "Prontuários seguros e criptografados para garantir a LGPD."}
                   {idx === 3 && "Visão financeira clara do seu faturamento mensal."}
                   {idx === 4 && "Área do paciente para agendamentos simplificados."}
                   {idx === 5 && "Relatórios completos sobre a sua clínica."}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">O que dizem nossos clientes</h2>
            <p className="text-lg text-gray-600">Psicólogos que transformaram sua rotina com a ClínicaMente</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"A ClínicaMente transformou completamente minha gestão. Meu tempo gasto com agenda reduziu em 70% e meus pacientes adoram a facilidade de agendar."</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">DR</div>
                <div>
                  <div className="font-semibold text-gray-900">Dra. Roberta Lima</div>
                  <div className="text-sm text-gray-500">CRP 06/123456</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"Finalmente consigo focar no atendimento. Os lembretes automáticos reduziram minhas faltas de 30% para quase zero. Investimento que vale cada centavo."</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">MJ</div>
                <div>
                  <div className="font-semibold text-gray-900">Dr. Marcos Júnior</div>
                  <div className="text-sm text-gray-500">CRP 07/987654</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[1,2,3,4,5].map((s) => (
                  <span key={s} className="text-amber-400">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">"Prontuários seguros e fácil acesso. Posso atender online e presencial com a mesma qualidade. Super recomendo para quem está começando."</p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">AS</div>
                <div>
                  <div className="font-semibold text-gray-900">Dra. Ana Silva</div>
                  <div className="text-sm text-gray-500">CRP 05/456789</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Perguntas Frequentes</h2>
            <p className="text-lg text-gray-600">Tire suas dúvidas sobre a ClínicaMente</p>
          </div>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">É seguro armazenar prontuários na nuvem?</h3>
              <p className="text-gray-600">Sim! Utilizamos criptografia de ponta e estamos em conformidade com a LGPD. Seus dados e de seus pacientes estão completamente protegidos.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Posso testar antes de pagar?</h3>
              <p className="text-gray-600">Oferecemos 14 dias de teste gratuito, sem necessidade de cartão de crédito. Você pode experimentar todas as funcionalidades antes de decidir.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Quais formas de pagamento aceita?</h3>
              <p className="text-gray-600">Aceitamos cartão de crédito (parcelamento em até 12x), PIX e boleto bancário. Você pode cancelar a qualquer momento.</p>
            </div>
            <div className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Preciso de conhecimento técnico para usar?</h3>
              <p className="text-gray-600">Não! A plataforma foi desenhada para ser intuitiva. Em poucos minutos você configura tudo. Oferecemos suporte gratuito por chat e email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Planos (Call To Action pre-footer) */}
      <section className="bg-white py-24">
         <div className="max-w-4xl mx-auto px-4 text-center">
             <h2 className="text-3xl font-bold text-gray-900 mb-6">Pronto para dar o próximo passo na gestão da sua clínica?</h2>
             <p className="text-lg text-gray-600 mb-8">
                Crie sua conta em poucos minutos e experimente uma rotina mais leve, com tecnologia pensada para o seu consultório.
             </p>
             <Link href="/pricing" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl">
                Ver Planos e Preços
             </Link>
         </div>
      </section>

      {/* 5. FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-16 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="text-white font-semibold mb-4">Produto</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/#como-funciona" className="hover:text-white transition-colors">Como funciona</Link>
                <Link href="/pricing" className="hover:text-white transition-colors">Planos e Preços</Link>
                <Link href="/signup" className="hover:text-white transition-colors">Teste gratuito</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Empresa</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="#" className="hover:text-white transition-colors">Sobre nós</Link>
                <Link href="#" className="hover:text-white transition-colors">Blog</Link>
                <Link href="#" className="hover:text-white transition-colors">Carreiras</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Recursos</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="#" className="hover:text-white transition-colors">Central de ajuda</Link>
                <Link href="#" className="hover:text-white transition-colors">Guias</Link>
                <Link href="#" className="hover:text-white transition-colors">Webinars</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
                <Link href="/termos" className="hover:text-white transition-colors">Termos</Link>
                <Link href="/politica-cookies" className="hover:text-white transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CM</span>
              </div>
              <span className="font-bold text-white">{projectName}</span>
            </div>
            
            <div className="text-sm">
              &copy; {currentYear} {projectName}. Todos os direitos reservados.
            </div>
            
            <div className="text-sm">
              Desenvolvido por{' '}
              <a 
                href="https://roldan-eng-software.github.io/roldan-page/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Roldan Eng Software
              </a>
            </div>
          </div>
          
        </div>
      </footer>
      
      <CookieBanner />
    </div>
  );
}
