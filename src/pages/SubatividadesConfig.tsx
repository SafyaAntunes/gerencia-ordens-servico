
import React, { useState, useEffect } from 'react';
import Layout from "@/components/layout/Layout";
import { SubatividadeForm } from "@/components/subatividades/SubatividadeForm";
import { getSubatividades, saveSubatividade, deleteSubatividade } from "@/services/subatividadeService";
import { SubAtividade, TipoServico } from "@/types/ordens";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SubatividadeList } from "@/components/subatividades/SubatividadeList";
import { AlertTriangle, ClipboardList } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Mapeia os tipos de serviço para nomes amigáveis
const tipoServicoNames: Record<TipoServico, string> = {
  bloco: "Bloco",
  biela: "Biela",
  cabecote: "Cabeçote",
  virabrequim: "Virabrequim",
  eixo_comando: "Eixo de Comando",
  montagem: "Montagem",
  dinamometro: "Dinamômetro",
  lavagem: "Lavagem"
};

// Define a lista de tipos de serviço para as abas
const tiposServico: TipoServico[] = [
  "bloco",
  "biela",
  "cabecote",
  "virabrequim",
  "eixo_comando",
  "montagem",
  "dinamometro",
  "lavagem"
];

export default function SubatividadesConfig({ onLogout }: { onLogout?: () => void }) {
  const [subatividades, setSubatividades] = useState<Record<TipoServico, SubAtividade[]>>({} as Record<TipoServico, SubAtividade[]>);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<TipoServico>("bloco");
  const [isEditing, setIsEditing] = useState<SubAtividade | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSubatividades();
  }, []);

  const loadSubatividades = async () => {
    setIsLoading(true);
    try {
      const data = await getSubatividades();
      setSubatividades(data);
    } catch (error) {
      console.error("Erro ao carregar subatividades:", error);
      toast({
        title: "Erro ao carregar subatividades",
        description: "Não foi possível carregar a lista de subatividades.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubatividade = async (data: SubAtividade, tipoServico: TipoServico) => {
    try {
      await saveSubatividade(data, tipoServico);
      toast({
        title: "Subatividade salva",
        description: "A subatividade foi salva com sucesso.",
        variant: "default"
      });
      
      // Atualiza a lista local
      setSubatividades(prev => ({
        ...prev,
        [tipoServico]: prev[tipoServico]
          ? prev[tipoServico].some(s => s.id === data.id)
            ? prev[tipoServico].map(s => s.id === data.id ? data : s)
            : [...prev[tipoServico], data]
          : [data]
      }));
      
      setIsEditing(null);
    } catch (error) {
      console.error("Erro ao salvar subatividade:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a subatividade.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteSubatividade = async (id: string, tipoServico: TipoServico) => {
    try {
      await deleteSubatividade(id, tipoServico);
      toast({
        title: "Subatividade excluída",
        description: "A subatividade foi excluída com sucesso.",
        variant: "default"
      });
      
      // Atualiza a lista local
      setSubatividades(prev => ({
        ...prev,
        [tipoServico]: prev[tipoServico].filter(s => s.id !== id)
      }));
    } catch (error) {
      console.error("Erro ao excluir subatividade:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a subatividade.",
        variant: "destructive"
      });
    }
  };

  const handleEditSubatividade = (subatividade: SubAtividade) => {
    setIsEditing(subatividade);
  };

  return (
    <Layout title="Configuração de Subatividades" onLogout={onLogout}>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">Configuração de Subatividades</h1>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Importante</AlertTitle>
          <AlertDescription>
            Defina as subatividades para cada tipo de serviço junto com seus preços por hora.
            Essas informações serão usadas para calcular os custos nas ordens de serviço.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Nova Subatividade</CardTitle>
              <CardDescription>
                Adicione ou edite uma subatividade para o tipo de serviço selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SubatividadeForm 
                onSave={(data) => handleSaveSubatividade(data, selectedTab)} 
                tipoServico={selectedTab}
                initialData={isEditing}
                onCancel={() => setIsEditing(null)}
              />
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Lista de Subatividades
              </CardTitle>
              <CardDescription>
                Gerencie as subatividades cadastradas por tipo de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                defaultValue="bloco" 
                value={selectedTab}
                onValueChange={(value) => setSelectedTab(value as TipoServico)}
                className="w-full"
              >
                <TabsList className="grid grid-cols-4 mb-4">
                  {tiposServico.slice(0, 4).map(tipo => (
                    <TabsTrigger key={tipo} value={tipo}>
                      {tipoServicoNames[tipo]}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsList className="grid grid-cols-4 mb-6">
                  {tiposServico.slice(4).map(tipo => (
                    <TabsTrigger key={tipo} value={tipo}>
                      {tipoServicoNames[tipo]}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {tiposServico.map(tipo => (
                  <TabsContent key={tipo} value={tipo} className="space-y-4">
                    <SubatividadeList 
                      subatividades={subatividades[tipo] || []}
                      isLoading={isLoading}
                      onEdit={handleEditSubatividade}
                      onDelete={(id) => handleDeleteSubatividade(id, tipo)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
