'use client';

import { useState, useEffect } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';

interface Company {
    id: string;
    title: string;
    type: string;
}

interface CompanySelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectExisting: (companyId: string) => void;
    onCreateNew: () => void;
}

export default function CompanySelectionModal({
    isOpen,
    onClose,
    onSelectExisting,
    onCreateNew
}: CompanySelectionModalProps) {
    const bitrix = useBitrix24();
    const [step, setStep] = useState<'question' | 'select'>('question');
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (step === 'select') {
            loadCompanies();
        }
    }, [step]);

    const loadCompanies = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/bitrix/companies?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const data = await response.json();

            if (data.success) {
                setCompanies(data.companies);
            }
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
                {step === 'question' ? (
                    // Pergunta inicial
                    <div className="p-8">
                        <h2 className="text-2xl font-bold mb-4">Empresa já cadastrada?</h2>
                        <p className="text-gray-600 mb-6">
                            A empresa para este cadastro já existe no sistema?
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep('select')}
                                className="flex-1 btn-primary"
                            >
                                ✓ Sim, selecionar empresa
                            </button>
                            <button
                                onClick={onCreateNew}
                                className="flex-1 btn-secondary"
                            >
                                ➕ Não, criar nova empresa
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="mt-4 text-gray-500 hover:text-gray-700 w-full"
                        >
                            Cancelar
                        </button>
                    </div>
                ) : (
                    // Lista de empresas
                    <div className="p-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Selecionar Empresa</h2>
                            <button
                                onClick={() => setStep('question')}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                ← Voltar
                            </button>
                        </div>

                        {/* Busca */}
                        <input
                            type="text"
                            placeholder="Buscar empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-4"
                        />

                        {/* Lista */}
                        <div className="max-h-96 overflow-y-auto space-y-2">
                            {loading ? (
                                <p className="text-center py-8 text-gray-500">Carregando empresas...</p>
                            ) : filteredCompanies.length === 0 ? (
                                <p className="text-center py-8 text-gray-500">Nenhuma empresa encontrada</p>
                            ) : (
                                filteredCompanies.map((company) => (
                                    <button
                                        key={company.id}
                                        onClick={() => onSelectExisting(company.id)}
                                        className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                                    >
                                        <div className="font-semibold text-gray-900">{company.title}</div>
                                        <div className="text-sm text-gray-500">{company.type}</div>
                                    </button>
                                ))
                            )}
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-4 text-gray-500 hover:text-gray-700 w-full"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
