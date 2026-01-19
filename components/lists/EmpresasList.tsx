'use client';

import { useState, useMemo } from 'react';
import { Empresa } from '@/types/database';

interface Props {
    initialEmpresas: Empresa[];
}

export default function EmpresasList({ initialEmpresas }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'PF' | 'PJ'>('all');

    const filteredEmpresas = useMemo(() => {
        return initialEmpresas.filter(empresa => {
            const matchesType = filterType === 'all' || empresa.tipo === filterType;

            if (!searchTerm) return matchesType;

            const search = searchTerm.toLowerCase();
            const matchesSearch =
                empresa.nome?.toLowerCase().includes(search) ||
                empresa.razao_social?.toLowerCase().includes(search) ||
                empresa.cpf?.includes(search) ||
                empresa.cnpj?.includes(search) ||
                empresa.email?.toLowerCase().includes(search);

            return matchesType && matchesSearch;
        });
    }, [initialEmpresas, searchTerm, filterType]);

    return (
        <div>
            {/* Filtros */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Buscar por nome, CPF, CNPJ ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input flex-1"
                />

                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Todas
                    </button>
                    <button
                        onClick={() => setFilterType('PF')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'PF'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pessoa Física
                    </button>
                    <button
                        onClick={() => setFilterType('PJ')}
                        className={`px-4 py-2 rounded-lg transition-colors ${filterType === 'PJ'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        Pessoa Jurídica
                    </button>
                </div>
            </div>

            {/* Contador */}
            <p className="text-sm text-gray-600 mb-4">
                {filteredEmpresas.length} {filteredEmpresas.length === 1 ? 'empresa' : 'empresas'}
                {searchTerm && ' encontrada(s)'}
            </p>

            {/* Lista */}
            {filteredEmpresas.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="mt-2 text-gray-500">
                        {searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmpresas.map((empresa) => {
                        const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
                        const doc = empresa.tipo === 'PJ' ? empresa.cnpj : empresa.cpf;

                        return (
                            <div key={empresa.id} className="card hover:shadow-lg transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${empresa.tipo === 'PJ'
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                            }`}>
                                            {empresa.tipo}
                                        </span>
                                        <h3 className="font-semibold text-gray-900">{displayName}</h3>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-gray-600">
                                    <p>{empresa.tipo === 'PJ' ? 'CNPJ' : 'CPF'}: {doc}</p>
                                    {empresa.email && <p>Email: {empresa.email}</p>}
                                    {empresa.telefone && <p>Telefone: {empresa.telefone}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
