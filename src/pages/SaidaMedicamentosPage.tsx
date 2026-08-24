import React, { useState, useEffect } from 'react';
import SaidaMedicamentosForm from '../components/movimentos/SaidaMedicamentosForm';
import type { MovimentoSaidaFormData } from '../types/MovimentoSaida';
import type { Medicamento } from '../types/Medicamento';
import type { Estabelecimento } from '../types/Estabelecimento';
import { movimentoSaidaService } from '../store/services/movimentoSaidaService';
import { medicamentoService } from '../store/services/medicamentoService';
import { estabelecimentoService } from '../store/services/estabelecimentoService';
import { authService } from '../store/services/authService';

const SaidaMedicamentosPage: React.FC = () => {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [usuarioLogado, setUsuarioLogado] = useState<any>(null);

  // Novo estado para mensagens
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoadingData(true);
      const userData = await authService.getCurrentUser();
      setUsuarioLogado(userData);

      if (!userData?.estabelecimentoId) {
        throw new Error('Usuário não autenticado ou sem estabelecimento definido');
      }

      const [medsData, estsData] = await Promise.all([
        medicamentoService.getComEstoquePorEstabelecimento(userData.estabelecimentoId),
        estabelecimentoService.getAll(),
      ]);

      setMedicamentos(medsData);

      let estabelecimentosFiltrados: Estabelecimento[] = [];
      if (userData && userData.estabelecimentoId) {
        estabelecimentosFiltrados = estsData.filter(
          (est) => est.id === userData.estabelecimentoId
        );
      }
      setEstabelecimentos(estabelecimentosFiltrados);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErrorMessage('Erro ao carregar medicamentos e estabelecimentos');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSubmit = async (formData: MovimentoSaidaFormData) => {
    try {
      setIsLoading(true);

      if (formData.estabelecimentoId !== usuarioLogado?.estabelecimentoId) {
        setErrorMessage('Você só pode registrar saída no seu próprio estabelecimento');
        return;
      }

      if (formData.itens.length === 0) {
        setErrorMessage('Erro: Nenhum item foi adicionado à saída');
        return;
      }

      await movimentoSaidaService.create(formData);
      setSuccessMessage('Saída de medicamentos registrada com sucesso!');
      await loadData();

    } catch (error) {
      console.error('Erro ao registrar saída:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Erro ao registrar saída');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (isLoadingData) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-4">
        {/* Mensagens modernas */}
        {successMessage && (
          <div className="alert alert-success" role="alert">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="alert alert-danger" role="alert">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="row">
        <div className="col-12">
          <SaidaMedicamentosForm
            estabelecimentos={estabelecimentos}
            medicamentos={medicamentos}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default SaidaMedicamentosPage;
