import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from 'lucide-react';
import { TipoServico, SubAtividade } from '@/types/ordens';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { toast } from "sonner";
import { SimpleFuncionarioSelector } from '@/components/funcionarios/SimpleFuncionarioSelector';
import useFuncionariosDisponibilidade from "@/hooks/useFuncionariosDisponibilidade";

interface ServicoControlProps {
  tipo: TipoServico;
  form: any;
  handleSubatividadeToggle: (servicoTipo: string, subatividadeId: string, checked: boolean) => void;
  handleAtividadeEspecificaToggle: (servicoTipo: string, tipoAtividade: string, subatividadeId: string, checked: boolean) => void;
  descricao?: string;
  subatividades?: SubAtividade[];
  onChange?: (tipo: TipoServico, descricao: string, subatividades: SubAtividade[]) => void;
  atividadesEspecificas?: Record<string, SubAtividade[]>;
  onAtividadeEspecificaToggle?: (servicoTipo: string, tipoAtividade: string, subatividadeId: string, checked: boolean) => void;
}

const toTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export function ServicoControl({
  tipo,
  form,
  handleSubatividadeToggle,
  handleAtividadeEspecificaToggle,
  descricao = '',
  subatividades = [],
  onChange,
  atividadesEspecificas,
  onAtividadeEspecificaToggle
}: ServicoControlProps) {
  const [localDescricao, setLocalDescricao] = useState(descricao);
  const [localSubatividades, setLocalSubatividades] = useState(subatividades);
  const [novaAtividadeNome, setNovaAtividadeNome] = useState('');
  const [novaAtividadeTempoEstimado, setNovaAtividadeTempoEstimado] = useState<number | undefined>(undefined);
  const [funcionarioResponsavelId, setFuncionarioResponsavelId] = useState<string | null>(null);
  const [funcionarioResponsavelNome, setFuncionarioResponsavelNome] = useState<string | null>(null);

  const handleFuncionarioSelecionado = useCallback((id: string, nome: string) => {
    setFuncionarioResponsavelId(id);
    setFuncionarioResponsavelNome(nome);
  }, []);

  useEffect(() => {
    if (onChange) {
      setLocalDescricao(descricao);
      setLocalSubatividades(subatividades);
    }
  }, [tipo, descricao, subatividades, onChange]);

  useEffect(() => {
    if (onChange) {
      onChange(tipo, localDescricao, localSubatividades);
    }
  }, [tipo, localDescricao, localSubatividades, onChange]);

  const handleDescricaoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalDescricao(e.target.value);
  };

  const handleSubatividadeToggleLocal = (id: string, checked: boolean) => {
    const updatedSubatividades = localSubatividades.map(sub =>
      sub.id === id ? { ...sub, selecionada: checked } : sub
    );
    setLocalSubatividades(updatedSubatividades);
    handleSubatividadeToggle(tipo, id, checked);
  };

  const handleAddAtividadeEspecifica = (tipoAtividade: string) => {
    if (!novaAtividadeNome.trim()) {
      toast.error("Nome da atividade não pode estar vazio");
      return;
    }

    const novaAtividade: SubAtividade = {
      id: Date.now().toString(),
      nome: toTitleCase(novaAtividadeNome.trim()),
      selecionada: true,
      tempoEstimado: novaAtividadeTempoEstimado,
      servicoTipo: tipo,
      tipoAtividade: tipoAtividade,
    };

    if (onChange) {
      // If onChange is provided, use it
      onChange(tipo, localDescricao, [...localSubatividades, novaAtividade]);
    } else {
      // Otherwise use the form methods directly
      const servicosSubatividades = form.getValues("servicosSubatividades") || {};
      const currentSubatividades = servicosSubatividades[tipo] || [];
      form.setValue("servicosSubatividades", { 
        ...servicosSubatividades, 
        [tipo]: [...currentSubatividades, novaAtividade] 
      });
    }

    setNovaAtividadeNome('');
    setNovaAtividadeTempoEstimado(undefined);
  };

  const handleRemoveAtividadeEspecifica = (tipoAtividade: string, id: string) => {
    if (onChange) {
      const updatedSubatividades = localSubatividades.filter(sub => sub.id !== id);
      onChange(tipo, localDescricao, updatedSubatividades);
    } else {
      // Use form methods directly
      const servicosSubatividades = form.getValues("servicosSubatividades") || {};
      const currentSubatividades = servicosSubatividades[tipo] || [];
      form.setValue("servicosSubatividades", {
        ...servicosSubatividades,
        [tipo]: currentSubatividades.filter((sub: SubAtividade) => sub.id !== id)
      });
    }
  };

  // Filter subatividades by tipoAtividade
  const getSubatividadesByTipo = (tipoAtividade: string) => {
    if (!form) return [];
    
    const servicosSubatividades = form.getValues("servicosSubatividades") || {};
    const allSubatividades = servicosSubatividades[tipo] || [];
    
    return allSubatividades.filter((sub: SubAtividade) => sub.tipoAtividade === tipoAtividade);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{toTitleCase(tipo)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor={`${tipo}-descricao`}>Descrição do Serviço</Label>
          <Textarea
            id={`${tipo}-descricao`}
            placeholder="Detalhes sobre o serviço a ser realizado..."
            value={form ? form.getValues(`servicosDescricoes.${tipo}`) || '' : localDescricao}
            onChange={(e) => {
              if (form) {
                const descricoes = form.getValues('servicosDescricoes') || {};
                form.setValue('servicosDescricoes', { ...descricoes, [tipo]: e.target.value });
              } else {
                handleDescricaoChange(e);
              }
            }}
          />
        </div>

        <div>
          <Label>Subatividades Padrão</Label>
          <div className="pl-4 space-y-2">
            {localSubatividades.map(sub => (
              <div key={sub.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`${tipo}-subatividade-${sub.id}`}
                  checked={sub.selecionada}
                  onCheckedChange={(checked) => handleSubatividadeToggleLocal(sub.id, !!checked)}
                />
                <Label htmlFor={`${tipo}-subatividade-${sub.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                  {sub.nome}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label>Atividades Especificas</Label>
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="retifica">
              <AccordionTrigger>Retífica</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {localSubatividades
                    .filter(sub => sub.tipoAtividade === 'retifica')
                    .map(sub => (
                      <div key={sub.id} className="flex items-center space-x-2 pl-4">
                        <Checkbox
                          id={`${tipo}-retifica-${sub.id}`}
                          checked={sub.selecionada}
                          onCheckedChange={(checked) => handleAtividadeEspecificaToggle('retifica', sub.id, !!checked)}
                        />
                        <Label htmlFor={`${tipo}-retifica-${sub.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed">
                          {sub.nome}
                        </Label>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveAtividadeEspecifica('retifica', sub.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                  <div className="flex items-center space-x-2 pl-4">
                    <Input
                      type="text"
                      placeholder="Nova atividade de retífica"
                      value={novaAtividadeNome}
                      onChange={(e) => setNovaAtividadeNome(e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Tempo estimado (horas)"
                      value={novaAtividadeTempoEstimado === undefined ? '' : novaAtividadeTempoEstimado.toString()}
                      onChange={(e) => setNovaAtividadeTempoEstimado(e.target.value === '' ? undefined : Number(e.target.value))}
                    />
                    <Button variant="outline" size="icon" onClick={() => handleAddAtividadeEspecifica('retifica')}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div>
          <SimpleFuncionarioSelector
            label="Responsável"
            especialidadeRequerida={tipo}
            funcionarioAtualId={funcionarioResponsavelId || undefined}
            funcionarioAtualNome={funcionarioResponsavelNome || undefined}
            onFuncionarioSelecionado={handleFuncionarioSelecionado}
            mostrarCancelar={false}
          />
        </div>
      </CardContent>
    </Card>
  );
}
