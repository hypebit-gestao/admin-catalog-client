"use client";

import React, { useState, useMemo } from "react";
import ContentMain from "@/components/content-main";
import { cn } from "@/lib/utils";
import { MdCalculate, MdInfo, MdAttachMoney } from "react-icons/md";
import { FaPercent } from "react-icons/fa";

const PAYMENT_METHODS = [
  { key: "pix", label: "PIX", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  { key: "debit", label: "Débito", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { key: "credit1x", label: "Crédito à vista", color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
  { key: "credit2x", label: "Crédito 2x", color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200" },
  { key: "credit3x", label: "Crédito 3x", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
  { key: "credit6x", label: "Crédito 6x", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
  { key: "credit12x", label: "Crédito 12x", color: "text-red-700", bg: "bg-red-50", border: "border-red-300" },
] as const;

type PaymentKey = (typeof PAYMENT_METHODS)[number]["key"];

interface Fees {
  pix: number;
  debit: number;
  credit1x: number;
  credit2x: number;
  credit3x: number;
  credit6x: number;
  credit12x: number;
}

const DEFAULT_FEES: Fees = {
  pix: 1.0,
  debit: 1.99,
  credit1x: 2.99,
  credit2x: 3.49,
  credit3x: 3.99,
  credit6x: 4.99,
  credit12x: 6.99,
};

const formatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^\d,]/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function InputField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-gray-500 text-sm font-medium pointer-events-none">
            {prefix}
          </span>
        )}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full border border-gray-200 rounded-lg py-2.5 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary/50",
            "transition-all bg-white",
            prefix ? "pl-8 pr-3" : "px-3",
            suffix ? "pr-8" : ""
          )}
        />
        {suffix && (
          <span className="absolute right-3 text-gray-500 text-sm font-medium pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const Calculator = () => {
  const [costStr, setCostStr] = useState("0,00");
  const [marginStr, setMarginStr] = useState("30");
  const [fees, setFees] = useState<Fees>(DEFAULT_FEES);
  const [activeTab, setActiveTab] = useState<"price" | "fees">("price");

  const cost = parseCurrency(costStr);
  const marginPct = parseFloat(marginStr) || 0;

  const basePrice = useMemo(() => {
    if (cost <= 0 || marginPct >= 100) return 0;
    return cost / (1 - marginPct / 100);
  }, [cost, marginPct]);

  const results = useMemo(() => {
    return PAYMENT_METHODS.map((pm) => {
      const feePct = fees[pm.key];
      const finalPrice = basePrice / (1 - feePct / 100);
      const profit = finalPrice - cost;
      const realMargin = finalPrice > 0 ? (profit / finalPrice) * 100 : 0;
      return {
        ...pm,
        feePct,
        finalPrice,
        profit,
        realMargin,
      };
    });
  }, [basePrice, cost, fees]);

  const isValid = cost > 0 && marginPct > 0 && marginPct < 100;

  return (
    <ContentMain
      title="Calculadora de Preços"
      subtitle="Calcule o preço de venda ideal para cada forma de pagamento"
    >
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 max-w-6xl">
        {/* Left panel — inputs */}
        <div className="xl:col-span-2 space-y-4">
          {/* Tab switcher */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("price")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  activeTab === "price"
                    ? "bg-green-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                Produto
              </button>
              <button
                onClick={() => setActiveTab("fees")}
                className={cn(
                  "flex-1 py-3 text-sm font-medium transition-colors",
                  activeTab === "fees"
                    ? "bg-green-primary text-white"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                Taxas
              </button>
            </div>

            <div className="p-5 space-y-4">
              {activeTab === "price" ? (
                <>
                  <InputField
                    label="Custo do produto"
                    value={costStr}
                    onChange={setCostStr}
                    prefix="R$"
                    hint="Quanto você paga para adquirir ou produzir o produto"
                  />
                  <InputField
                    label="Margem de lucro desejada"
                    value={marginStr}
                    onChange={setMarginStr}
                    suffix="%"
                    hint="Percentual de lucro que você quer ter sobre o preço de venda"
                  />

                  {cost > 0 && marginPct > 0 && marginPct < 100 && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Custo:</span>
                        <span className="font-medium">{formatter.format(cost)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mt-1">
                        <span>Preço base (sem taxas):</span>
                        <span className="font-semibold text-green-primary">{formatter.format(basePrice)}</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Ajuste as taxas cobradas pela sua plataforma de pagamento.
                  </p>
                  {PAYMENT_METHODS.map((pm) => (
                    <div key={pm.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        {pm.label}
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="99"
                          value={fees[pm.key]}
                          onChange={(e) =>
                            setFees((prev) => ({
                              ...prev,
                              [pm.key]: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-green-primary/30 bg-white"
                        />
                        <span className="absolute right-3 text-gray-500 text-sm pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setFees(DEFAULT_FEES)}
                    className="text-xs text-green-primary hover:underline"
                  >
                    Restaurar taxas padrão
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Info card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
            <MdInfo size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-medium">Como funciona?</p>
              <p>
                A calculadora define um preço base usando sua margem desejada sobre
                o custo, depois adiciona a taxa de cada forma de pagamento para
                garantir que você sempre receba o lucro esperado.
              </p>
              <p className="text-amber-700">
                Fórmula: Preço = Custo ÷ (1 − Margem%) ÷ (1 − Taxa%)
              </p>
            </div>
          </div>
        </div>

        {/* Right panel — results */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <MdCalculate size={20} className="text-green-primary" />
              <h2 className="font-semibold text-gray-900">
                Preços por forma de pagamento
              </h2>
            </div>

            {!isValid ? (
              <div className="p-12 text-center text-muted-foreground">
                <MdAttachMoney size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">
                  Preencha o custo e a margem desejada para ver os preços sugeridos.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {results.map((r) => (
                  <div key={r.key} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold flex-shrink-0",
                            r.bg,
                            r.color
                          )}
                        >
                          {r.label}
                        </span>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 flex-shrink-0">
                          <FaPercent size={9} />
                          <span>Taxa: {r.feePct.toFixed(2)}%</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-green-primary leading-none">
                          {formatter.format(r.finalPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Lucro: {formatter.format(r.profit)} ({r.realMargin.toFixed(1)}%)
                        </p>
                      </div>
                    </div>

                    {/* Lucro bar */}
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", r.bg.replace("bg-", "bg-").replace("-50", "-400"))}
                        style={{ width: `${Math.min(r.realMargin, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {isValid && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Menor preço", value: formatter.format(Math.min(...results.map((r) => r.finalPrice))), sub: "via PIX" },
                { label: "Maior preço", value: formatter.format(Math.max(...results.map((r) => r.finalPrice))), sub: "parcelado" },
                { label: "Diferença", value: formatter.format(Math.max(...results.map((r) => r.finalPrice)) - Math.min(...results.map((r) => r.finalPrice))), sub: "entre métodos" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white rounded-xl border border-gray-200/80 p-4 shadow-sm text-center"
                >
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-base font-bold text-green-primary mt-1">{item.value}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentMain>
  );
};

export default Calculator;
