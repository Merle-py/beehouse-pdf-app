'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import EmpresaForm, { type EmpresaFormData } from '@/components/forms/EmpresaForm';
import Link from 'next/link';

interface Imovel {
    id: number;
    descricao: string;
    endereco: string;
    valor: number;
}

export default function EditarEmpresaPage() {
    const router = useRouter();
    const params = useParams();
    const empresaId = parseInt(params?.id as string);

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [empresa, setEmpresa] = useState<any>(null);
    const [imoveis, setImoveis] = useState<Imovel[]>([]);

    useEffect(() => {
        if (empresaId) {
            fetchEmpresaData();
        }
    }, [empresaId]);

    const fetchEmpresaData = async () => {
        try {
            const [empresaRes, imoveisRes] = await Promise.all([
                fetch(`/api/empresas/${empresaId}`),
                fetch(`/api/imoveis?empresa_id=${empresaId}`)
            ]);

            if (empresaRes.ok) {
                const empresaData = await empresaRes.json();
                setEmpresa(empresaData);
            } else {
                toast.error('Erro ao carregar dados da empresa');
                router.push('/empresas');
            }

            if (imoveisRes.ok) {
                const imoveisData = await imoveisRes.json();
                setImoveis(imoveisData.imoveis || []);
            }
        } catch (error) {
            console.error('Error fetching empresa:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoadingData(false);
        }
    };

    const handleSubmit = async (data: EmpresaFormData) => {
        setLoading(true);

        try {
            const response = await fetch(`/api/empresas/${empresaId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao atualizar empresa');
            }

            toast.success('Empresa atualizada com sucesso!');
            router.push('/empresas');
        } catch (error: any) {
            console.error('Error updating empresa:', error);
            toast.error(error.message || 'Erro ao atualizar empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push('/empresas');
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

    if (!empresa) {
        return null;
    }

    const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/empresas')}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar para lista
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Empresa</h1>
                    <p className="text-gray-600 mt-2">Atualize os dados de {displayName}</p>
                </div>

                {/* Imóveis vinculados */}
                {imoveis.length > 0 && (
                    <div className="card mb-6 bg-blue-50 border border-blue-200">
                        <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Imóveis Vinculados
                        </h3>
                        <p className="text-sm text-gray-700 mb-3">
                            Esta empresa possui {imoveis.length} imóve{imoveis.length === 1 ? 'l' : 'is'} cadastrado{imoveis.length === 1 ? '' : 's'}:
                        </p>
                        <ul className="space-y-2">
                            {imoveis.slice(0, 3).map(imovel => (
                                <li key={imovel.id} className="text-sm text-gray-600 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                    {imovel.descricao} - R$ {imovel.valor.toLocaleString('pt-BR')}
                                </li>
                            ))}
                        </ul>
                        {imoveis.length > 3 && (
                            <p className="text-sm text-gray-600 mt-2">
                                e mais {imoveis.length - 3} imóve{imoveis.length - 3 === 1 ? 'l' : 'is'}...
                            </p>
                        )}
                        <Link
                            href={`/imoveis?empresa_id=${empresaId}`}
                            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium mt-3"
                        >
                            Ver todos os imóveis
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Form */}
                <EmpresaForm
                    initialData={empresa}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    mode="edit"
                    loading={loading}
                />
            </div>
        </div>
    );
}
