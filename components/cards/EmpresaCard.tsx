'use client';

interface Empresa {
    id: number;
    tipo: 'PF' | 'PJ';
    nome?: string;
    razao_social?: string;
    cpf?: string;
    cnpj?: string;
    email?: string;
    telefone?: string;
    endereco?: string;
    endereco_sede?: string;
    estado_civil?: string;
    regime_casamento?: string;
    rep_legal_nome?: string;
    rep_legal_cargo?: string;
    conjuge_nome?: string;
}

interface EmpresaCardProps {
    empresa: Empresa;
    showDetails?: boolean;
}

export default function EmpresaCard({ empresa, showDetails = false }: EmpresaCardProps) {
    const displayName = empresa.tipo === 'PJ' ? empresa.razao_social : empresa.nome;
    const doc = empresa.tipo === 'PJ' ? empresa.cnpj : empresa.cpf;
    const address = empresa.tipo === 'PJ' ? empresa.endereco_sede : empresa.endereco;

    return (
        <div className="card border-l-4 border-blue-500 bg-gradient-to-r from-blue-50 to-white">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${empresa.tipo === 'PJ'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                            {empresa.tipo}
                        </span>
                        <h3 className="font-semibold text-gray-900 text-lg">
                            {displayName}
                        </h3>
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <span className="font-medium">{empresa.tipo === 'PJ' ? 'CNPJ' : 'CPF'}:</span>
                            <span>{doc}</span>
                        </p>

                        {empresa.email && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                {empresa.email}
                            </p>
                        )}

                        {empresa.telefone && (
                            <p className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {empresa.telefone}
                            </p>
                        )}
                    </div>

                    {showDetails && (
                        <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 text-sm">
                            {empresa.tipo === 'PF' && (
                                <>
                                    {empresa.estado_civil && (
                                        <p className="text-gray-600">
                                            <span className="font-medium">Estado Civil:</span> {empresa.estado_civil}
                                            {empresa.regime_casamento && ` - ${empresa.regime_casamento}`}
                                        </p>
                                    )}
                                    {empresa.conjuge_nome && (
                                        <p className="text-gray-600">
                                            <span className="font-medium">Cônjuge:</span> {empresa.conjuge_nome}
                                        </p>
                                    )}
                                </>
                            )}

                            {empresa.tipo === 'PJ' && empresa.rep_legal_nome && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Representante Legal:</span> {empresa.rep_legal_nome}
                                    {empresa.rep_legal_cargo && ` - ${empresa.rep_legal_cargo}`}
                                </p>
                            )}

                            {address && (
                                <p className="text-gray-600">
                                    <span className="font-medium">Endereço:</span> {address}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
