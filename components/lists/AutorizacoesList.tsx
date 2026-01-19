'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Autorizacao {
    id: number;
    status: string;
    created_at: string;
    prazo_exclusividade?: number;
    comissao_percentual?: number;
    pdf_url?: string;
    imovel?: {
        id: number;
        descricao: string;
        endereco: string;
        valor: number;
        empresa?: {
            id: number;
            nome: string | null;
            razao_social: string | null;
        } | null;
    } | null;
}

interface Props {
    initialAutorizacoes: Autorizacao[];
}

export default function AutorizacoesList({ initialAutorizacoes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filteredAutorizacoes = useMemo(() => {
        return initialAutorizacoes.filter(auth => {
            const matchesStatus = filterStatus === 'all' || auth.status === filterStatus;

            if (!searchTerm) return matchesStatus;

            const search = searchTerm.toLowerCase();
            const matchesSearch =
                auth.imovel?.descricao?.toLowerCase().includes(search) ||
                auth.imovel?.endereco?.toLowerCase().includes(search) ||
                auth.imovel?.empresa?.nome?.toLowerCase().includes(search) ||
                auth.imovel?.empresa?.razao_social?.toLowerCase().includes(search);

            return matchesStatus && matchesSearch;
        });
    }, [initialAutorizacoes, searchTerm, filterStatus]);

    const getStatusColor = (status: string) => {
        const colors = {
            rascunho: 'bg-gray-100 text-gray-800',
            aguardando_assinatura: 'bg-yellow-100 text-yellow-800',
            assinado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800',
            encerrado: 'bg-blue-100 text-blue-800',
        };
        return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels = {
            rascunho: 'Rascunho',
            aguardando_assinatura: 'Aguardando Assinatura',
            assinado: 'Assinado',
            cancelado: 'Cancelado',
            encerrado: 'Encerrado',
        };
        return labels[status as keyof typeof labels] || status;
    };

    return (
        <div>
            {/* Filtros */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Buscar por imóvel, endereço ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input flex-1"
                />

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input sm:w-48"
                >
                    <option value="all">Todos os status</option>
                    <option value="rascunho">Rascunho</option>
                    <option value="aguardando_assinatura">Aguardando Assinatura</option>
                    <option value="assinado">Assinado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="encerrado">Encerrado</option>
                </select>
            </div>

            {/* Contador */}
            <p className="text-sm text-gray-600 mb-4">
                {filteredAutorizacoes.length} {filteredAutorizacoes.length === 1 ? 'autorização' : 'autorizações'}
                {searchTerm && ' encontrada(s)'}
            </p>

            {/* Lista */}
            {filteredAutorizacoes.length === 0 ? (
                <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-gray-500">
                        {searchTerm ? 'Nenhuma autorização encontrada' : 'Nenhuma autorização cadastrada'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredAutorizacoes.map((auth) => (
                        <div key={auth.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(auth.status)}`}>
                                            {getStatusLabel(auth.status)}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(auth.created_at).toLocaleDateString('pt-BR')}
                                        </span>
                                    </div>

                                    {auth.imovel && (
                                        <>
                                            <h3 className="font-semibold text-lg mb-1">{auth.imovel.descricao}</h3>
                                            <p className="text-sm text-gray-600 mb-1">{auth.imovel.endereco}</p>

                                            {auth.imovel.empresa && (
                                                <p className="text-sm text-gray-500">
                                                    Proprietário: {auth.imovel.empresa.razao_social || auth.imovel.empresa.nome}
                                                </p>
                                            )}

                                            <div className="flex gap-4 mt-2 text-sm">
                                                <p className="text-green-600 font-semibold">
                                                    {new Intl.NumberFormat('pt-BR', {
                                                        style: 'currency',
                                                        currency: 'BRL',
                                                    }).format(Number(auth.imovel.valor))}
                                                </p>
                                                {auth.prazo_exclusividade && (
                                                    <p className="text-gray-600">
                                                        Prazo: {auth.prazo_exclusividade} dias
                                                    </p>
                                                )}
                                                {auth.comissao_percentual && (
                                                    <p className="text-gray-600">
                                                        Comissão: {auth.comissao_percentual}%
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    {auth.pdf_url && (
                                        <a
                                            href={auth.pdf_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ver PDF"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </a>
                                    )}
                                    <Link
                                        href={`/autorizacoes/${auth.id}`}
                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        title="Ver detalhes"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
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
