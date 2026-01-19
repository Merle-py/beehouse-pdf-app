import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import AutorizacoesList from '@/components/lists/AutorizacoesList';

export default async function MinhasAutorizacoesPage() {
    // Buscar dados no servidor
    const supabase = createClient();

    const { data: autorizacoes } = await supabase
        .from('autorizacoes_vendas')
        .select(`
      *,
      imovel:imoveis(
        id,
        descricao,
        endereco,
        valor,
        empresa:empresas(
          id,
          nome,
          razao_social
        )
      )
    `)
        .order('created_at', { ascending: false });

    // Estatísticas
    const stats = {
        total: autorizacoes?.length || 0,
        rascunho: autorizacoes?.filter(a => a.status === 'rascunho').length || 0,
        aguardando: autorizacoes?.filter(a => a.status === 'aguardando_assinatura').length || 0,
        assinado: autorizacoes?.filter(a => a.status === 'assinado').length || 0,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Minhas Autorizações</h1>
                        <p className="text-gray-600 mt-2">Gerencie suas autorizações de venda</p>
                    </div>
                    <Link
                        href="/nova-autorizacao"
                        prefetch={false}
                        className="btn-primary inline-flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Nova Autorização
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <p className="text-sm opacity-90">Total</p>
                        <p className="text-3xl font-bold mt-1">{stats.total}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-gray-500 to-gray-600 text-white">
                        <p className="text-sm opacity-90">Rascunhos</p>
                        <p className="text-3xl font-bold mt-1">{stats.rascunho}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
                        <p className="text-sm opacity-90">Aguardando</p>
                        <p className="text-3xl font-bold mt-1">{stats.aguardando}</p>
                    </div>
                    <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                        <p className="text-sm opacity-90">Assinados</p>
                        <p className="text-3xl font-bold mt-1">{stats.assinado}</p>
                    </div>
                </div>

                {/* Lista com filtros (Client Component) */}
                <div className="card">
                    <AutorizacoesList initialAutorizacoes={autorizacoes || []} />
                </div>
            </div>
        </div>
    );
}
