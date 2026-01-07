'use client';

import React from 'react';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

interface Company {
    ID: string;
    TITLE: string;
    COMPANY_TYPE: string;
    UF_CRM_CPF_CNPJ?: string;
    EMAIL?: Array<{ VALUE: string }> | string;
    PHONE?: Array<{ VALUE: string }> | string;
    propertyCount?: number;
    createdTime?: string;
}

interface CompanyListProps {
    companies: Company[];
    onCreateProperty: (companyId: string) => void;
    onCreateAuthorization: (companyId: string) => void;
}

export default function CompanyList({ companies, onCreateProperty, onCreateAuthorization }: CompanyListProps) {
    const getCompanyTypeBadge = (type: string) => {
        const types: Record<string, { label: string; variant: any }> = {
            'CUSTOMER': { label: 'PF Solteiro', variant: 'info' },
            'PARTNER': { label: 'PF Casado', variant: 'success' },
            'SUPPLIER': { label: 'Sócios', variant: 'warning' },
            'COMPETITOR': { label: 'PJ', variant: 'default' }
        };
        return types[type] || { label: type, variant: 'default' };
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Nome/Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPF/CNPJ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contato
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Imóveis
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {companies.map((company) => {
                        const typeBadge = getCompanyTypeBadge(company.COMPANY_TYPE);
                        return (
                            <tr key={company.ID} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {company.TITLE}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <Badge variant={typeBadge.variant}>
                                        {typeBadge.label}
                                    </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {company.UF_CRM_CPF_CNPJ || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {Array.isArray(company.EMAIL) && company.EMAIL.length > 0
                                            ? (typeof company.EMAIL[0] === 'object' && 'VALUE' in company.EMAIL[0]
                                                ? company.EMAIL[0].VALUE
                                                : company.EMAIL[0])
                                            : (typeof company.EMAIL === 'string' ? company.EMAIL : '-')}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        {Array.isArray(company.PHONE) && company.PHONE.length > 0
                                            ? (typeof company.PHONE[0] === 'object' && 'VALUE' in company.PHONE[0]
                                                ? company.PHONE[0].VALUE
                                                : company.PHONE[0])
                                            : (typeof company.PHONE === 'string' ? company.PHONE : '-')}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-sm font-semibold text-gray-900">
                                        {company.propertyCount || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => onCreateProperty(company.ID)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Criar Imóvel"
                                        >
                                            🏠
                                        </button>
                                        <button
                                            onClick={() => onCreateAuthorization(company.ID)}
                                            className="text-green-600 hover:text-green-900"
                                            title="Criar Autorização"
                                        >
                                            ➕
                                        </button>
                                        <Link
                                            href={`/autorizacao/${company.ID}`}
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Ver Detalhes"
                                        >
                                            👁️
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
