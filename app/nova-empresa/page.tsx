'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApiClient } from '@/lib/utils/api-client';
import { formatCPFOrCNPJ, validateCPFOrCNPJ, formatPhone } from '@/lib/utils/formatters';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import MaskedInput from '@/components/forms/MaskedInput';
import Select from '@/components/forms/Select';

function NovaEmpresaForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { client } = useApiClient();
    const [loading, setLoading] = useState(false);

    const redirectTo = searchParams.get('redirect'); // novo-imovel ou nova-autorizacao

    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        cpfCnpj: '',
        email: '',
        telefone: ''
    });

    const tipoOptions = [
        { value: 'pf', label: 'Pessoa Física' },
        { value: 'pf-casado', label: 'Pessoa Física Casado' },
        { value: 'pj', label: 'Pessoa Jurídica' }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validação de CPF/CNPJ
        if (!validateCPFOrCNPJ(formData.cpfCnpj)) {
            toast.error('CPF/CNPJ inválido. Verifique os dígitos.');
            return;
        }

        setLoading(true);

        try {
            const response = await client('/api/bitrix/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Empresa criada com sucesso!');

                // Se tem redirect, vai para a página com o ID da empresa
                if (redirectTo && result.companyId) {
                    router.push(`/${redirectTo}?companyId=${result.companyId}`);
                } else {
                    router.push('/dashboard');
                }
            } else {
                toast.error('Erro ao criar empresa: ' + result.error);
            }
        } catch (error) {
            const err = error as Error;
            console.error('Erro:', err);
            toast.error(`Erro ao criar empresa: ${err.message || 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Nova Empresa</h1>
                    <p className="text-gray-600 mt-2">Cadastre uma nova empresa no sistema</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados da Empresa */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Dados da Empresa</h2>
                        <div className="space-y-4">
                            <Select
                                label="Tipo"
                                value={formData.tipo}
                                onChange={(v) => setFormData({ ...formData, tipo: v })}
                                options={tipoOptions}
                                placeholder="Selecione o tipo"
                                required
                            />

                            <Input
                                label={formData.tipo === 'pj' ? 'Razão Social' : 'Nome Completo'}
                                value={formData.nome}
                                onChange={(v) => setFormData({ ...formData, nome: v })}
                                placeholder="Digite o nome"
                                required
                            />

                            <MaskedInput
                                label={formData.tipo === 'pj' ? 'CNPJ' : 'CPF'}
                                value={formData.cpfCnpj}
                                onChange={(v) => setFormData({ ...formData, cpfCnpj: v })}
                                mask="cpfCnpj"
                                validation="cpfCnpj"
                                placeholder={formData.tipo === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
                                required
                            />

                            <Input
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(v) => setFormData({ ...formData, email: v })}
                                placeholder="email@exemplo.com"
                                required
                            />

                            <MaskedInput
                                label="Telefone"
                                value={formData.telefone}
                                onChange={(v) => setFormData({ ...formData, telefone: v })}
                                mask="phone"
                                validation="phone"
                                placeholder="(00) 00000-0000"
                                required
                            />
                        </div>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Empresa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NovaEmpresaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Carregando...</div></div>}>
            <NovaEmpresaForm />
        </Suspense>
    );
}
