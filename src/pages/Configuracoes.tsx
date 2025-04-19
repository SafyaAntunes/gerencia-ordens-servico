
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
import { ClipboardList } from "lucide-react";
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
          </TabsList>
          
          <TabsContent value="subatividades">
            <SubatividadesConfig onLogout={onLogout} isEmbedded={true} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
