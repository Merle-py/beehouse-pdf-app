'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Empresa {
    id: number;
    tipo: 'PF' | 'PJ';
    nome?: string;
    razao_social?: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    imoveis_count?: number;
}

export default function EmpresasPage() {
    const router = useRouter();
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PF' | 'PJ'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmpresas();
    }, []);

    const fetchEmpresas = async () => {
        try {
            const response = await fetch('/api/empresas');
            if (response.ok) {
                const data = await response.json();
                setEmpresas(data.empresas || []);
            } else {
                toast.error('Erro ao carregar empresas');
            }
        } catch (error) {
            console.error('Error fetching empresas:', error);
            toast.error('Erro ao carregar empresas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number, nome: string) => {
        if (!confirm(`Tem certeza que deseja excluir a empresa "${nome}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/empresas/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                toast.success('Empresa excluída com sucesso!');
                fetchEmpresas(); // Reload list
            } else {
                const error = await response.json();
                toast.error(error.error || 'Erro ao excluir empresa');
            }
        } catch (error) {
            console.error('Error deleting empresa:', error);
            toast.error('Erro ao excluir empresa');
        }
    };

    const filteredEmpresas = empresas.filter(empresa => {
        // Filter by type
        if (filter !== 'ALL' && empresa.tipo !== filter) {
            return false;
        }

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
            const doc = empresa.tipo === 'PJ' ? empresa.cnpj : empresa.cpf;

            return (
                displayName?.toLowerCase().includes(searchLower) ||
                doc?.includes(searchTerm)
            );
        }

        return true;
    });

    const stats = {
        total: empresas.length,
        pf: empresas.filter(e => e.tipo === 'PF').length,
        pj: empresas.filter(e => e.tipo === 'PJ').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
                        <p className="text-gray-600 mt-2">Gerencie suas empresas cadastradas</p>
                    </div>
                    <Link
                        href="/nova-empresa"
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nova Empresa
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-sm opacity-90">Total de Empresas</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <p className="text-sm opacity-90">Pessoas Jurídicas</p>
                        <p className="text-3xl font-bold mt-1">{stats.pj}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-sm opacity-90">Pessoas Físicas</p>
                        <p className="text-3xl font-bold mt-1">{stats.pf}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nome, CPF ou CNPJ..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('ALL')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'ALL'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Todas
                            </button>
                            <button
                                onClick={() => setFilter('PF')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'PF'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                PF
                            </button>
                            <button
                                onClick={() => setFilter('PJ')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'PJ'
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                PJ
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="card animate-pulse">
                        <div className="h-20 bg-gray-200 rounded"></div>
                    </div>
                ) : filteredEmpresas.length === 0 ? (
                    <div className="card text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchTerm
                                ? 'Tente buscar com outros termos'
                                : 'Comece cadastrando sua primeira empresa'}
                        </p>
                        {!searchTerm && (
                            <Link href="/nova-empresa" className="btn-primary inline-flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Criar Primeira Empresa
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredEmpresas.map((empresa) => {
                            const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
                            const doc = empresa.tipo === 'PJ' ? empresa.cnpj : empresa.cpf;

                            return (
                                <div key={empresa.id} className="card hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${empresa.tipo === 'PJ'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {empresa.tipo}
                                                </span>
                                                <h3 className="font-semibold text-gray-900 text-lg">
                                                    {displayName}
                                                </h3>
                                            </div>
                                            <div className="space-y-1 text-sm text-gray-600">
                                                <p>{empresa.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {doc}</p>
                                                {empresa.email && <p>Email: {empresa.email}</p>}
                                                {empresa.telefone && <p>Telefone: {empresa.telefone}</p>}
                                                {empresa.imoveis_count !== undefined && (
                                                    <p className="text-blue-600 font-medium">
                                                        {empresa.imoveis_count} imóve{empresa.imoveis_count === 1 ? 'l' : 'is'} cadastrado{empresa.imoveis_count === 1 ? '' : 's'}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/editar-empresa/${empresa.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <Link
                                                href={`/imoveis?empresa_id=${empresa.id}`}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Ver Imóveis"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(empresa.id, displayName || 'empresa')}
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
