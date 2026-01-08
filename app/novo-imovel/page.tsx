'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';

function NovoImovelForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');

    const companyId = searchParams.get('companyId');

    useEffect(() => {
        if (companyId && bitrix.isInitialized) {
            loadCompanyName();
        }
    }, [companyId, bitrix.isInitialized]);

    const loadCompanyName = async () => {
        try {
            const response = await fetch(`/api/bitrix/companies/${companyId}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const data = await response.json();
            if (data.success) {
                setCompanyName(data.company.title);
            }
        } catch (error) {
            console.error('Erro ao carregar empresa:', error);
        }
    };

    const [formData, setFormData] = useState({
        endereco: '',
        valor: '',
        matricula: '',
        administradora: '',
        valorCondominio: '',
        chamadaCapital: '',
        numeroParcelas: '',
        descricao: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!companyId) {
            alert('ID da empresa não fornecido');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/bitrix/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    companyId,
                    accessToken: bitrix.authId,
                    domain: bitrix.domain
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Imóvel criado com sucesso!');
                router.push('/dashboard');
            } else {
                alert('Erro ao criar imóvel: ' + result.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao criar imóvel');
        } finally {
            setLoading(false);
        }
    };

    if (!companyId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Erro</h2>
                    <p className="text-gray-600 mb-4">ID da empresa não fornecido</p>
                    <button onClick={() => router.push('/dashboard')} className="btn-primary">
                        Voltar ao Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Novo Imóvel</h1>
                    <p className="text-gray-600 mt-2">
                        Cadastre um novo imóvel para: <span className="font-semibold">{companyName || 'Carregando...'}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados do Imóvel */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Dados do Imóvel</h2>
                        <div className="space-y-4">
                            <Textarea
                                label="Endereço Completo"
                                value={formData.endereco}
                                onChange={(v) => setFormData({ ...formData, endereco: v })}
                                placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                                rows={3}
                                required
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Valor do Imóvel"
                                    type="number"
                                    value={formData.valor}
                                    onChange={(v) => setFormData({ ...formData, valor: v })}
                                    placeholder="0.00"
                                    required
                                />
                                <Input
                                    label="Matrícula"
                                    value={formData.matricula}
                                    onChange={(v) => setFormData({ ...formData, matricula: v })}
                                    placeholder="Número da matrícula"
                                />
                            </div>

                            <PropertyFinancialFields
                                matricula={formData.matricula}
                                adminCondominio={formData.administradora}
                                valorCondominio={parseFloat(formData.valorCondominio) || 0}
                                chamadaCapital={formData.chamadaCapital}
                                numParcelas={formData.numeroParcelas}
                                onChange={(field, value) => setFormData({ ...formData, [field]: value })}
                            />

                            <Textarea
                                label="Descrição do Imóvel"
                                value={formData.descricao}
                                onChange={(v) => setFormData({ ...formData, descricao: v })}
                                placeholder="Detalhes adicionais sobre o imóvel"
                                rows={4}
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
                            {loading ? 'Salvando...' : 'Salvar Imóvel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function NovoImovelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Carregando...</div></div>}>
            <NovoImovelForm />
        </Suspense>
    );
}
