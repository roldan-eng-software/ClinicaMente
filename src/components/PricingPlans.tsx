"use client";

import { useState } from "react";
import "./pricing-plans.css";

export default function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  const plans = [
    {
      id: "student",
      name: "Student",
      description: "Perfeito para quem está começando",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Até 10 sessões por mês",
        "Agenda básica",
        "Prontuário simplificado",
        "Suporte por email",
      ],
      cta: "Começar grátis",
      ctaVariant: "outline",
      highlighted: false,
    },
    {
      id: "basic",
      name: "Básico",
      description: "Para profissionais iniciantes",
      monthlyPrice: 49,
      annualPrice: 490,
      features: [
        "Sessões ilimitadas",
        "Agenda avançada",
        "Prontuários detalhados",
        "Lembretes automáticos",
        "Suporte prioritário",
      ],
      cta: "Começar teste gratuito",
      ctaVariant: "primary",
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pró",
      description: "O plano mais popular",
      monthlyPrice: 74,
      annualPrice: 740,
      features: [
        "Tudo do plano Básico",
        "Histórico de sessões completo",
        "Relatórios detalhados",
        "Integração com Stripe",
        "API para integrações",
        "Suporte prioritário 24/7",
      ],
      cta: "Começar teste gratuito",
      ctaVariant: "primary",
      highlighted: true,
    },
    {
      id: "plus",
      name: "Plus",
      description: "Para clínicas pequenas",
      monthlyPrice: 115,
      annualPrice: 1150,
      features: [
        "Tudo do plano Pró",
        "Até 3 profissionais",
        "Gestão de pacientes avançada",
        "Dashboard customizável",
        "Relatórios financeiros completos",
        "Suporte prioritário 24/7",
      ],
      cta: "Começar teste gratuito",
      ctaVariant: "primary",
      highlighted: false,
    },
    {
      id: "clinic",
      name: "Clínica",
      description: "Para clínicas com múltiplos profissionais",
      monthlyPrice: 129,
      annualPrice: 1290,
      features: [
        "Tudo do plano Plus",
        "Profissionais ilimitados",
        "Gestão avançada de equipe",
        "Documentos personalizados",
        "Análise de desempenho",
        "Gerente de conta dedicado",
      ],
      cta: "Falar com vendas",
      ctaVariant: "primary",
      highlighted: false,
    },
  ];

  const getPrice = (plan: typeof plans[0]) => {
    if (billingPeriod === "annual") {
      return plan.annualPrice;
    }
    return plan.monthlyPrice;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return "Grátis";
    return `R$ ${price.toLocaleString("pt-BR")}`;
  };

  return (
    <section className="pricing-section">
      <div className="pricing-header">
        <h2>Planos e preços</h2>
        <p>Escolha o plano ideal para sua clínica. Sem compromisso, cancele quando quiser.</p>
      </div>

      <div className="pricing-toggle">
        <button
          className={`pricing-toggle-btn ${billingPeriod === "monthly" ? "active" : ""}`}
          onClick={() => setBillingPeriod("monthly")}
        >
          Mensal
        </button>
        <button
          className={`pricing-toggle-btn ${billingPeriod === "annual" ? "active" : ""}`}
          onClick={() => setBillingPeriod("annual")}
        >
          Anual <span className="discount-badge">-17%</span>
        </button>
      </div>

      <div className="pricing-cards">
        {plans.map((plan) => (
          <article
            key={plan.id}
            className={`pricing-card ${plan.highlighted ? "highlighted" : ""}`}
          >
            {plan.highlighted && <div className="pricing-badge">Mais popular</div>}

            <div className="pricing-card-header">
              <h3>{plan.name}</h3>
              <p className="pricing-description">{plan.description}</p>
            </div>

            <div className="pricing-price">
              <span className="amount">{formatPrice(getPrice(plan))}</span>
              {getPrice(plan) > 0 && (
                <span className="period">/{billingPeriod === "monthly" ? "mês" : "ano"}</span>
              )}
            </div>

            <button
              className={`pricing-cta pricing-cta--${plan.ctaVariant}`}
            >
              {plan.cta}
            </button>

            <ul className="pricing-features">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="check-icon" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="pricing-footer">
        <p>
          <strong>Prova gratuita de 14 dias</strong> em todos os planos pagos. Sem necessidade de cartão de crédito.
        </p>
      </div>
    </section>
  );
}
