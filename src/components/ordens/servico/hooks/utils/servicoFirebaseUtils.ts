
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Funcionario } from "@/types/funcionarios";

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
