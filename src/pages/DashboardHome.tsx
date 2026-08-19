// src/pages/DashboardHome.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import AlertasEstoque from '../components/dashboard/AlertasEstoque';
import { FaBox, FaSignInAlt, FaSignOutAlt, FaCapsules, FaTachometerAlt } from 'react-icons/fa';
import { dashboardService, type DashboardMetrics } from '../store/services/dashboardService';
import { medicamentoService } from '../store/services/medicamentoService';
import { relatorioService } from '../store/services/relatorioService';
import type { Medicamento } from '../types/Medicamento';

const DashboardHome: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMedicamentos, setLoadingMedicamentos] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Função para carregar medicamentos com estoque atualizado
  const loadMedicamentos = useCallback(async () => {
    try {
      setLoadingMedicamentos(true);
      
      const medicamentosBase = await medicamentoService.getAll();
      
      try {
        const posicaoEstoque = await relatorioService.getPosicaoEstoque();
        
        // Agrupa os itens de estoque por medicamento e soma as quantidades
        const estoqueAgrupado = posicaoEstoque.reduce((acc, item) => {
          const chave = `${item.medicamento.principioAtivo}|${item.medicamento.concentracao}|${item.medicamento.formaFarmaceutica}`;
          
          if (!acc[chave]) {
            acc[chave] = 0;
          }
          acc[chave] += item.quantidade;
          return acc;
        }, {} as Record<string, number>);
        
        // Atualiza os medicamentos com a quantidade total do estoque
        const medicamentosAtualizados = medicamentosBase.map(med => {
          const chave = `${med.principioAtivo}|${med.concentracao}|${med.formaFarmaceutica}`;
          const quantidadeTotal = estoqueAgrupado[chave] || 0;
          
          return {
            ...med,
            quantidadeEstoque: quantidadeTotal,
          };
        });
        
        setMedicamentos(medicamentosAtualizados);
      } catch (estoqueError) {
        console.warn('Erro ao buscar posição de estoque:', estoqueError);
        setMedicamentos(medicamentosBase);
      }
    } catch (error) {
      console.error('Erro ao carregar medicamentos:', error);
    } finally {
      setLoadingMedicamentos(false);
    }
  }, []);

  // Função para carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardService.getMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
      setError('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carrega os dados ao montar o componente
  useEffect(() => {
    loadDashboardData();
    loadMedicamentos();
    
    // Recarregar a cada 60 segundos para manter atualizado
    const interval = setInterval(() => {
      loadDashboardData();
      loadMedicamentos();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [loadDashboardData, loadMedicamentos]);

  // Se estiver carregando os dados principais
  if (isLoading) {
    return (
      <Container fluid>
        <div className="text-center py-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </Spinner>
          <p className="mt-2">Carregando dashboard...</p>
        </div>
      </Container>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <Container fluid>
        <Alert variant="danger">
          <Alert.Heading>Erro</Alert.Heading>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>
            Tentar Novamente
          </button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      {/* Cabeçalho */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mt-3">
            <FaTachometerAlt size={32} className="text-primary me-3" />
            <div>
              <h1 className="h2 mb-0">Dashboard Ragda</h1>
              <p className="lead text-muted mb-0">Visão geral do sistema farmacêutico</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Métricas Rápidas */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <FaBox size={24} className="text-primary mb-2" />
              <h4>{metrics?.totalMedicamentos || 0}</h4>
              <p className="text-muted mb-0">Medicamentos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <FaSignInAlt size={24} className="text-success mb-2" />
              <h4>{metrics?.entradasHoje || 0}</h4>
              <p className="text-muted mb-0">Entradas Hoje</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <FaSignOutAlt size={24} className="text-warning mb-2" />
              <h4>{metrics?.saidasHoje || 0}</h4>
              <p className="text-muted mb-0">Saídas Hoje</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <FaCapsules size={24} className="text-info mb-2" />
              <h4>{metrics?.dispensacoesHoje || 0}</h4>
              <p className="text-muted mb-0">Dispensações Hoje</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Alertas de Estoque e Atividades */}
      <Row>
        <Col md={6}>
          {/* Alertas de Estoque com medicamentos atualizados */}
          <AlertasEstoque 
            medicamentos={medicamentos} 
            loading={loadingMedicamentos} 
          />
        </Col>
        <Col md={6}>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="card-title mb-0">Atividades Recentes</h5>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4">
                <p className="text-muted">Em breve: atividades recentes do sistema</p>
                <small className="text-muted">
                  Últimas movimentações e dispensações aparecerão aqui
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DashboardHome;