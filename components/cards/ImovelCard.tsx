'use client';

interface Imovel {
    id: number;
    descricao: string;
    endereco: string;
    valor: number;
    matricula?: string;
    admin_condominio?: string;
    valor_condominio?: number;
    chamada_capital?: string;
    num_parcelas?: number;
}

interface ImovelCardProps {
    imovel: Imovel;
    showDetails?: boolean;
}

export default function ImovelCard({ imovel, showDetails = false }: ImovelCardProps) {
    return (
        <div className="card border-l-4 border-green-500 bg-gradient-to-r from-green-50 to-white">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">
                        {imovel.descricao}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {imovel.endereco}
                        </p>

                        <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-green-700 text-base">
                                R$ {imovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                        </p>

                        {imovel.matricula && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="font-medium">Matrícula:</span> {imovel.matricula}
                            </p>
                        )}
                    </div>

                    {showDetails && (imovel.admin_condominio || imovel.valor_condominio || imovel.chamada_capital) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                            {imovel.admin_condominio && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Administradora:</span> {imovel.admin_condominio}
                                </p>
                            )}

                            {imovel.valor_condominio && imovel.valor_condominio > 0 && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Valor do Condomínio:</span> R$ {imovel.valor_condominio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                            )}

                            {imovel.chamada_capital && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Chamada de Capital:</span> {imovel.chamada_capital}
                                    {imovel.num_parcelas && ` em ${imovel.num_parcelas} parcelas`}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
