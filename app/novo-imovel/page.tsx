'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import EmpresaSelector from '@/components/selectors/EmpresaSelector';
import ImovelForm, { type ImovelFormData } from '@/components/forms/ImovelForm';

export default function NovoImovelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [empresaId, setEmpresaId] = useState<number | null>(null);
    const [empresaNome, setEmpresaNome] = useState<string>('');
    const [empresas, setEmpresas] = useState<any[]>([]);

    // Get empresa_id from URL if provided
    useEffect(() => {
        const urlEmpresaId = searchParams?.get('empresa_id');
        if (urlEmpresaId) {
            setEmpresaId(parseInt(urlEmpresaId));
        }
    }, [searchParams]);

    // Fetch empresas to get selected empresa name
    useEffect(() => {
        fetchEmpresas();
    }, []);

    useEffect(() => {
        if (empresaId && empresas.length > 0) {
            const empresa = empresas.find(e => e.id === empresaId);
            if (empresa) {
                const nome = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
                setEmpresaNome(nome || '');
            }
        }
    }, [empresaId, empresas]);

    const fetchEmpresas = async () => {
        try {
            const response = await fetch('/api/empresas');
            if (response.ok) {
                const data = await response.json();
                setEmpresas(data.empresas || []);
            }
        } catch (error) {
            console.error('Error fetching empresas:', error);
        }
    };

    const handleSubmit = async (data: ImovelFormData) => {
        setLoading(true);

        try {
            const response = await fetch('/api/imoveis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar imóvel');
            }

            const result = await response.json();

            toast.success('Imóvel criado com sucesso!');
            router.push('/imoveis');
        } catch (error: any) {
            console.error('Error creating imovel:', error);
            toast.error(error.message || 'Erro ao criar imóvel');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
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
                    <h1 className="text-3xl font-bold text-gray-900">Novo Imóvel</h1>
                    <p className="text-gray-600 mt-2">Cadastre um novo imóvel vinculado a uma empresa</p>
                </div>

                {/* Empresa Selector */}
                {!empresaId && (
                    <div className="card mb-6">
                        <EmpresaSelector
                            value={empresaId}
                            onChange={setEmpresaId}
                            allowCreate={true}
                            onCreateClick={() => router.push('/nova-empresa?redirect=novo-imovel')}
                            label="Empresa Proprietária"
                            required
                        />
                    </div>
                )}

                {/* Form */}
                {empresaId && empresaNome ? (
                    <ImovelForm
                        empresaId={empresaId}
                        empresaNome={empresaNome}
                        onSubmit={handleSubmit}
                        onCancel={handleCancel}
                        mode="create"
                        loading={loading}
                    />
                ) : empresaId ? (
                    <div className="card animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
