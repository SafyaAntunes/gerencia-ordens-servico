
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { EtapaOS, OrdemServico, Servico, TipoServico } from "@/types/ordens";
import { formatTime } from "@/utils/timerUtils";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { CheckCircle2, User } from "lucide-react";
import ServicoTracker from "./ServicoTracker";
import OrdemCronometro from "./OrdemCronometro";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos?: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    iniciado?: Date;
    finalizado?: Date;
    usarCronometro?: boolean;
    pausas?: { inicio: number; fim?: number; motivo?: string }[];
    funcionarioId?: string;
    funcionarioNome?: string;
  };
  onSubatividadeToggle?: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange?: (servicoTipo: TipoServico, concluido: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
  onEtapaStatusChange?: (etapa: EtapaOS, concluida: boolean, funcionarioId?: string, funcionarioNome?: string) => void;
}

export default function EtapaCard({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos = [],
  etapaInfo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange
}: EtapaCardProps) {
  const [progresso, setProgresso] = useState(0);
  const [isAtivo, setIsAtivo] = useState(false);
  const [atribuirFuncionarioDialogOpen, setAtribuirFuncionarioDialogOpen] = useState(false);
  const [funcionariosOptions, setFuncionariosOptions] = useState<Funcionario[]>([]);
  const [funcionarioSelecionadoId, setFuncionarioSelecionadoId] = useState<string>("");
  const [funcionarioSelecionadoNome, setFuncionarioSelecionadoNome] = useState<string>("");
  const { funcionario } = useAuth();
  
  const podeAtribuirFuncionario = funcionario?.nivelPermissao === 'admin' || 
                                 funcionario?.nivelPermissao === 'gerente';
  
  useEffect(() => {
    const carregarFuncionarios = async () => {
      try {
        const funcionariosRef = collection(db, "funcionarios");
        const snapshot = await getDocs(funcionariosRef);
        const funcionarios: Funcionario[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Funcionario;
          funcionarios.push({
            ...data,
            id: doc.id
          });
        });
        
        setFuncionariosOptions(funcionarios);
      } catch (error) {
        console.error("Erro ao carregar funcionários:", error);
      }
    };
    
    if (podeAtribuirFuncionario) {
      carregarFuncionarios();
    }
  }, [podeAtribuirFuncionario]);
  
  const etapaServicos = (() => {
    switch(etapa) {
      case 'retifica':
        return servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
      case 'montagem':
        return servicos.filter(servico => servico.tipo === 'montagem');
      case 'dinamometro':
        return servicos.filter(servico => servico.tipo === 'dinamometro');
      case 'lavagem':
        return servicos.filter(servico => servico.tipo === 'lavagem');
      case 'inspecao_inicial':
      case 'inspecao_final':
        return [];
      default:
        return [];
    }
  })();

  useEffect(() => {
    if (etapaServicos.length === 0) return;
    
    const servicosConcluidos = etapaServicos.filter(servico => servico.concluido).length;
    const percentualProgresso = Math.round((servicosConcluidos / etapaServicos.length) * 100);
    setProgresso(percentualProgresso);
    
    if (servicosConcluidos === etapaServicos.length && !etapaInfo?.concluido && onEtapaStatusChange) {
      onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
    }
  }, [etapaServicos, etapaInfo, onEtapaStatusChange]);

  const etapaComCronometro = ['lavagem', 'inspecao_inicial', 'inspecao_final'].includes(etapa);
  
  const handleEtapaConcluida = (tempoTotal: number) => {
    if (onEtapaStatusChange) {
      if (podeAtribuirFuncionario) {
        setAtribuirFuncionarioDialogOpen(true);
      } else {
        onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
      }
    }
  };

  const handleMarcarConcluido = () => {
    if (!funcionario?.id) {
      toast.error("É necessário estar logado para finalizar uma etapa");
      return;
    }
    
    if (podeAtribuirFuncionario) {
      setAtribuirFuncionarioDialogOpen(true);
    } else {
      if (onEtapaStatusChange) {
        onEtapaStatusChange(etapa, true, funcionario.id, funcionario.nome);
      }
    }
  };
  
  const handleConfirmarAtribuicao = () => {
    if (onEtapaStatusChange) {
      if (funcionarioSelecionadoId) {
        onEtapaStatusChange(etapa, true, funcionarioSelecionadoId, funcionarioSelecionadoNome);
      } else {
        onEtapaStatusChange(etapa, true, funcionario?.id, funcionario?.nome);
      }
    }
    setAtribuirFuncionarioDialogOpen(false);
  };

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioSelecionadoId(value);
    const funcionarioSelecionado = funcionariosOptions.find(f => f.id === value);
    setFuncionarioSelecionadoNome(funcionarioSelecionado?.nome || "");
  };
  
  const getEtapaStatus = () => {
    if (etapaInfo?.concluido) {
      return "concluido";
    } else if (etapaInfo?.iniciado) {
      return "em_andamento";
    } else {
      return "nao_iniciado";
    }
  };
  
  useEffect(() => {
    if (etapaInfo?.iniciado && !etapaInfo?.concluido) {
      setIsAtivo(true);
    } else {
      setIsAtivo(false);
    }
  }, [etapaInfo]);

  // Add the handleInspecaoChange function
  const handleInspecaoChange = (servicoTipo: TipoServico, tipo: 'inicial' | 'final', concluida: boolean) => {
    if (onServicoStatusChange) {
      // This is just a pass-through function to handle inspections for this specific service
      // The actual implementation of changing inspection status happens in the parent component
      // through the onServicoStatusChange callback
      console.log(`Alterando inspeção ${tipo} para ${concluida ? 'concluída' : 'não concluída'} no serviço ${servicoTipo}`);
    }
  };

  return (
    <Card className="p-6 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{etapaNome}</h3>
        <div className="flex items-center gap-2">
          {getEtapaStatus() === "concluido" && (
            <Badge variant="success">
              Concluído
            </Badge>
          )}
          {getEtapaStatus() === "em_andamento" && (
            <Badge variant="outline">Em andamento</Badge>
          )}
          {getEtapaStatus() === "nao_iniciado" && (
            <Badge variant="outline" className="bg-gray-100">Não iniciado</Badge>
          )}
        </div>
      </div>
      
      {etapaInfo?.concluido && etapaInfo?.funcionarioNome && (
        <div className="mb-4 flex items-center text-sm text-muted-foreground">
          <User className="h-4 w-4 mr-1" />
          <span>Concluído por: {etapaInfo.funcionarioNome}</span>
        </div>
      )}
      
      {etapaServicos.length > 0 && (
        <div className="mb-4">
          <Progress value={progresso} className="h-2" />
        </div>
      )}
      
      {etapaComCronometro && (
        <div className="p-4 border rounded-md mb-4">
          <OrdemCronometro
            ordemId={ordemId}
            funcionarioId={funcionarioId}
            funcionarioNome={funcionarioNome}
            etapa={etapa}
            onFinish={handleEtapaConcluida}
            isEtapaConcluida={etapaInfo?.concluido}
            onStart={() => setIsAtivo(true)}
          />
          
          {!etapaInfo?.concluido && (
            <div className="mt-4">
              <Button 
                variant="default" 
                size="sm" 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleMarcarConcluido}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Marcar Etapa como Concluída
              </Button>
            </div>
          )}
        </div>
      )}
      
      {etapaServicos.length > 0 && (
        <div className="space-y-4">
          {etapaServicos.map((servico, i) => (
            <ServicoTracker
              key={`${servico.tipo}-${i}`}
              servico={servico}
              ordemId={ordemId}
              funcionarioId={funcionarioId}
              funcionarioNome={funcionarioNome}
              onSubatividadeToggle={
                onSubatividadeToggle ? 
                  (subId, checked) => onSubatividadeToggle(servico.tipo, subId, checked) : 
                  () => {}
              }
              onServicoStatusChange={
                onServicoStatusChange ? 
                  (concluido, funcId, funcNome) => onServicoStatusChange(servico.tipo, concluido, funcId, funcNome) : 
                  () => {}
              }
              onInspecaoChange={(tipo, concluida) => {
                if (onServicoStatusChange) {
                  handleInspecaoChange(servico.tipo, tipo, concluida);
                }
              }}
            />
          ))}
        </div>
      )}
      
      <Dialog open={atribuirFuncionarioDialogOpen} onOpenChange={setAtribuirFuncionarioDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Atribuir Funcionário</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label htmlFor="funcionario-select-etapa" className="block text-sm font-medium">
                Selecione o funcionário que executou esta etapa
              </label>
              
              <Select onValueChange={handleFuncionarioChange} value={funcionarioSelecionadoId}>
                <SelectTrigger id="funcionario-select-etapa" className="w-full">
                  <SelectValue placeholder="Selecione um funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={funcionario?.id || ""}>
                    {funcionario?.nome || "Eu mesmo"} (você)
                  </SelectItem>
                  {funcionariosOptions
                    .filter(f => f.id !== funcionario?.id)
                    .map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.nome}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAtribuirFuncionarioDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarAtribuicao} className="bg-blue-500 hover:bg-blue-600">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
