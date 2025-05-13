
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";
import { EtapaOS } from "@/types/ordens";

export async function loadFuncionario(funcionarioId: string): Promise<Funcionario | null> {
  if (!funcionarioId) return null;
  
  try {
    const docRef = doc(db, "funcionarios", funcionarioId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as Funcionario;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Failed to load funcionario:", error);
    return null;
  }
}

export async function markSubatividadeConcluida(
  ordemId: string, 
  etapa: EtapaOS, 
  servicoTipo: string, 
  subatividadeId: string, 
  concluida: boolean
) {
  try {
    const ordemRef = doc(db, "ordens", ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }
    
    const ordemData = ordemDoc.data();
    const servicos = ordemData.servicos || [];
    
    // Find the servico and update the subatividade
    const updatedServicos = servicos.map((servico: any) => {
      if (servico.tipo === servicoTipo) {
        const updatedSubatividades = (servico.subatividades || []).map((sub: any) => {
          if (sub.id === subatividadeId) {
            return { ...sub, concluida };
          }
          return sub;
        });
        
        return {
          ...servico,
          subatividades: updatedSubatividades
        };
      }
      return servico;
    });
    
    // Update the ordem
    await updateDoc(ordemRef, {
      servicos: updatedServicos
    });
    
    return true;
  } catch (error) {
    console.error("Error marking subatividade:", error);
    throw error;
  }
}

export async function markServicoCompleto(
  ordemId: string, 
  etapa: EtapaOS, 
  servicoTipo: string, 
  concluido: boolean,
  funcionarioId?: string,
  funcionarioNome?: string
) {
  try {
    const ordemRef = doc(db, "ordens", ordemId);
    const ordemDoc = await getDoc(ordemRef);
    
    if (!ordemDoc.exists()) {
      throw new Error("Ordem não encontrada");
    }
    
    const ordemData = ordemDoc.data();
    const servicos = ordemData.servicos || [];
    
    // Find the servico and update it
    const updatedServicos = servicos.map((servico: any) => {
      if (servico.tipo === servicoTipo) {
        return {
          ...servico,
          concluido,
          funcionarioId: concluido ? funcionarioId : undefined,
          funcionarioNome: concluido ? funcionarioNome : undefined,
          dataConclusao: concluido ? new Date() : undefined
        };
      }
      return servico;
    });
    
    // Update the ordem
    await updateDoc(ordemRef, {
      servicos: updatedServicos
    });
    
    return true;
  } catch (error) {
    console.error("Error marking servico completo:", error);
    throw error;
  }
}
