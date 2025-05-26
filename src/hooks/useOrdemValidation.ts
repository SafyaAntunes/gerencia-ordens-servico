
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const useOrdemValidation = () => {
  const [isValidating, setIsValidating] = useState(false);

  const validateOrdemId = async (id: string, excludeId?: string): Promise<boolean> => {
    if (!id || id.trim().length === 0) {
      return false;
    }

    setIsValidating(true);
    try {
      const ordensRef = collection(db, 'ordens_servico');
      const q = query(ordensRef, where('__name__', '==', id.trim()));
      const querySnapshot = await getDocs(q);
      
      // Se encontrou documentos e não é o mesmo que estamos editando
      const exists = !querySnapshot.empty && querySnapshot.docs[0].id !== excludeId;
      return !exists;
    } catch (error) {
      console.error('Erro ao validar ID da ordem:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateOrdemId,
    isValidating
  };
};
