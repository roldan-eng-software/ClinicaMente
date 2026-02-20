# ClínicaMente - MicroSaaS para Psicólogos

Plataforma completa de gestão de clínica psicológica com agendamento online, gestão de pacientes, pagamentos e lembretes automatizados.

## Quick Start

### 1. Configuração do Ambiente

```bash
# Clone o repositório
git clone https://github.com/roldan-eng-software/ClinicaMente.git
cd ClinicaMente

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
```

### 2. Variáveis de Ambiente

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PRO_PRICE_ID=price_xxx

# Email (Resend)
EMAIL_API_KEY=re_xxx

# WhatsApp (Twilio)
WHATSAPP_API_KEY=xxx
```

### 3. Execute o Seed de Dados (Desenvolvimento)

No painel do Supabase (SQL Editor), execute o script `supabase/seed.sql` para criar dados de teste.

### 4. Inicie o Servidor

```bash
npm run dev
```

Acesse http://localhost:3000

---

## Guia de Testes por Fase

### Fase 0-4: Autenticação e Onboarding

**Teste de Cadastro:**
1. Acesse `/signup`
2. Preencha os dados: nome, email, senha
3. Complete o onboarding em 4 etapas:
   - Dados da clínica (nome, endereço, especialidade)
   - Configurações financeiras (preço da sessão)
   - Disponibilidade (dias e horários)
   - Confirmação

**Teste de Login:**
1. Acesse `/login`
2. Use credenciais criadas ou do seed

### Fase 5: Dashboard do Psicólogo

**Acesse o dashboard:**
- URL: `/dashboard`
- Verifique o menu de navegação:
  - Início
  - Agenda
  - Pacientes
  - Financeiro
  - Disponibilidade
  - Prontuário (Pro)
  - Upgrade (para usuários free)

### Fase 6: Gestão de Pacientes

**Liste pacientes:**
1. Acesse `/dashboard/patients`
2. Verifique a lista de pacientes
3. Use a busca por nome/email
4. Clique em um paciente para ver detalhes

**Adicione novo paciente (Free = 10 limite):**
1. Clique em "Novo Paciente"
2. Se atingir o limite, verá modal de upgrade
3. Complete o formulário

### Fase 7: Agendamento Público

**Página pública do psicólogo:**
1. Acesse `/p/[slug]` (ex: `/p/joao-silva-free`)
2. Verifique as informações exibidas

**Booking flow:**
1. Na página pública, selecione um horário disponível
2. Preencha dados do paciente
3. Aceite o consentimento LGPD
4. Finalize o agendamento
5. Você será redirecionado para pagamento

### Fase 8: Pagamentos Stripe

**Fluxo de pagamento:**
1. Ao agendar, redirecionado para checkout Stripe
2. Escolha método (card ou pix)
3. Complete o pagamento
4. Em caso de sucesso: `/p/success`
5. Em caso de cancelamento: retorna para booking

**Dashboard financeiro:**
1. Acesse `/dashboard/financial`
2. See lista de pagamentos
3. Verifique status (pending/paid/failed)

### Fase 9: Lembretes Automatizados (Pro)

**Configuração:**
- Disponível apenas para plano Pro
- Verifique a funcionalidade em `/dashboard/availability`

**Confirmação de consulta:**
1. Acesse link de confirmação no email/reminder
2. Veja `/p/confirm/[token]`

**Cancelamento de consulta:**
1. Acesse link de cancelamento no email/reminder
2. Veja `/p/cancel/[token]`

### Fase 10: LGPD (Privacidade)

**Portal do paciente:**
1. Acesse `/minha-conta/privacidade`
2. Exporte seus dados
3. Solicite exclusão

### Fase 11: Planos e Upgrade

**Página de upgrade:**
1. Acesse `/dashboard/upgrade`
2. Compare planos (Free vs Pro)
3. Clique em "Upgrade para Pro"
4. Complete pagamento Stripe

**Verificação de limites:**
- Free: 10 pacientes, 20 consultas/mês
- Pro: pacientes ilimitados, consultas ilimitadas

### Fase 12: Segurança

**Headers configurados:**
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- HSTS

**Rate limiting:**
- Login: 5 tentativas/minuto
- Signup: 3 tentativas/minuto
- Webhooks: 20/minuto
- Booking público: 30/minuto

---

## Dados de Teste (Seed)

O seed cria 3 psicólogos de teste:

| Email | Plano | Slug |
|-------|-------|------|
| psicologo.free@clinicamente.com | Free | joao-silva-free |
| psicologo.pro@clinicamente.com | Pro (30 dias) | maria-santos-pro |
| psicologo.expired@clinicamente.com | Pro expirado | pedro-oliveira-expired |

**Senha para todos:** Use a função de reset de senha do Supabase Auth.

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── actions/          # Server actions
│   ├── api/              # API routes
│   ├── dashboard/        # Área logged do psicólogo
│   ├── minha-conta/      # Portal do paciente
│   └── p/[slug]/         # Páginas públicas
├── lib/
│   ├── supabase/         # Clients Supabase
│   ├── stripe.ts         # Integração Stripe
│   ├── rate-limit.ts     # Rate limiting
│   └── plan-check.ts     # Verificação de planos
└── middleware.ts         # Auth e rate limiting
```

---

## Funcionalidades por Plano

| Funcionalidade | Free | Pro |
|---------------|------|-----|
| Pacientes | 10 | Ilimitado |
| Consultas/mês | 20 | Ilimitado |
| Notas clínicas | ✅ | ✅ |
| Lembretes automatizados | ❌ | ✅ |
| Relatórios | ❌ | ✅ |

---

## Edge Functions (Supabase)

- `payment-expiration` - Expira pagamentos pendentes (hora em hora)
- `create-reminders` - Cria lembretes 24h antes (hora 30)
- `process-reminders` - Envia emails/WhatsApp (a cada 30 min)
- `review-inactive-patients` - Revisa pacientes inativos (mensal)
- `check-expired-subscriptions` - Verifica assinaturas expiradas (diário)

---

## Cron Jobs (Vercel)

Configurados em `vercel.json`:

- `/api/cron/review-inactive-patients` - 1º dia do mês às 6h
- `/api/cron/check-expired-subscriptions` - Diariamente às 6h

---

## Tech Stack

- **Frontend:** Next.js 16, React, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui
- **Backend:** Next.js Server Actions, API Routes
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe (checkout + subscriptions)
- **Email:** Resend
- **WhatsApp:** Twilio
- **Deploy:** Vercel

---

## Licença

MIT
