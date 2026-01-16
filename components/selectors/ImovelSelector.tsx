'use client';

import { useState, useEffect } from 'react';

interface Imovel {
    id: number;
    descricao: string;
    endereco: string;
    valor: number;
    matricula?: string;
}

interface ImovelSelectorProps {
    empresaId: number | null;
    value: number | null;
    onChange: (imovelId: number | null) => void;
    allowCreate?: boolean;
    onCreateClick?: () => void;
    label?: string;
    required?: boolean;
}

export default function ImovelSelector({
    empresaId,
    value,
    onChange,
    allowCreate = false,
    onCreateClick,
    label = 'Selecione o Imóvel',
    required = false
}: ImovelSelectorProps) {
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (empresaId) {
            fetchImoveis();
        } else {
            setImoveis([]);
        }
    }, [empresaId]);

    const fetchImoveis = async () => {
        if (!empresaId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/imoveis?empresa_id=${empresaId}`);
            if (response.ok) {
                const data = await response.json();
                setImoveis(data.imoveis || []);
            }
        } catch (error) {
            console.error('Error fetching imóveis:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredImoveis = imoveis.filter(imovel => {
        const searchLower = searchTerm.toLowerCase();
        return (
            imovel.descricao?.toLowerCase().includes(searchLower) ||
            imovel.endereco?.toLowerCase().includes(searchLower) ||
            imovel.matricula?.toLowerCase().includes(searchLower)
        );
    });

    const selectedImovel = imoveis.find(i => i.id === value);

    if (!empresaId) {
        return (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-sm text-yellow-800">
                        Selecione uma empresa primeiro
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {loading ? (
                <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 animate-pulse">
                    Carregando imóveis...
                </div>
            ) : (
                <div className="space-y-2">
                    {/* Search input */}
                    {imoveis.length > 0 && (
                        <input
                            type="text"
                            placeholder="Buscar por descrição, endereço ou matrícula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    )}

                    {/* Select dropdown */}
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                        required={required}
                        disabled={imoveis.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">
                            {imoveis.length === 0 ? 'Nenhum imóvel cadastrado' : 'Selecione um imóvel'}
                        </option>
                        {filteredImoveis.map(imovel => (
                            <option key={imovel.id} value={imovel.id}>
                                {imovel.descricao} - R$ {imovel.valor.toLocaleString('pt-BR')}
                            </option>
                        ))}
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
                            Criar Novo Imóvel
                        </button>
                    )}

                    {/* Selected imovel preview */}
                    {selectedImovel && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm font-medium text-gray-900">
                                {selectedImovel.descricao}
                            </p>
                            <p className="text-xs text-gray-600">
                                {selectedImovel.endereco}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                                Valor: R$ {selectedImovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                {selectedImovel.matricula && ` • Matrícula: ${selectedImovel.matricula}`}
                            </p>
                        </div>
                    )}

                    {/* No results */}
                    {filteredImoveis.length === 0 && searchTerm && (
                        <p className="text-sm text-gray-500 text-center py-2">
                            Nenhum imóvel encontrado
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
