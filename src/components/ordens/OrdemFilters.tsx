
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, Check, Activity } from "lucide-react";
import Select from 'react-select';

interface OrdemFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string[];
  setStatusFilter: (value: string[]) => void;
  prioridadeFilter: string;
  setPrioridadeFilter: (value: string) => void;
  progressoFilter: string;
  setProgressoFilter: (value: string) => void;
  prazoFilter?: string;
  setPrazoFilter?: (value: string) => void;
}

export default function OrdemFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  prioridadeFilter,
  setPrioridadeFilter,
  progressoFilter,
  setProgressoFilter,
  prazoFilter = "all",
  setPrazoFilter = () => {}
}: OrdemFiltersProps) {
  const [filtrosVisiveis, setFiltrosVisiveis] = useState(true);

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          type="button"
          className="text-blue-600 hover:underline text-sm"
          onClick={() => setFiltrosVisiveis(v => !v)}
        >
          {filtrosVisiveis ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>
      {filtrosVisiveis && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-6">
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Buscar ordem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search className="h-5 w-5 text-muted-foreground -ml-8" />
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-full">
              <Select
                options={[
                  { value: "all", label: "Todas as prioridades" },
                  { value: "alta", label: "Alta" },
                  { value: "media", label: "Média" },
                  { value: "baixa", label: "Baixa" },
                  { value: "urgente", label: "Urgente" },
                ]}
                value={{ value: prioridadeFilter, label: prioridadeFilter === "all" ? "Todas as prioridades" : prioridadeFilter.charAt(0).toUpperCase() + prioridadeFilter.slice(1) }}
                onChange={option => setPrioridadeFilter(option?.value || "all")}
                placeholder="Filtrar por prioridade"
                classNamePrefix="react-select"
                isSearchable={false}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="grid grid-cols-2 gap-2 w-full">
              <Select
                options={[
                  { value: "all", label: "Todos os progressos" },
                  { value: "nao_iniciado", label: "Não iniciado (0%)" },
                  { value: "em_andamento", label: "Em andamento" },
                  { value: "quase_concluido", label: "Quase concluído (≥75%)" },
                  { value: "concluido", label: "Concluído (100%)" },
                  { value: "atrasadas", label: "Atrasadas" },
                ]}
                value={{ value: progressoFilter, label: progressoFilter === "all" ? "Todos os progressos" : progressoFilter.charAt(0).toUpperCase() + progressoFilter.slice(1).replace('_', ' ') }}
                onChange={option => setProgressoFilter(option?.value || "all")}
                placeholder="Filtrar por progresso"
                classNamePrefix="react-select"
                isSearchable={false}
              />
              
              <Select
                options={[
                  { value: "all", label: "Todos os prazos" },
                  { value: "no_prazo", label: "Dentro do prazo" },
                  { value: "atrasada", label: "Atrasadas" },
                ]}
                value={{ value: prazoFilter, label: prazoFilter === "all" ? "Todos os prazos" : prazoFilter === "no_prazo" ? "Dentro do prazo" : "Atrasadas" }}
                onChange={option => setPrazoFilter(option?.value || "all")}
                placeholder="Filtrar por prazo"
                classNamePrefix="react-select"
                isSearchable={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
