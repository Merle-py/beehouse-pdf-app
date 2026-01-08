'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import { extractBitrixField } from '@/lib/utils/bitrix';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import Select from '@/components/forms/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function EditarEmpresaForm() {
    const params = useParams();
    const router = useRouter();
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const companyId = params.companyId as string;

    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        cpfCnpj: '',
        email: '',
        telefone: ''
    });

    const tipoOptions = [
        { value: 'CUSTOMER', label: 'Pessoa Física' },
        { value: 'PARTNER', label: 'Pessoa Física Casado' },
        { value: 'COMPETITOR', label: 'Pessoa Jurídica' }
    ];

    useEffect(() => {
        if (bitrix.isInitialized && companyId) {
            loadCompany();
        }
    }, [bitrix.isInitialized, companyId]);

    const loadCompany = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bitrix/companies/${companyId}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Erro ao carregar empresa');
            }

            const company = result.company;

            // Extrai email e telefone usando função utilitária
            const email = extractBitrixField(company.EMAIL);
            const telefone = extractBitrixField(company.PHONE);

            setFormData({
                nome: company.TITLE || '',
                tipo: company.COMPANY_TYPE || '',
                cpfCnpj: company.UF_CRM_CPF_CNPJ || '',
                email: email || '',
                telefone: telefone || ''
            });
        } catch (err: any) {
            console.error('Erro ao carregar empresa:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/bitrix/companies/${companyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    accessToken: bitrix.authId,
                    domain: bitrix.domain
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Empresa atualizada com sucesso!');
                router.push(`/autorizacao/${companyId}`);
            } else {
                toast.error('Erro ao atualizar empresa: ' + result.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao atualizar empresa');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando dados da empresa..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="card">
                        <p className="text-red-600 mb-4">❌ {error}</p>
                        <button onClick={() => router.back()} className="btn-primary">
                            ← Voltar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                    <h1 className="text-3xl font-bold text-gray-900">Editar Empresa</h1>
                    <p className="text-gray-600 mt-2">Atualize as informações da empresa</p>
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
                                label={formData.tipo === 'COMPETITOR' ? 'Razão Social' : 'Nome Completo'}
                                value={formData.nome}
                                onChange={(v) => setFormData({ ...formData, nome: v })}
                                placeholder="Digite o nome"
                                required
                            />

                            <Input
                                label={formData.tipo === 'COMPETITOR' ? 'CNPJ' : 'CPF'}
                                value={formData.cpfCnpj}
                                onChange={(v) => setFormData({ ...formData, cpfCnpj: v })}
                                placeholder={formData.tipo === 'COMPETITOR' ? '00.000.000/0000-00' : '000.000.000-00'}
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
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={saving}
                        >
                            {saving ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function EditarEmpresaPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <EditarEmpresaForm />
        </Suspense>
    );
}
