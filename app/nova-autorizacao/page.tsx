'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmpresaSelector from '@/components/selectors/EmpresaSelector';
import ImovelSelector from '@/components/selectors/ImovelSelector';
import EmpresaCard from '@/components/cards/EmpresaCard';
import ImovelCard from '@/components/cards/ImovelCard';
import Input from '@/components/forms/Input';

export default function NovaAutorizacaoPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Empresa
    const [empresaId, setEmpresaId] = useState<number | null>(null);
    const [empresaData, setEmpresaData] = useState<any>(null);

    // Step 2: Imóvel
    const [imovelId, setImovelId] = useState<number | null>(null);
    const [imovelData, setImovelData] = useState<any>(null);

    // Step 3: Termos
    const [prazoExclusividade, setPrazoExclusividade] = useState('0');
    const [comissaoPercentual, setComissaoPercentual] = useState('6');

    // Fetch empresa data when selected
    const handleEmpresaChange = async (id: number | null) => {
        setEmpresaId(id);
        if (id) {
            try {
                const response = await fetch(`/api/empresas/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setEmpresaData(data);
                }
            } catch (error) {
                console.error('Error fetching empresa:', error);
            }
        } else {
            setEmpresaData(null);
        }
    };

    // Fetch imovel data when selected
    const handleImovelChange = async (id: number | null) => {
        setImovelId(id);
        if (id) {
            try {
                const response = await fetch(`/api/imoveis/${id}`);
                if (response.ok) {
                    const data = await response.json();
                    setImovelData(data);
                }
            } catch (error) {
                console.error('Error fetching imovel:', error);
            }
        } else {
            setImovelData(null);
        }
    };

    const handleNext = () => {
        if (currentStep === 1 && !empresaId) {
            toast.error('Selecione uma empresa');
            return;
        }
        if (currentStep === 2 && !imovelId) {
            toast.error('Selecione um imóvel');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async (generatePdf: boolean) => {
        if (!empresaId || !imovelId) {
            toast.error('Selecione empresa e imóvel');
            return;
        }

        setLoading(true);

        try {
            // Create autorização
            const response = await fetch('/api/autorizacoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imovel_id: imovelId,
                    prazo_exclusividade: parseInt(prazoExclusividade) || 0,
                    comissao_percentual: parseFloat(comissaoPercentual) || 6,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar autorização');
            }

            const result = await response.json();
            const autorizacaoId = result.id;

            toast.success('Autorização criada com sucesso!');

            // Generate PDF if requested
            if (generatePdf) {
                toast.loading('Gerando PDF...', { id: 'pdf-gen' });

                const pdfResponse = await fetch(`/api/autorizacoes/${autorizacaoId}/generate-pdf`, {
                    method: 'POST',
                });

                if (pdfResponse.ok) {
                    const pdfBlob = await pdfResponse.blob();
                    const url = window.URL.createObjectURL(pdfBlob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `autorizacao-${autorizacaoId}.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success('PDF gerado com sucesso!', { id: 'pdf-gen' });
                } else {
                    toast.error('Erro ao gerar PDF', { id: 'pdf-gen' });
                }
            }

            router.push('/minhas-autorizacoes');
        } catch (error: any) {
            console.error('Error creating autorização:', error);
            toast.error(error.message || 'Erro ao criar autorização');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Nova Autorização de Venda</h1>
                    <p className="text-gray-600 mt-2">Crie uma autorização de venda em 3 etapas</p>
                </div>

                {/* Progress Steps */}
                <div className="card mb-6">
                    <div className="flex items-center justify-between">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center flex-1">
                                <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step < currentStep
                                            ? 'bg-green-500 text-white'
                                            : step === currentStep
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {step < currentStep ? '✓' : step}
                                    </div>
                                    <div className="ml-3">
                                        <p className={`text-sm font-medium ${step <= currentStep ? 'text-gray-900' : 'text-gray-500'
                                            }`}>
                                            {step === 1 ? 'Empresa' : step === 2 ? 'Imóvel' : 'Termos'}
                                        </p>
                                    </div>
                                </div>
                                {step < 3 && (
                                    <div className={`flex-1 h-1 mx-4 ${step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step Content */}
                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Etapa 1: Selecione a Empresa</h2>
                            <EmpresaSelector
                                value={empresaId}
                                onChange={handleEmpresaChange}
                                allowCreate={true}
                                onCreateClick={() => router.push('/nova-empresa')}
                                label="Empresa Contratante"
                                required
                            />
                        </div>

                        {empresaData && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Empresa Selecionada:</h3>
                                <EmpresaCard empresa={empresaData} showDetails={true} />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={handleNext}
                                disabled={!empresaId}
                                className="btn-primary flex items-center gap-2"
                            >
                                Próximo: Selecionar Imóvel
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Etapa 2: Selecione o Imóvel</h2>
                            <ImovelSelector
                                empresaId={empresaId}
                                value={imovelId}
                                onChange={handleImovelChange}
                                allowCreate={true}
                                onCreateClick={() => router.push(`/novo-imovel?empresa_id=${empresaId}`)}
                                label="Imóvel a ser vendido"
                                required
                            />
                        </div>

                        {imovelData && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-2">Imóvel Selecionado:</h3>
                                <ImovelCard imovel={imovelData} showDetails={true} />
                            </div>
                        )}

                        <div className="flex justify-between">
                            <button
                                onClick={handleBack}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={!imovelId}
                                className="btn-primary flex items-center gap-2"
                            >
                                Próximo: Configurar Termos
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}

                {currentStep === 3 && (
                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Etapa 3: Configure os Termos</h2>
                            <div className="space-y-4">
                                <Input
                                    label="Prazo de Exclusividade (dias)"
                                    type="number"
                                    value={prazoExclusividade}
                                    onChange={setPrazoExclusividade}
                                    placeholder="0"
                                    helpText="0 = sem exclusividade. A autorização terá validade de 90 dias."
                                />
                                <Input
                                    label="Comissão (%)"
                                    type="number"
                                    step="0.1"
                                    value={comissaoPercentual}
                                    onChange={setComissaoPercentual}
                                    placeholder="6.0"
                                    required
                                />
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="card bg-blue-50 border border-blue-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Resumo da Autorização</h3>
                            <div className="space-y-2 text-sm">
                                <p><span className="font-medium">Empresa:</span> {empresaData?.tipo === 'PJ' ? empresaData?.razao_social : empresaData?.nome}</p>
                                <p><span className="font-medium">Imóvel:</span> {imovelData?.descricao}</p>
                                <p><span className="font-medium">Valor:</span> R$ {imovelData?.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p><span className="font-medium">Prazo:</span> {prazoExclusividade || 0} dias {prazoExclusividade === '0' ? '(sem exclusividade)' : '(com exclusividade)'}</p>
                                <p><span className="font-medium">Comissão:</span> {comissaoPercentual}%</p>
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={handleBack}
                                className="btn-secondary flex items-center gap-2"
                                disabled={loading}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar
                            </button>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleSubmit(false)}
                                    className="btn-secondary"
                                    disabled={loading}
                                >
                                    Salvar como Rascunho
                                </button>
                                <button
                                    onClick={() => handleSubmit(true)}
                                    className="btn-primary flex items-center gap-2"
                                    disabled={loading}
                                >
                                    {loading ? 'Processando...' : 'Salvar e Gerar PDF'}
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
