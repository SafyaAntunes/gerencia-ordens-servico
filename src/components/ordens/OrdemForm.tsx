
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface OrdemFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  defaultFotosEntrada?: File[];
  defaultFotosSaida?: File[];
  includeNumeroOS?: boolean;
}

// Dados de exemplo para clientes
const CLIENTES = [
  {
    id: "1",
    nome: "Auto Peças Silva",
    telefone: "(11) 98765-4321",
    email: "contato@autopecassilva.com.br",
  },
  {
    id: "2",
    nome: "Oficina Mecânica Central",
    telefone: "(11) 3333-4444",
    email: "oficina@central.com.br",
  },
  {
    id: "3",
    nome: "Concessionária Motors",
    telefone: "(11) 9999-0000",
    email: "pecas@motors.com.br",
  },
  {
    id: "4",
    nome: "Autoelétrica Express",
    telefone: "(11) 7777-8888",
    email: "atendimento@express.com.br",
  },
  {
    id: "5",
    nome: "Transportadora Rodovia",
    telefone: "(11) 5555-6666",
    email: "manutencao@rodovia.com.br",
  },
];

export default function OrdemForm({ 
  initialData, 
  onSubmit, 
  defaultFotosEntrada = [], 
  defaultFotosSaida = [],
  includeNumeroOS = false
}: OrdemFormProps) {
  // Inicializar com dados existentes ou valores padrão
  const [nome, setNome] = useState(initialData?.nome || "");
  const [clienteId, setClienteId] = useState(initialData?.clienteId || "");
  const [numeroOS, setNumeroOS] = useState(initialData?.numeroOS || "");
  const [dataAbertura, setDataAbertura] = useState<Date | undefined>(
    initialData?.dataAbertura ? new Date(initialData.dataAbertura) : new Date()
  );
  const [dataPrevistaEntrega, setDataPrevistaEntrega] = useState<Date | undefined>(
    initialData?.dataPrevistaEntrega ? new Date(initialData.dataPrevistaEntrega) : undefined
  );
  const [prioridade, setPrioridade] = useState(initialData?.prioridade || "media");
  const [observacoes, setObservacoes] = useState(initialData?.observacoes || "");
  
  // Serviços disponíveis
  const servicosTiposDisponiveis = [
    { id: "bloco", label: "Bloco" },
    { id: "biela", label: "Biela" },
    { id: "cabecote", label: "Cabeçote" },
    { id: "virabrequim", label: "Virabrequim" },
    { id: "eixo_comando", label: "Eixo de Comando" },
  ];
  
  // Estado para controlar quais serviços estão selecionados
  const [servicosTipos, setServicosTipos] = useState<string[]>(
    initialData?.servicosTipos || []
  );
  
  // Estado para armazenar descrições de serviços
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>(
    initialData?.servicosDescricoes || {}
  );
  
  // Gerenciar toggles de serviços
  const handleServicoToggle = (tipo: string) => {
    setServicosTipos((current) => {
      if (current.includes(tipo)) {
        // Se já existe, remova
        return current.filter((t) => t !== tipo);
      } else {
        // Se não existe, adicione
        return [...current, tipo];
      }
    });
  };
  
  // Gerenciar descrições de serviços
  const handleServicoDescricaoChange = (tipo: string, descricao: string) => {
    setServicosDescricoes((prev) => ({
      ...prev,
      [tipo]: descricao,
    }));
  };
  
  // Validação básica antes de enviar
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar campos obrigatórios
    if (!nome.trim()) {
      toast("Campo obrigatório", {
        description: "O nome da ordem de serviço é obrigatório.",
      });
      return;
    }
    
    if (!clienteId) {
      toast("Campo obrigatório", {
        description: "Selecione um cliente para a ordem de serviço.",
      });
      return;
    }
    
    if (servicosTipos.length === 0) {
      toast("Campo obrigatório", {
        description: "Selecione pelo menos um tipo de serviço.",
      });
      return;
    }
    
    // Verificar se todos os serviços selecionados têm descrição
    const servicosSemDescricao = servicosTipos.filter(tipo => 
      !servicosDescricoes[tipo] || servicosDescricoes[tipo].trim() === ""
    );
    
    if (servicosSemDescricao.length > 0) {
      toast("Descrições obrigatórias", {
        description: "Preencha a descrição para todos os serviços selecionados.",
      });
      return;
    }
    
    // Preparar objeto para envio
    const formData = {
      nome,
      clienteId,
      numeroOS: numeroOS.trim() || undefined,
      dataAbertura,
      dataPrevistaEntrega,
      prioridade,
      observacoes,
      servicosTipos,
      servicosDescricoes,
    };
    
    // Enviar para o callback
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="informacoes" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>
        
        <TabsContent value="informacoes" className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Ordem</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Motor Fiat Palio 1.0"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENTES.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {includeNumeroOS && (
              <div className="space-y-2">
                <Label htmlFor="numeroOS">Número da OS (opcional)</Label>
                <Input
                  id="numeroOS"
                  placeholder="Ex: OS-2023-001 (Deixe em branco para gerar automaticamente)"
                  value={numeroOS}
                  onChange={(e) => setNumeroOS(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Se deixado em branco, o sistema gerará um número automaticamente.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Abertura</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataAbertura && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataAbertura ? (
                        format(dataAbertura, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataAbertura}
                      onSelect={setDataAbertura}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Previsão de Entrega</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dataPrevistaEntrega && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dataPrevistaEntrega ? (
                        format(dataPrevistaEntrega, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dataPrevistaEntrega}
                      onSelect={setDataPrevistaEntrega}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prioridade">Prioridade</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger id="prioridade">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais sobre esta ordem de serviço..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="servicos" className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Tipos de Serviço</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selecione os tipos de serviço que serão realizados nesta ordem.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {servicosTiposDisponiveis.map((servico) => (
                  <div key={servico.id} className="flex items-start space-x-3 p-3 border rounded-md">
                    <Checkbox
                      id={`servico-${servico.id}`}
                      checked={servicosTipos.includes(servico.id)}
                      onCheckedChange={() => handleServicoToggle(servico.id)}
                    />
                    <div className="space-y-2 w-full">
                      <Label
                        htmlFor={`servico-${servico.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {servico.label}
                      </Label>
                      
                      {servicosTipos.includes(servico.id) && (
                        <Textarea
                          placeholder={`Descreva os detalhes do serviço de ${servico.label.toLowerCase()}...`}
                          value={servicosDescricoes[servico.id] || ""}
                          onChange={(e) => handleServicoDescricaoChange(servico.id, e.target.value)}
                          rows={3}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator className="my-4" />
      
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Salvar Ordem de Serviço
        </Button>
      </div>
    </form>
  );
}
