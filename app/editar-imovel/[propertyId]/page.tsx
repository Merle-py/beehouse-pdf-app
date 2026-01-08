'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import Input from '@/components/forms/Input';
import Textarea from '@/components/forms/Textarea';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function EditarImovelForm() {
    const params = useParams();
    const router = useRouter();
    const bitrix = useBitrix24();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');

    const propertyId = params.propertyId as string;

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

    useEffect(() => {
        if (propertyId && bitrix.isInitialized) {
            loadPropertyData();
        }
    }, [propertyId, bitrix.isInitialized]);

    const loadPropertyData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/bitrix/properties/${propertyId}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Erro ao carregar imóvel');
            }

            const property = data.property;

            // Preenche o formulário com os dados do imóvel
            setFormData({
                endereco: property.ufCrmPropertyAddress || '',
                valor: property.ufCrmPropertyValue || '',
                matricula: property.ufCrmPropertyMatricula || '',
                administradora: property.ufCrmPropertyAdminCondominio || '',
                valorCondominio: property.ufCrmPropertyValorCondominio || '',
                chamadaCapital: property.ufCrmPropertyChamadaCapital || '',
                numeroParcelas: property.ufCrmPropertyNumParcelas || '',
                descricao: property.ufCrmPropertyDescription || ''
            });

            setCompanyName(property.companyName);
            setCompanyId(property.companyId);

        } catch (err: any) {
            console.error('Erro ao carregar imóvel:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await fetch(`/api/bitrix/properties/${propertyId}`, {
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
                alert('Imóvel atualizado com sucesso!');
                // Redireciona para a página de detalhes da empresa
                if (companyId) {
                    router.push(`/autorizacao/${companyId}`);
                } else {
                    router.push('/dashboard');
                }
            } else {
                alert('Erro ao atualizar imóvel: ' + result.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao atualizar imóvel');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Carregando dados do imóvel..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
                <div className="max-w-3xl mx-auto">
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
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Editar Imóvel</h1>
                    <p className="text-gray-600 mt-2">
                        Empresa: <span className="font-semibold">{companyName || 'Carregando...'}</span>
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

export default function EditarImovelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <EditarImovelForm />
        </Suspense>
    );
}
