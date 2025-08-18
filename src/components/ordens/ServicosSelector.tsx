import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Wrench, Cog, Car, Settings, Hammer, Activity, Droplets, Eye, CheckCircle } from "lucide-react";
import { TipoServico } from '@/types/ordens';
import { cn } from "@/lib/utils";

interface ServicosSelectorProps {
  servicosSelecionados: string[];
  servicosDescricoes: Record<string, string>;
  onToggleServico: (tipo: string, checked: boolean) => void;
  onChangeDescricao: (tipo: string, descricao: string) => void;
}

// Configuração dos serviços com ícones e agrupamento
const SERVICOS_CONFIG = {
  'Retífica': [
    { tipo: 'bloco', nome: 'Bloco', icon: Cog, description: 'Retífica do bloco do motor' },
    { tipo: 'biela', nome: 'Biela', icon: Settings, description: 'Retífica da biela' },
    { tipo: 'cabecote', nome: 'Cabeçote', icon: Wrench, description: 'Retífica do cabeçote' },
    { tipo: 'virabrequim', nome: 'Virabrequim', icon: Settings, description: 'Retífica do virabrequim' },
    { tipo: 'eixo_comando', nome: 'Eixo Comando', icon: Cog, description: 'Retífica do eixo comando' },
  ],
  'Montagem e Testes': [
    { tipo: 'montagem', nome: 'Montagem', icon: Hammer, description: 'Montagem completa do motor' },
    { tipo: 'dinamometro', nome: 'Dinamômetro', icon: Activity, description: 'Teste no dinamômetro' },
  ],
  'Serviços Auxiliares': [
    { tipo: 'lavagem', nome: 'Lavagem', icon: Droplets, description: 'Lavagem de peças' },
    { tipo: 'inspecao_inicial', nome: 'Inspeção Inicial', icon: Eye, description: 'Inspeção inicial das peças' },
    { tipo: 'inspecao_final', nome: 'Inspeção Final', icon: CheckCircle, description: 'Inspeção final do motor' },
  ]
};

export function ServicosSelector({
  servicosSelecionados,
  servicosDescricoes,
  onToggleServico,
  onChangeDescricao
}: ServicosSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'Retífica': true,
    'Montagem e Testes': true,
    'Serviços Auxiliares': true
  });

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Filtrar serviços baseado na busca
  const filteredGroups = Object.entries(SERVICOS_CONFIG).reduce((acc, [groupName, servicos]) => {
    const filteredServicos = servicos.filter(servico =>
      servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      servico.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (filteredServicos.length > 0) {
      acc[groupName] = filteredServicos;
    }
    
    return acc;
  }, {} as Record<string, typeof SERVICOS_CONFIG[keyof typeof SERVICOS_CONFIG]>);

  // Contar serviços selecionados
  const servicosCount = servicosSelecionados.length;

  return (
    <div className="space-y-4">
      {/* Header com busca e contador */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Serviços</h3>
          {servicosCount > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Car className="h-3 w-3" />
              {servicosCount} selecionado{servicosCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar serviços..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Serviços selecionados (resumo) */}
      {servicosCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Serviços Selecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {servicosSelecionados.map(tipo => {
                const servico = Object.values(SERVICOS_CONFIG)
                  .flat()
                  .find(s => s.tipo === tipo);
                
                return servico ? (
                  <Badge
                    key={tipo}
                    variant="default"
                    className="flex items-center gap-1"
                  >
                    <servico.icon className="h-3 w-3" />
                    {servico.nome}
                  </Badge>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grupos de serviços */}
      {Object.entries(filteredGroups).map(([groupName, servicos]) => (
        <Card key={groupName} className="overflow-hidden">
          <CardHeader
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleGroup(groupName)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{groupName}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {servicos.filter(s => servicosSelecionados.includes(s.tipo)).length}/{servicos.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <Search className={cn(
                    "h-4 w-4 transition-transform",
                    expandedGroups[groupName] ? "rotate-180" : ""
                  )} />
                </Button>
              </div>
            </div>
          </CardHeader>

          {expandedGroups[groupName] && (
            <CardContent className="pt-0">
              <div className="grid gap-3">
                {servicos.map(servico => {
                  const isSelected = servicosSelecionados.includes(servico.tipo);
                  const Icon = servico.icon;

                  return (
                    <div
                      key={servico.tipo}
                      className={cn(
                        "border rounded-lg p-4 transition-all",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-sm" 
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            id={`servico-${servico.tipo}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => onToggleServico(servico.tipo, !!checked)}
                          />
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <Label
                                htmlFor={`servico-${servico.tipo}`}
                                className="font-medium cursor-pointer"
                              >
                                {servico.nome}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {servico.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t">
                          <Label htmlFor={`${servico.tipo}-descricao`} className="text-sm">
                            Descrição específica (opcional)
                          </Label>
                          <Textarea
                            id={`${servico.tipo}-descricao`}
                            placeholder={`Detalhes específicos sobre ${servico.nome.toLowerCase()}...`}
                            value={servicosDescricoes[servico.tipo] || ''}
                            onChange={(e) => onChangeDescricao(servico.tipo, e.target.value)}
                            rows={2}
                            className="mt-1 resize-y min-h-[60px] max-h-[120px] overflow-wrap-anywhere break-words"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {Object.keys(filteredGroups).length === 0 && searchTerm && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhum serviço encontrado para "{searchTerm}"
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}