
import { ReactNode } from 'react';

interface TizenLayoutProps {
  children: ReactNode;
  onLogout?: () => void;
}

export default function TizenLayout({ children, onLogout }: TizenLayoutProps) {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Simplified header */}
      <div style={{
        backgroundColor: '#2563eb',
        color: 'white',
        padding: '15px 20px',
        marginBottom: '20px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Sistema de Ordens</h1>
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sair
          </button>
        )}
      </div>
      
      {/* Simplified navigation */}
      <div style={{
        backgroundColor: 'white',
        padding: '15px',
        marginBottom: '20px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <nav style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#2563eb', textDecoration: 'none', padding: '5px 10px' }}>
            Dashboard
          </a>
          <a href="/ordens" style={{ color: '#2563eb', textDecoration: 'none', padding: '5px 10px' }}>
            Ordens
          </a>
          <a href="/funcionarios" style={{ color: '#2563eb', textDecoration: 'none', padding: '5px 10px' }}>
            Funcionários
          </a>
          <a href="/clientes" style={{ color: '#2563eb', textDecoration: 'none', padding: '5px 10px' }}>
            Clientes
          </a>
        </nav>
      </div>
      
      {/* Content area */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        minHeight: '400px'
      }}>
        {children}
      </div>
    </div>
  );
}
