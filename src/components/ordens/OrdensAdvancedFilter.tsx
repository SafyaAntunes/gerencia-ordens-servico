
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { StatusOS, Prioridade } from "@/types/ordens";

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

const prioridadeOptions = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" }
];

export interface FilterCriteria {
  numeroOS?: string;
  cliente?: string;
  selectedStatus: string[];
  selectedPrioridade: string[];
  dataInicio?: Date;
  dataFim?: Date;
}

interface OrdensAdvancedFilterProps {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
}

export default function OrdensAdvancedFilter({
  filters,
  onFiltersChange
}: OrdensAdvancedFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [prioridadeDropdownOpen, setPrioridadeDropdownOpen] = useState(false);

  const updateFilters = (updates: Partial<FilterCriteria>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const handleStatusToggle = (statusValue: string) => {
    const newSelected = filters.selectedStatus.includes(statusValue)
      ? filters.selectedStatus.filter(s => s !== statusValue)
      : [...filters.selectedStatus, statusValue];
    
    updateFilters({ selectedStatus: newSelected });
  };

  const handlePrioridadeToggle = (prioridadeValue: string) => {
    const newSelected = filters.selectedPrioridade.includes(prioridadeValue)
      ? filters.selectedPrioridade.filter(p => p !== prioridadeValue)
      : [...filters.selectedPrioridade, prioridadeValue];
    
    updateFilters({ selectedPrioridade: newSelected });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      numeroOS: "",
      cliente: "",
      selectedStatus: [],
      selectedPrioridade: [],
      dataInicio: undefined,
      dataFim: undefined
    });
  };

  const hasActiveFilters = filters.numeroOS || filters.cliente || 
    filters.selectedStatus.length > 0 || filters.selectedPrioridade.length > 0 ||
    filters.dataInicio || filters.dataFim;

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.numeroOS) count++;
    if (filters.cliente) count++;
    if (filters.selectedStatus.length > 0) count++;
    if (filters.selectedPrioridade.length > 0) count++;
    if (filters.dataInicio) count++;
    if (filters.dataFim) count++;
    return count;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Search className="h-4 w-4" />
        Filtros avançados
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {getActiveFiltersCount()}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900">Filtros</h3>
            <div className="flex gap-2">
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-gray-500"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Número da OS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da OS
              </label>
              <Input
                placeholder="Digite o número da OS..."
                value={filters.numeroOS || ""}
                onChange={(e) => updateFilters({ numeroOS: e.target.value })}
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <Input
                placeholder="Digite o nome do cliente..."
                value={filters.cliente || ""}
                onChange={(e) => updateFilters({ cliente: e.target.value })}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="w-full justify-between text-left"
                >
                  <span className="truncate">
                    {filters.selectedStatus.length === 0 
                      ? "Selecionar status..."
                      : `${filters.selectedStatus.length} status selecionados`}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>

                {statusDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    <div className="p-2">
                      {statusOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            id={`status-${option.value}`}
                            checked={filters.selectedStatus.includes(option.value)}
                            onCheckedChange={() => handleStatusToggle(option.value)}
                          />
                          <label
                            htmlFor={`status-${option.value}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Prioridade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setPrioridadeDropdownOpen(!prioridadeDropdownOpen)}
                  className="w-full justify-between text-left"
                >
                  <span className="truncate">
                    {filters.selectedPrioridade.length === 0 
                      ? "Selecionar prioridade..."
                      : `${filters.selectedPrioridade.length} prioridades selecionadas`}
                  </span>
                  <ChevronDown className="h-4 w-4 shrink-0" />
                </Button>

                {prioridadeDropdownOpen && (
                  <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50">
                    <div className="p-2">
                      {prioridadeOptions.map((option) => (
                        <div
                          key={option.value}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                        >
                          <Checkbox
                            id={`prioridade-${option.value}`}
                            checked={filters.selectedPrioridade.includes(option.value)}
                            onCheckedChange={() => handlePrioridadeToggle(option.value)}
                          />
                          <label
                            htmlFor={`prioridade-${option.value}`}
                            className="text-sm cursor-pointer flex-1"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Data Início */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de abertura (início)
              </label>
              <DatePicker
                date={filters.dataInicio}
                onDateChange={(date) => updateFilters({ dataInicio: date })}
                placeholder="Selecionar data inicial"
              />
            </div>

            {/* Data Fim */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de abertura (fim)
              </label>
              <DatePicker
                date={filters.dataFim}
                onDateChange={(date) => updateFilters({ dataFim: date })}
                placeholder="Selecionar data final"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdowns */}
      {(isOpen || statusDropdownOpen || prioridadeDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setStatusDropdownOpen(false);
            setPrioridadeDropdownOpen(false);
          }}
        />
      )}
    </div>
  );
}
