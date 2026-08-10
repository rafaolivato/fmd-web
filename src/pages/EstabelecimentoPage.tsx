// EstabelecimentoPage.tsx
import React, { useEffect, useState } from 'react';
import { Container, Button, Table, Spinner, Alert, Row, Col } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../store/store';
import { fetchEstabelecimentos, deleteEstabelecimento } from '../store/slices/estabelecimentoSlice';
import EstabelecimentoForm from '../components/estabelecimentos/EstabelecimentoForm';
import type { Estabelecimento } from '../store/slices/estabelecimentoSlice';
import { FaStore, FaPlusCircle, FaTrash, FaEdit } from 'react-icons/fa';
import type { TipoEstabelecimento } from '../types/Estabelecimento';

const EstabelecimentoPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  const [showModal, setShowModal] = useState(false);
  const [editingEstabelecimento, setEditingEstabelecimento] = useState<Estabelecimento | null>(null);

  const { estabelecimentos, loading, error } = useSelector(
    (state: RootState) => state.estabelecimentos
  );

  // Verifica se usuário atual é adm
  useEffect(() => {
    const checkAdmin = () => {
      try {
        const userStr = localStorage.getItem('@fmd:user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setIsAdmin(user?.role?.toLowerCase() === 'admin');
        }
      } catch (error) {
        console.error('Erro ao verificar role:', error);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchEstabelecimentos());
    }
  }, [dispatch, isAdmin]);

  const tipoLabels: Record<TipoEstabelecimento, string> = {
    ALMOXARIFADO: "Almoxarifado",
    FARMACIA_UNIDADE: "Farmácia da Unidade",
    OUTRO: "Outro"
  };

  // Função para obter o label do tipo de forma segura
  const getTipoLabel = (tipo: string): string => {
    // Verifica se o tipo é uma das chaves válidas
    const tiposValidos: TipoEstabelecimento[] = ['ALMOXARIFADO', 'FARMACIA_UNIDADE', 'OUTRO'];
    
    if (tiposValidos.includes(tipo as TipoEstabelecimento)) {
      return tipoLabels[tipo as TipoEstabelecimento];
    }
    
    return tipo; // Retorna o próprio tipo se não for encontrado
  };

  // Se não for admin, mostra mensagem igual ao CadastroUsuario
  if (!isAdmin) {
    return (
      <Container fluid className="mt-5">
        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <div className="card shadow-sm">
              <div className="card-body text-center py-5">
                <FaStore size={64} className="text-danger mb-4" />
                <h3>❌ Acesso Restrito</h3>
                <p className="text-muted mb-4">
                  Apenas administradores podem gerenciar estabelecimentos.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Voltar para Dashboard
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (loading === 'pending') {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const handleDelete = (id: string, nome: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o estabelecimento "${nome}"?`)) {
      dispatch(deleteEstabelecimento(id));
    }
  };

  const handleEdit = (estabelecimento: Estabelecimento) => {
    setEditingEstabelecimento(estabelecimento);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setEditingEstabelecimento(null);
    setShowModal(false);
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mt-3">
            <FaStore size={32} className="text-primary me-3" />
            <div>
              <h1 className="h2 mb-0">Cadastro de Estabelecimentos</h1>
              <p className="lead text-muted mb-0">Gerencie os estabelecimentos (Acesso Administrativo)</p>
            </div>
          </div>
        </Col>
        <Col xs="auto" className="d-flex align-items-center gap-2">
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <FaPlusCircle className="me-2" />
            Novo Estabelecimento
          </Button>
        </Col>
      </Row>

      <Row>
        <Col>
          <Table striped bordered hover responsive className="align-middle">
            <thead>
              <tr>
                <th>Nome</th>
                <th>CNES</th>
                <th>Tipo</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {estabelecimentos.map((est) => (
                <tr key={est.id}>
                  <td>{est.nome}</td>
                  <td>{est.cnes}</td>
                  <td>{getTipoLabel(est.tipo)}</td>
                  <td className="text-center">
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => handleEdit(est)}
                        title="Editar"
                      >
                        <FaEdit />
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={() => handleDelete(est.id, est.nome)}
                        title="Excluir"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <EstabelecimentoForm
        show={showModal}
        handleClose={handleCloseModal}
        estabelecimentoToEdit={editingEstabelecimento}
      />
    </Container>
  );
};

export default EstabelecimentoPage;