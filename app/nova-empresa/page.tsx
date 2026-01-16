'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import EmpresaForm, { type EmpresaFormData } from '@/components/forms/EmpresaForm';

export default function NovaEmpresaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: EmpresaFormData) => {
        setLoading(true);

        try {
            const response = await fetch('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao criar empresa');
            }

            const result = await response.json();

            toast.success('Empresa criada com sucesso!');
            router.push('/empresas');
        } catch (error: any) {
            console.error('Error creating empresa:', error);
            toast.error(error.message || 'Erro ao criar empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Nova Empresa</h1>
                    <p className="text-gray-600 mt-2">Cadastre uma nova empresa (Pessoa Física ou Jurídica)</p>
                </div>

                {/* Form */}
                <EmpresaForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    mode="create"
                    loading={loading}
                />
            </div>
        </div>
    );
}
