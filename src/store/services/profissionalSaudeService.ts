import type { ProfissionalSaude } from '../../types/ProfissionalSaude';
import { api } from './api'; // 👈 Importa a API central

export const profissionalSaudeService = {
  async getAll(): Promise<ProfissionalSaude[]> {
    const response = await api.get('/profissionais-saude');
    return response.data;
  },

  async getById(id: string): Promise<ProfissionalSaude> {
    const response = await api.get(`/profissionais-saude/${id}`);
    return response.data;
  },

  async create(profissional: Omit<ProfissionalSaude, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfissionalSaude> {
    const response = await api.post('/profissionais-saude', profissional);
    return response.data;
  },

  async update(id: string, profissional: Partial<ProfissionalSaude>): Promise<ProfissionalSaude> {
    const response = await api.put(`/profissionais-saude/${id}`, profissional);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/profissionais-saude/${id}`);
  },

  async search(termo: string): Promise<ProfissionalSaude[]> {
    const response = await api.get(`/profissionais-saude/buscar?termo=${encodeURIComponent(termo)}`);
    return response.data;
  }
};