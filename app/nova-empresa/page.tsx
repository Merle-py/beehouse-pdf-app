'use client';

import { useState } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';

function NovaEmpresaForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bitrix = useBitrix24();
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
        setLoading(true);

        try {
            const response = await fetch('/api/bitrix/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    accessToken: bitrix.authId,
                    domain: bitrix.domain
                })
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
            console.error('Erro:', error);
            toast.error('Erro ao criar empresa');
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

                            <Input
                                label={formData.tipo === 'pj' ? 'CNPJ' : 'CPF'}
                                value={formData.cpfCnpj}
                                onChange={(v) => setFormData({ ...formData, cpfCnpj: v })}
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

                            <Input
                                label="Telefone"
                                type="tel"
                                value={formData.telefone}
                                onChange={(v) => setFormData({ ...formData, telefone: v })}
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
