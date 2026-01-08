'use client';

import React, { useState, useEffect } from 'react';
import type { Company } from '@/types/company';
import type { Property } from '@/types/property';
import type { DashboardStats } from '@/types/dashboard';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import StatsCard from '@/components/ui/StatsCard';
import Dropdown from '@/components/ui/Dropdown';
import CompanySelectionModal from '@/components/modals/CompanySelectionModal';
import TabNavigation from '@/components/ui/TabNavigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { CardSkeleton } from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import CompanyList from '@/components/dashboard/CompanyList';
import PropertyList from '@/components/dashboard/PropertyList';
import AuthorizationList from '@/components/dashboard/AuthorizationList';

export default function DashboardPage() {
    const bitrix = useBitrix24();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('companies');
    const [stats, setStats] = useState({
        totalCompanies: 0,
        totalProperties: 0,
        totalAuthorizations: 0,
        pendingAuthorizations: 0,
        signedAuthorizations: 0,
        pendingSignatures: 0
    });
    const [companies, setCompanies] = useState<Company[]>([]);
    const [properties, setProperties] = useState<Property[]>([]);
    const [authorizations, setAuthorizations] = useState<any[]>([]); // Lista para aba de autorizações
    const [loading, setLoading] = useState(true);
    const [authorizationsLoading, setAuthorizationsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

    // Modal de seleção de empresa
    const [showCompanyModal, setShowCompanyModal] = useState(false);
    const [modalAction, setModalAction] = useState<'property' | 'authorization' | null>(null);

    // Filtros
    const [selectedCompany, setSelectedCompany] = useState<string>('all');
    const [selectedAuthStatus, setSelectedAuthStatus] = useState<string>('all');

    const CACHE_KEY = 'dashboard_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos

    // Carrega dados do cache ao iniciar
    useEffect(() => {
        console.log('[Dashboard] Bitrix state:', {
            isInitialized: bitrix.isInitialized,
            authId: bitrix.authId,
            domain: bitrix.domain
        });

        if (bitrix.isInitialized && bitrix.authId && bitrix.domain) {
            loadFromCacheOrFetch();
            loadUserInfo();
        }
    }, [bitrix.isInitialized, bitrix.authId, bitrix.domain]);

    // Carrega autorizações quando a aba "Autorizações" é ativada
    useEffect(() => {
        if (activeTab === 'authorizations' && authorizations.length === 0 && bitrix.isInitialized) {
            loadAuthorizations();
        }
    }, [activeTab, bitrix.isInitialized]);

    const loadFromCacheOrFetch = (forceRefresh = false) => {
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { data, timestamp } = JSON.parse(cached);
                    const now = Date.now();

                    // Verifica se o cache ainda é válido (menos de 5 minutos)
                    if (now - timestamp < CACHE_DURATION) {
                        console.log('[Dashboard] Carregando do cache localStorage');
                        setStats(data.stats);
                        setCompanies(data.companies);
                        setProperties(data.properties);
                        setLoading(false);
                        return;
                    }

                    console.log('[Dashboard] Cache expirado, recarregando...');
                }
            } catch (err) {
                console.error('[Dashboard] Erro ao ler cache:', err);
            }
        }

        // Se não tem cache ou expirou, ou se é refresh forçado, carrega da API
        loadDashboardData();
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[Dashboard] Loading data from API...');

            let fetchedStats = stats;
            let fetchedCompanies = companies;
            let fetchedProperties = properties;

            // Carrega estatísticas
            console.log('[Dashboard] Fetching stats...');
            const statsResponse = await fetch(
                `/api/bitrix/stats?accessToken=${bitrix.authId}&domain=${bitrix.domain}`
            );
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                console.log('[Dashboard] Stats loaded:', statsData);
                setStats(statsData.stats);
                fetchedStats = statsData.stats;
            } else {
                console.error('[Dashboard] Stats error:', await statsResponse.text());
            }

            // Carrega empresas
            console.log('[Dashboard] Fetching companies...');
            const companiesResponse = await fetch(
                `/api/bitrix/companies?accessToken=${bitrix.authId}&domain=${bitrix.domain}`
            );
            if (companiesResponse.ok) {
                const companiesData = await companiesResponse.json();
                console.log('[Dashboard] Companies loaded:', companiesData);
                setCompanies(companiesData.companies || []);
                fetchedCompanies = companiesData.companies || [];
            } else {
                console.error('[Dashboard] Companies error:', await companiesResponse.text());
            }

            // Carrega imóveis
            console.log('[Dashboard] Fetching properties...');
            const propertiesResponse = await fetch(
                `/api/bitrix/properties?accessToken=${bitrix.authId}&domain=${bitrix.domain}`
            );
            if (propertiesResponse.ok) {
                const propertiesData = await propertiesResponse.json();
                console.log('[Dashboard] Properties loaded:', propertiesData);
                setProperties(propertiesData.properties || []);
                fetchedProperties = propertiesData.properties || [];
            } else {
                console.error('[Dashboard] Properties error:', await propertiesResponse.text());
            }

            // Salva no localStorage com timestamp
            try {
                const cacheData = {
                    data: {
                        stats: fetchedStats,
                        companies: fetchedCompanies,
                        properties: fetchedProperties
                    },
                    timestamp: Date.now()
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
                console.log('[Dashboard] Dados salvos no cache localStorage');
            } catch (err) {
                console.error('[Dashboard] Erro ao salvar cache:', err);
            }

        } catch (err: any) {
            console.error('[Dashboard] Error loading dashboard:', err);
            setError('Erro ao carregar dados do dashboard');
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    // Carrega autorizações para a aba
    const loadAuthorizations = async () => {
        if (!bitrix.isInitialized) return;

        try {
            setAuthorizationsLoading(true);
            const response = await fetch(`/api/bitrix/all-authorizations?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setAuthorizations(data.authorizations || []);
                }
            } else {
                toast.error('Erro ao carregar autorizações');
            }
        } catch (err) {
            console.error('[Dashboard] Erro ao carregar autorizações:', err);
            toast.error('Erro ao carregar autorizações');
        } finally {
            setAuthorizationsLoading(false);
        }
    };

    // Carrega informações do usuário atual (ID e se é admin)
    const loadUserInfo = async () => {
        try {
            const response = await fetch(`/api/bitrix/user-info?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setCurrentUserId(data.user.id);
                    setIsAdmin(data.isAdmin || false);
                    console.log('[Dashboard] User info loaded:', { id: data.user.id, isAdmin: data.isAdmin });
                }
            }
        } catch (err) {
            console.error('[Dashboard] Erro ao carregar info do usuário:', err);
        }
    };

    // Handlers para o dropdown "+ Novo"
    const handleNovaEmpresa = () => {
        router.push('/nova-empresa');
    };

    const handleNovoImovel = () => {
        setModalAction('property');
        setShowCompanyModal(true);
    };

    const handleNovaAutorizacao = () => {
        setModalAction('authorization');
        setShowCompanyModal(true);
    };

    const handleCompanySelected = (companyId: string) => {
        setShowCompanyModal(false);
        if (modalAction === 'property') {
            router.push(`/novo-imovel?companyId=${companyId}`);
        } else if (modalAction === 'authorization') {
            router.push(`/nova-autorizacao?companyId=${companyId}`);
        }
    };

    const handleCreateNewCompany = () => {
        setShowCompanyModal(false);
        if (modalAction === 'property') {
            router.push('/nova-empresa?redirect=novo-imovel');
        } else if (modalAction === 'authorization') {
            router.push('/nova-empresa?redirect=nova-autorizacao');
        }
    };

    const handleCreateProperty = (companyId: string) => {
        router.push(`/novo-imovel?companyId=${companyId}`);
    };

    const handleCreateAuthorization = (companyId: string) => {
        router.push(`/nova-autorizacao?companyId=${companyId}`);
    };

    const handleCreateAuthorizationForProperty = (propertyId: string) => {
        const property = properties.find(p => p.id === propertyId);
        if (property && property.companyId) {
            router.push(`/nova-autorizacao?propertyId=${propertyId}&companyId=${property.companyId}`);
        } else {
            alert('Erro: Imóvel não possui empresa vinculada');
        }
    };

    // Filtra e ordena imóveis
    const filteredAndSortedProperties = React.useMemo(() => {
        let filtered = [...properties];

        // Filtro por empresa
        if (selectedCompany !== 'all') {
            filtered = filtered.filter(p => p.companyId === selectedCompany);
        }

        // Filtro por status de autorização
        if (selectedAuthStatus === 'with') {
            filtered = filtered.filter(p => p.hasAuthorization);
        } else if (selectedAuthStatus === 'without') {
            filtered = filtered.filter(p => !p.hasAuthorization);
        }

        // Ordena: sem assinatura primeiro, depois com assinatura
        filtered.sort((a, b) => {
            const aHasSigned = a.hasSigned || false;
            const bHasSigned = b.hasSigned || false;

            if (aHasSigned === bHasSigned) return 0;
            return aHasSigned ? 1 : -1; // Sem assinatura (false) vem primeiro
        });

        return filtered;
    }, [properties, selectedCompany, selectedAuthStatus]);

    // Filtra empresas
    const filteredCompanies = React.useMemo(() => {
        if (selectedCompany === 'all') return companies;
        return companies.filter(c => c.ID === selectedCompany);
    }, [companies, selectedCompany]);

    if (!bitrix.isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Conectando ao Bitrix24..." />
            </div>
        );
    }

    const tabs = [
        { id: 'companies', label: 'Empresas', count: companies.length },
        { id: 'properties', label: 'Imóveis', count: properties.length },
        { id: 'authorizations', label: 'Autorizações', count: stats.totalAuthorizations }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Gerencie empresas, imóveis e autorizações
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Limpa o cache do localStorage
                                    localStorage.removeItem(CACHE_KEY);
                                    console.log('[Dashboard] Cache limpo, recarregando...');
                                    loadFromCacheOrFetch(true);
                                }}
                                className="btn-secondary flex items-center gap-2"
                                disabled={loading}
                            >
                                🔄 {loading ? 'Atualizando...' : 'Atualizar'}
                            </button>
                            <Dropdown
                                trigger={
                                    <button className="btn-primary flex items-center gap-2">
                                        ➕ Novo
                                    </button>
                                }
                                options={[
                                    {
                                        label: 'Nova Empresa',
                                        icon: '🏢',
                                        onClick: handleNovaEmpresa
                                    },
                                    {
                                        label: 'Novo Imóvel',
                                        icon: '🏠',
                                        onClick: handleNovoImovel
                                    },
                                    {
                                        label: 'Nova Autorização',
                                        icon: '📄',
                                        onClick: handleNovaAutorizacao
                                    }
                                ]}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        title="Total de Empresas"
                        value={stats.totalCompanies}
                        icon="🏢"
                        color="blue"
                    />
                    <StatsCard
                        title="Total de Imóveis"
                        value={stats.totalProperties}
                        icon="🏠"
                        color="green"
                    />
                    <StatsCard
                        title="Autorizações"
                        value={stats.totalAuthorizations}
                        icon="📄"
                        color="purple"
                    />
                    <StatsCard
                        title="Pendentes"
                        value={stats.pendingAuthorizations}
                        icon="⏳"
                        color="red"
                        subtitle="Sem autorização"
                    />
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Filtrar por Empresa
                            </label>
                            <select
                                value={selectedCompany}
                                onChange={(e) => setSelectedCompany(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todas as empresas</option>
                                {companies.map((company) => (
                                    <option key={company.ID} value={company.ID}>
                                        {company.TITLE}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status de Autorização
                            </label>
                            <select
                                value={selectedAuthStatus}
                                onChange={(e) => setSelectedAuthStatus(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">Todos</option>
                                <option value="with">Com Autorização</option>
                                <option value="without">Sem Autorização</option>
                            </select>
                        </div>

                        {(selectedCompany !== 'all' || selectedAuthStatus !== 'all') && (
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedCompany('all');
                                        setSelectedAuthStatus('all');
                                    }}
                                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Limpar Filtros
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Contador de resultados */}
                    {activeTab === 'properties' && (
                        <div className="mt-3 text-sm text-gray-600">
                            Mostrando {filteredAndSortedProperties.length} de {properties.length} imóveis
                        </div>
                    )}
                    {activeTab === 'companies' && (
                        <div className="mt-3 text-sm text-gray-600">
                            Mostrando {filteredCompanies.length} de {companies.length} empresas
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-6 pt-6">
                        <TabNavigation
                            tabs={tabs}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {loading ? (
                            <LoadingSpinner text="Carregando dados..." />
                        ) : error ? (
                            <div className="text-center py-12">
                                <p className="text-red-600">{error}</p>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        localStorage.removeItem(CACHE_KEY);
                                        loadFromCacheOrFetch(true);
                                    }}
                                    className="mt-4 btn-secondary"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'companies' && (
                                    companies.length > 0 ? (
                                        <CompanyList
                                            companies={companies}
                                            onCreateProperty={handleCreateProperty}
                                            onCreateAuthorization={handleCreateAuthorization}
                                            isAdmin={isAdmin}
                                            currentUserId={currentUserId}
                                        />
                                    ) : (
                                        <EmptyState
                                            icon="🏢"
                                            title="Nenhuma empresa cadastrada"
                                            description="Crie sua primeira autorização para começar"
                                            action={{
                                                label: 'Nova Autorização',
                                                onClick: () => router.push('/nova-autorizacao')
                                            }}
                                        />
                                    )
                                )}

                                {activeTab === 'properties' && (
                                    properties.length > 0 ? (
                                        <PropertyList
                                            properties={properties}
                                            onCreateAuthorization={handleCreateAuthorizationForProperty}
                                            isAdmin={isAdmin}
                                            onPropertyUpdate={() => {
                                                localStorage.removeItem(CACHE_KEY);
                                                loadFromCacheOrFetch(true);
                                            }}
                                        />
                                    ) : (
                                        <EmptyState
                                            icon="🏠"
                                            title="Nenhum imóvel cadastrado"
                                            description="Os imóveis são criados automaticamente ao gerar autorizações"
                                            action={{
                                                label: 'Nova Autorização',
                                                onClick: () => router.push('/nova-autorizacao')
                                            }}
                                        />
                                    )
                                )}

                                {activeTab === 'authorizations' && (
                                    authorizationsLoading ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <CardSkeleton />
                                            <CardSkeleton />
                                            <CardSkeleton />
                                            <CardSkeleton />
                                        </div>
                                    ) : authorizations.length > 0 ? (
                                        <AuthorizationList authorizations={authorizations} />
                                    ) : (
                                        <div className="text-center py-12">
                                            <p className="text-gray-600 mb-4">📄 Nenhuma autorização encontrada</p>
                                            <Link href="/nova-autorizacao" className="btn-primary">
                                                Nova Autorização
                                            </Link>
                                        </div>
                                    )
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Seleção de Empresa */}
            <CompanySelectionModal
                isOpen={showCompanyModal}
                onClose={() => setShowCompanyModal(false)}
                onSelectExisting={handleCompanySelected}
                onCreateNew={handleCreateNewCompany}
            />
        </div>
    );
}
