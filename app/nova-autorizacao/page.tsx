'use client';

import { useState } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NovaAutorizacaoPage() {
    const bitrix = useBitrix24();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state (exemplo simplificado)
    const [authType, setAuthType] = useState<'pf-solteiro' | 'pf-casado' | 'socios' | 'pj'>('pf-solteiro');
    const [contratante, setContratante] = useState({
        nome: '',
        cpf: '',
        email: '',
        profissao: '',
        endereco: ''
    });

    const [contrato, setContrato] = useState({
        prazo: 90,
        comissaoPct: 6
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);

            // Monta dados do formulário
            const formData = {
                authType,
                contratante,
                contrato
            };

            // Envia para API
            const response = await fetch('/api/bitrix/cadastro-autorizacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    brokerId: bitrix.authId,
                    brokerDomain: bitrix.domain,
                    brokerAccessToken: bitrix.authId
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Erro ao cadastrar autorização');
            }

            alert(`✅ Autorização criada com sucesso!\nCompany ID: ${data.companyId}`);
            router.push('/dashboard');

        } catch (err: any) {
            console.error('[Form] Erro:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard" className="text-beehouse-primary hover:underline">
                        ← Voltar ao Dashboard
                    </Link>
                </div>

                <div className="card">
                    <h1 className="text-3xl font-bold mb-6">Nova Autorização de Venda</h1>

                    {!bitrix.isInsideBitrix && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
                            <p className="text-yellow-800">
                                ⚠️ Modo standalone - Conecte-se ao Bitrix24 para usar todas as funcionalidades
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded mb-6">
                            <p className="text-red-800">❌ {error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Tipo de Contratante */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Tipo de Contratante
                            </label>
                            <select
                                value={authType}
                                onChange={(e) => setAuthType(e.target.value as any)}
                                className="input"
                                required
                            >
                                <option value="pf-solteiro">Pessoa Física - Solteiro(a)</option>
                                <option value="pf-casado">Pessoa Física - Casado(a)</option>
                                <option value="socios">Sociedade</option>
                                <option value="pj">Pessoa Jurídica</option>
                            </select>
                        </div>

                        {/* Dados do Contratante (simplificado) */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Dados do Contratante</h3>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Nome Completo *</label>
                                <input
                                    type="text"
                                    value={contratante.nome}
                                    onChange={(e) => setContratante({ ...contratante, nome: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">CPF *</label>
                                    <input
                                        type="text"
                                        value={contratante.cpf}
                                        onChange={(e) => setContratante({ ...contratante, cpf: e.target.value })}
                                        className="input"
                                        placeholder="000.000.000-00"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">Email *</label>
                                    <input
                                        type="email"
                                        value={contratante.email}
                                        onChange={(e) => setContratante({ ...contratante, email: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Profissão</label>
                                <input
                                    type="text"
                                    value={contratante.profissao}
                                    onChange={(e) => setContratante({ ...contratante, profissao: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2">Endereço Completo</label>
                                <input
                                    type="text"
                                    value={contratante.endereco}
                                    onChange={(e) => setContratante({ ...contratante, endereco: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        {/* Dados do Contrato */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold">Contrato</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Prazo de Exclusividade (dias) *
                                    </label>
                                    <input
                                        type="number"
                                        value={contrato.prazo}
                                        onChange={(e) => setContrato({ ...contrato, prazo: parseInt(e.target.value) })}
                                        className="input"
                                        min="1"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold mb-2">
                                        Comissão (%) *
                                    </label>
                                    <input
                                        type="number"
                                        value={contrato.comissaoPct}
                                        onChange={(e) => setContrato({ ...contrato, comissaoPct: parseFloat(e.target.value) })}
                                        className="input"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Nota */}
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                            <p className="text-sm text-blue-800">
                                ℹ️ <strong>Nota:</strong> Este é um formulário simplificado para demonstração.
                                O formulário completo com todos os campos (cônjuge, sócios, imóveis) será implementado em breve.
                            </p>
                        </div>

                        {/* Botões */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex-1"
                            >
                                {loading ? 'Cadastrando...' : 'Cadastrar e Gerar PDF'}
                            </button>

                            <Link href="/dashboard" className="btn-secondary flex-1 text-center">
                                Cancelar
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
