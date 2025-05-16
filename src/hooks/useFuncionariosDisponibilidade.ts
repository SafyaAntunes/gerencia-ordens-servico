
import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";
import { FuncionarioStatus, AtividadeAtual } from "@/utils/funcionarioTypes";

// Re-export the FuncionarioStatus type
export { FuncionarioStatus, AtividadeAtual };

export const useFuncionariosDisponibilidade = () => {
  const [funcionarios, setFuncionarios] = useState<FuncionarioStatus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Computed properties for different status groups
  const funcionariosStatus = funcionarios;
  const funcionariosDisponiveis = funcionarios.filter(f => f.status === 'disponivel');
  const funcionariosOcupados = funcionarios.filter(f => f.status === 'ocupado');
  const funcionariosInativos = funcionarios.filter(f => f.status === 'inativo');

  useEffect(() => {
    const q = query(collection(db, "funcionarios"));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const funcionariosData: Funcionario[] = [];
        
        querySnapshot.forEach((doc) => {
          funcionariosData.push({
            id: doc.id,
            ...doc.data()
          } as Funcionario);
        });
        
        // Get ordem details for each funcionário with active task
        const funcionariosWithStatus: FuncionarioStatus[] = await Promise.all(
          funcionariosData.map(async (funcionario) => {
            // Default status is disponível
            let status: "disponivel" | "ocupado" | "inativo" = "disponivel";
            let atividadeAtual: AtividadeAtual | undefined = undefined;
            
            // Convert statusAtividade (string) to proper enum
            if (funcionario.status === "inativo") {
              status = "inativo";
            }
            
            // Check if funcionario has current activity
            if (funcionario.atividadeAtual && funcionario.atividadeAtual.ordemId) {
              status = "ocupado";
              
              // Get ordem details
              try {
                const ordemRef = doc(db, "ordens_servico", funcionario.atividadeAtual.ordemId);
                const ordemSnap = await getDoc(ordemRef);
                
                if (ordemSnap.exists()) {
                  const ordemData = ordemSnap.data();
                  
                  atividadeAtual = {
                    ...funcionario.atividadeAtual,
                    ordemNome: ordemData.nome || "Ordem sem nome"
                  };
                }
              } catch (error) {
                console.error("Erro ao buscar ordem vinculada:", error);
              }
            }
            
            return {
              id: funcionario.id,
              nome: funcionario.nome,
              status,
              atividadeAtual,
              especialidades: funcionario.especialidades || []
            } as FuncionarioStatus;
          })
        );
        
        setFuncionarios(funcionariosWithStatus);
      } catch (error) {
        console.error("Erro ao buscar dados de funcionários:", error);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return { 
    funcionarios, 
    funcionariosStatus, 
    funcionariosDisponiveis, 
    funcionariosOcupados, 
    funcionariosInativos, 
    loading 
  };
};
