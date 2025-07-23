
import { useDashboardData } from "@/hooks/useDashboardData";
import TizenLayout from './TizenLayout';

interface TizenDashboardProps {
  onLogout: () => void;
}

export default function TizenDashboard({ onLogout }: TizenDashboardProps) {
  const { data, loading, error } = useDashboardData({});

  if (loading) {
    return (
      <TizenLayout onLogout={onLogout}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px' }}>Carregando dados...</div>
        </div>
      </TizenLayout>
    );
  }

  if (error) {
    return (
      <TizenLayout onLogout={onLogout}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#dc2626' }}>
            Erro: {error}
          </div>
        </div>
      </TizenLayout>
    );
  }

  if (!data) {
    return (
      <TizenLayout onLogout={onLogout}>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '18px' }}>Nenhum dado disponível</div>
        </div>
      </TizenLayout>
    );
  }

  return (
    <TizenLayout onLogout={onLogout}>
      <div style={{ padding: '20px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '30px', color: '#1f2937' }}>
          Dashboard
        </h1>
        
        {/* Simplified metrics grid */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
              {data.totalOrdens}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Total de Ordens
            </div>
          </div>

          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>
              {data.ordensEmAndamento}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Em Andamento
            </div>
          </div>

          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
              {data.ordensFinalizadas}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Finalizadas
            </div>
          </div>

          <div style={{
            backgroundColor: '#f3f4f6',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '200px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ef4444' }}>
              {data.ordensAtrasadas}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              Atrasadas
            </div>
          </div>
        </div>

        {/* Simplified status list */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1f2937' }}>
            Status das Ordens
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.ordensPorStatus.map((status, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '16px' }}>{status.name}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{status.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Simplified services list */}
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1f2937' }}>
            Serviços por Tipo
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data.servicosPorTipo.map((servico, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '10px',
                backgroundColor: 'white',
                borderRadius: '4px'
              }}>
                <span style={{ fontSize: '16px' }}>{servico.name}</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{servico.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </TizenLayout>
  );
}
