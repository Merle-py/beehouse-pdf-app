'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import ImovelForm, { type ImovelFormData } from '@/components/forms/ImovelForm';
import Link from 'next/link';

interface Autorizacao {
    id: number;
    status: string;
    prazo_exclusividade: number;
    comissao_percentual: number;
    created_at: string;
}

export default function EditarImovelPage() {
    const router = useRouter();
    const params = useParams();
    const imovelId = parseInt(params?.id as string);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [imovel, setImovel] = useState<any>(null);
    const [empresaNome, setEmpresaNome] = useState<string>('');
    const [autorizacoes, setAutorizacoes] = useState<Autorizacao[]>([]);

    useEffect(() => {
        if (imovelId) {
            fetchImovelData();
        }
    }, [imovelId]);

    const fetchImovelData = async () => {
        try {
            const [imovelRes, autorizacoesRes] = await Promise.all([
                fetch(`/api/imoveis/${imovelId}`),
                fetch(`/api/autorizacoes?imovel_id=${imovelId}`)
            ]);

            if (imovelRes.ok) {
                const imovelData = await imovelRes.json();
                setImovel(imovelData);

                // Get empresa name
                const empresaRes = await fetch(`/api/empresas/${imovelData.empresa_id}`);
                if (empresaRes.ok) {
                    const empresaData = await empresaRes.json();
                    const nome = empresaData.tipo === 'PJ' ? empresaData.razao_social : empresaData.nome;
                    setEmpresaNome(nome || '');
                }
            } else {
                toast.error('Erro ao carregar dados do imóvel');
                router.push('/imoveis');
            }

            if (autorizacoesRes.ok) {
                const autorizacoesData = await autorizacoesRes.json();
                setAutorizacoes(autorizacoesData.autorizacoes || []);
            }
        } catch (error) {
            console.error('Error fetching imovel:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (data: ImovelFormData) => {
        setLoading(true);

        try {
            const response = await fetch(`/api/imoveis/${imovelId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar imóvel');
            }

            toast.success('Imóvel atualizado com sucesso!');
            router.push('/imoveis');
        } catch (error: any) {
            console.error('Error updating imovel:', error);
            toast.error(error.message || 'Erro ao atualizar imóvel');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/imoveis');
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            rascunho: 'bg-gray-100 text-gray-800',
            aguardando_assinatura: 'bg-yellow-100 text-yellow-800',
            assinado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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

    if (!imovel) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/imoveis')}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar para lista
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Imóvel</h1>
                    <p className="text-gray-600 mt-2">Atualize os dados do imóvel</p>
                </div>

                {/* Autorizações vinculadas */}
                {autorizacoes.length > 0 && (
                    <div className="card mb-6 bg-purple-50 border border-purple-200">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Autorizações Vinculadas
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Este imóvel possui {autorizacoes.length} autorização{autorizacoes.length === 1 ? '' : 'ões'}:
                        </p>
                        <ul className="space-y-2">
                            {autorizacoes.slice(0, 3).map(auth => (
                                <li key={auth.id} className="text-sm flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-gray-600">
                                            Comissão: {auth.comissao_percentual}% • Prazo: {auth.prazo_exclusividade} dias
                                        </span>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(auth.status)}`}>
                                        {auth.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        {autorizacoes.length > 3 && (
                            <p className="text-sm text-gray-600 mt-2">
                                e mais {autorizacoes.length - 3} autorização{autorizacoes.length - 3 === 1 ? '' : 'ões'}...
                            </p>
                        )}
                        <Link
                            href={`/minhas-autorizacoes?imovel_id=${imovelId}`}
                            className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium mt-3"
                        >
                            Ver todas as autorizações
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Form */}
                {empresaNome && (
                    <ImovelForm
                        empresaId={imovel.empresa_id}
                        empresaNome={empresaNome}
                        initialData={imovel}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        mode="edit"
                        loading={loading}
                    />
                )}
            </div>
        </div>
    );
}
