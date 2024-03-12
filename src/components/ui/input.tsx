import * as React from "react";

import { cn } from "@/lib/utils";
import CurrencyInput from "react-currency-input-field";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  currencyConfig?: CurrencyConfig;
  onValueChange?: (value: any, name: string, values: any) => void;
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
  ({ className, type, currencyConfig, onValueChange, ...props }: any, ref) => {
    const handleValueChange = (value: any, name: string, values: any) => {
      if (onValueChange) {
        onValueChange(value, name, values);
      }
    };

    if (currencyConfig) {
      // Passando a propriedade onValueChange diretamente para o CurrencyInput
      return (
        <CurrencyInput
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref as React.MutableRefObject<any>} // Type assertion to allow compatibility
          onValueChange={handleValueChange}
          {...currencyConfig}
          {...props}
        />
      );
    } else {
      return (
        <input
          type={type}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }
  }
);

Input.displayName = "Input";

export { Input };
