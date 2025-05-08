
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Layout from "@/components/layout/Layout";
import OrdemForm from "@/components/ordens/OrdemForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import types from the file
import type {
  Cliente,
  Motor,
  TipoServico,
  TipoAtividade,
  SubAtividade,
  Servico,
  StatusOS,
  EtapaOS,
  Prioridade,
  TempoRegistro,
  FotoBase64,
  PausaRegistro,
  OrdemServico,
} from "@/types/ordens";

interface RelatoriosProducaoProps {
  onLogout: () => void;
}

const RelatoriosProducao = ({ onLogout }: RelatoriosProducaoProps) => {
  return (
    <Layout onLogout={onLogout}>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Relatórios de Produção</h1>
        
        <Tabs defaultValue="etapas" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="etapas">Por Etapas</TabsTrigger>
            <TabsTrigger value="servicos">Por Serviços</TabsTrigger>
            <TabsTrigger value="funcionarios">Por Funcionários</TabsTrigger>
          </TabsList>
          
          <TabsContent value="etapas">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Etapas</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Relatórios de produtividade por etapas serão exibidos aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="servicos">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Serviços</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Relatórios de produtividade por tipos de serviços serão exibidos aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="funcionarios">
            <Card>
              <CardHeader>
                <CardTitle>Produtividade por Funcionários</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Relatórios de produtividade por funcionários serão exibidos aqui.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default RelatoriosProducao;
