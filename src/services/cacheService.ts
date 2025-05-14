
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Cache para documentos do Firestore - com controle de expiração individual
const documentCache: Record<string, {data: any, timestamp: number}> = {};
const CACHE_TTL = 300000; // Aumentado para 5 minutos (de 10 segundos)

// Cache para consultas de coleção
const collectionCache: Record<string, {data: any[], timestamp: number}> = {};
const COLLECTION_CACHE_TTL = 120000; // 2 minutos para caches de coleção

/**
 * Função otimizada para obter documentos com cache
 * @param collectionName Nome da coleção
 * @param docId ID do documento
 * @param forceFresh Forçar atualização do cache
 * @returns Objeto com dados do documento e flag indicando se veio do cache
 */
export async function getDocumentWithCache(collectionName: string, docId: string, forceFresh = false) {
  const cacheKey = `${collectionName}/${docId}`;
  const now = Date.now();
  const cachedDoc = documentCache[cacheKey];
  
  // Se temos no cache, não expirou, e não estamos forçando atualização
  if (!forceFresh && cachedDoc && (now - cachedDoc.timestamp < CACHE_TTL)) {
    console.log(`🔄 Using cached document: ${cacheKey}`);
    return { data: cachedDoc.data, fromCache: true };
  }
  
  // Se não temos no cache, expirou, ou estamos forçando atualização
  try {
    console.log(`📡 Fetching document from Firestore: ${cacheKey}`);
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
 * Função para cachear resultados de consultas a coleções
 * @param cacheKey Chave única para identificar a consulta
 * @param fetchFunction Função assíncrona que retorna os dados da coleção
 * @param forceFresh Forçar atualização do cache
 * @returns Array com os dados da coleção
 */
export async function getCollectionWithCache<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T[]>,
  forceFresh = false
): Promise<{ data: T[], fromCache: boolean }> {
  const now = Date.now();
  const cachedCollection = collectionCache[cacheKey];
  
  // Se temos no cache, não expirou, e não estamos forçando atualização
  if (!forceFresh && cachedCollection && (now - cachedCollection.timestamp < COLLECTION_CACHE_TTL)) {
    console.log(`🔄 Using cached collection: ${cacheKey}`);
    return { data: cachedCollection.data as T[], fromCache: true };
  }
  
  // Se não temos no cache, expirou, ou estamos forçando atualização
  try {
    console.log(`📡 Fetching collection from Firestore: ${cacheKey}`);
    const data = await fetchFunction();
    collectionCache[cacheKey] = { data, timestamp: now };
    return { data, fromCache: false };
  } catch (error) {
    console.error(`Error fetching collection ${cacheKey}:`, error);
    // Retornar cache mesmo expirado em caso de erro, se existir
    if (cachedCollection) {
      console.log(`⚠️ Using expired cache for ${cacheKey} due to fetch error`);
      return { data: cachedCollection.data as T[], fromCache: true };
    }
    return { data: [] as T[], fromCache: false };
  }
}

/**
 * Limpa entradas específicas ou todas do cache
 * @param key Chave específica para limpar ou undefined para limpar tudo
 * @param type Tipo de cache a limpar ('document', 'collection' ou 'all')
 */
export function clearCache(key?: string, type: 'document' | 'collection' | 'all' = 'all') {
  if (key) {
    if (type === 'document' || type === 'all') {
      delete documentCache[key];
    }
    if (type === 'collection' || type === 'all') {
      delete collectionCache[key];
    }
    console.log(`🧹 Cache cleared for key: ${key}, type: ${type}`);
  } else {
    if (type === 'document' || type === 'all') {
      Object.keys(documentCache).forEach(k => delete documentCache[k]);
    }
    if (type === 'collection' || type === 'all') {
      Object.keys(collectionCache).forEach(k => delete collectionCache[k]);
    }
    console.log(`🧹 All ${type} cache cleared`);
  }
}

// Alias para compatibilidade com código existente
export const clearDocumentCache = clearCache;

/**
 * Pré-carrega documentos no cache para uso futuro
 * @param docs Array de {collectionName, docId} para pré-carregar
 */
export async function preloadDocuments(docs: {collectionName: string, docId: string}[]): Promise<void> {
  await Promise.all(docs.map(({collectionName, docId}) => 
    getDocumentWithCache(collectionName, docId, true)
  ));
  console.log(`🔄 Preloaded ${docs.length} documents to cache`);
}
