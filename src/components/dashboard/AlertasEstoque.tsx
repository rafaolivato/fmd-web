// src/components/dashboard/AlertasEstoque.tsx
import React, { useRef, useEffect, useMemo } from 'react';
import { Card, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { FaExclamationTriangle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';
import type { Medicamento } from '../../types/Medicamento';

interface AlertaEstoque {
  id: string;
  medicamento: string;
  quantidade: number;
  estoqueMinimo: number;
  tipo: 'CRITICO' | 'ALERTA' | 'ATENCAO';
}

interface AlertasEstoqueProps {
  medicamentos: Medicamento[]; // Mudamos para receber medicamentos
  loading?: boolean; // Opcional: para mostrar loading
}

const AlertasEstoque: React.FC<AlertasEstoqueProps> = ({ medicamentos, loading = false }) => {
  const listRef = useRef<HTMLDivElement>(null);

  // Gera os alertas a partir dos medicamentos usando useMemo
  const alertas = useMemo(() => {
    const novosAlertas: AlertaEstoque[] = [];
    
    medicamentos.forEach(med => {
      const quantidade = med.quantidadeEstoque || 0;
      const estoqueMinimo = med.estoqueMinimo || 0;
      
      // Só gera alerta se o estoque estiver abaixo ou igual ao mínimo
      if (quantidade <= estoqueMinimo && estoqueMinimo > 0) {
        let tipo: 'CRITICO' | 'ALERTA' | 'ATENCAO' = 'ATENCAO';
        const percentual = quantidade / estoqueMinimo;
        
        if (percentual <= 0.3) {
          tipo = 'CRITICO';
        } else if (percentual <= 0.6) {
          tipo = 'ALERTA';
        }
        
        novosAlertas.push({
          id: med.id!,
          medicamento: `${med.principioAtivo} ${med.concentracao}`,
          quantidade: quantidade,
          estoqueMinimo: estoqueMinimo,
          tipo: tipo,
        });
      }
    });
    
    // Ordena por criticidade (CRITICO primeiro)
    const ordemTipo = { CRITICO: 0, ALERTA: 1, ATENCAO: 2 };
    novosAlertas.sort((a, b) => ordemTipo[a.tipo] - ordemTipo[b.tipo]);
    
    return novosAlertas;
  }, [medicamentos]); // Recalcula quando medicamentos mudar

  // Faz o scroll automático para o fim quando novos alertas chegam
  useEffect(() => {
    if (listRef.current && alertas.length > 0) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [alertas]);

  const getBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return 'danger';
      case 'ALERTA': return 'warning';
      case 'ATENCAO': return 'info';
      default: return 'secondary';
    }
  };

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'CRITICO': return <FaExclamationTriangle className="text-danger" />;
      case 'ALERTA': return <FaExclamationCircle className="text-warning" />;
      case 'ATENCAO': return <FaInfoCircle className="text-info" />;
      default: return <FaInfoCircle />;
    }
  };

  // Estado de loading
  if (loading) {
    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Alertas de Estoque</h5>
          <Badge bg="secondary">Carregando...</Badge>
        </Card.Header>
        <Card.Body className="text-center py-4">
          <Spinner animation="border" variant="primary" size="sm" />
          <p className="mt-2 text-muted mb-0">Carregando alertas...</p>
        </Card.Body>
      </Card>
    );
  }

  // Sem alertas
  if (alertas.length === 0) {
    return (
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">Alertas de Estoque</h5>
          <Badge bg="success">Tudo OK</Badge>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-3">
            <FaInfoCircle size={32} className="text-success mb-2" />
            <p className="text-muted mb-0">Nenhum alerta de estoque no momento</p>
            <small className="text-muted">Todos os medicamentos com estoque adequado</small>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Com alertas
  return (
    <Card>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Alertas de Estoque</h5>
        <Badge bg="danger">{alertas.length} alerta{alertas.length > 1 ? 's' : ''}</Badge>
      </Card.Header>
      <div
        ref={listRef}
        style={{
          maxHeight: '300px',
          overflowY: 'auto'
        }}
        className="alertas-scroll"
      >
        <ListGroup variant="flush">
          {alertas.map((alerta) => (
            <ListGroup.Item 
              key={alerta.id} 
              className={`d-flex justify-content-between align-items-center border-start border-3 border-${getBadgeVariant(alerta.tipo)}`}
            >
              <div className="d-flex align-items-center">
                {getIcon(alerta.tipo)}
                <div className="ms-3">
                  <div className="fw-semibold">{alerta.medicamento}</div>
                  <small className="text-muted">
                    Estoque: <strong>{alerta.quantidade}</strong> | Mínimo: {alerta.estoqueMinimo}
                  </small>
                </div>
              </div>
              <Badge bg={getBadgeVariant(alerta.tipo)} pill>
                {alerta.tipo}
              </Badge>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </div>
    </Card>
  );
};

export default AlertasEstoque;