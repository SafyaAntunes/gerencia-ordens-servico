
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Droplet, FileSearch, Search } from "lucide-react";
import SubatividadesConfig from "./SubatividadesConfig";

interface ConfiguracoesProps {
  onLogout: () => void;
}

export default function Configuracoes({ onLogout }: ConfiguracoesProps) {
  const [activeTab, setActiveTab] = useState("subatividades");
  
  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações do sistema
          </p>
        </div>
        
        <Tabs 
          defaultValue="subatividades" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-6">
            <TabsTrigger value="subatividades" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Subatividades
            </TabsTrigger>
            <TabsTrigger value="lavagem" className="flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Lavagem
            </TabsTrigger>
            <TabsTrigger value="inspecao_inicial" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Inspeção Inicial
            </TabsTrigger>
            <TabsTrigger value="inspecao_final" className="flex items-center gap-2">
              <FileSearch className="h-4 w-4" />
              Inspeção Final
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="subatividades">
            <SubatividadesConfig onLogout={onLogout} isEmbedded={true} />
          </TabsContent>
          
          <TabsContent value="lavagem">
            <SubatividadesConfig 
              onLogout={onLogout} 
              isEmbedded={true} 
              tipoFixo="lavagem" 
              titulo="Configuração de Atividades de Lavagem"
              descricao="Configure as atividades de lavagem específicas para cada tipo de serviço"
              porServico={true}
            />
          </TabsContent>
          
          <TabsContent value="inspecao_inicial">
            <SubatividadesConfig 
              onLogout={onLogout} 
              isEmbedded={true} 
              tipoFixo="inspecao_inicial" 
              titulo="Configuração de Atividades de Inspeção Inicial"
              descricao="Configure as atividades de inspeção inicial específicas para cada tipo de serviço"
              porServico={true}
            />
          </TabsContent>
          
          <TabsContent value="inspecao_final">
            <SubatividadesConfig 
              onLogout={onLogout} 
              isEmbedded={true} 
              tipoFixo="inspecao_final" 
              titulo="Configuração de Atividades de Inspeção Final"
              descricao="Configure as atividades de inspeção final específicas para cada tipo de serviço"
              porServico={true}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
