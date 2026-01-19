'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Stats {
    totalEmpresas: number;
    totalImoveis: number;
    totalAutorizacoes: number;
    autorizacoesRascunho: number;
    autorizacoesAssinadas: number;
    empresasPF: number;
    empresasPJ: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats>({
        totalEmpresas: 0,
        totalImoveis: 0,
        totalAutorizacoes: 0,
        autorizacoesRascunho: 0,
        autorizacoesAssinadas: 0,
        empresasPF: 0,
        empresasPJ: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentAutorizacoes, setRecentAutorizacoes] = useState<any[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [empresasRes, imoveisRes, autorizacoesRes] = await Promise.all([
                fetch('/api/empresas'),
                fetch('/api/imoveis'),
                fetch('/api/autorizacoes'),
            ]);

            let empresasData: any[] = [];
            let imoveisData: any[] = [];
            let autorizacoesData: any[] = [];

            if (empresasRes.ok) {
                const data = await empresasRes.json();
                empresasData = data.empresas || [];
            }

            if (imoveisRes.ok) {
                const data = await imoveisRes.json();
                imoveisData = data.imoveis || [];
            }

            if (autorizacoesRes.ok) {
                const data = await autorizacoesRes.json();
                autorizacoesData = data.autorizacoes || [];
            }

            // Calculate stats
            const newStats: Stats = {
                totalEmpresas: empresasData.length,
                totalImoveis: imoveisData.length,
                totalAutorizacoes: autorizacoesData.length,
                autorizacoesRascunho: autorizacoesData.filter((a: any) => a.status === 'rascunho').length,
                autorizacoesAssinadas: autorizacoesData.filter((a: any) => a.status === 'assinado').length,
                empresasPF: empresasData.filter((e: any) => e.tipo === 'PF').length,
                empresasPJ: empresasData.filter((e: any) => e.tipo === 'PJ').length,
            };

            setStats(newStats);

            // Get recent autorizacoes (last 5)
            const recent = autorizacoesData
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 5);
            setRecentAutorizacoes(recent);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Erro ao carregar dados do dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            rascunho: 'bg-gray-100 text-gray-800',
            aguardando_assinatura: 'bg-yellow-100 text-yellow-800',
            assinado: 'bg-green-100 text-green-800',
            cancelado: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="card animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
                                <div className="h-12 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-2">Visão geral do sistema</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Link href="/empresas" prefetch={false} className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">Empresas</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalEmpresas}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    {stats.empresasPF} PF • {stats.empresasPJ} PJ
                                </p>
                            </div>
                            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                    </Link>

                    <Link href="/imoveis" prefetch={false} className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">Imóveis</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalImoveis}</p>
                            </div>
                            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                    </Link>

                    <Link href="/minhas-autorizacoes" prefetch={false} className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">Autorizações</p>
                                <p className="text-3xl font-bold mt-1">{stats.totalAutorizacoes}</p>
                                <p className="text-xs opacity-75 mt-2">
                                    {stats.autorizacoesAssinadas} assinadas
                                </p>
                            </div>
                            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </Link>

                    <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-90">Rascunhos</p>
                                <p className="text-3xl font-bold mt-1">{stats.autorizacoesRascunho}</p>
                            </div>
                            <svg className="w-12 h-12 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Link href="/nova-empresa" prefetch={false} className="card hover:shadow-lg transition-all hover:scale-105">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Nova Empresa</h3>
                                <p className="text-sm text-gray-600">Cadastrar PF ou PJ</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/novo-imovel" prefetch={false} className="card hover:shadow-lg transition-all hover:scale-105">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Novo Imóvel</h3>
                                <p className="text-sm text-gray-600">Adicionar propriedade</p>
                            </div>
                        </div>
                    </Link>

                    <Link href="/nova-autorizacao" prefetch={false} className="card hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Nova Autorização</h3>
                                <p className="text-sm text-gray-600">Criar autorização de venda</p>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Recent Autorizações */}
                {recentAutorizacoes.length > 0 && (
                    <div className="card">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Autorizações Recentes</h2>
                        <div className="space-y-3">
                            {recentAutorizacoes.map((auth) => (
                                <Link
                                    key={auth.id}
                                    href={`/minhas-autorizacoes`}
                                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {auth.imovel_descricao || 'Imóvel'}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {auth.empresa_nome || auth.empresa_razao_social || 'Empresa'}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Comissão: {auth.comissao_percentual}% •
                                                Prazo: {auth.prazo_exclusividade || 0} dias
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(auth.status)}`}>
                                            {auth.status}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <Link
                            href="/minhas-autorizacoes"
                            className="block mt-4 text-center text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                            Ver todas →
                        </Link>
                    </div>
                )}

                {/* Empty State */}
                {stats.totalEmpresas === 0 && (
                    <div className="card text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Bem-vindo ao Beehouse!
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Comece criando sua primeira autorização de venda. O sistema irá guiá-lo através de um processo simples em 3 etapas.
                        </p>
                        <Link href="/nova-autorizacao" prefetch={false} className="btn-primary inline-flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Criar Primeira Autorização
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
