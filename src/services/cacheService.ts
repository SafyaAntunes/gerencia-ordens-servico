import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Cache para documentos do Firestore - com controle de expiração individual
const documentCache: Record<string, {data: any, timestamp: number}> = {};
const CACHE_TTL = 10000; // 10 segundos de TTL para o cache

/**
 * Função otimizada para obter documentos com cache
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 * @returns Objeto com dados do documento e flag indicando se veio do cache
 */
export async function getDocumentWithCache(collectionName: string, docId: string) {
  const cacheKey = `${collectionName}/${docId}`;
  const now = Date.now();
  const cachedDoc = documentCache[cacheKey];
  
  // Se temos no cache e não expirou, usar o cache
  if (cachedDoc && (now - cachedDoc.timestamp < CACHE_TTL)) {
    return { data: cachedDoc.data, fromCache: true };
  }
  
  // Se não temos no cache ou expirou, buscar do Firestore
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      documentCache[cacheKey] = { data, timestamp: now };
      return { data, fromCache: false };
    }
  } catch (error) {
    console.error(`Error fetching document ${collectionName}/${docId}:`, error);
  }
  
  return { data: null, fromCache: false };
}

/**
 * Limpa entradas específicas ou todas do cache
 * @param key Chave específica para limpar ou undefined para limpar tudo
 */
export function clearDocumentCache(key?: string) {
  if (key) {
    delete documentCache[key];
  } else {
    Object.keys(documentCache).forEach(k => delete documentCache[k]);
  }
} 