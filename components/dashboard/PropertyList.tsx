'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface Property {
    id: string;
    title: string;
    description: string;
    address: string;
    value: number;
    companyId: string;
    companyName: string;
    hasAuthorization: boolean;
}

interface PropertyListProps {
    properties: Property[];
    onCreateAuthorization: (propertyId: string) => void;
}

export default function PropertyList({ properties, onCreateAuthorization }: PropertyListProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Imóvel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endereço
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                    {property.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                    {property.description}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {property.address}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {formatCurrency(property.value)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Link
                                    href={`/autorizacao/${property.companyId}`}
                                    className="text-sm text-blue-600 hover:text-blue-900"
                                >
                                    {property.companyName}
                                </Link>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant={property.hasAuthorization ? 'success' : 'warning'}>
                                    {property.hasAuthorization ? 'Com Autorização' : 'Sem Autorização'}
                                </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    {!property.hasAuthorization && (
                                        <button
                                            onClick={() => onCreateAuthorization(property.id)}
                                            className="text-green-600 hover:text-green-900"
                                            title="Criar Autorização"
                                        >
                                            ➕
                                        </button>
                                    )}
                                    <Link
                                        href={`/autorizacao/${property.companyId}`}
                                        className="text-gray-600 hover:text-gray-900"
                                        title="Ver Empresa"
                                    >
                                        🔗
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
