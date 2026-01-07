'use client';

import { useState } from 'react';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import type { ContractorType, AuthorizationFormData } from '@/types/authorization';

export default function AuthorizationPage() {
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(false);
    const [authType, setAuthType] = useState<ContractorType>('pf-solteiro');
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Estados do formulário
    const [formData, setFormData] = useState<Partial<AuthorizationFormData>>({
        authType: 'pf-solteiro',
        contrato: {
            prazo: 90,
            comissaoPct: 6
        }
    });

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log('[Frontend] Enviando dados:', formData);

            // Preparar dados com autenticação do corretor
            const requestBody = {
                formData,
                brokerId: bitrix.authId || null, // member_id obtido do SDK
                brokerDomain: bitrix.domain || null,
                brokerAccessToken: bitrix.authId || null // access_token do SDK
            };

            const response = await fetch('/api/bitrix/cadastro-autorizacao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Erro desconhecido');
            }

            console.log('[Frontend] Sucesso:', result);
            showToast('success', `Autorização gerada! Company ID: ${result.companyId}, Item ID: ${result.propertyItemId}${result.createdBy ? ` (Criado por: ${result.createdBy})` : ''}`);

            // Download do PDF
            if (result.pdfUrl) {
                const link = document.createElement('a');
                link.href = result.pdfUrl;
                link.download = result.pdfFileName || 'Autorizacao_Venda.pdf';
                link.click();
            }

            // Reset do formulário
            setFormData({
                authType: 'pf-solteiro',
                contrato: {
                    prazo: 90,
                    comissaoPct: 6
                }
            });

        } catch (error: any) {
            console.error('[Frontend] Erro:', error);
            showToast('error', error.message || 'Erro ao gerar autorização');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-beehouse-secondary mb-2">
                        Autorização de Venda
                    </h1>
                    <p className="text-gray-600">
                        Preencha os dados abaixo para cadastrar e gerar a autorização
                    </p>

                    {/* Status do Bitrix24 */}
                    {bitrix.isInitialized && (
                        <div className="mt-4 inline-block">
                            {bitrix.isInsideBitrix ? (
                                <div className="flex items-center gap-4">
                                    <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                        ✓ Conectado ao Bitrix24
                                    </span>
                                    <a
                                        href="/minhas-autorizacoes"
                                        className="bg-beehouse-primary hover:bg-beehouse-accent text-white text-sm px-4 py-1 rounded-full transition-colors"
                                    >
                                        📋 Minhas Autorizações
                                    </a>
                                </div>
                            ) : (
                                <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                                    Modo standalone (sem Bitrix24)
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Formulário */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Contratante */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Tipo de Contratante</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { value: 'pf-solteiro', label: 'PF Solteiro(a)' },
                                { value: 'pf-casado', label: 'PF Casado(a)' },
                                { value: 'socios', label: 'Sócios' },
                                { value: 'pj', label: 'Pessoa Jurídica' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setAuthType(option.value as ContractorType);
                                        setFormData({ ...formData, authType: option.value as ContractorType });
                                    }}
                                    className={`py-3 px-4 rounded-lg font-medium transition-all ${authType === option.value
                                        ? 'bg-beehouse-primary text-white shadow-md'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dados do Contratante (Dinâmico) */}
                    {authType === 'pf-solteiro' || authType === 'pf-casado' ? (
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados do Contratante</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Nome Completo *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contratante: { ...formData.contratante, nome: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">CPF *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        placeholder="000.000.000-00"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contratante: { ...formData.contratante, cpf: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contratante: { ...formData.contratante, email: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Profissão</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contratante: { ...formData.contratante, profissao: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="form-label">Endereço</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            contratante: { ...formData.contratante, endereco: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            {authType === 'pf-casado' && (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-4">Dados do Cônjuge</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">Nome do Cônjuge</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    conjuge: { ...formData.conjuge, nome: e.target.value }
                                                })}
                                            />
                                        </div>
                                        <div>
                                            <label className="form-label">CPF do Cônjuge</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    conjuge: { ...formData.conjuge, cpf: e.target.value }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : null}

                    {authType === 'pj' && (
                        <div className="card">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados da Empresa</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="form-label">Razão Social *</label>
                                    <input
                                        type="text"
                                        required
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            empresa: { ...formData.empresa, razaoSocial: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">CNPJ</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            empresa: { ...formData.empresa, cnpj: e.target.value }
                                        })}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Telefone</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            empresa: { ...formData.empresa, telefone: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Dados do Imóvel */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Dados do Imóvel</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="form-label">Descrição do Imóvel *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="Ex: Apartamento 3 quartos, 2 vagas"
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        imovelUnico: { ...formData.imovelUnico, descricao: e.target.value, endereco: '', valor: 0 }
                                    })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="form-label">Endereço do Imóvel *</label>
                                <input
                                    type="text"
                                    required
                                    className="form-input"
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        imovelUnico: { ...formData.imovelUnico, endereco: e.target.value, descricao: formData.imovelUnico?.descricao || '', valor: formData.imovelUnico?.valor || 0 }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Valor do Imóvel *</label>
                                <input
                                    type="number"
                                    required
                                    className="form-input"
                                    placeholder="R$ 0,00"
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        imovelUnico: { ...formData.imovelUnico, valor: parseFloat(e.target.value), descricao: formData.imovelUnico?.descricao || '', endereco: formData.imovelUnico?.endereco || '' }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Matrícula</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        imovelUnico: { ...formData.imovelUnico, matricula: e.target.value, descricao: formData.imovelUnico?.descricao || '', endereco: formData.imovelUnico?.endereco || '', valor: formData.imovelUnico?.valor || 0 }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Condições do Contrato */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Condições do Contrato</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="form-label">Prazo de Exclusividade (dias) *</label>
                                <input
                                    type="number"
                                    required
                                    className="form-input"
                                    defaultValue={90}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        contrato: { ...formData.contrato, prazo: parseInt(e.target.value) || 0, comissaoPct: formData.contrato?.comissaoPct || 6 }
                                    })}
                                />
                            </div>
                            <div>
                                <label className="form-label">Comissão (%) *</label>
                                <input
                                    type="number"
                                    required
                                    className="form-input"
                                    defaultValue={6}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        contrato: { ...formData.contrato, comissaoPct: parseFloat(e.target.value) || 0, prazo: formData.contrato?.prazo || 90 }
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botão Submit */}
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary px-12 py-4 text-lg flex items-center gap-3"
                        >
                            {loading ? (
                                <>
                                    <div className="spinner w-6 h-6 border-2" />
                                    Processando...
                                </>
                            ) : (
                                <>
                                    📄 Cadastrar e Gerar Autorização
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Toast */}
                {toast && (
                    <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
                        <div className="flex items-start gap-3">
                            <div className="text-2xl">
                                {toast.type === 'success' ? '✅' : '❌'}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">
                                    {toast.type === 'success' ? 'Sucesso!' : 'Erro'}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
