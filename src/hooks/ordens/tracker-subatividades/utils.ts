
import { SubAtividade, TipoServico, OrdemServico } from '@/types/ordens';
import { v4 as uuidv4 } from 'uuid';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

// Validates if an order exists and has a valid ID
export function validateOrdem(ordem: OrdemServico | undefined): ordem is OrdemServico & { id: string } {
  if (!ordem) {
    const error = "Ordem não encontrada";
    toast.error(error);
    console.error(error, ordem);
    return false;
  }
  
  if (!ordem.id) {
    const error = "ID da ordem não encontrado";
    toast.error(error);
    console.error(error, ordem);
    return false;
  }
  
  return true;
}

// Creates new subatividades based on the provided names
export function createSubatividades(subatividadesNomes: string[]): SubAtividade[] {
  return subatividadesNomes.map(nome => ({
    id: uuidv4(),
    nome,
    selecionada: true, // Default to selected
    concluida: false,
    tempoEstimado: 1 // Default time of 1 hour
  }));
}

// Updates the service with new subatividades, handling existing ones
export function prepareServiceUpdate(
  servicoIndex: number, 
  servicos: OrdemServico['servicos'],
  novasSubatividades: SubAtividade[]
): OrdemServico['servicos'] {
  const servicosAtualizados = [...servicos];
  
  // If subatividades already exist, add only new ones
  if (servicosAtualizados[servicoIndex].subatividades?.length) {
    const existentes = servicosAtualizados[servicoIndex].subatividades || [];
    const nomesExistentes = existentes.map(s => s.nome.toLowerCase());
    
    // Filter only subatividades that don't exist yet
    const novasParaAdicionar = novasSubatividades.filter(
      sub => !nomesExistentes.includes(sub.nome.toLowerCase())
    );
    
    if (novasParaAdicionar.length === 0) {
      toast.info("Todas as subatividades já foram adicionadas");
      return servicosAtualizados;
    }
    
    // Add new subatividades to existing ones
    servicosAtualizados[servicoIndex] = {
      ...servicosAtualizados[servicoIndex],
      subatividades: [...existentes, ...novasParaAdicionar]
    };
  } else {
    // If no subatividades exist, add all
    servicosAtualizados[servicoIndex] = {
      ...servicosAtualizados[servicoIndex],
      subatividades: novasSubatividades
    };
  }
  
  return servicosAtualizados;
}

// Updates the ordem in Firestore and returns the updated version
export async function updateOrdemWithNewServicos(
  ordem: OrdemServico, 
  servicosAtualizados: OrdemServico['servicos']
): Promise<OrdemServico> {
  const ordemRef = doc(db, "ordens_servico", ordem.id);
  await updateDoc(ordemRef, { servicos: servicosAtualizados });
  
  // Fetch the updated ordem to ensure we have the latest data
  const ordemDoc = await getDoc(ordemRef);
  
  if (ordemDoc.exists()) {
    return { ...ordemDoc.data(), id: ordemDoc.id } as OrdemServico;
  } else {
    // If unable to fetch the updated ordem, use the local version
    return {
      ...ordem,
      servicos: servicosAtualizados
    };
  }
}
