
import { useCallback, useEffect, useState } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { OrdemServico, Servico, ServicoStatus } from "@/types/ordens";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SimpleFuncionarioSelector } from "@/components/funcionarios/SimpleFuncionarioSelector";
import { 
  marcarFuncionarioEmServico, 
  liberarFuncionarioDeServico,
  diagnosticarStatusFuncionario,
  limparDadosInconsistentes,
  forcarLiberacaoFuncionario
} from "@/services/funcionarioEmServicoService";

type ServicoControlTabProps = {
  ordem: OrdemServico;
  onOrdemUpdate?: (ordem: OrdemServico) => void;
};

const getStatusBadgeVariant = (status: ServicoStatus) => {
  switch (status) {
    case 'nao_iniciado': return 'outline';
    case 'em_andamento': return 'default';
    case 'pausado': return 'warning';
    case 'concluido': return 'success';
    default: return 'outline';
  }
};

const getStatusLabel = (status: ServicoStatus) => {
  switch (status) {
    case 'nao_iniciado': return 'Não Iniciado';
    case 'em_andamento': return 'Em Andamento';
    case 'pausado': return 'Pausado';
    case 'concluido': return 'Concluído';
    default: return 'Não Iniciado';
  }
};

const getStatusButtonStyle = (currentStatus: ServicoStatus, buttonStatus: ServicoStatus) => {
  if (currentStatus === buttonStatus) {
    switch (buttonStatus) {
      case 'em_andamento':
        return 'bg-blue-500 hover:bg-blue-600 text-white';
      case 'pausado':
        return 'bg-orange-500 hover:bg-orange-600 text-white';
      case 'concluido':
        return 'bg-green-600 hover:bg-green-700 text-white';
      default:
        return '';
    }
  }
  return '';
};

export function ServicoControlTab({ ordem, onOrdemUpdate }: ServicoControlTabProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diagnosticandoFuncionarios, setDiagnosticandoFuncionarios] = useState<string[]>([]);

  // Função para diagnosticar status de um funcionário específico
  const handleDiagnosticarFuncionario = async (funcionarioId: string) => {
    if (!funcionarioId) return;
    
    setDiagnosticandoFuncionarios(prev => [...prev, funcionarioId]);
    
    try {
      const diagnostico = await diagnosticarStatusFuncionario(funcionarioId);
      
      if (diagnostico.erro) {
        toast.error(`Erro no diagnóstico: ${diagnostico.erro}`);
        return;
      }
      
      // Mostrar resultado do diagnóstico
      if (diagnostico.inconsistente) {
        toast.warning(
          `Dados inconsistentes detectados! Funcionário está marcado como ocupado mas a ordem não existe.`,
          {
            duration: 8000,
            action: {
              label: "Limpar Automaticamente",
              onClick: () => handleLimparDados(funcionarioId)
            }
          }
        );
      } else {
        toast.success("Status do funcionário está consistente");
      }
      
      console.log("📋 Diagnóstico do funcionário:", diagnostico);
    } catch (error) {
      toast.error("Erro ao diagnosticar funcionário");
      console.error("Erro no diagnóstico:", error);
    } finally {
      setDiagnosticandoFuncionarios(prev => prev.filter(id => id !== funcionarioId));
    }
  };

  // Função para limpar dados inconsistentes
  const handleLimparDados = async (funcionarioId: string) => {
    try {
      const sucesso = await limparDadosInconsistentes(funcionarioId);
      if (sucesso) {
        toast.success("Dados inconsistentes corrigidos com sucesso");
      } else {
        toast.error("Não foi possível corrigir os dados");
      }
    } catch (error) {
      toast.error("Erro ao limpar dados inconsistentes");
      console.error("Erro na limpeza:", error);
    }
  };

  const handleStatusChange = async (servicoTipo: string, newStatus: ServicoStatus) => {
    try {
      setIsSubmitting(true);
      
      const servico = ordem.servicos.find(s => s.tipo === servicoTipo);
      const funcionarioId = servico?.funcionarioId;
      
      console.log("🔄 Mudança de status do serviço:", {
        servicoTipo,
        newStatus,
        funcionarioId,
        funcionarioNome: servico?.funcionarioNome,
        ordemId: ordem.id
      });
      
      // Gerenciar status do funcionário baseado no novo status do serviço
      if (funcionarioId) {
        if (newStatus === 'em_andamento') {
          console.log("🔄 Tentando marcar funcionário como ocupado...");
          console.log("Dados para marcar funcionário:", {
            funcionarioId,
            ordemId: ordem.id,
            etapa: 'retifica',
            servicoTipo: servico?.tipo
          });
          
          // Marcar funcionário como ocupado
          const success = await marcarFuncionarioEmServico(
            funcionarioId,
            ordem.id,
            'retifica', // Usar etapa padrão para serviços
            servico?.tipo
          );
          
          if (!success) {
            console.error("❌ Falha ao marcar funcionário como ocupado");
            
            // Oferecer opções de diagnóstico e correção
            toast.error("Não foi possível iniciar o serviço. Verifique se o funcionário está disponível.", {
              duration: 10000,
              action: {
                label: "Diagnosticar",
                onClick: () => handleDiagnosticarFuncionario(funcionarioId)
              }
            });
            return;
          }
          console.log("✅ Funcionário marcado como ocupado com sucesso");
        } else if (newStatus === 'pausado' || newStatus === 'concluido') {
          console.log("🔄 Liberando funcionário do serviço...");
          // Liberar funcionário
          const liberado = await liberarFuncionarioDeServico(funcionarioId);
          if (liberado) {
            console.log("✅ Funcionário liberado com sucesso");
          } else {
            console.warn("⚠️ Problema ao liberar funcionário, mas continuando...");
          }
        }
      } else if (newStatus === 'em_andamento') {
        toast.error("É necessário atribuir um funcionário antes de iniciar o serviço");
        return;
      }
      
      // Update the service status in the ordem
      const updatedServicos = ordem.servicos.map(servico => 
        servico.tipo === servicoTipo 
          ? { 
              ...servico, 
              status: newStatus,
              concluido: newStatus === 'concluido'
            }
          : servico
      );

      // Update in Firestore
      console.log("🔄 Atualizando serviços no Firestore...");
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        servicos: updatedServicos
      });
      console.log("✅ Serviços atualizados no Firestore");
      
      // Update local state
      if (onOrdemUpdate) {
        onOrdemUpdate({
          ...ordem,
          servicos: updatedServicos
        });
      }
      
      toast.success(`Status do serviço ${servicoTipo} atualizado para ${getStatusLabel(newStatus)}`);
    } catch (error) {
      console.error("❌ Erro ao atualizar status do serviço:", error);
      console.error("❌ Detalhes do erro:", {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast.error(`Erro ao atualizar status do serviço: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFuncionarioChange = async (servicoTipo: string, funcionarioId: string, funcionarioNome: string) => {
    try {
      setIsSubmitting(true);
      
      const servico = ordem.servicos.find(s => s.tipo === servicoTipo);
      const funcionarioAnteriorId = servico?.funcionarioId;
      
      console.log("Mudança de funcionário:", {
        servicoTipo,
        funcionarioAnterior: funcionarioAnteriorId,
        novoFuncionario: funcionarioId,
        novoFuncionarioNome: funcionarioNome,
        statusAtual: servico?.status
      });
      
      // Liberar funcionário anterior se existir
      if (funcionarioAnteriorId && funcionarioAnteriorId !== funcionarioId) {
        console.log("Liberando funcionário anterior...");
        await liberarFuncionarioDeServico(funcionarioAnteriorId);
      }
      
      // Update the service funcionario in the ordem
      const updatedServicos = ordem.servicos.map(servico => 
        servico.tipo === servicoTipo 
          ? { 
              ...servico, 
              funcionarioId,
              funcionarioNome
            }
          : servico
      );

      // Update in Firestore
      console.log("Atualizando serviços no Firestore...");
      const ordemRef = doc(db, "ordens_servico", ordem.id);
      await updateDoc(ordemRef, {
        servicos: updatedServicos
      });
      console.log("✅ Serviços atualizados no Firestore");
      
      // Se o serviço já está em andamento, marcar novo funcionário como ocupado
      if (servico?.status === 'em_andamento') {
        console.log("Serviço já está em andamento, marcando novo funcionário como ocupado...");
        const success = await marcarFuncionarioEmServico(
          funcionarioId,
          ordem.id,
          'retifica', // Usar etapa padrão para serviços
          servico?.tipo
        );
        
        if (!success) {
          toast.warning("Funcionário atribuído mas não foi possível marcá-lo como ocupado. O serviço foi pausado.");
          // Pausar o serviço se não conseguir marcar funcionário como ocupado
          const servicosPausados = updatedServicos.map(s => 
            s.tipo === servicoTipo ? { ...s, status: 'pausado' as ServicoStatus } : s
          );
          await updateDoc(ordemRef, { servicos: servicosPausados });
          if (onOrdemUpdate) {
            onOrdemUpdate({ ...ordem, servicos: servicosPausados });
          }
          return;
        }
      }
      
      // Update local state
      if (onOrdemUpdate) {
        onOrdemUpdate({
          ...ordem,
          servicos: updatedServicos
        });
      }
      
      toast.success(`Funcionário ${funcionarioNome} atribuído ao serviço ${servicoTipo}`);
    } catch (error) {
      console.error("Erro ao atualizar funcionário do serviço:", error);
      toast.error("Erro ao atualizar funcionário do serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TabsContent value="controle-servicos" className="space-y-4 py-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Controle de Serviços</h2>
        <p className="text-muted-foreground">Gerencie os funcionários responsáveis e status de cada serviço</p>
      </div>
      
      {ordem.servicos && ordem.servicos.length > 0 ? (
        <div className="space-y-6">
          {ordem.servicos.map((servico, index) => (
            <Card key={`${servico.tipo}-${index}`} className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl capitalize mb-2">
                      {servico.tipo.replace('_', ' ')}
                    </CardTitle>
                    {servico.descricao && (
                      <p className="text-sm text-muted-foreground">
                        {servico.descricao}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusBadgeVariant(servico.status || 'nao_iniciado')} className="text-sm">
                    {getStatusLabel(servico.status || 'nao_iniciado')}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Funcionário Responsável */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SimpleFuncionarioSelector
                      label="Funcionário Responsável"
                      especialidadeRequerida={servico.tipo}
                      funcionarioAtualId={servico.funcionarioId}
                      funcionarioAtualNome={servico.funcionarioNome}
                      onFuncionarioSelecionado={(id, nome) => handleFuncionarioChange(servico.tipo, id, nome)}
                      mostrarCancelar={false}
                    />
                    
                    {/* Botões de diagnóstico e liberação */}
                    {servico.funcionarioId && (
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDiagnosticarFuncionario(servico.funcionarioId!)}
                          disabled={diagnosticandoFuncionarios.includes(servico.funcionarioId!)}
                          className="text-xs"
                        >
                          {diagnosticandoFuncionarios.includes(servico.funcionarioId!) ? "Verificando..." : "Diagnosticar"}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => forcarLiberacaoFuncionario(servico.funcionarioId!)}
                          className="text-xs"
                        >
                          Liberar
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de Status */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700">Status do Serviço</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'nao_iniciado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'nao_iniciado')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'nao_iniciado')}`}
                    >
                      Não Iniciado
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'em_andamento' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'em_andamento')}
                      disabled={isSubmitting || !servico.funcionarioId}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'em_andamento')}`}
                    >
                      Em Andamento
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'pausado' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'pausado')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'pausado')}`}
                    >
                      Pausado
                    </Button>
                    
                    <Button 
                      variant={(servico.status || 'nao_iniciado') === 'concluido' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusChange(servico.tipo, 'concluido')}
                      disabled={isSubmitting}
                      className={`h-10 ${getStatusButtonStyle(servico.status || 'nao_iniciado', 'concluido')}`}
                    >
                      Finalizado
                    </Button>
                  </div>
                  
                  {!servico.funcionarioId && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Atribua um funcionário antes de iniciar o serviço
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-600 mb-4">Esta ordem não possui serviços configurados.</p>
              <p className="text-sm text-gray-500">
                Para adicionar serviços, edite a ordem e selecione os serviços desejados.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
