import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../store/services/api';
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Modal from 'react-bootstrap/Modal';

// Tipos
interface EstabelecimentoDestino {
  id: string;
  nome: string;
  cnes: string | null;
  tipo: string;
}

interface LoteEstoque {
  id: string;
  numeroLote: string;
  quantidade: number;
  dataValidade: string;
  fabricante: string;
}

interface MedicamentoDisponivel {
  id: string;
  principioAtivo: string;
  concentracao: string;
  formaFarmaceutica: string;
  psicotropico: boolean;
  categoriaControlada?: {
    nome: string;
    tipo: string;
  };
  estoqueLotes: LoteEstoque[];
}

interface ItemDistribuicaoLocal {
  medicamentoId: string;
  loteNumero: string;
  quantidade: number;
  medicamentoNome: string;
  concentracao: string;
  formaFarmaceutica: string;
  psicotropico: boolean;
}

export const DistribuicaoSemRequisicao: React.FC = () => {
  const { user } = useAuth();
  
  const [estabelecimentos, setEstabelecimentos] = useState<EstabelecimentoDestino[]>([]);
  const [medicamentos, setMedicamentos] = useState<MedicamentoDisponivel[]>([]);
  const [itensSelecionados, setItensSelecionados] = useState<ItemDistribuicaoLocal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'warning' | 'info'; text: string } | null>(null);
  
  const [estabelecimentoDestinoId, setEstabelecimentoDestinoId] = useState('');
  const [observacao, setObservacao] = useState('');
  
  const [medicamentoSelecionadoId, setMedicamentoSelecionadoId] = useState('');
  const [loteSelecionado, setLoteSelecionado] = useState('');
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const [showModal, setShowModal] = useState(false);

  // Mostrar mensagem temporária
  const showMessage = (type: 'success' | 'danger' | 'warning' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const carregarEstabelecimentos = async () => {
    try {
      if (!user?.estabelecimentoId) return;
      const response = await api.get(
        `/movimentos/distribuicao/estabelecimentos-destino/${user.estabelecimentoId}`
      );
      setEstabelecimentos(response.data);
    } catch (error) {
      showMessage('danger', 'Erro ao carregar estabelecimentos de destino');
    }
  };

  const carregarMedicamentos = async () => {
    try {
      if (!user?.estabelecimentoId) return;
      setLoading(true);
      const response = await api.get(
        `/movimentos/distribuicao/medicamentos-disponiveis/${user.estabelecimentoId}`,
        { params: { search: searchTerm || undefined } }
      );
      setMedicamentos(response.data);
    } catch (error) {
      showMessage('danger', 'Erro ao carregar medicamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.estabelecimentoId) {
      carregarEstabelecimentos();
      carregarMedicamentos();
    }
  }, [user?.estabelecimentoId]);

  const adicionarItem = () => {
    if (!medicamentoSelecionadoId || !loteSelecionado || quantidadeItem <= 0) {
      showMessage('warning', 'Preencha todos os campos do item');
      return;
    }

    const medicamento = medicamentos.find(m => m.id === medicamentoSelecionadoId);
    if (!medicamento) return;

    const lote = medicamento.estoqueLotes.find(l => l.numeroLote === loteSelecionado);
    if (!lote || quantidadeItem > lote.quantidade) {
      showMessage('danger', 'Quantidade maior que o disponível no lote');
      return;
    }

    const novoItem: ItemDistribuicaoLocal = {
      medicamentoId: medicamento.id,
      loteNumero: loteSelecionado,
      quantidade: quantidadeItem,
      medicamentoNome: medicamento.principioAtivo,
      concentracao: medicamento.concentracao,
      formaFarmaceutica: medicamento.formaFarmaceutica,
      psicotropico: medicamento.psicotropico
    };

    setItensSelecionados([...itensSelecionados, novoItem]);
    setMedicamentoSelecionadoId('');
    setLoteSelecionado('');
    setQuantidadeItem(1);
    setShowModal(false);
    showMessage('success', 'Item adicionado com sucesso!');
  };

  const removerItem = (index: number) => {
    const newItens = [...itensSelecionados];
    newItens.splice(index, 1);
    setItensSelecionados(newItens);
  };

  const enviarDistribuicao = async () => {
    if (!estabelecimentoDestinoId) {
      showMessage('warning', 'Selecione o estabelecimento de destino');
      return;
    }

    if (itensSelecionados.length === 0) {
      showMessage('warning', 'Adicione pelo menos um medicamento');
      return;
    }

    const temControlados = itensSelecionados.some(item => item.psicotropico);
    if (temControlados && !observacao.trim()) {
      showMessage('warning', 'Medicamentos controlados exigem uma observação');
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        estabelecimentoOrigemId: user?.estabelecimentoId,
        estabelecimentoDestinoId,
        observacao: observacao || undefined,
        itens: itensSelecionados.map(item => ({
          medicamentoId: item.medicamentoId,
          loteNumero: item.loteNumero,
          quantidade: item.quantidade
        })),
        usuarioId: user?.id
      };

      const response = await api.post('/movimentos/distribuicao', payload);
      
      showMessage('success', response.data.message || 'Distribuição realizada com sucesso!');
      
      setEstabelecimentoDestinoId('');
      setObservacao('');
      setItensSelecionados([]);
      setSearchTerm('');
      carregarMedicamentos();
      
    } catch (error: any) {
      showMessage('danger', error.response?.data?.error || 'Erro ao realizar distribuição');
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  const estabelecimentoSelecionado = estabelecimentos.find(e => e.id === estabelecimentoDestinoId);
  const medicamentoSelecionado = medicamentos.find(m => m.id === medicamentoSelecionadoId);
  const loteSelecionadoObj = medicamentoSelecionado?.estoqueLotes.find(l => l.numeroLote === loteSelecionado);

  const totalMedicamentos = itensSelecionados.length;
  const totalUnidades = itensSelecionados.reduce((acc, item) => acc + item.quantidade, 0);

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          Faça login para acessar esta página.
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4 mb-4">
      <Card>
        <Card.Body>
          {/* Cabeçalho */}
          <div className="d-flex align-items-center mb-4">
            <span style={{ fontSize: '2rem', marginRight: '1rem' }}>🚚</span>
            <div>
              <h4 className="mb-1">Distribuição sem Requisição</h4>
              <p className="text-muted mb-0">
                Envie medicamentos do almoxarifado para unidades de saúde
              </p>
            </div>
          </div>

          <hr />

          {/* Mensagem de feedback */}
          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {/* Seleção do destino */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Estabelecimento de Destino *</Form.Label>
                <Form.Select
                  value={estabelecimentoDestinoId}
                  onChange={(e) => setEstabelecimentoDestinoId(e.target.value)}
                >
                  <option value="">Selecione uma unidade...</option>
                  {estabelecimentos.map(est => (
                    <option key={est.id} value={est.id}>
                      {est.nome} {est.cnes ? `- CNES: ${est.cnes}` : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Observação/Motivo</Form.Label>
                <Form.Control
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Ex: Distribuição emergencial..."
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Info da distribuição */}
          {estabelecimentoSelecionado && (
            <Alert variant="primary" className="d-flex align-items-center gap-2">
              <span>📦 {user?.estabelecimento?.nome || 'Almoxarifado'}</span>
              <span>→</span>
              <strong>{estabelecimentoSelecionado.nome}</strong>
              {estabelecimentoSelecionado.cnes && (
                <Badge bg="light" text="dark">CNES: {estabelecimentoSelecionado.cnes}</Badge>
              )}
            </Alert>
          )}

          {/* Busca e botão adicionar */}
          <Row className="mb-3">
            <Col md={6}>
              <Form.Control
                type="text"
                placeholder="Buscar medicamento no estoque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && carregarMedicamentos()}
              />
            </Col>
            <Col md={3}>
              <Button variant="secondary" onClick={carregarMedicamentos} className="w-100">
                🔍 Buscar
              </Button>
            </Col>
            <Col md={3}>
              <Button 
                variant="primary" 
                onClick={() => setShowModal(true)}
                disabled={!estabelecimentoDestinoId}
                className="w-100"
              >
                + Adicionar Item
              </Button>
            </Col>
          </Row>

          {/* Tabela de itens */}
          {itensSelecionados.length > 0 ? (
            <>
              <Table striped bordered hover responsive size="sm">
                <thead>
                  <tr>
                    <th>Medicamento</th>
                    <th>Lote</th>
                    <th className="text-center">Qtd</th>
                    <th>Controle</th>
                    <th className="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {itensSelecionados.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{item.medicamentoNome}</strong>
                        <br />
                        <small className="text-muted">
                          {item.concentracao} • {item.formaFarmaceutica}
                        </small>
                      </td>
                      <td><Badge bg="info">{item.loteNumero}</Badge></td>
                      <td className="text-center"><Badge bg="primary">{item.quantidade}</Badge></td>
                      <td>
                        {item.psicotropico && (
                          <Badge bg="warning" text="dark">⚠ Controlado</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => removerItem(index)}
                        >
                          🗑
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="bg-light p-3 rounded mb-3">
                <p className="mb-0 text-muted">
                  {totalMedicamentos} medicamento(s) • {totalUnidades} unidade(s) no total
                  {itensSelecionados.some(i => i.psicotropico) && 
                    ` • ${itensSelecionados.filter(i => i.psicotropico).length} controlado(s)`}
                </p>
              </div>
            </>
          ) : (
            <Alert variant="info">
              Nenhum medicamento adicionado. Clique em "Adicionar Item" para iniciar.
            </Alert>
          )}

          {/* Botões de ação */}
          <div className="d-flex justify-content-end gap-2">
            <Button 
              variant="outline-primary"
              onClick={() => setItensSelecionados([])}
              disabled={itensSelecionados.length === 0}
            >
              Limpar Lista
            </Button>
            <Button 
              variant="primary"
              size="lg"
              onClick={enviarDistribuicao}
              disabled={loading || itensSelecionados.length === 0 || !estabelecimentoDestinoId}
            >
              {loading ? '⏳ Processando...' : '📤 Registrar Distribuição'}
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal de adição */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Adicionar Medicamento para Distribuição</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Medicamento</Form.Label>
            <Form.Select
              value={medicamentoSelecionadoId}
              onChange={(e) => {
                setMedicamentoSelecionadoId(e.target.value);
                setLoteSelecionado('');
                setQuantidadeItem(1);
              }}
            >
              <option value="">Selecione um medicamento...</option>
              {medicamentos.map(med => (
                <option key={med.id} value={med.id}>
                  {med.principioAtivo} {med.concentracao} - {med.formaFarmaceutica}
                  {med.psicotropico ? ' (Controlado)' : ''} - 
                  Estoque: {med.estoqueLotes.reduce((acc, l) => acc + l.quantidade, 0)} und
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {medicamentoSelecionado && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Lote (FIFO - Vencimento mais próximo)</Form.Label>
                <Form.Select
                  value={loteSelecionado}
                  onChange={(e) => setLoteSelecionado(e.target.value)}
                >
                  <option value="">Selecione um lote...</option>
                  {medicamentoSelecionado.estoqueLotes.map(lote => (
                    <option key={lote.id} value={lote.numeroLote}>
                      Lote: {lote.numeroLote} | Qtd: {lote.quantidade} | Val: {formatarData(lote.dataValidade)} | Fab: {lote.fabricante}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {loteSelecionadoObj && (
                <Form.Group className="mb-3">
                  <Form.Label>
                    Quantidade (Disponível no lote: {loteSelecionadoObj.quantidade} unidades)
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max={loteSelecionadoObj.quantidade}
                    value={quantidadeItem}
                    onChange={(e) => setQuantidadeItem(Number(e.target.value))}
                  />
                </Form.Group>
              )}

              {medicamentoSelecionado.psicotropico && (
                <Alert variant="warning">
                  ⚠️ Medicamento controlado - Verifique autorização do destino.
                </Alert>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary"
            onClick={adicionarItem}
            disabled={!medicamentoSelecionadoId || !loteSelecionado || quantidadeItem <= 0}
          >
            Adicionar à Distribuição
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};