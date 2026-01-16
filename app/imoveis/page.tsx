'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Imovel {
    id: number;
    descricao: string;
    endereco: string;
    valor: number;
    matricula?: string;
    empresa_id: number;
    empresa_nome?: string;
    empresa_razao_social?: string;
    empresa_tipo?: 'PF' | 'PJ';
    autorizacoes_count?: number;
}

export default function ImoveisPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [empresaFilter, setEmpresaFilter] = useState<number | null>(null);

    // If URL has empresa_id, filter by it
    useEffect(() => {
        const urlEmpresaId = searchParams?.get('empresa_id');
        if (urlEmpresaId) {
            setEmpresaFilter(parseInt(urlEmpresaId));
        }
    }, [searchParams]);

    useEffect(() => {
        fetchImoveis();
    }, [empresaFilter]);

    const fetchImoveis = async () => {
        try {
            const url = empresaFilter
                ? `/api/imoveis?empresa_id=${empresaFilter}`
                : '/api/imoveis';

            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setImoveis(data.imoveis || []);
            } else {
                toast.error('Erro ao carregar imóveis');
            }
        } catch (error) {
            console.error('Error fetching imoveis:', error);
            toast.error('Erro ao carregar imóveis');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, descricao: string) => {
        if (!confirm(`Tem certeza que deseja excluir o imóvel "${descricao}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/imoveis/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Imóvel excluído com sucesso!');
                fetchImoveis();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao excluir imóvel');
            }
        } catch (error) {
            console.error('Error deleting imovel:', error);
            toast.error('Erro ao excluir imóvel');
        }
    };

    const filteredImoveis = imoveis.filter(imovel => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const empresaNome = imovel.empresa_tipo === 'PJ'
            ? imovel.empresa_razao_social
            : imovel.empresa_nome;

        return (
            imovel.descricao?.toLowerCase().includes(searchLower) ||
            imovel.endereco?.toLowerCase().includes(searchLower) ||
            imovel.matricula?.toLowerCase().includes(searchLower) ||
            empresaNome?.toLowerCase().includes(searchLower)
        );
    });

    const stats = {
        total: imoveis.length,
        totalValue: imoveis.reduce((sum, i) => sum + i.valor, 0),
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Imóveis</h1>
                        <p className="text-gray-600 mt-2">
                            {empresaFilter
                                ? 'Imóveis desta empresa'
                                : 'Gerencie seus imóveis cadastrados'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {empresaFilter && (
                            <button
                                onClick={() => {
                                    setEmpresaFilter(null);
                                    router.push('/imoveis');
                                }}
                                className="btn-secondary flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpar Filtro
                            </button>
                        )}
                        <Link
                            href={empresaFilter ? `/novo-imovel?empresa_id=${empresaFilter}` : '/novo-imovel'}
                            className="btn-primary flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Novo Imóvel
                        </Link>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-sm opacity-90">Total de Imóveis</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-sm opacity-90">Valor Total</p>
                        <p className="text-3xl font-bold mt-1">
                            R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="card mb-6">
                    <input
                        type="text"
                        placeholder="Buscar por descrição, endereço, matrícula ou empresa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* List */}
                {loading ? (
                    <div className="card animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                ) : filteredImoveis.length === 0 ? (
                    <div className="card text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm
                                ? 'Tente buscar com outros termos'
                                : 'Comece cadastrando seu primeiro imóvel'}
                        </p>
                        {!searchTerm && (
                            <Link href="/novo-imovel" className="btn-primary inline-flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Criar Primeiro Imóvel
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredImoveis.map((imovel) => {
                            const empresaNome = imovel.empresa_tipo === 'PJ'
                                ? imovel.empresa_razao_social
                                : imovel.empresa_nome;

                            return (
                                <div key={imovel.id} className="card hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-lg mb-2">
                                                {imovel.descricao}
                                            </h3>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    </svg>
                                                    {imovel.endereco}
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-semibold text-green-700">
                                                        R$ {imovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </p>
                                                {imovel.matricula && (
                                                    <p className="text-gray-500">Matrícula: {imovel.matricula}</p>
                                                )}
                                                {empresaNome && (
                                                    <p className="flex items-center gap-2 text-blue-600 font-medium">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {empresaNome}
                                                    </p>
                                                )}
                                                {imovel.autorizacoes_count !== undefined && (
                                                    <p className="text-purple-600 font-medium">
                                                        {imovel.autorizacoes_count} autorização{imovel.autorizacoes_count === 1 ? '' : 'ões'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/editar-imovel/${imovel.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/minhas-autorizacoes?imovel_id=${imovel.id}`}
                                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Ver Autorizações"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(imovel.id, imovel.descricao)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
