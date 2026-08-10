import { api } from './api';

export interface DashboardMetrics {
  totalMedicamentos: number;
  entradasHoje: number;
  saidasHoje: number;
  dispensacoesHoje: number;
  alertasEstoque: Array<{
    id: string;
    medicamento: string;
    quantidade: number;
    estoqueMinimo: number;
    tipo: 'CRITICO' | 'ALERTA' | 'ATENCAO';
  }>;
}

export const dashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await api.get('/dashboard/metrics');
      return response.data;
    } catch (error: any) {
      // Verifica se é erro de CORS
      if (error.message?.includes('Network Error') || error.message?.includes('CORS')) {
        throw new Error('Erro de conexão/CORS. Verifique se o backend está rodando e acessível.');
      }
      
      throw new Error(
        error.response?.data?.message || 
        `Erro ${error.response?.status || 'N/A'}: ${error.message}`
      );
    }
  }
};