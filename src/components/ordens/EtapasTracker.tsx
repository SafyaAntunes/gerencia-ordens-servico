
import { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { OrdemServico, TipoServico, EtapaOS, Servico } from "@/types/ordens";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Clock, PlayCircle } from "lucide-react";
import EtapaCard from "./EtapaCard";

interface EtapasTrackerProps {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
}

const EtapasTracker = ({ ordem, onOrdemUpdate }: EtapasTrackerProps) => {
  const [etapasAtivas, setEtapasAtivas] = useState<EtapaOS[]>([]);
  const [progressoTotal, setProgressoTotal] = useState(0);
  const { funcionario } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("todas");

  useEffect(() => {
    // Determine active etapas based on ordem status and technician specializations
    let availableEtapas: EtapaOS[] = [];
    
    // Define etapas based on user role
    if (funcionario?.tipo === 'tecnico') {
      // Técnicos veem apenas Inspeção Inicial, Retífica e Inspeção Final
      availableEtapas = ['inspecao_inicial', 'retifica', 'inspecao_final'];
    } else {
      // Gerentes e admins veem todas as etapas, na ordem específica
      if (ordem.status === 'orcamento') {
        availableEtapas = ['lavagem', 'inspecao_inicial'];
      } else {
        availableEtapas = [
          'lavagem', 
          'inspecao_inicial', 
          'retifica', 
          'montagem', 
          'dinamometro', 
          'inspecao_final'
        ];
      }
    }
    
    setEtapasAtivas(availableEtapas);
    
    // Calcular o progresso total da ordem
    calcularProgressoTotal(ordem);
  }, [ordem, funcionario]);

  // Função para calcular o progresso total
  const calcularProgressoTotal = (ordemAtual: OrdemServico) => {
    const etapas = Object.keys(ordemAtual.etapasAndamento) as EtapaOS[];
    
    if (etapas.length === 0) {
      setProgressoTotal(0);
      return;
    }
    
    const etapasConcluidas = etapas.filter(
      etapa => ordemAtual.etapasAndamento[etapa]?.concluido
    ).length;
    
    const progresso = Math.round((etapasConcluidas / etapas.length) * 100);
    setProgressoTotal(progresso);
  };

  // Função para lidar com a troca de status do serviço
  const handleServicoStatusChange = async (servicoTipo: TipoServico, concluido: boolean) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Crie uma cópia dos serviços atuais
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo) {
          // Se estiver marcando como concluído manualmente, todas as subatividades também serão marcadas
          let subatividades = servico.subatividades;
          if (concluido && subatividades) {
            subatividades = subatividades.map(sub => {
              if (sub.selecionada) {
                return { ...sub, concluida: true };
              }
              return sub;
            });
          }
          
          return { 
            ...servico, 
            concluido,
            subatividades
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      toast.success(`Serviço ${servicoTipo} ${concluido ? 'concluído' : 'reaberto'}`);
    } catch (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      toast.error("Erro ao atualizar status do serviço");
    }
  };

  // Função para lidar com a troca de status de uma etapa
  const handleEtapaStatusChange = async (etapa: EtapaOS, concluida: boolean, servicoTipo?: TipoServico) => {
    if (!ordem?.id || !funcionario?.id) return;
    
    try {
      // Gerar uma chave única para a etapa + serviço se fornecido
      const etapaKey = servicoTipo ? `${etapa}_${servicoTipo}` : etapa;
      
      // Atualize a etapa na ordem
      const etapasAndamento = {
        ...ordem.etapasAndamento,
        [etapaKey]: {
          ...ordem.etapasAndamento[etapaKey],
          concluido: concluida,
          funcionarioId: funcionario.id,
          funcionarioNome: funcionario.nome,
          servicoTipo: servicoTipo,
          finalizado: concluida ? new Date() : undefined
        }
      };
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { etapasAndamento });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        etapasAndamento
      };
      
      calcularProgressoTotal(ordemAtualizada);
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
      
      // Exiba um toast de sucesso
      const servicoInfo = servicoTipo ? ` para ${formatarTipoServico(servicoTipo)}` : '';
      toast.success(`Etapa ${formatarEtapa(etapa)}${servicoInfo} ${concluida ? 'concluída' : 'reaberta'}`);
    } catch (error) {
      console.error("Erro ao atualizar status da etapa:", error);
      toast.error("Erro ao atualizar status da etapa");
    }
  };

  // Função para lidar com a troca de status de uma subatividade
  const handleSubatividadeToggle = async (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => {
    if (!ordem?.id) return;
    
    try {
      // Encontre o serviço atual
      const servicoAtual = ordem.servicos.find(s => s.tipo === servicoTipo);
      if (!servicoAtual || !servicoAtual.subatividades) return;
      
      // Atualize a subatividade
      const servicosAtualizados = ordem.servicos.map(servico => {
        if (servico.tipo === servicoTipo && servico.subatividades) {
          const subatividades = servico.subatividades.map(sub => {
            if (sub.id === subatividadeId) {
              return { ...sub, concluida: checked };
            }
            return sub;
          });
          
          return { 
            ...servico, 
            subatividades 
          };
        }
        return servico;
      });
      
      // Atualize o Firestore
      const ordemRef = doc(db, "ordens", ordem.id);
      await updateDoc(ordemRef, { servicos: servicosAtualizados });
      
      // Atualize o estado local
      const ordemAtualizada = {
        ...ordem,
        servicos: servicosAtualizados
      };
      
      if (onOrdemUpdate) {
        onOrdemUpdate(ordemAtualizada);
      }
    } catch (error) {
      console.error("Erro ao atualizar subatividade:", error);
      toast.error("Erro ao atualizar subatividade");
    }
  };

  // Função para formatação dos nomes das etapas
  const formatarEtapa = (etapa: EtapaOS): string => {
    const labels: Record<EtapaOS, string> = {
      lavagem: "Lavagem",
      inspecao_inicial: "Inspeção Inicial",
      retifica: "Retífica",
      montagem: "Montagem",
      dinamometro: "Dinamômetro",
      inspecao_final: "Inspeção Final"
    };
    return labels[etapa] || etapa;
  };
  
  // Função para formatação dos nomes dos serviços
  const formatarTipoServico = (tipo: TipoServico): string => {
    const labels: Record<TipoServico, string> = {
      bloco: "Bloco",
      biela: "Biela",
      cabecote: "Cabeçote",
      virabrequim: "Virabrequim",
      eixo_comando: "Eixo de Comando",
      montagem: "Montagem",
      dinamometro: "Dinamômetro"
    };
    return labels[tipo] || tipo;
  };

  // Função para filtrar serviços com base nas especializações do técnico
  const filtrarServicosPorEspecializacao = (servicos: Servico[]): Servico[] => {
    if (!funcionario || funcionario.tipo !== 'tecnico' || !funcionario.especializacoes?.length) {
      return servicos;
    }
    
    return servicos.filter(servico => 
      funcionario.especializacoes?.includes(servico.tipo)
    );
  };

  // Organiza os serviços por etapas
  const getServicosParaEtapa = (etapa: EtapaOS): Servico[] => {
    let servicosEtapa: Servico[] = [];
    
    switch (etapa) {
      case 'retifica':
        servicosEtapa = ordem.servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
        break;
      case 'montagem':
        servicosEtapa = ordem.servicos.filter(servico => servico.tipo === 'montagem');
        break;
      case 'dinamometro':
        servicosEtapa = ordem.servicos.filter(servico => servico.tipo === 'dinamometro');
        break;
      // Para lavagem e inspeção inicial, retornar todos os serviços de componentes
      case 'lavagem':
      case 'inspecao_inicial':
        servicosEtapa = ordem.servicos.filter(servico => 
          ['bloco', 'biela', 'cabecote', 'virabrequim', 'eixo_comando'].includes(servico.tipo)
        );
        break;
      default:
        servicosEtapa = [];
    }

    // Se for técnico com especialização, filtrar apenas os serviços da especialização dele
    return filtrarServicosPorEspecializacao(servicosEtapa);
  };

  // Filtra apenas os serviços ativos
  const servicosAtivos = ordem.servicos.filter(servico => 
    servico.subatividades && servico.subatividades.some(sub => sub.selecionada)
  );
  
  // Filtra serviços com base nas especializações do técnico
  const servicosAtivosFiltrados = filtrarServicosPorEspecializacao(servicosAtivos);

  // Se não houver serviços selecionados, exiba uma mensagem
  if (servicosAtivosFiltrados.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            {funcionario?.tipo === 'tecnico' && funcionario.especializacoes?.length > 0 
              ? "Não há serviços da sua especialização selecionados para esta ordem."
              : "Não há serviços com subatividades selecionadas para esta ordem."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-6">
            {funcionario?.tipo === 'tecnico' && funcionario.especializacoes?.length > 0 
              ? "Esta ordem não contém serviços da sua especialização."
              : "Edite a ordem para selecionar serviços e subatividades."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Renderizar as etapas baseadas no perfil do usuário (diferentes para técnicos e gerentes/admin)
  const renderEtapas = () => {
    if (etapasAtivas.length === 0) {
      return (
        <p className="text-center py-6 text-muted-foreground">
          Nenhuma etapa disponível para esta ordem.
        </p>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6">
        {etapasAtivas.map(etapa => {
          // Para técnicos, mostrar apenas serviços da sua especialização
          if (funcionario?.tipo === 'tecnico') {
            // Verificar se há serviços da especialização do técnico para esta etapa
            const servicosEspecializados = getServicosParaEtapa(etapa);
            
            if (servicosEspecializados.length === 0) {
              // Não mostrar a etapa se não tiver serviços para o técnico
              return null;
            }
            
            // Para cada etapa permitida para técnicos, mostra apenas seus serviços especializados
            if (etapa === 'inspecao_inicial' || etapa === 'retifica') {
              return (
                <EtapaCard 
                  key={etapa}
                  ordemId={ordem.id}
                  etapa={etapa}
                  etapaNome={formatarEtapa(etapa)}
                  funcionarioId={funcionario?.id || ""}
                  funcionarioNome={funcionario?.nome}
                  servicos={servicosEspecializados}
                  etapaInfo={ordem.etapasAndamento[etapa]}
                  onSubatividadeToggle={(servicoTipo, subId, checked) => {
                    handleSubatividadeToggle(servicoTipo, subId, checked);
                  }}
                  onServicoStatusChange={handleServicoStatusChange}
                  onEtapaStatusChange={handleEtapaStatusChange}
                />
              );
            } else if (etapa === 'inspecao_final') {
              // Para inspeção final de técnicos, mostrar uma etapa para cada especialização
              return (
                <div key={etapa} className="space-y-4">
                  <h3 className="text-xl font-semibold">{formatarEtapa(etapa)}</h3>
                  {funcionario.especializacoes.map(tipoServico => {
                    // Verificar se este tipo de serviço existe na ordem
                    const servicoExiste = ordem.servicos.some(s => s.tipo === tipoServico);
                    if (!servicoExiste) return null;
                    
                    const etapaKey = `${etapa}_${tipoServico}` as EtapaOS;
                    return (
                      <EtapaCard 
                        key={etapaKey}
                        ordemId={ordem.id}
                        etapa={etapa}
                        etapaNome={`${formatarEtapa(etapa)} - ${formatarTipoServico(tipoServico)}`}
                        funcionarioId={funcionario?.id || ""}
                        funcionarioNome={funcionario?.nome}
                        servicos={[]}
                        etapaInfo={ordem.etapasAndamento[etapaKey]}
                        onEtapaStatusChange={(etapaParam, concluida) => 
                          handleEtapaStatusChange(etapaParam, concluida, tipoServico)
                        }
                        servicoTipo={tipoServico}
                      />
                    );
                  })}
                </div>
              );
            }
          } else {
            // Para gerentes e admins, mostrar todas as etapas conforme a lógica original
            if ((etapa === 'lavagem' || etapa === 'inspecao_inicial') && 
                (ordem.status === 'orcamento' || ordem.status === 'fabricacao')) {
              
              const servicosComponentes = getServicosParaEtapa(etapa);
              
              if (servicosComponentes.length === 0) {
                return (
                  <EtapaCard 
                    key={etapa}
                    ordemId={ordem.id}
                    etapa={etapa}
                    etapaNome={formatarEtapa(etapa)}
                    funcionarioId={funcionario?.id || ""}
                    funcionarioNome={funcionario?.nome}
                    servicos={[]}
                    etapaInfo={ordem.etapasAndamento[etapa]}
                    onEtapaStatusChange={handleEtapaStatusChange}
                  />
                );
              }
              
              return (
                <div key={etapa} className="space-y-4">
                  <h3 className="text-xl font-semibold">{formatarEtapa(etapa)}</h3>
                  {servicosComponentes.map(servico => {
                    const etapaKey = `${etapa}_${servico.tipo}` as EtapaOS;
                    return (
                      <EtapaCard 
                        key={etapaKey}
                        ordemId={ordem.id}
                        etapa={etapa}
                        etapaNome={`${formatarEtapa(etapa)} - ${formatarTipoServico(servico.tipo)}`}
                        funcionarioId={funcionario?.id || ""}
                        funcionarioNome={funcionario?.nome}
                        servicos={[servico]}
                        etapaInfo={ordem.etapasAndamento[etapaKey]}
                        onSubatividadeToggle={(servicoTipo, subId, checked) => {
                          handleSubatividadeToggle(servicoTipo, subId, checked);
                        }}
                        onServicoStatusChange={handleServicoStatusChange}
                        onEtapaStatusChange={(etapaParam, concluida) => 
                          handleEtapaStatusChange(etapaParam, concluida, servico.tipo)
                        }
                        servicoTipo={servico.tipo}
                      />
                    );
                  })}
                </div>
              );
            } else if (etapa === 'retifica' || etapa === 'montagem' || etapa === 'dinamometro') {
              const servicosEspecializados = getServicosParaEtapa(etapa);
              
              if (servicosEspecializados.length === 0) {
                return (
                  <EtapaCard 
                    key={etapa}
                    ordemId={ordem.id}
                    etapa={etapa}
                    etapaNome={formatarEtapa(etapa)}
                    funcionarioId={funcionario?.id || ""}
                    funcionarioNome={funcionario?.nome}
                    servicos={[]}
                    etapaInfo={ordem.etapasAndamento[etapa]}
                    onEtapaStatusChange={handleEtapaStatusChange}
                  />
                );
              }
              
              return (
                <EtapaCard 
                  key={etapa}
                  ordemId={ordem.id}
                  etapa={etapa}
                  etapaNome={formatarEtapa(etapa)}
                  funcionarioId={funcionario?.id || ""}
                  funcionarioNome={funcionario?.nome}
                  servicos={servicosEspecializados}
                  etapaInfo={ordem.etapasAndamento[etapa]}
                  onSubatividadeToggle={(servicoTipo, subId, checked) => {
                    handleSubatividadeToggle(servicoTipo, subId, checked);
                  }}
                  onServicoStatusChange={handleServicoStatusChange}
                  onEtapaStatusChange={handleEtapaStatusChange}
                />
              );
            } else if (etapa === 'inspecao_final') {
              return (
                <EtapaCard 
                  key={etapa}
                  ordemId={ordem.id}
                  etapa={etapa}
                  etapaNome={formatarEtapa(etapa)}
                  funcionarioId={funcionario?.id || ""}
                  funcionarioNome={funcionario?.nome}
                  servicos={[]}
                  etapaInfo={ordem.etapasAndamento[etapa]}
                  onEtapaStatusChange={handleEtapaStatusChange}
                />
              );
            }
            
            // Para outras etapas, manter o comportamento original
            return (
              <EtapaCard 
                key={etapa}
                ordemId={ordem.id}
                etapa={etapa}
                etapaNome={formatarEtapa(etapa)}
                funcionarioId={funcionario?.id || ""}
                funcionarioNome={funcionario?.nome}
                servicos={getServicosParaEtapa(etapa)}
                etapaInfo={ordem.etapasAndamento[etapa]}
                onSubatividadeToggle={(servicoTipo, subId, checked) => {
                  handleSubatividadeToggle(servicoTipo, subId, checked);
                }}
                onServicoStatusChange={handleServicoStatusChange}
                onEtapaStatusChange={handleEtapaStatusChange}
              />
            );
          }
          
          return null;
        })}
      </div>
    );
  };

  // Exibe o painel de tracker
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tracker de Serviços</CardTitle>
          <CardDescription>
            {funcionario?.tipo === 'tecnico' && funcionario.especializacoes?.length > 0 
              ? `Acompanhe o progresso dos serviços de sua especialização: ${funcionario.especializacoes.map(formatarTipoServico).join(', ')}`
              : "Acompanhe o progresso dos serviços e etapas desta ordem."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barra de progresso total */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Total</span>
              <span className="text-sm font-medium">{progressoTotal}%</span>
            </div>
            <Progress value={progressoTotal} className="h-3" />
          </div>

          {/* Lista de etapas */}
          {renderEtapas()}
        </CardContent>
      </Card>
    </div>
  );
};

export default EtapasTracker;
