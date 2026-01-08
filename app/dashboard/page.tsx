'use client';

import { useState, useEffect } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import StatsCard from '@/components/ui/StatsCard';
import TabNavigation from '@/components/ui/TabNavigation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import CompanyList from '@/components/dashboard/CompanyList';
import PropertyList from '@/components/dashboard/PropertyList';

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
    const [companies, setCompanies] = useState<any[]>([]);
    const [properties, setProperties] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

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
        }
    }, [bitrix.isInitialized, bitrix.authId, bitrix.domain]);

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
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProperty = (companyId: string) => {
        // TODO: Implementar criação de imóvel
        console.log('Criar imóvel para empresa:', companyId);
        alert('Funcionalidade em desenvolvimento: Criar Imóvel');
    };

    const handleCreateAuthorization = (companyId: string) => {
        router.push(`/nova-autorizacao?companyId=${companyId}`);
    };

    const handleCreateAuthorizationForProperty = (propertyId: string) => {
        // TODO: Implementar criação de autorização para imóvel
        console.log('Criar autorização para imóvel:', propertyId);
        alert('Funcionalidade em desenvolvimento: Criar Autorização para Imóvel');
    };

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
                            <Link href="/nova-autorizacao" className="btn-primary">
                                + Nova Autorização
                            </Link>
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
                        color="yellow"
                        subtitle="Sem autorização"
                    />
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
                                    <div className="text-center py-12">
                                        <p className="text-gray-600 mb-4">
                                            Lista de autorizações em desenvolvimento
                                        </p>
                                        <Link href="/nova-autorizacao" className="btn-primary">
                                            Nova Autorização
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
