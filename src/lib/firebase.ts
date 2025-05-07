
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC-_ZHD6Q3MMt-AhD5x3VS1iCGuT_PegOc",
  authDomain: "sgestaoretifica.firebaseapp.com",
  projectId: "sgestaoretifica",
  storageBucket: "sgestaoretifica.appspot.com", // Corrigido para o bucket padrão do Firebase
  messagingSenderId: "1044361584868",
  appId: "1:1044361584868:web:3a40fdca12a0b5142a8cf1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Ensure storage permissions are working correctly with authentication
export const getStorageWithAuth = () => {
  const currentAuth = getAuth(app);
  
  if (!currentAuth.currentUser) {
    console.warn("Usuário não está autenticado para acesso ao Storage. As regras de segurança precisam permitir acesso não autenticado ou o usuário precisa estar logado.");
  }
  
  return storage;
};

// Função para adicionar listener de autenticação
export const addAuthListener = (callback: (user: any) => void) => {
  return onAuthStateChanged(auth, callback);
};

export default app;
