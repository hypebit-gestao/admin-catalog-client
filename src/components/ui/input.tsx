import * as React from "react";

import { cn } from "@/lib/utils";
import CurrencyInput from "react-currency-input-field";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  currencyConfig?: CurrencyConfig;
  onValueChange?: (value: any, name: string, values: any) => void;
  height?: string;
  icon?: React.ReactNode;
}

interface CurrencyConfig {
  prefix: string;
  decimalSeparator: string;
  groupSeparator: string;
  intlConfig: {
    locale: string;
    currency: string;
  };
  decimalsLimit: number;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      currencyConfig,
      onValueChange,
      height,
      icon,
      ...props
    }: any,
    ref
  ) => {
    return (
      <>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
          <input
            type={type}
            className={cn(
              `flex h-9 ${height} w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                icon ? "pl-12" : ""
              }`,
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      </>
    );
  }
);

Input.displayName = "Input";

const InputCurrency = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, value, onChange, onBlur, height, icon, placeholder },
    ref
  ) => {
    return (
      <CurrencyInput
        type={type}
        className={cn(
          `flex h-9 ${height} w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
            icon ? "pl-12" : ""
          }`,
          className
        )}
        ref={ref}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        intlConfig={{ locale: "pt-BR", currency: "BRL" }}
        decimalSeparator=","
        groupSeparator="."
        decimalsLimit={2}
        placeholder={placeholder}
      />
    );
  }
);

InputCurrency.displayName = "InputCurrency";

export { Input, InputCurrency };
