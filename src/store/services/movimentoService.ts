// src/store/services/movimentoService.ts
import { api } from './api';
import type { Movimento } from '../../types/Movimento';

export const movimentoService = {
  async getAll(): Promise<Movimento[]> {
    try {
      const response = await api.get('/movimentos');
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro no movimentoService.getAll():', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Falha ao buscar movimentos: ${error.response?.data?.message || error.message}`);
    }
  },

  async getById(id: string): Promise<Movimento> {
    try {
      const response = await api.get(`/movimentos/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar movimento por ID:', error);
      throw new Error(`Falha ao buscar movimento: ${error.response?.data?.message || error.message}`);
    }
  },

  async getByTipo(tipo: string): Promise<Movimento[]> {
    try {
      const response = await api.get(`/movimentos?tipo=${tipo}`);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erro ao buscar movimentos por tipo:', error);
      throw new Error(`Falha ao filtrar movimentos: ${error.response?.data?.message || error.message}`);
    }
  }
};