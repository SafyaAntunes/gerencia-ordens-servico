
import { useState } from "react";
import { Servico, TipoServico, EtapaOS } from "@/types/ordens";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, Clock, X } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EtapaCardProps {
  ordemId: string;
  etapa: EtapaOS;
  etapaNome: string;
  funcionarioId: string;
  funcionarioNome?: string;
  servicos: Servico[];
  etapaInfo?: {
    concluido?: boolean;
    funcionarioId?: string;
    funcionarioNome?: string;
    iniciado?: Date;
    finalizado?: Date;
  };
  onSubatividadeToggle: (servicoTipo: TipoServico, subatividadeId: string, checked: boolean) => void;
  onServicoStatusChange: (servicoTipo: TipoServico, concluido: boolean) => void;
  onEtapaStatusChange: (etapa: EtapaOS, concluida: boolean) => void;
}

const EtapaCard = ({
  ordemId,
  etapa,
  etapaNome,
  funcionarioId,
  funcionarioNome,
  servicos,
  etapaInfo,
  onSubatividadeToggle,
  onServicoStatusChange,
  onEtapaStatusChange
}: EtapaCardProps) => {
  const [confirming, setConfirming] = useState(false);
  
  const temSubatividade = servicos.some(s => s.subatividades && s.subatividades.length > 0);
  const todosSelecionados = servicos.every(s => !s.subatividades || s.subatividades.every(sub => sub.concluida));
  const todosServicosAtivos = servicos.filter(s => 
    s.subatividades && s.subatividades.some(sub => sub.selecionada)
  );
  const todoServicosConluidos = todosServicosAtivos.length > 0 && todosServicosAtivos.every(s => s.concluido);

  const handleToggleEtapa = (concluida: boolean) => {
    if (concluida && !confirming) {
      setConfirming(true);
      return;
    }
    
    onEtapaStatusChange(etapa, concluida);
    setConfirming(false);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{etapaNome}</CardTitle>
          <Badge variant={etapaInfo?.concluido ? "success" : "outline"}>
            {etapaInfo?.concluido ? "Concluída" : "Em andamento"}
          </Badge>
        </div>
        
        <CardDescription>
          {etapaInfo?.funcionarioNome && etapaInfo?.concluido && (
            <div className="flex items-center text-sm mt-1">
              <span className="font-medium text-muted-foreground mr-1">
                Concluída por:
              </span>
              <span>{etapaInfo.funcionarioNome}</span>
            </div>
          )}
          
          {etapaInfo?.finalizado && (
            <div className="flex items-center text-sm">
              <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(new Date(etapaInfo.finalizado), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2">
        {servicos.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              Serviços desta etapa:
            </h3>
            
            <Accordion type="multiple" className="w-full">
              {servicos.map((servico, index) => {
                const hasSubatividades = servico.subatividades && servico.subatividades.some(s => s.selecionada);
                
                return (
                  <AccordionItem 
                    key={`${servico.tipo}-${index}`} 
                    value={`${servico.tipo}-${index}`}
                    className={`${servico.concluido ? 'border-green-100 bg-green-50' : ''}`}
                  >
                    <AccordionTrigger className="py-2">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${servico.concluido ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <span>{servico.tipo.charAt(0).toUpperCase() + servico.tipo.slice(1).replace('_', ' ')}</span>
                        </div>
                        
                        {servico.concluido && (
                          <Badge variant="outline" className="bg-green-100 ml-2 text-xs">
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    
                    <AccordionContent>
                      {servico.funcionarioNome && servico.concluido && (
                        <div className="mb-2 text-sm flex flex-col">
                          <span className="text-muted-foreground">
                            Concluído por: <span className="font-medium">{servico.funcionarioNome}</span>
                          </span>
                          {servico.dataConclusao && (
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {format(new Date(servico.dataConclusao), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {hasSubatividades ? (
                        <div className="space-y-2 py-1">
                          {servico.subatividades
                            .filter(sub => sub.selecionada)
                            .map((sub) => (
                              <div key={sub.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`${servico.tipo}-${sub.id}`}
                                  checked={sub.concluida}
                                  onCheckedChange={(checked) => 
                                    onSubatividadeToggle(servico.tipo as TipoServico, sub.id, !!checked)
                                  }
                                  disabled={etapaInfo?.concluido}
                                />
                                <label
                                  htmlFor={`${servico.tipo}-${sub.id}`}
                                  className={`text-sm ${sub.concluida ? 'line-through text-muted-foreground' : ''}`}
                                >
                                  {sub.nome}
                                </label>
                              </div>
                            ))}
                          
                          <div className="flex justify-end pt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={servico.concluido ? "destructive" : "default"}
                              onClick={() => onServicoStatusChange(servico.tipo as TipoServico, !servico.concluido)}
                              disabled={etapaInfo?.concluido}
                            >
                              {servico.concluido ? (
                                <>
                                  <X className="h-4 w-4 mr-1" />
                                  Reabrir
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Marcar concluído
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1 text-sm text-muted-foreground italic">
                          Não há subatividades selecionadas para este serviço.
                        </div>
                      )}
                      
                      {servico.descricao && (
                        <div className="mt-2 text-sm">
                          <Separator className="my-1" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {servico.descricao}
                          </p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        ) : (
          <div className="py-2 text-sm text-muted-foreground italic">
            Não há serviços associados a esta etapa.
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-2">
        {confirming ? (
          <div className="w-full space-y-2">
            <p className="text-sm font-medium">
              Tem certeza que deseja marcar esta etapa como concluída?
            </p>
            <div className="flex justify-end space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleToggleEtapa(true)}
              >
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <Button 
              className="w-full" 
              variant={etapaInfo?.concluido ? "destructive" : "default"}
              onClick={() => handleToggleEtapa(!etapaInfo?.concluido)}
              disabled={!etapaInfo?.concluido && (!temSubatividade || !todoServicosConluidos)}
            >
              {etapaInfo?.concluido ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Reabrir Etapa
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Concluir Etapa
                </>
              )}
            </Button>
            
            {!etapaInfo?.concluido && (!temSubatividade || !todoServicosConluidos) && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Todos os serviços devem ser concluídos antes de finalizar a etapa.
              </p>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default EtapaCard;
