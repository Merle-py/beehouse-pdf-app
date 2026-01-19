import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import EmpresasList from '@/components/lists/EmpresasList';

export default async function EmpresasPage() {
    // Buscar dados no servidor
    const supabase = createClient();

    const { data: empresas } = await supabase
        .from('empresas')
        .select('*')
        .order('created_at', { ascending: false });

    const stats = {
        total: empresas?.length || 0,
        pf: empresas?.filter(e => e.tipo === 'PF').length || 0,
        pj: empresas?.filter(e => e.tipo === 'PJ').length || 0,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Empresas</h1>
                        <p className="text-gray-600 mt-2">Gerencie suas empresas cadastradas</p>
                    </div>
                    <Link
                        href="/nova-empresa"
                        prefetch={false}
                        className="btn-primary flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nova Empresa
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-sm opacity-90">Total de Empresas</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                        <p className="text-sm opacity-90">Pessoas Jurídicas</p>
                        <p className="text-3xl font-bold mt-1">{stats.pj}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-sm opacity-90">Pessoas Físicas</p>
                        <p className="text-3xl font-bold mt-1">{stats.pf}</p>
                    </div>
                </div>

                {/* Lista com filtros (Client Component) */}
                <div className="card">
                    <EmpresasList initialEmpresas={empresas || []} />
                </div>
            </div>
        </div>
    );
}
