import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, Calendar, Check, Activity } from "lucide-react";
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
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6">
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
            <SelectItem value="autorizado">Autorizado</SelectItem>
            <SelectItem value="executando_servico">Executando Serviço</SelectItem>
            <SelectItem value="aguardando_peca_cliente">Aguardando Peça (Cliente)</SelectItem>
            <SelectItem value="aguardando_peca_interno">Aguardando Peça (Interno)</SelectItem>
            <SelectItem value="finalizado">Finalizado</SelectItem>
            <SelectItem value="entregue">Entregue</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex items-center space-x-2">
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
      </div>

      <div className="flex items-center space-x-2">
        <div className="grid grid-cols-2 gap-2 w-full">
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
              <SelectItem value="atrasadas">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={prazoFilter} onValueChange={setPrazoFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por prazo">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Prazo</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os prazos</SelectItem>
              <SelectItem value="no_prazo">Dentro do prazo</SelectItem>
              <SelectItem value="atrasada">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
