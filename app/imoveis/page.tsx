import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import ImoveisList from '@/components/lists/ImoveisList';

export default async function ImoveisPage() {
    // Buscar dados no servidor
    const supabase = createClient();

    const { data: imoveis } = await supabase
        .from('imoveis')
        .select(`
      *,
      empresa:empresas(
        id,
        nome,
        razao_social
      )
    `)
        .order('created_at', { ascending: false });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Imóveis</h1>
                        <p className="text-gray-600 mt-2">Gerencie seus imóveis cadastrados</p>
                    </div>
                    <Link
                        href="/novo-imovel"
                        prefetch={false}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Novo Imóvel
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-sm opacity-90">Total de Imóveis</p>
                        <p className="text-3xl font-bold mt-1">{imoveis?.length || 0}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-sm opacity-90">Valor Total</p>
                        <p className="text-2xl font-bold mt-1">
                            {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                                minimumFractionDigits: 0,
                            }).format(
                                imoveis?.reduce((sum, i) => sum + Number(i.valor || 0), 0) || 0
                            )}
                        </p>
                    </div>
                </div>

                {/* Lista com filtros (Client Component) */}
                <div className="card">
                    <ImoveisList initialImoveis={imoveis || []} />
                </div>
            </div>
        </div>
    );
}
