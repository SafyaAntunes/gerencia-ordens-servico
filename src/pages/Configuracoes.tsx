
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
import { ClipboardList, HardDrive } from "lucide-react";
import SubatividadesConfig from "./SubatividadesConfig";
import { StorageInfo } from "@/components/common/StorageInfo";

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
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
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
                <TabsTrigger value="armazenamento" className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Armazenamento
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="subatividades">
                <SubatividadesConfig isEmbedded={true} />
              </TabsContent>
              
              <TabsContent value="armazenamento">
                <Card>
                  <CardHeader>
                    <CardTitle>Armazenamento</CardTitle>
                    <CardDescription>
                      Gerencie o armazenamento da aplicação
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StorageInfo />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajuda</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  As configurações permitem personalizar o sistema para atender às suas necessidades específicas.
                </p>
                <ul className="list-disc pl-5 text-sm space-y-2">
                  <li>
                    <strong>Subatividades</strong>: Configure as subatividades para os diferentes serviços.
                  </li>
                  <li>
                    <strong>Armazenamento</strong>: Visualize e gerencie o uso de armazenamento do sistema.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
