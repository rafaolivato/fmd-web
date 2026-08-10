import React from 'react';
import { Card, Table, Badge, Button, Modal } from 'react-bootstrap';
import type { Requisicao } from '../../types/Requisicao';
import { FaEye, FaStore, FaHandshake, FaTimes, FaTrash, FaPrint } from 'react-icons/fa';
import { api } from '../../store/services/api';

interface RequisicoesListProps {
  requisicoes: Requisicao[];
  onViewDetails: (requisicao: Requisicao) => void;
  onAtender?: (requisicao: Requisicao) => void;
  onCancelar?: (requisicao: Requisicao) => void;
  onImprimir?: (requisicao: Requisicao) => void;
  isLoading?: boolean;
  modo: 'minhas' | 'para-atender';
}

// ✅ Verifica se pode imprimir (inclui PENDENTE)
const podeImprimir = (requisicao: Requisicao): boolean => {
  return ['PENDENTE', 'EM_SEPARACAO', 'ATENDIDA_PARCIALMENTE', 'ATENDIDA'].includes(requisicao.status);
};

const RequisicoesList: React.FC<RequisicoesListProps> = ({
  requisicoes,
  onViewDetails,
  onAtender,
  onCancelar,
  isLoading = false,
  modo
}) => {
  const [showCancelModal, setShowCancelModal] = React.useState(false);
  const [requisicaoParaCancelar, setRequisicaoParaCancelar] = React.useState<Requisicao | null>(null);

  // ✅ Função otimizada para buscar todas as localizações de uma vez
  const buscarLocalizacoesEmLote = async (
    medicamentos: Array<{ medicamentoId: string }>,
    estabelecimentoId: string
  ): Promise<Map<string, string>> => {
    const localizacoesMap = new Map<string, string>();

    try {
      const response = await api.post('/estoque/localizacoes', {
        medicamentos,
        estabelecimentoId
      });

      response.data.localizacoes.forEach((item: any) => {
        localizacoesMap.set(item.medicamentoId, item.localizacao);
      });

    } catch (error) {
      console.error('❌ Erro ao buscar localizações em lote:', error);
    }

    return localizacoesMap;
  };


  const gerarHTMLFolhaSeparacao = async (requisicao: Requisicao): Promise<string> => {
    // Prepara array de medicamentos para busca em lote
    const medicamentosParaBuscar = requisicao.itens.map(item => ({
      medicamentoId: item.medicamentoId
    }));
  
    // Busca todas as localizações de uma vez
    const localizacoesMap = await buscarLocalizacoesEmLote(
      medicamentosParaBuscar,
      requisicao.atendenteId|| '' // Garante string
    );
  
    const itensComLocalizacao = requisicao.itens.map((item, index) => {
      const localizacao = localizacoesMap.get(item.medicamentoId) || "Não localizado";
      const temLocalizacao = !["Não localizado", "Erro na consulta", "Localização não cadastrada"].includes(localizacao);
      
      return {
        ...item,
        numero: index + 1,
        localizacao,
        temLocalizacao,
        classeLocalizacao: temLocalizacao ? 'localizacao-cell' : 'localizacao-nao-encontrada'
      };
    });
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Folha de Separação - #${requisicao.id.substring(0, 8)}</title>
        <style>
          @page { 
            size: A4; 
            margin: 0.8cm;
            @bottom-center {
              content: "Página " counter(page) " de " counter(pages);
              font-size: 10px;
              color: #666;
            }
          }
          
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            font-size: 11px; 
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 0;
          }
          
          .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
          }
          
          .header h1 {
            font-size: 16px;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            color: #333;
          }
          
          .info-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 8px;
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: bold;
            color: #495057;
            font-size: 10px;
          }
          
          .info-value {
            font-size: 11px;
            color: #212529;
          }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 15px;
            font-size: 10px;
          }
          
          th { 
            background-color: #343a40; 
            color: white;
            border: 1px solid #454d55;
            padding: 6px 4px;
            text-align: left;
            font-weight: 600;
          }
          
          td { 
            border: 1px solid #dee2e6; 
            padding: 5px 4px;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .localizacao-cell {
            background-color: #e7f5ff;
            font-weight: bold;
            color: #0056b3;
          }


          
          .separado-cell {
            text-align: center;
            border: 1px dashed #6c757d;
          }
          
          .conferido-cell {
            text-align: center;
          }
          
          .assinatura-section {
            margin-top: 30px;
            page-break-inside: avoid;
          }
          
          .assinatura-box {
            display: inline-block;
            width: 45%;
            vertical-align: top;
          }
          
          .linha-assinatura {
            border-top: 1px solid #000;
            margin-top: 40px;
            padding-top: 5px;
          }
          
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 9px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 10px;
          }
          
          .total-row {
            background-color: #e9ecef;
            font-weight: bold;
          }
          
          .checkbox {
            display: inline-block;
            width: 12px;
            height: 12px;
            border: 1px solid #000;
            margin-right: 3px;
          }
          
          .urgente {
            background-color: #fff3cd;
            padding: 2px 4px;
            border-radius: 2px;
            font-weight: bold;
            font-size: 9px;
          }
          
          .codigo-requisicao {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📋 FOLHA DE SEPARAÇÃO - ALMOXARIFADO</h1>
          <div style="font-size: 10px; color: #666;">
            Sistema de Gestão Farmacêutica • ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 15px;">
          <div class="info-box">
            <div class="info-label">Nº REQUISIÇÃO</div>
            <div class="info-value codigo-requisicao">#${requisicao.id.substring(0, 8)}</div>
          </div>
          
          <div class="info-box">
            <div class="info-label">DATA SOLICITAÇÃO</div>
            <div class="info-value">${new Date(requisicao.dataSolicitacao).toLocaleDateString('pt-BR')}</div>
          </div>
          
          <div class="info-box">
            <div class="info-label">STATUS</div>
            <div class="info-value">
              <span style="color: ${requisicao.status === 'PENDENTE' ? '#ffc107' : requisicao.status === 'EM_SEPARACAO' ? '#17a2b8' : '#28a745'};">
                ${requisicao.status === 'PENDENTE' ? '⏳ PENDENTE' :
        requisicao.status === 'EM_SEPARACAO' ? '📦 EM SEPARAÇÃO' :
          requisicao.status === 'ATENDIDA' ? '✅ ATENDIDA' :
            '🔄 ATENDIDA PARCIALMENTE'}
              </span>
            </div>
          </div>
          
          <div class="info-box">
            <div class="info-label">SOLICITANTE</div>
            <div class="info-value">${requisicao.solicitante.nome}</div>
          </div>
          
          <div class="info-box">
            <div class="info-label">ESTAB. SOLICITANTE</div>
            <div class="info-value">${requisicao.solicitante?.nome || 'N/A'}</div>
          </div>
          
          <div class="info-box">
            <div class="info-label">ESTAB. ATENDENTE</div>
            <div class="info-value">${requisicao.atendente?.nome || 'N/A'}</div>
          </div>
        </div>
        
        ${requisicao.observacao ? `
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 8px; margin-bottom: 15px;">
            <strong>📝 Observações:</strong> ${requisicao.observacao}
          </div>
        ` : ''}
        
        <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #495057;">📦 ITENS PARA SEPARAÇÃO</h3>
        
        <table>
          <thead>
            <tr>
              <th width="3%">#</th>
              <th width="35%">MEDICAMENTO</th>
              <th width="15%">LOCALIZAÇÃO</th>
              <th width="10%">SOLICITADO</th>
              <th width="12%">SEPARADO</th>
              <th width="10%">✓ CONF.</th>
              <th width="15%">LOTE / VALIDADE</th>
            </tr>
          </thead>
          <tbody>
            ${itensComLocalizacao.map(item => `
              <tr>
                <td><strong>${item.numero}</strong></td>
                <td>
                  <strong>${item.medicamento?.principioAtivo || 'N/A'}</strong><br/>
                  <small style="color: #666;">
                    ${item.medicamento?.concentracao || ''} ${item.medicamento?.formaFarmaceutica || ''}
                   
                  </small>
                </td>
                <td class="${item.classeLocalizacao}">
                <span class="icone-localizacao">
                  ${item.temLocalizacao ? '📍' : '❌'}
                </span>
                ${item.localizacao}
              </td>
                <td style="text-align: center;">
                  <strong>${item.quantidadeSolicitada}</strong>
                </td>
                <td class="separado-cell">
                  ________
                </td>
                <td class="conferido-cell">
                  <span class="checkbox"></span>
                </td>
                
              </tr>
            `).join('')}
            
            <!-- Linha de totais -->
            <tr class="total-row">
              <td colspan="3" style="text-align: right;"><strong>TOTAL GERAL:</strong></td>
              <td style="text-align: center;">
                <strong>${requisicao.itens.reduce((sum, item) => sum + item.quantidadeSolicitada, 0)}</strong>
              </td>
              <td colspan="3"></td>
            </tr>
          </tbody>
        </table>
        
        <div class="assinatura-section">
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div class="assinatura-box">
              <div class="linha-assinatura"></div>
              <p style="text-align: center; margin: 5px 0; font-size: 10px;">
                <strong>RESPONSÁVEL PELA SEPARAÇÃO</strong>
              </p>
              <p style="text-align: center; margin: 2px 0; font-size: 9px; color: #666;">
                Nome: _________________________
              </p>
              <p style="text-align: center; margin: 2px 0; font-size: 9px; color: #666;">
                Data: ___/___/______ Hora: ___:___
              </p>
            </div>
            
            <div class="assinatura-box">
              <div class="linha-assinatura"></div>
              <p style="text-align: center; margin: 5px 0; font-size: 10px;">
                <strong>RESPONSÁVEL PELA CONFERÊNCIA</strong>
              </p>
              <p style="text-align: center; margin: 2px 0; font-size: 9px; color: #666;">
                Nome: _________________________
              </p>
              <p style="text-align: center; margin: 2px 0; font-size: 9px; color: #666;">
                Data: ___/___/______ Hora: ___:___
              </p>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>
            <strong>${requisicao.itens.length}</strong> itens listados • 
            Gerado automaticamente pelo sistema
          </p>
          <p style="font-size: 8px;">
            Este documento é para uso interno. Mantenha-o arquivado por 5 anos conforme legislação vigente.
          </p>
        </div>
        
        <script>
          window.onload = function() {
            // Pequeno delay para garantir que tudo carregou
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }, 300);
          }
        </script>
      </body>
      </html>
    `;
  };

  // ✅ Função para imprimir
  const handleImprimirSeparacao = async (requisicao: Requisicao) => {
    try {
      const html = await gerarHTMLFolhaSeparacao(requisicao);
      const printWindow = window.open('', '_blank', 'width=900,height=600');

      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      } else {
        alert('Permita pop-ups para imprimir a folha de separação');
      }
    } catch (error) {
      console.error('Erro ao gerar impressão:', error);
      alert('Erro ao gerar folha de separação. Tente novamente.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'warning';
      case 'EM_SEPARACAO': return 'info';
      case 'ATENDIDA': return 'success';
      case 'ATENDIDA_PARCIALMENTE': return 'primary';
      case 'CANCELADA': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'Pendente';
      case 'EM_SEPARACAO': return 'Em Separação';
      case 'ATENDIDA': return 'Atendida';
      case 'ATENDIDA_PARCIALMENTE': return 'Atendida Parcialmente';
      case 'CANCELADA': return 'Cancelada';
      default: return status;
    }
  };

  const getTotalItens = (requisicao: Requisicao) => requisicao.itens.length;
  const getTotalQuantidadeSolicitada = (requisicao: Requisicao) =>
    requisicao.itens.reduce((total, item) => total + item.quantidadeSolicitada, 0);
  const getTotalQuantidadeAtendida = (requisicao: Requisicao) =>
    requisicao.itens.reduce((total, item) => total + item.quantidadeAtendida, 0);

  const handleOpenCancelModal = (requisicao: Requisicao) => {
    setRequisicaoParaCancelar(requisicao);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = () => {
    if (requisicaoParaCancelar && onCancelar) {
      onCancelar(requisicaoParaCancelar);
    }
    setShowCancelModal(false);
    setRequisicaoParaCancelar(null);
  };

  const handleCloseCancelModal = () => {
    setShowCancelModal(false);
    setRequisicaoParaCancelar(null);
  };

  const podeCancelar = (requisicao: Requisicao): boolean => {
    return ['PENDENTE', 'EM_SEPARACAO'].includes(requisicao.status);
  };

  const podeAtender = (requisicao: Requisicao): boolean => {
    return modo === 'para-atender' && requisicao.status === 'PENDENTE';
  };

  if (isLoading) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
          <p className="mt-2">Carregando requisições...</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="card-title mb-0">
            {modo === 'minhas' ? 'Minhas Requisições' : 'Requisições para Atender'}
          </h5>
          <Badge bg="light" text="dark">
            {requisicoes.length} requisições
          </Badge>
        </Card.Header>
        <Card.Body className="p-0">
          {requisicoes.length === 0 ? (
            <div className="text-center py-5">
              <FaStore size={48} className="text-muted mb-3" />
              <p className="text-muted">
                {modo === 'minhas' ? 'Nenhuma requisição encontrada.' : 'Nenhuma requisição pendente para atender.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Data</th>
                    <th>ID</th>
                    {modo === 'minhas' ? <th>Atendente</th> : <th>Solicitante</th>}
                    <th>Itens</th>
                    <th>Quantidade</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requisicoes.map((requisicao) => (
                    <tr key={requisicao.id}>
                      <td><div className="fw-semibold">{formatDate(requisicao.dataSolicitacao)}</div></td>
                      <td><code className="small">#{requisicao.id.substring(0, 8)}</code></td>
                      <td>{modo === 'minhas' ? requisicao.atendente.nome : requisicao.solicitante.nome}</td>
                      <td><div className="fw-semibold">{getTotalItens(requisicao)} itens</div></td>
                      <td>
                        <div>Solicitado: <strong>{getTotalQuantidadeSolicitada(requisicao)}</strong></div>
                        <div>Atendido: <strong>{getTotalQuantidadeAtendida(requisicao)}</strong></div>
                      </td>
                      <td>
                        <Badge bg={getStatusVariant(requisicao.status)}>
                          {getStatusText(requisicao.status)}
                        </Badge>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button variant="outline-primary" onClick={() => onViewDetails(requisicao)} title="Ver detalhes">
                            <FaEye />
                          </Button>

                          {podeImprimir(requisicao) && (
                            <Button variant="outline-secondary" size="sm" onClick={() => handleImprimirSeparacao(requisicao)} title="Imprimir folha de separação">
                              <FaPrint />
                            </Button>
                          )}

                          {podeAtender(requisicao) && onAtender && (
                            <Button variant="outline-success" onClick={() => onAtender(requisicao)} title="Atender requisição">
                              <FaHandshake />
                            </Button>
                          )}

                          {podeCancelar(requisicao) && onCancelar && (
                            <Button variant="outline-danger" onClick={() => handleOpenCancelModal(requisicao)} title="Cancelar requisição">
                              <FaTimes />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCancelModal} onHide={handleCloseCancelModal}>
        <Modal.Header closeButton><Modal.Title>Cancelar Requisição</Modal.Title></Modal.Header>
        <Modal.Body>
          {requisicaoParaCancelar && (
            <>
              <p><strong>Confirma o cancelamento da requisição?</strong></p>
              <div className="bg-light p-3 rounded">
                <p><strong>ID:</strong> #{requisicaoParaCancelar.id.substring(0, 8)}</p>
                <p><strong>Solicitante:</strong> {requisicaoParaCancelar.solicitante.nome}</p>
                <p><strong>Itens:</strong> {getTotalItens(requisicaoParaCancelar)}</p>
                <p><strong>Status:</strong> <Badge bg={getStatusVariant(requisicaoParaCancelar.status)}>{getStatusText(requisicaoParaCancelar.status)}</Badge></p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseCancelModal}>Manter Requisição</Button>
          <Button variant="danger" onClick={handleConfirmCancel}><FaTrash className="me-2" />Confirmar Cancelamento</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default RequisicoesList;