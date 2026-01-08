'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Link from 'next/link';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Badge from '@/components/ui/Badge';

interface AuthorizationDetail {
    success: boolean;
    isOwner: boolean;
    isAdmin: boolean;
    hasAccess: boolean;
    company: any;
    properties: any[];
    canEdit: boolean;
    canDelete: boolean;
    message?: string;
}

export default function AutorizacaoDetalhesPage() {
    const params = useParams();
    const router = useRouter();
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<AuthorizationDetail | null>(null);

    const companyId = params.companyId as string;

    useEffect(() => {
        if (bitrix.isInitialized) {
            loadAuthorization();
        }
    }, [bitrix.isInitialized, companyId]);

    const loadAuthorization = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bitrix/authorization/${companyId}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro ao carregar autorização');
            }

            setData(result);
        } catch (err: any) {
            console.error('[Detalhes] Erro:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getCompanyTypeBadge = (type: string) => {
        const types: Record<string, { label: string; variant: any }> = {
            'CUSTOMER': { label: 'PF Solteiro', variant: 'info' },
            'PARTNER': { label: 'PF Casado', variant: 'success' },
            'SUPPLIER': { label: 'Sócios', variant: 'warning' },
            'COMPETITOR': { label: 'PJ', variant: 'default' }
        };
        return types[type] || { label: 'Outro', variant: 'default' };
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const formatCurrency = (value: any) => {
        if (!value) return '-';
        const num = parseFloat(value);
        if (isNaN(num)) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(num);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando detalhes..." />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="card">
                        <p className="text-red-600 mb-4">❌ {error || 'Erro desconhecido'}</p>
                        <Link href="/dashboard" className="btn-primary">
                            ← Voltar ao Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const typeBadge = getCompanyTypeBadge(data.company.COMPANY_TYPE);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            {/* Acesso Negado */}
            {!loading && data && !data.hasAccess && (
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="ml-3 flex-1">
                                <h3 className="text-lg font-medium text-yellow-800">
                                    Acesso Restrito
                                </h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <p>Você não tem permissão para visualizar os detalhes completos desta empresa.</p>
                                    <p className="mt-2">Apenas o responsável pela empresa ou administradores podem acessar essas informações.</p>
                                </div>

                                {/* Informações Básicas */}
                                <div className="mt-4 bg-white rounded-md p-4 border border-yellow-200">
                                    <h4 className="text-sm font-medium text-gray-900 mb-2">Informações Básicas</h4>
                                    <dl className="grid grid-cols-1 gap-2">
                                        <div>
                                            <dt className="text-xs text-gray-500">Nome</dt>
                                            <dd className="text-sm font-medium text-gray-900">{data.company.TITLE}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Tipo</dt>
                                            <dd className="text-sm">
                                                <Badge variant={getCompanyTypeBadge(data.company.COMPANY_TYPE).variant}>
                                                    {getCompanyTypeBadge(data.company.COMPANY_TYPE).label}
                                                </Badge>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <Link
                                        href="/dashboard"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        ← Voltar ao Dashboard
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Conteúdo Completo (Owner ou Admin) */}
            {!loading && data && data.hasAccess && (
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <Link href="/dashboard" className="text-beehouse-primary hover:underline">
                            ← Voltar ao Dashboard
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="card mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{data.company.TITLE}</h1>
                                <div className="flex items-center gap-3 mb-4">
                                    <Badge variant={typeBadge.variant}>{typeBadge.label}</Badge>
                                    {data.isOwner && (
                                        <Badge variant="success">Você é o responsável</Badge>
                                    )}
                                    {data.isAdmin && (
                                        <Badge variant="info">Administrador</Badge>
                                    )}
                                </div>
                            </div>
                            {data.canEdit && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => router.push(`/nova-autorizacao?companyId=${companyId}`)}
                                        className="btn-primary text-sm"
                                    >
                                        ➕ Nova Autorização
                                    </button>
                                    <button
                                        onClick={() => router.push(`/novo-imovel?companyId=${companyId}`)}
                                        className="btn-primary text-sm"
                                    >
                                        🏠 Novo Imóvel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Informações da Empresa */}
                    <div className="card mb-6">
                        <h2 className="text-xl font-bold mb-4">Informações da Empresa</h2>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <dt className="text-sm text-gray-500">Data de Criação</dt>
                                <dd className="text-base font-medium">{formatDate(data.company.DATE_CREATE)}</dd>
                            </div>
                            {data.company.PHONE && (
                                <div>
                                    <dt className="text-sm text-gray-500">Telefone</dt>
                                    <dd className="text-base font-medium">
                                        {Array.isArray(data.company.PHONE)
                                            ? (typeof data.company.PHONE[0] === 'object' ? data.company.PHONE[0]?.VALUE : data.company.PHONE[0])
                                            : data.company.PHONE}
                                    </dd>
                                </div>
                            )}
                            {data.company.EMAIL && (
                                <div>
                                    <dt className="text-sm text-gray-500">Email</dt>
                                    <dd className="text-base font-medium">
                                        {Array.isArray(data.company.EMAIL)
                                            ? (typeof data.company.EMAIL[0] === 'object' ? data.company.EMAIL[0]?.VALUE : data.company.EMAIL[0])
                                            : data.company.EMAIL}
                                    </dd>
                                </div>
                            )}
                            {data.company.UF_CRM_CPF_CNPJ && (
                                <div>
                                    <dt className="text-sm text-gray-500">CPF/CNPJ</dt>
                                    <dd className="text-base font-medium">{data.company.UF_CRM_CPF_CNPJ}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Imóveis Vinculados */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Imóveis Vinculados ({data.properties.length})</h2>
                        {data.properties.length > 0 ? (
                            <div className="space-y-3">
                                {data.properties.map((property: any) => (
                                    <div key={property.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-medium text-gray-900">{property.title || `Imóvel #${property.id}`}</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-sm">
                                                    {property.ufCrmPropertyAddress && (
                                                        <div>
                                                            <span className="text-gray-500">📍 Endereço:</span>
                                                            <p className="text-gray-800">{property.ufCrmPropertyAddress}</p>
                                                        </div>
                                                    )}
                                                    {property.ufCrmPropertyValue && (
                                                        <div>
                                                            <span className="text-gray-500">💰 Valor:</span>
                                                            <p className="text-gray-800">{formatCurrency(property.ufCrmPropertyValue)}</p>
                                                        </div>
                                                    )}
                                                    {property.ufCrmPropertyMatricula && (
                                                        <div>
                                                            <span className="text-gray-500">📄 Matrícula:</span>
                                                            <p className="text-gray-800">{property.ufCrmPropertyMatricula}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                <Badge variant={property.hasAuthorization ? 'success' : 'warning'}>
                                                    {property.hasAuthorization ? 'Com Autorização' : 'Sem Autorização'}
                                                </Badge>
                                                {data.canEdit && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => router.push(`/editar-imovel/${property.id}`)}
                                                            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
                                                        >
                                                            ✏️ Editar
                                                        </button>
                                                        {!property.hasAuthorization && (
                                                            <button
                                                                onClick={() => router.push(`/nova-autorizacao?propertyId=${property.id}&companyId=${companyId}`)}
                                                                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                                                            >
                                                                ➕ Autorização
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>Nenhum imóvel vinculado a esta empresa</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
}
