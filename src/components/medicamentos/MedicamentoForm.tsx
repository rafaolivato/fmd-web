import React, { useState, useEffect } from 'react';
import type { Medicamento, MedicamentoFormData } from '../../types/Medicamento';

interface MedicamentoFormProps {
  medicamento?: Medicamento;
  onSubmit: (data: MedicamentoFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CategoriaControlada {
  id: string;
  nome: string;
  tipo: string;
}

// ✅ Interface específica para erros (pode conter strings)
interface MedicamentoFormErrors {
  principioAtivo?: string;
  concentracao?: string;
  formaFarmaceutica?: string;
  psicotropico?: string;
  estoqueMinimo?: string;  // Agora pode ser string
  categoriaControladaId?: string;
}

const MedicamentoForm: React.FC<MedicamentoFormProps> = ({
  medicamento,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<MedicamentoFormData>({
    principioAtivo: '',
    concentracao: '',
    formaFarmaceutica: '',
    psicotropico: false,
    estoqueMinimo: 0,
    categoriaControladaId: ''
  });

  const [categorias, setCategorias] = useState<CategoriaControlada[]>([]);
  // ✅ Usa a nova interface de erros
  const [errors, setErrors] = useState<MedicamentoFormErrors>({});
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [categoriasError] = useState<string>('');

  useEffect(() => {
    const carregarCategorias = async () => {
      setLoadingCategorias(true);
      
      try {
        const response = await fetch('/medicamentos/categorias');
        
        if (response.ok) {
          const categoriasData = await response.json();
          setCategorias(categoriasData);
        } else {
          throw new Error(`Erro ${response.status}`);
        }
        
      } catch (error) {
        console.error('❌ Erro ao carregar categorias:', error);
        // Fallback com as categorias do seu banco
        const categoriasFallback = [
          { id: 'A1', nome: 'Entorpecentes', tipo: 'A1' },
          { id: 'A2', nome: 'Entorpecentes A2', tipo: 'A2' },
          { id: 'A3', nome: 'Psicotrópicos A3', tipo: 'A3' },
          { id: 'B1', nome: 'Psicotrópicos', tipo: 'B1' },
          { id: 'B2', nome: 'Psicotrópicos B2', tipo: 'B2' },
          { id: 'C1', nome: 'Outros Controlados', tipo: 'C1' },
          { id: 'C2', nome: 'Retinoides Sistêmicos', tipo: 'C2' },
          { id: 'C3', nome: 'Imunossupressores', tipo: 'C3' },
          { id: 'ANTIMICROBIANO', nome: 'Antimicrobianos', tipo: 'ANTIMICROBIANO' }
        ];
        setCategorias(categoriasFallback);
      } finally {
        setLoadingCategorias(false);
      }
    };

    carregarCategorias();
  }, []);

  useEffect(() => {
    if (medicamento) {
      setFormData({
        principioAtivo: medicamento.principioAtivo,
        concentracao: medicamento.concentracao,
        formaFarmaceutica: medicamento.formaFarmaceutica,
        psicotropico: medicamento.psicotropico,
        estoqueMinimo: medicamento.estoqueMinimo,
        categoriaControladaId: medicamento.categoriaControladaId || ''
      });
    }
  }, [medicamento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number'
          ? Number(value)
          : value
    }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name as keyof MedicamentoFormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: MedicamentoFormErrors = {};

    if (!formData.principioAtivo.trim()) {
      newErrors.principioAtivo = 'Princípio ativo é obrigatório';
    }

    if (!formData.concentracao.trim()) {
      newErrors.concentracao = 'Concentração é obrigatória';
    }

    if (!formData.formaFarmaceutica.trim()) {
      newErrors.formaFarmaceutica = 'Forma farmacêutica é obrigatória';
    }

    if (formData.estoqueMinimo < 0) {
      newErrors.estoqueMinimo = 'Estoque mínimo não pode ser negativo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      // Garantir que estoqueMinimo seja número
      const dataToSubmit: MedicamentoFormData = {
        ...formData,
        estoqueMinimo: Number(formData.estoqueMinimo) || 0
      };
      onSubmit(dataToSubmit);
    }
  };
  
  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          {medicamento ? 'Editar Medicamento' : 'Novo Medicamento'}
        </h5>
      </div>
      <div className="card-body">
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="principioAtivo" className="form-label">
                Princípio Ativo *
              </label>
              <input
                type="text"
                className={`form-control ${errors.principioAtivo ? 'is-invalid' : ''}`}
                id="principioAtivo"
                name="principioAtivo"
                value={formData.principioAtivo}
                onChange={handleChange}
                placeholder="Ex: Dipirona, Paracetamol"
              />
              {errors.principioAtivo && (
                <div className="invalid-feedback">{errors.principioAtivo}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="concentracao" className="form-label">
                Concentração *
              </label>
              <input
                type="text"
                className={`form-control ${errors.concentracao ? 'is-invalid' : ''}`}
                id="concentracao"
                name="concentracao"
                value={formData.concentracao}
                onChange={handleChange}
                placeholder="Ex: 500mg, 10mg/mL"
              />
              {errors.concentracao && (
                <div className="invalid-feedback">{errors.concentracao}</div>
              )}
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="formaFarmaceutica" className="form-label">
                Forma Farmacêutica *
              </label>
              <select
                className={`form-select ${errors.formaFarmaceutica ? 'is-invalid' : ''}`}
                id="formaFarmaceutica"
                name="formaFarmaceutica"
                value={formData.formaFarmaceutica}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                <option value="Comprimido">Comprimido</option>
                <option value="Cápsula">Cápsula</option>
                <option value="Xarope">Xarope</option>
                <option value="Solução">Solução</option>
                <option value="Pomada">Pomada</option>
                <option value="Creme">Creme</option>
                <option value="Gel">Gel</option>
                <option value="Injetável">Injetável</option>
                <option value="Supositório">Supositório</option>
                <option value="Spray">Spray</option>
                <option value="Adesivo">Adesivo</option>
                <option value="Unidade">Unidade</option>
              </select>
              {errors.formaFarmaceutica && (
                <div className="invalid-feedback">{errors.formaFarmaceutica}</div>
              )}
            </div>

            <div className="col-md-6 mb-3">
              <label htmlFor="estoqueMinimo" className="form-label">
                Estoque Mínimo
              </label>
              <input
                type="number"
                className={`form-control ${errors.estoqueMinimo ? 'is-invalid' : ''}`}
                id="estoqueMinimo"
                name="estoqueMinimo"
                value={formData.estoqueMinimo}
                onChange={handleChange}
                placeholder="Ex: 10"
                min={0}
              />
              {errors.estoqueMinimo && (
                <div className="invalid-feedback">{errors.estoqueMinimo}</div>
              )}
              <div className="form-text">
                Quantidade mínima para alertas de estoque (opcional)
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="categoriaControladaId" className="form-label">
                Categoria Controlada
              </label>
              <select
                className="form-select"
                id="categoriaControladaId"
                name="categoriaControladaId"
                value={formData.categoriaControladaId || ''}
                onChange={handleChange}
                disabled={loadingCategorias}
              >
                <option value="">Selecione a categoria...</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nome} ({categoria.tipo})
                  </option>
                ))}
              </select>
              
              {loadingCategorias && (
                <div className="form-text text-info">Carregando categorias...</div>
              )}
              
              {categoriasError && (
                <div className="form-text text-warning">{categoriasError}</div>
              )}
              
              {!loadingCategorias && categorias.length === 0 && (
                <div className="form-text text-danger">
                  Nenhuma categoria disponível
                </div>
              )}
              
              
              
              <div className="form-text">
                Selecione a categoria para medicamentos controlados (opcional)
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="form-check mt-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="psicotropico"
                  name="psicotropico"
                  checked={formData.psicotropico}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="psicotropico">
                  Psicotrópico
                </label>
                <div className="form-text">
                  Marque se o medicamento é controlado (psicotrópico)
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Salvando...
                </>
              ) : (
                medicamento ? 'Atualizar' : 'Cadastrar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicamentoForm;