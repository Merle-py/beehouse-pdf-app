'use client';

import { useState, useEffect } from 'react';

interface Empresa {
    id: number;
    tipo: 'PF' | 'PJ';
    nome?: string;
    razao_social?: string;
    cpf?: string;
    cnpj?: string;
}

interface EmpresaSelectorProps {
    value: number | null;
    onChange: (empresaId: number | null) => void;
    allowCreate?: boolean;
    onCreateClick?: () => void;
    label?: string;
    required?: boolean;
}

export default function EmpresaSelector({
    value,
    onChange,
    allowCreate = false,
    onCreateClick,
    label = 'Selecione a Empresa',
    required = false
}: EmpresaSelectorProps) {
    const [empresas, setEmpresas] = useState<Empresa[]>([]);
    const [loading, setLoading] = useState(true);
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
            }
        } catch (error) {
            console.error('Error fetching empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmpresas = empresas.filter(empresa => {
        const searchLower = searchTerm.toLowerCase();
        const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
        const doc = empresa.tipo === 'PJ' ? empresa.cnpj : empresa.cpf;

        return (
            displayName?.toLowerCase().includes(searchLower) ||
            doc?.includes(searchTerm)
        );
    });

    const selectedEmpresa = empresas.find(e => e.id === value);

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {loading ? (
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
                    Carregando empresas...
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Search input */}
                    <input
                        type="text"
                        placeholder="Buscar por nome ou CPF/CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />

                    {/* Select dropdown */}
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                        required={required}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Selecione uma empresa</option>
                        {filteredEmpresas.map(empresa => {
                            const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
                            const doc = empresa.tipo === 'PJ'
                                ? empresa.cnpj
                                : empresa.cpf;

                            return (
                                <option key={empresa.id} value={empresa.id}>
                                    {displayName} - {empresa.tipo} ({doc})
                                </option>
                            );
                        })}
                    </select>

                    {/* Create new button */}
                    {allowCreate && onCreateClick && (
                        <button
                            type="button"
                            onClick={onCreateClick}
                            className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Criar Nova Empresa
                        </button>
                    )}

                    {/* Selected empresa preview */}
                    {selectedEmpresa && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">
                                {selectedEmpresa.tipo === 'PJ' ? selectedEmpresa.razao_social : selectedEmpresa.nome}
                            </p>
                            <p className="text-xs text-gray-600">
                                {selectedEmpresa.tipo} • {selectedEmpresa.tipo === 'PJ' ? selectedEmpresa.cnpj : selectedEmpresa.cpf}
                            </p>
                        </div>
                    )}

                    {/* No results */}
                    {filteredEmpresas.length === 0 && searchTerm && (
                        <p className="text-sm text-gray-500 text-center py-2">
                            Nenhuma empresa encontrada
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
