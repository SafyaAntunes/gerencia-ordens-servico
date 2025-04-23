
import React from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number;
  onValueChange: (value: number) => void;
  locale?: string;
  currency?: string;
}

export function CurrencyInput({
  value,
  onValueChange,
  locale = "pt-BR",
  currency = "BRL",
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");

  React.useEffect(() => {
    // Formata o valor numérico para exibição
    const formatted = value.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    setDisplayValue(formatted);
  }, [value, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove tudo exceto números e ponto
    let input = e.target.value.replace(/[^\d]/g, "");
    
    // Converte para número com 2 casas decimais
    const numericValue = parseFloat(input) / 100;
    
    // Atualiza o valor
    onValueChange(numericValue);
    
    // Formata para exibição
    const formatted = numericValue.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    setDisplayValue(formatted);
  };

  return (
    <div className="relative flex items-center">
      <span className="absolute left-3 text-muted-foreground">R$</span>
      <Input
        {...props}
        className="pl-9"
        value={displayValue}
        onChange={handleChange}
        inputMode="numeric"
      />
    </div>
  );
}
