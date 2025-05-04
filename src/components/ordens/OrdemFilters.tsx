
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface OrdemFiltersProps {
  search: string;
  setSearch: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  prioridadeFilter: string;
  setPrioridadeFilter: (value: string) => void;
  progressoFilter: string;
  setProgressoFilter: (value: string) => void;
}

export default function OrdemFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  prioridadeFilter,
  setPrioridadeFilter,
  progressoFilter,
  setProgressoFilter
}: OrdemFiltersProps) {
  return (
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
        <Filter className="h-5 w-5 text-muted-foreground mr-2" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="orcamento">Orçamento</SelectItem>
            <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
            <SelectItem value="retifica">Retífica</SelectItem>
            <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
            <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2 col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex items-center space-x-2 w-full">
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as prioridades</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="media">Média</SelectItem>
              <SelectItem value="baixa">Baixa</SelectItem>
              <SelectItem value="urgente">Urgente</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={progressoFilter} onValueChange={setProgressoFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por progresso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os progressos</SelectItem>
              <SelectItem value="nao_iniciado">Não iniciado (0%)</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="quase_concluido">Quase concluído (≥75%)</SelectItem>
              <SelectItem value="concluido">Concluído (100%)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
