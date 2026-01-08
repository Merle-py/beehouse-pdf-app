'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import type { Property } from '@/types/property';

interface PropertyListProps {
    properties: Property[];
    onCreateAuthorization: (propertyId: string) => void;
    isAdmin?: boolean;
    onPropertyUpdate?: () => void;
    currentUserId?: string;  // ID do usuário atual
}

export default function PropertyList({ properties, onCreateAuthorization, isAdmin = false, onPropertyUpdate, currentUserId }: PropertyListProps) {
    const bitrix = useBitrix24();
    const [updatingProperty, setUpdatingProperty] = useState<string | null>(null);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const handleToggleManualAuth = async (propertyId: string, currentValue: any) => {
        const newValue = !(currentValue === 'Y' || currentValue === true);

        try {
            setUpdatingProperty(propertyId);

            const response = await fetch(
                `/api/bitrix/properties/${propertyId}/manual-auth?accessToken=${bitrix.authId}&domain=${bitrix.domain}`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ hasAuthorization: newValue })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro ao atualizar autorização');
            }

            console.log('[PropertyList] Autorização manual atualizada:', result);

            // Atualiza a lista de imóveis
            if (onPropertyUpdate) {
                onPropertyUpdate();
            }

        } catch (err: any) {
            console.error('[PropertyList] Erro ao atualizar:', err);
            alert(`Erro: ${err.message}`);
        } finally {
            setUpdatingProperty(null);
        }
    };

    const getAuthorizationStatus = (property: any) => {
        // Verifica usando o ID exato do campo que o Bitrix24 retorna
        const fieldValue = (property as any).ufCrm15_1767879091919 || property.ufCrmPropertyHasAuthorization;

        const hasManualAuth = fieldValue === 'Y' ||
            fieldValue === true ||
            fieldValue === '1' ||
            fieldValue === 1;

        return property.hasAuthorization || hasManualAuth;
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
                        {isAdmin && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Autorização Geral
                            </th>
                        )}
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">
                                            {property.title}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {property.description || property.ufCrmPropertyDescription || '-'}
                                        </div>
                                    </div>
                                    {currentUserId && property.assignedById === currentUserId && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Minha
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                                {property.address || property.ufCrmPropertyAddress || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                {property.value ? formatCurrency(property.value) :
                                    property.ufCrmPropertyValue ? formatCurrency(parseFloat(property.ufCrmPropertyValue)) : '-'}
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
                                <Badge variant={getAuthorizationStatus(property) ? 'success' : 'warning'}>
                                    {getAuthorizationStatus(property) ? 'Com Autorização' : 'Sem Autorização'}
                                </Badge>
                            </td>
                            {isAdmin && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={property.ufCrmPropertyHasAuthorization === 'Y' || property.ufCrmPropertyHasAuthorization === true}
                                            onChange={() => handleToggleManualAuth(property.id, property.ufCrmPropertyHasAuthorization)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-gray-600">Marcar</span>
                                    </label>
                                </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end gap-2">
                                    {!getAuthorizationStatus(property) && (
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
