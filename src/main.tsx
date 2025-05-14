
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useDadosPreload } from './hooks/useDadosPreload.ts'

// Componente para iniciar o preload de dados comuns
const AppWithPreload = () => {
  // Inicia o preload de dados comuns em segundo plano
  useDadosPreload();
  
  // Retorna o App normalmente
  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithPreload />);
