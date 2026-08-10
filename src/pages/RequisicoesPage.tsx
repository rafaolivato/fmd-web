import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Tabs, Tab, Alert } from 'react-bootstrap';
import RequisicoesList from '../components/requisicoes/RequisicoesList';
import RequisicaoDetailsModal from '../components/requisicoes/RequisicaoDetailsModal';
import AtenderRequisicaoModal from '../components/requisicoes/AtenderRequisicaoModal';
import type { Requisicao } from '../types/Requisicao';
import type { User } from '../types/User';
import { requisicaoService } from '../store/services/requisicaoService';
import { authService } from '../store/services/authService';
import { FaPlus, FaSync, FaStore, FaHandshake, FaClipboardList } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Badge from 'react-bootstrap/Badge';

interface UsuarioLogadoState {
  user: User | null;
  isAlmoxarifado: boolean;
}

const RequisicoesPage: React.FC = () => {
  const [minhasRequisicoes, setMinhasRequisicoes] = useState<Requisicao[]>([]);
  const [paraAtender, setParaAtender] = useState<Requisicao[]>([]);
  const [selectedRequisicao, setSelectedRequisicao] = useState<Requisicao | null>(null);
  const [requisicaoParaAtender, setRequisicaoParaAtender] = useState<Requisicao | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAtenderModal, setShowAtenderModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('minhas');
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogadoState>({
    user: null,
    isAlmoxarifado: false
  });
  const navigate = useNavigate();

  // ✅ CORREÇÃO: useCallback para loadUsuarioLogado
  const loadUsuarioLogado = useCallback(async (): Promise<void> => {
    try {
      const userData = await authService.getCurrentUser();

      if (userData) {
        const userIsAlmoxarifado = authService.isUserAlmoxarifado(userData);

        setUsuarioLogado({
          user: userData,
          isAlmoxarifado: userIsAlmoxarifado
        });

        await loadRequisicoes(userIsAlmoxarifado);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  }, []); // ✅ Dependências vazias pois não depende de state/props

  // ✅ CORREÇÃO: useCallback para loadRequisicoes
  const loadRequisicoes = useCallback(async (userIsAlmoxarifado: boolean): Promise<void> => {
    try {
      setIsLoading(true);
    
      if (userIsAlmoxarifado) {
        const paraAtenderData = await requisicaoService.getParaAtender();
        setParaAtender(paraAtenderData);
        setMinhasRequisicoes([]);
      } else {
     
        const minhasData = await requisicaoService.getMinhasRequisicoes();
        setMinhasRequisicoes(minhasData);
        setParaAtender([]);
      }

    } catch (error: unknown) {
      console.error('Erro ao carregar requisições:', error);

      if (error instanceof Error && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 403) {
          return;
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao carregar requisições: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsuarioLogado();
  }, [loadUsuarioLogado]); // ✅ CORREÇÃO: Agora loadUsuarioLogado é uma dependência


  const handleCancelarRequisicao = async (requisicao: Requisicao) => {
    if (!window.confirm(`Tem certeza que deseja cancelar a requisição #${requisicao.id.substring(0, 8)}?`)) {
      return;
    }

    try {
     
      // Atualiza a lista
      if (usuarioLogado.user) {
        loadRequisicoes(usuarioLogado.isAlmoxarifado);
      }

      alert(`Requisição #${requisicao.id.substring(0, 8)} cancelada com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao cancelar requisição:', error);
      alert(error.response?.data?.message || 'Erro ao cancelar requisição');
    }
  };

  const handleViewDetails = (requisicao: Requisicao): void => {
    setSelectedRequisicao(requisicao);
    setShowDetailsModal(true);
  };

  const handleAtender = (requisicao: Requisicao): void => {
    setRequisicaoParaAtender(requisicao);
    setShowAtenderModal(true);
  };

  const handleCloseDetails = (): void => {
    setShowDetailsModal(false);
    setSelectedRequisicao(null);
  };

  const handleCloseAtender = (): void => {
    setShowAtenderModal(false);
    setRequisicaoParaAtender(null);
  };

  const handleAtendimentoSuccess = (): void => {
    handleCloseAtender();
    if (usuarioLogado.user) {
      loadRequisicoes(usuarioLogado.isAlmoxarifado);
    }
  };



  if (!usuarioLogado.user) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados do usuário...</p>
        </div>
      </Container>
    );
  }

  if (!usuarioLogado.user) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando dados do usuário...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mt-3">
            <FaClipboardList size={32} className="text-primary me-3" />
            <div>
              <h1 className="h2 mb-0">Requisições</h1>
              <p className="lead text-muted mb-0">Histórico de requisições de materiais</p>
            </div>
          </div>
        </Col>
        <Col xs="auto" className="d-flex align-items-center gap-2">
          {!usuarioLogado.isAlmoxarifado && (
            <Button variant="primary" onClick={() => navigate('/requisicoes/nova')}>
              <FaPlus className="me-2" />
              Nova Requisição
            </Button>
          )}
          <Button
            variant="outline-primary"
            onClick={() => usuarioLogado.user && loadRequisicoes(usuarioLogado.isAlmoxarifado)}
          >
            <FaSync />
          </Button>
        </Col>
      </Row>


      <Row>
        <Col>
          <Tabs
            activeKey={activeTab}
            onSelect={(tab: string | null) => setActiveTab(tab || 'minhas')}
            className="mb-4"
          >
            {/* ABA "MINHAS REQUISIÇÕES" - Só para Farmácias */}
            {!usuarioLogado.isAlmoxarifado && (
              <Tab
                eventKey="minhas"
                title={
                  <span>
                    <FaStore className="me-2" />
                    Minhas Requisições
                    {minhasRequisicoes.length > 0 && (
                      <Badge bg="secondary" className="ms-2">
                        {minhasRequisicoes.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                <RequisicoesList
                  requisicoes={minhasRequisicoes}
                  onViewDetails={handleViewDetails}
                  onCancelar={handleCancelarRequisicao}
                  isLoading={isLoading}
                  modo="minhas"
                />
              </Tab>
            )}

            {/* ABA "PARA ATENDER" - Só para Almoxarifados */}
            {usuarioLogado.isAlmoxarifado && (
              <Tab
                eventKey="para-atender"
                title={
                  <span>
                    <FaHandshake className="me-2" />
                    Para Atender
                    {paraAtender.length > 0 && (
                      <Badge bg="warning" className="ms-2">
                        {paraAtender.length}
                      </Badge>
                    )}
                  </span>
                }
              >
                {paraAtender.filter(r => r.status === 'PENDENTE').length > 0 && (
                  <Alert variant="warning" className="mb-3">
                    <FaHandshake className="me-2" />
                    Você tem {paraAtender.filter(r => r.status === 'PENDENTE').length} requisição(ões) pendente(s) para atender
                  </Alert>
                )}
                <RequisicoesList
                  requisicoes={paraAtender}
                  onViewDetails={handleViewDetails}
                  onAtender={handleAtender}
                  onCancelar={handleCancelarRequisicao}
                  isLoading={isLoading}
                  modo="para-atender"
                />
              </Tab>
            )}
          </Tabs>

          {/* MENSAGEM PARA FARMÁCIAS SEM REQUISIÇÕES */}
          {!usuarioLogado.isAlmoxarifado && minhasRequisicoes.length === 0 && !isLoading && (
            <Alert variant="info">
              <FaStore className="me-2" />
              Você ainda não fez nenhuma requisição. Clique em "Nova Requisição" para começar.
            </Alert>
          )}

          {/* MENSAGEM PARA ALMOXARIFADOS SEM REQUISIÇÕES */}
          {usuarioLogado.isAlmoxarifado && paraAtender.length === 0 && !isLoading && (
            <Alert variant="info">
              <FaHandshake className="me-2" />
              Não há requisições pendentes para atender no momento.
            </Alert>
          )}
        </Col>
      </Row>

      {/* Modal de Detalhes */}
      {selectedRequisicao && (
        <RequisicaoDetailsModal
          requisicao={selectedRequisicao}
          show={showDetailsModal}
          onHide={handleCloseDetails}
        />
      )}

      {/* Modal de Atendimento */}
      {requisicaoParaAtender && (
        <AtenderRequisicaoModal
          requisicao={requisicaoParaAtender}
          show={showAtenderModal}
          onHide={handleCloseAtender}
          onSuccess={handleAtendimentoSuccess}
        />
      )}
    </Container>
  );
};

export default RequisicoesPage;