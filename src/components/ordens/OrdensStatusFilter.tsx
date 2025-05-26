
import React, { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StatusOS } from "@/types/ordens";

const statusOptions = [
  { value: "desmontagem", label: "Desmontagem" },
  { value: "inspecao_inicial", label: "Inspeção Inicial" },
  { value: "orcamento", label: "Orçamento" },
  { value: "aguardando_aprovacao", label: "Aguardando Aprovação" },
  { value: "autorizado", label: "Autorizado" },
  { value: "executando_servico", label: "Executando Serviço" },
  { value: "aguardando_peca_cliente", label: "Aguardando Peça (Cliente)" },
  { value: "aguardando_peca_interno", label: "Aguardando Peça (Interno)" },
  { value: "finalizado", label: "Finalizado" },
  { value: "entregue", label: "Entregue" }
];

interface OrdensStatusFilterProps {
  selectedStatus: string[];
  onStatusChange: (status: string[]) => void;
}

export default function OrdensStatusFilter({
  selectedStatus = [],
  onStatusChange
}: OrdensStatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure selectedStatus is always an array
  const safeSelectedStatus = Array.isArray(selectedStatus) ? selectedStatus : [];

  const handleStatusToggle = (statusValue: string) => {
    if (!onStatusChange || typeof onStatusChange !== 'function') {
      console.error('OrdensStatusFilter: onStatusChange is not a function');
      return;
    }

    const newSelected = safeSelectedStatus.includes(statusValue)
      ? safeSelectedStatus.filter(s => s !== statusValue)
      : [...safeSelectedStatus, statusValue];
    
    onStatusChange(newSelected);
  };

  const handleClearAll = () => {
    if (onStatusChange && typeof onStatusChange === 'function') {
      onStatusChange([]);
    }
  };

  const selectedCount = safeSelectedStatus.length;
  const buttonText = selectedCount === 0 
    ? "Filtrar por status..."
    : selectedCount === 1 
      ? statusOptions.find(opt => opt.value === safeSelectedStatus[0])?.label || "1 status"
      : `${selectedCount} status selecionados`;

  return (
    <div className="relative w-64">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="truncate">{buttonText}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="w-full text-left justify-start text-sm"
            >
              Limpar filtros
            </Button>
          </div>
          
          <div className="p-2">
            {statusOptions.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
              >
                <Checkbox
                  id={`status-${option.value}`}
                  checked={safeSelectedStatus.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                />
                <label
                  htmlFor={`status-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
