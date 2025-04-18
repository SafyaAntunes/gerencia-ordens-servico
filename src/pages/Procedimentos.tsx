
import { useState } from "react";
import Layout from "@/components/layout/Layout";
import { TipoServico } from "@/types/ordens";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProcedimentoForm from "@/components/procedimentos/ProcedimentoForm";

interface ProcedimentosProps {
  onLogout: () => void;
}

export default function Procedimentos({ onLogout }: ProcedimentosProps) {
  const [activeTab, setActiveTab] = useState<TipoServico>("bloco");
  
  const { data: procedimentos, isLoading } = useQuery({
    queryKey: ['procedimentos'],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "procedimentos"));
      const docs = {};
      snapshot.forEach(doc => {
        docs[doc.id] = doc.data();
      });
      return docs;
    }
  });
  
  const servicoTipos: TipoServico[] = [
    'bloco',
    'biela',
    'cabecote',
    'virabrequim',
    'eixo_comando',
    'montagem',
    'dinamometro',
    'lavagem'
  ];

  const getServicoNome = (tipo: TipoServico): string => {
    const nomes = {
      bloco: 'Bloco',
      biela: 'Biela',
      cabecote: 'Cabeçote',
      virabrequim: 'Virabrequim',
      eixo_comando: 'Eixo Comando',
      montagem: 'Montagem',
      dinamometro: 'Dinamômetro',
      lavagem: 'Lavagem'
    };
    return nomes[tipo];
  };

  return (
    <Layout onLogout={onLogout}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Procedimentos Operacionais Padrão (POP)
          </h1>
          <p className="text-muted-foreground">
            Gerencie os procedimentos padrão para cada tipo de serviço
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Procedimentos por Serviço</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TipoServico)}>
              <TabsList className="grid grid-cols-4 lg:grid-cols-8 w-full">
                {servicoTipos.map((tipo) => (
                  <TabsTrigger key={tipo} value={tipo}>
                    {getServicoNome(tipo)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {servicoTipos.map((tipo) => (
                <TabsContent key={tipo} value={tipo}>
                  <ProcedimentoForm
                    tipo={tipo}
                    procedimento={procedimentos?.[tipo]}
                    isLoading={isLoading}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
