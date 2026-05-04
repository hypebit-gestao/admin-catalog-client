"use client";

import React, { useState } from "react";
import ContentMain from "@/components/content-main";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  MdCategory,
  MdOutlineProductionQuantityLimits,
  MdRequestPage,
  MdSettings,
  MdCheckCircle,
  MdRadioButtonUnchecked,
  MdExpandMore,
  MdExpandLess,
  MdLightbulb,
  MdCalculate,
} from "react-icons/md";
import { FaStore, FaRulerHorizontal } from "react-icons/fa";
import { HiArrowRight } from "react-icons/hi";

const CHECKLIST = [
  {
    id: "category",
    label: "Criar sua primeira categoria",
    description: "Organize seus produtos em categorias para facilitar a navegação dos clientes.",
    href: "/category",
    icon: MdCategory,
  },
  {
    id: "product",
    label: "Cadastrar seu primeiro produto",
    description: "Adicione nome, descrição, preço, fotos e categoria ao produto.",
    href: "/product",
    icon: MdOutlineProductionQuantityLimits,
  },
  {
    id: "size",
    label: "Configurar tamanhos",
    description: "Cadastre os tamanhos disponíveis (P, M, G, 38, 40...) para associar aos produtos.",
    href: "/size",
    icon: FaRulerHorizontal,
  },
  {
    id: "shipping",
    label: "Configurar entrega",
    description: "Defina o tipo de frete e as taxas de envio da sua loja.",
    href: "/configurations",
    icon: MdSettings,
  },
  {
    id: "personalization",
    label: "Personalizar a loja",
    description: "Escolha a cor tema e configure descontos por forma de pagamento.",
    href: "/configurations",
    icon: FaStore,
  },
];

const FAQS = [
  {
    question: "Como adicionar fotos aos produtos?",
    answer:
      "Ao cadastrar ou editar um produto, clique no campo de imagens e selecione os arquivos do seu computador. Você pode adicionar múltiplas fotos. Recomendamos imagens em formato quadrado (1:1) com no mínimo 600×600 pixels para melhor visualização no catálogo.",
  },
  {
    question: "Posso ter produtos sem categoria?",
    answer:
      "Sim, mas não é recomendado. Produtos sem categoria ficam difíceis de encontrar pelos clientes no catálogo. Crie categorias relevantes (ex: Camisetas, Calças, Acessórios) e associe todos os produtos a uma delas.",
  },
  {
    question: "Como funciona o desconto por forma de pagamento?",
    answer:
      "Em Configurações > Personalização da loja você pode definir percentuais de desconto para PIX, crédito e débito. Esses descontos são exibidos no catálogo para o cliente. Use a Calculadora de Preços para definir preços que já absorvem as taxas da maquininha.",
  },
  {
    question: "Como gerenciar os pedidos recebidos?",
    answer:
      "Acesse a página Pedidos no menu lateral. Lá você vê todos os pedidos com nome do cliente, valor e status (Pendente, Enviado, Entregue ou Cancelado). Clique no ícone de edição para atualizar o status de um pedido à medida que ele avança.",
  },
  {
    question: "O que é o status do pedido 'Pendente'?",
    answer:
      "Pendente indica que o pedido foi recebido mas ainda não foi processado/enviado. Assim que você separar e enviar o produto, atualize o status para 'Enviado', e quando o cliente confirmar o recebimento, para 'Entregue'. Isso ajuda a manter o controle do seu fluxo de vendas.",
  },
  {
    question: "Como exportar meus dados para Excel?",
    answer:
      "Na página de Pedidos, clique no botão 'Exportar Excel' no final da tabela. Isso gera um arquivo .xlsx com todos os dados dos pedidos que você pode usar para controle financeiro, relatórios ou qualquer outro sistema.",
  },
  {
    question: "Posso alterar a cor tema da minha loja?",
    answer:
      "Sim! Em Configurações > Personalização da loja, você encontra um seletor de cores. A cor escolhida é aplicada em botões, destaques e elementos visuais do seu catálogo público.",
  },
  {
    question: "Como usar a Calculadora de Preços?",
    answer:
      "Acesse Calculadora no menu. Informe o custo do produto (quanto você paga) e a margem de lucro que deseja (%). A calculadora calcula automaticamente o preço ideal para cada forma de pagamento, já considerando as taxas de maquininha. Na aba 'Taxas', você pode ajustar as taxas cobradas pela sua plataforma.",
  },
];

const TIPS = [
  {
    icon: MdLightbulb,
    color: "text-amber-500",
    bg: "bg-amber-50",
    title: "Fotos de qualidade vendem mais",
    body: "Use fundo branco ou neutro, boa iluminação natural e mostre o produto de vários ângulos. Produtos com fotos profissionais convertem até 3× mais.",
  },
  {
    icon: MdCalculate,
    color: "text-blue-600",
    bg: "bg-blue-50",
    title: "Precifique considerando as taxas",
    body: "Nunca esqueça as taxas da maquininha ao definir preços. Use a Calculadora de Preços para garantir que você lucra em toda forma de pagamento.",
  },
  {
    icon: MdOutlineProductionQuantityLimits,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    title: "Descrições detalhadas reduzem dúvidas",
    body: "Inclua medidas, materiais, instruções de cuidado e variações disponíveis. Quanto mais informação, menos o cliente precisa perguntar antes de comprar.",
  },
  {
    icon: MdRequestPage,
    color: "text-violet-600",
    bg: "bg-violet-50",
    title: "Atualize status dos pedidos em tempo real",
    body: "Clientes satisfeitos são clientes que sabem onde está o pedido. Atualize para 'Enviado' assim que despachar e notifique o cliente pelo WhatsApp ou Instagram.",
  },
];

const Help = () => {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(typeof window !== "undefined" ? JSON.parse(localStorage.getItem("help_checklist") || "[]") : [])
  );

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (typeof window !== "undefined") {
        localStorage.setItem("help_checklist", JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const progress = Math.round((checked.size / CHECKLIST.length) * 100);

  return (
    <ContentMain
      title="Central de Ajuda"
      subtitle="Guia de primeiros passos, dicas e perguntas frequentes"
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl">
        {/* Left column */}
        <div className="xl:col-span-2 space-y-6">
          {/* Getting started checklist */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Primeiros Passos</h2>
                <span className="text-sm font-medium text-green-primary">
                  {checked.size}/{CHECKLIST.length} concluídos
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <ul className="divide-y divide-gray-50">
              {CHECKLIST.map((item) => {
                const done = checked.has(item.id);
                return (
                  <li key={item.id} className="px-5 py-4">
                    <div className="flex gap-4 items-start">
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className="mt-0.5 flex-shrink-0"
                        aria-label={done ? "Marcar como pendente" : "Marcar como concluído"}
                      >
                        {done ? (
                          <MdCheckCircle size={22} className="text-green-primary" />
                        ) : (
                          <MdRadioButtonUnchecked size={22} className="text-gray-300" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-medium text-sm", done && "line-through text-muted-foreground")}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                      {!done && (
                        <button
                          onClick={() => router.push(item.href)}
                          className="flex-shrink-0 flex items-center gap-1 text-xs text-green-primary hover:text-green-secondary font-medium transition-colors"
                        >
                          Ir
                          <HiArrowRight size={13} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {progress === 100 && (
              <div className="mx-5 mb-4 mt-1 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-800 font-medium text-center">
                🎉 Parabéns! Sua loja está configurada e pronta para vender!
              </div>
            )}
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Perguntas Frequentes</h2>
            </div>
            <ul className="divide-y divide-gray-50">
              {FAQS.map((faq, idx) => (
                <li key={idx}>
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-800 leading-snug">
                      {faq.question}
                    </span>
                    {openFaq === idx ? (
                      <MdExpandLess size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <MdExpandMore size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                  {openFaq === idx && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column — tips */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Dicas Rápidas</h2>
            </div>
            <div className="p-4 space-y-4">
              {TIPS.map((tip, idx) => (
                <div key={idx} className={cn("rounded-lg p-4 border", tip.bg, "border-transparent")}>
                  <div className="flex gap-3 items-start">
                    <tip.icon size={20} className={cn("flex-shrink-0 mt-0.5", tip.color)} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800 mb-1">{tip.title}</p>
                      <p className="text-xs text-gray-600 leading-relaxed">{tip.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Atalhos</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-2">
              {[
                { label: "Novo Produto", href: "/product", icon: MdOutlineProductionQuantityLimits, color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Nova Categoria", href: "/category", icon: MdCategory, color: "text-teal-600", bg: "bg-teal-50" },
                { label: "Ver Pedidos", href: "/order", icon: MdRequestPage, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Calculadora", href: "/calculator", icon: MdCalculate, color: "text-violet-600", bg: "bg-violet-50" },
                { label: "Tamanhos", href: "/size", icon: () => <FaRulerHorizontal size={18} />, color: "text-orange-600", bg: "bg-orange-50" },
                { label: "Configurações", href: "/configurations", icon: MdSettings, color: "text-gray-600", bg: "bg-gray-50" },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg text-center",
                    "border border-transparent hover:border-gray-200 transition-all duration-150",
                    link.bg
                  )}
                >
                  <link.icon size={20} className={link.color} />
                  <span className="text-xs font-medium text-gray-700">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContentMain>
  );
};

export default Help;
