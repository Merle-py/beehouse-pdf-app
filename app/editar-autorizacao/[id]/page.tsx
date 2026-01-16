'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import EmpresaCard from '@/components/cards/EmpresaCard';
import ImovelCard from '@/components/cards/ImovelCard';

export default function EditarAutorizacaoPage() {
    const router = useRouter();
    const params = useParams();
    const autorizacaoId = parseInt(params?.id as string);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [autorizacao, setAutorizacao] = useState<any>(null);
    const [prazoExclusividade, setPrazoExclusividade] = useState('0');
    const [comissaoPercentual, setComissaoPercentual] = useState('6');

    useEffect(() => {
        if (autorizacaoId) {
            fetchAutorizacao();
        }
    }, [autorizacaoId]);

    const fetchAutorizacao = async () => {
        try {
            const response = await fetch(`/api/autorizacoes/${autorizacaoId}`);
            if (response.ok) {
                const data = await response.json();
                setAutorizacao(data);
                setPrazoExclusividade(data.prazo_exclusividade?.toString() || '0');
                setComissaoPercentual(data.comissao_percentual?.toString() || '6');
            } else {
                toast.error('Erro ao carregar autorização');
                router.push('/minhas-autorizacoes');
            }
        } catch (error) {
            console.error('Error fetching autorização:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);

        try {
            const response = await fetch(`/api/autorizacoes/${autorizacaoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prazo_exclusividade: parseInt(prazoExclusividade) || 0,
                    comissao_percentual: parseFloat(comissaoPercentual) || 6,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar autorização');
            }

            toast.success('Autorização atualizada com sucesso!');
            router.push('/minhas-autorizacoes');
        } catch (error: any) {
            console.error('Error updating autorização:', error);
            toast.error(error.message || 'Erro ao atualizar autorização');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!autorizacao) {
        return null;
    }

    // Can only edit drafts
    if (autorizacao.status !== 'rascunho') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Edição não permitida
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Apenas autorizações com status "rascunho" podem ser editadas.
                        </p>
                        <button
                            onClick={() => router.push('/minhas-autorizacoes')}
                            className="btn-primary"
                        >
                            Voltar para Autorizações
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const empresaData = {
        id: autorizacao.empresa_id,
        tipo: autorizacao.empresa_tipo,
        nome: autorizacao.empresa_nome,
        razao_social: autorizacao.empresa_razao_social,
        cpf: autorizacao.empresa_cpf,
        cnpj: autorizacao.empresa_cnpj,
        email: autorizacao.empresa_email,
        telefone: autorizacao.empresa_telefone,
    };

    const imovelData = {
        id: autorizacao.imovel_id,
        descricao: autorizacao.imovel_descricao,
        endereco: autorizacao.imovel_endereco,
        valor: autorizacao.imovel_valor,
        matricula: autorizacao.imovel_matricula,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/minhas-autorizacoes')}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Autorização</h1>
                    <p className="text-gray-600 mt-2">Atualize os termos da autorização</p>
                </div>

                {/* Empresa (readonly) */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Empresa Contratante:</h3>
                    <EmpresaCard empresa={empresaData} showDetails={false} />
                </div>

                {/* Imóvel (readonly) */}
                <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Imóvel:</h3>
                    <ImovelCard imovel={imovelData} showDetails={false} />
                    <p className="text-xs text-gray-500 mt-2">
                        ℹ️ A empresa e o imóvel não podem ser alterados após a criação da autorização.
                    </p>
                </div>

                {/* Editable Terms */}
                <div className="card mb-6">
                    <h2 className="text-xl font-bold mb-4">Termos da Autorização</h2>
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

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => router.push('/minhas-autorizacoes')}
                        className="btn-secondary"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
