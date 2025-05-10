import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentData,
  QueryConstraint,
  DocumentReference
} from 'firebase/firestore';
import { toast } from 'sonner';

export class FirebaseService {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  protected getCollectionRef() {
    return collection(db, this.collectionName);
  }

  protected getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  async getById(id: string): Promise<DocumentData | null> {
    try {
      const docRef = this.getDocRef(id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error(`Error getting document ${id} from ${this.collectionName}:`, error);
      toast.error(`Erro ao carregar documento`);
      return null;
    }
  }

  async getAll(): Promise<DocumentData[]> {
    try {
      const querySnapshot = await getDocs(this.getCollectionRef());
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting all documents from ${this.collectionName}:`, error);
      toast.error(`Erro ao carregar documentos`);
      return [];
    }
  }

  async getWhere(constraints: QueryConstraint[]): Promise<DocumentData[]> {
    try {
      const q = query(this.getCollectionRef(), ...constraints);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error querying documents from ${this.collectionName}:`, error);
      toast.error(`Erro ao buscar documentos`);
      return [];
    }
  }

  async create(data: DocumentData): Promise<string | null> {
    try {
      const docRef = doc(this.getCollectionRef());
      await setDoc(docRef, {
        ...data,
        id: docRef.id,
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      toast.error(`Erro ao criar documento`);
      return null;
    }
  }

  async update(id: string, data: Partial<DocumentData>): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error(`Error updating document ${id} in ${this.collectionName}:`, error);
      toast.error(`Erro ao atualizar documento`);
      return false;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const docRef = this.getDocRef(id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error(`Error deleting document ${id} from ${this.collectionName}:`, error);
      toast.error(`Erro ao excluir documento`);
      return false;
    }
  }
} 