
import { useEffect } from 'react';
import { getDocumentWithCache, getCollectionWithCache, preloadDocuments } from '@/services/cacheService';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Hook para pré-carregar dados comumente usados na aplicação
 * Isto melhora significativamente o tempo de resposta
 */
export const useDadosPreload = () => {
  useEffect(() => {
    const preloadCommonData = async () => {
      try {
        console.log("🔄 Iniciando pré-carregamento de dados comuns...");
        
        // Pré-carregar funcionários
        getCollectionWithCache<any>(
          'funcionarios_all',
          async () => {
            const funcionariosRef = query(collection(db, 'funcionarios'));
            const snapshot = await getDocs(funcionariosRef);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        );
        
        // Pré-carregar clientes recentes
        getCollectionWithCache<any>(
          'clientes_recentes',
          async () => {
            const clientesRef = query(collection(db, 'clientes'), orderBy('ultimaAtualizacao', 'desc'), limit(10));
            const snapshot = await getDocs(clientesRef);
            return snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
          }
        );
        
        // Pré-carregar configurações de serviço
        getDocumentWithCache('configuracoes', 'servicos');
        
        console.log("✅ Pré-carregamento de dados comuns concluído.");
      } catch (error) {
        console.error("❌ Erro no pré-carregamento:", error);
      }
    };
    
    preloadCommonData();
  }, []);
  
  return null; // Este hook não retorna nada, apenas executa o efeito
};
