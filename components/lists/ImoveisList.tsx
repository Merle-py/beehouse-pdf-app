'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Imovel } from '@/types/database';

interface Props {
    initialImoveis: (Imovel & {
        empresa?: {
            id: number;
            nome: string | null;
            razao_social: string | null;
        } | null
    })[];
}

export default function ImoveisList({ initialImoveis }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredImoveis = useMemo(() => {
        if (!searchTerm) return initialImoveis;

        const search = searchTerm.toLowerCase();
        return initialImoveis.filter(imovel =>
            imovel.descricao?.toLowerCase().includes(search) ||
            imovel.endereco?.toLowerCase().includes(search) ||
            imovel.matricula?.toLowerCase().includes(search) ||
            imovel.empresa?.nome?.toLowerCase().includes(search) ||
            imovel.empresa?.razao_social?.toLowerCase().includes(search)
        );
    }, [initialImoveis, searchTerm]);

    return (
        <div>
            {/* Busca */}
            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Buscar por descrição, endereço, matrícula ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input w-full"
                />
            </div>

            {/* Contador */}
            <p className="text-sm text-gray-600 mb-4">
                {filteredImoveis.length} {filteredImoveis.length === 1 ? 'imóvel' : 'imóveis'}
                {searchTerm && ' encontrado(s)'}
            </p>

            {/* Lista */}
            {filteredImoveis.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <p className="mt-2 text-gray-500">
                        {searchTerm ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel cadastrado'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredImoveis.map((imovel) => (
                        <div key={imovel.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-2">{imovel.descricao}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{imovel.endereco}</p>

                                    {imovel.empresa && (
                                        <p className="text-sm text-gray-500">
                                            Empresa: {imovel.empresa.razao_social || imovel.empresa.nome}
                                        </p>
                                    )}

                                    {imovel.matricula && (
                                        <p className="text-xs text-gray-400 mt-1">Matrícula: {imovel.matricula}</p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL',
                                        }).format(Number(imovel.valor))}
                                    </p>

                                    <Link
                                        href={`/editar-imovel/${imovel.id}`}
                                        className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
                                    >
                                        Editar
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
