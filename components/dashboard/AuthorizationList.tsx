'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { getCompanyTypeBadge } from '@/lib/utils/bitrix';

interface Authorization {
    id: string;
    companyName: string;
    companyType: string;
    createdTime: string;
    createdBy: string;
    cpfCnpj?: string;
}

interface AuthorizationListProps {
    authorizations: Authorization[];
}

export default function AuthorizationList({ authorizations }: AuthorizationListProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (authorizations.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">📄 Nenhuma autorização encontrada</p>
                <Link href="/nova-autorizacao" className="btn-primary">
                    Nova Autorização
                </Link>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPF/CNPJ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data de Criação
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {authorizations.map((auth) => {
                        const badge = getCompanyTypeBadge(auth.companyType);

                        return (
                            <tr key={auth.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-gray-900">
                                        {auth.companyName}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={badge.variant}>
                                        {badge.label}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {auth.cpfCnpj || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(auth.createdTime)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <Link
                                            href={`/autorizacao/${auth.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Ver Detalhes"
                                        >
                                            👁️
                                        </Link>
                                        <Link
                                            href={`/editar-empresa/${auth.id}`}
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Editar"
                                        >
                                            ✏️
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="mt-4 text-sm text-gray-600 text-center">
                Total: {authorizations.length} {authorizations.length === 1 ? 'autorização' : 'autorizações'}
            </div>
        </div>
    );
}
