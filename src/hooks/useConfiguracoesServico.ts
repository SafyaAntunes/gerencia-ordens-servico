
import { useState, useEffect } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SubAtividade, TipoServico } from "@/types/ordens";

export const useConfiguracoesServico = () => {
  const [loading, setLoading] = useState(false);
  const [subatividades, setSubatividades] = useState<SubAtividade[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<TipoServico | ''>('');

  useEffect(() => {
    const fetchSubatividades = async () => {
      if (!selectedTipo) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, "subatividades"),
          where("servicoTipo", "==", selectedTipo)
        );
        
        const querySnapshot = await getDocs(q);
        
        const items: SubAtividade[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as SubAtividade);
        });
        
        setSubatividades(items);
      } catch (error) {
        console.error("Error fetching subatividades:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubatividades();
  }, [selectedTipo]);

  const allServicoOptions = [
    {value: TipoServico.BLOCO, label: "Bloco"},
    {value: TipoServico.BIELA, label: "Biela"},
    {value: TipoServico.CABECOTE, label: "Cabeçote"},
    {value: TipoServico.VIRABREQUIM, label: "Virabrequim"},
    {value: TipoServico.EIXO_COMANDO, label: "Eixo de Comando"},
    {value: TipoServico.MONTAGEM, label: "Montagem"},
    {value: TipoServico.DINAMOMETRO, label: "Dinamômetro"},
    {value: TipoServico.LAVAGEM, label: "Lavagem"},
    {value: TipoServico.INSPECAO_INICIAL, label: "Inspeção Inicial"},
    {value: TipoServico.INSPECAO_FINAL, label: "Inspeção Final"},
  ];

  return {
    loading,
    subatividades,
    allServicoOptions,
    selectedTipo,
    setSelectedTipo
  };
};
