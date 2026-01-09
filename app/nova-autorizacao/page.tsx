'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBitrix24 } from '@/lib/bitrix/client-sdk';
import toast from 'react-hot-toast';
import Input from '@/components/forms/Input';
import MaskedInput from '@/components/forms/MaskedInput';
import Select from '@/components/forms/Select';
import Textarea from '@/components/forms/Textarea';
import SpouseSection from '@/components/forms/SpouseSection';
import PropertyFinancialFields from '@/components/forms/PropertyFinancialFields';
import SocioFields from '@/components/forms/SocioFields';
import { PersonData, SpouseData } from '@/types/authorization';

function NovaAutorizacaoForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const bitrix = useBitrix24();

    const [loading, setLoading] = useState(false);
    const [authType, setAuthType] = useState('');

    // Estados para dados do contratante
    const [contratante, setContratante] = useState({
        nome: '',
        cpfCnpj: '',
        telefone: '',
        email: '',
        estadoCivil: '',
        regimeCasamento: '',
        profissao: '',
        endereco: ''
    });

    // Estado para cônjuge (se casado)
    const [conjuge, setConjuge] = useState<SpouseData>({
        nome: '',
        cpf: '',
        profissao: '',
        email: ''
    });

    // Estado para imóvel
    const [imovel, setImovel] = useState({
        endereco: '',
        valor: '',
        matricula: '',
        administradora: '',
        valorCondominio: '',
        chamadaCapital: '',
        numeroParcelas: '',
        descricao: ''
    });

    // Estado para sócios (se PJ)
    const [socios, setSocios] = useState<PersonData[]>([{
        nome: '',
        cpf: '',
        estadoCivil: '',
        profissao: ''
    }]);

    const authTypeOptions = [
        { value: 'pf', label: 'Pessoa Física' },
        { value: 'pf-casado', label: 'Pessoa Física Casado' },
        { value: 'pj', label: 'Pessoa Jurídica' }
    ];

    const estadoCivilOptions = [
        { value: 'solteiro', label: 'Solteiro(a)' },
        { value: 'casado', label: 'Casado(a)' },
        { value: 'divorciado', label: 'Divorciado(a)' },
        { value: 'viuvo', label: 'Viúvo(a)' }
    ];

    const regimeCasamentoOptions = [
        { value: 'comunhao-parcial', label: 'Comunhão Parcial de Bens' },
        { value: 'comunhao-universal', label: 'Comunhão Universal de Bens' },
        { value: 'separacao-total', label: 'Separação Total de Bens' },
        { value: 'participacao-final', label: 'Participação Final nos Aquestos' }
    ];

    // Autofill: carrega dados da empresa se companyId estiver presente
    const companyId = searchParams.get('companyId');

    useEffect(() => {
        if (companyId && bitrix.isInitialized) {
            loadCompanyData(companyId);
        }
    }, [companyId, bitrix.isInitialized]);

    const loadCompanyData = async (id: string) => {
        try {
            const response = await fetch(`/api/bitrix/companies/${id}?accessToken=${bitrix.authId}&domain=${bitrix.domain}`);
            const result = await response.json();

            if (result.success && result.company) {
                const company = result.company;

                // Extrai email e telefone
                const email = Array.isArray(company.EMAIL)
                    ? (typeof company.EMAIL[0] === 'object' ? company.EMAIL[0]?.VALUE : company.EMAIL[0])
                    : company.EMAIL;

                const telefone = Array.isArray(company.PHONE)
                    ? (typeof company.PHONE[0] === 'object' ? company.PHONE[0]?.VALUE : company.PHONE[0])
                    : company.PHONE;

                // Mapeia tipo da empresa para tipo de autorização
                const companyTypeMap: Record<string, string> = {
                    'CUSTOMER': 'pf',
                    'PARTNER': 'pf-casado',
                    'COMPETITOR': 'pj'
                };

                const mappedAuthType = companyTypeMap[company.COMPANY_TYPE] || 'pf';

                // Pré-preenche formulário
                setAuthType(mappedAuthType);
                setContratante({
                    nome: company.TITLE || '',
                    cpfCnpj: company.UF_CRM_CPF_CNPJ || '',
                    telefone: telefone || '',
                    email: email || '',
                    estadoCivil: '',
                    regimeCasamento: '',
                    profissao: '',
                    endereco: ''
                });
            }
        } catch (error) {
            console.error('Erro ao carregar dados da empresa:', error);
            toast.error('Erro ao carregar dados da empresa');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = {
                authType,
                contratante: {
                    ...contratante,
                    cpf: contratante.cpfCnpj.replace(/\D/g, '') // Remove formatação antes de enviar
                },
                ...(authType === 'pf-casado' && { conjuge }),
                ...(authType === 'pj' && { socios }),
                imovel: {
                    ...imovel,
                    valor: parseFloat(imovel.valor) || 0
                },
                contrato: {
                    prazo: 90,
                    comissaoPct: 6
                }
            };

            const response = await fetch('/api/bitrix/cadastro-autorizacao', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    formData,
                    accessToken: bitrix.authId,
                    domain: bitrix.domain
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Autorização criada com sucesso!');
                router.push('/dashboard');
            } else {
                toast.error('Erro ao criar autorização: ' + result.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao criar autorização');
        } finally {
            setLoading(false);
        }
    };

    const addSocio = () => {
        setSocios([...socios, {
            nome: '',
            cpf: '',
            estadoCivil: '',
            profissao: '',
            endereco: ''
        }]);
    };

    const removeSocio = (index: number) => {
        setSocios(socios.filter((_, i) => i !== index));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-blue-600 hover:text-blue-800 mb-4"
                    >
                        ← Voltar
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Nova Autorização</h1>
                    <p className="text-gray-600 mt-2">Preencha os dados para criar uma nova autorização</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tipo de Autorização */}
                    <div className="card">
                        <h2 className="text-xl font-bold mb-4">Tipo de Autorização</h2>
                        <Select
                            label="Selecione o tipo"
                            value={authType}
                            onChange={setAuthType}
                            options={authTypeOptions}
                            placeholder="Escolha o tipo de autorização"
                            required
                        />
                    </div>

                    {/* Dados do Contratante */}
                    {authType && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">
                                {authType === 'pj' ? 'Dados da Empresa' : 'Dados do Contratante'}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label={authType === 'pj' ? 'Razão Social' : 'Nome Completo'}
                                    value={contratante.nome}
                                    onChange={(v) => setContratante({ ...contratante, nome: v })}
                                    placeholder="Digite o nome completo"
                                    required
                                />
                                <MaskedInput
                                    label={authType === 'pj' ? 'CNPJ' : 'CPF/CNPJ'}
                                    value={contratante.cpfCnpj}
                                    onChange={(v) => setContratante({ ...contratante, cpfCnpj: v })}
                                    mask="cpfCnpj"
                                    validation="cpfCnpj"
                                    placeholder={authType === 'pj' ? '00.000.000/0000-00' : '000.000.000-00 ou 00.000.000/0000-00'}
                                    required
                                />
                                <Input
                                    label="Endereço Residencial"
                                    value={contratante.endereco}
                                    onChange={(v) => setContratante({ ...contratante, endereco: v })}
                                    placeholder="Endereço completo"
                                />
                                <MaskedInput
                                    label="Telefone"
                                    value={contratante.telefone}
                                    onChange={(v) => setContratante({ ...contratante, telefone: v })}
                                    mask="phone"
                                    validation="phone"
                                    placeholder="(00) 00000-0000"
                                    required
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    value={contratante.email}
                                    onChange={(v) => setContratante({ ...contratante, email: v })}
                                    placeholder="email@exemplo.com"
                                    required
                                />
                                {authType !== 'pj' && (
                                    <>
                                        <Select
                                            label="Estado Civil"
                                            value={contratante.estadoCivil}
                                            onChange={(v) => setContratante({ ...contratante, estadoCivil: v })}
                                            options={estadoCivilOptions}
                                            required
                                        />
                                        {contratante.estadoCivil === 'casado' && (
                                            <Select
                                                label="Regime de Casamento"
                                                value={contratante.regimeCasamento}
                                                onChange={(v) => setContratante({ ...contratante, regimeCasamento: v })}
                                                options={regimeCasamentoOptions}
                                                required
                                            />
                                        )}
                                        <Input
                                            label="Profissão"
                                            value={contratante.profissao}
                                            onChange={(v) => setContratante({ ...contratante, profissao: v })}
                                            placeholder="Digite a profissão"
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Dados do Cônjuge */}
                    {authType === 'pf-casado' && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Dados do Cônjuge</h2>
                            <SpouseSection
                                spouse={conjuge}
                                onChange={(spouse) => setConjuge(spouse as SpouseData)}
                            />
                        </div>
                    )}

                    {/* Sócios (PJ) */}
                    {authType === 'pj' && (
                        <div className="card">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">Sócios</h2>
                                <button
                                    type="button"
                                    onClick={addSocio}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                    ➕ Adicionar Sócio
                                </button>
                            </div>
                            {socios.map((socio, index) => (
                                <SocioFields
                                    key={index}
                                    index={index}
                                    socio={socio}
                                    onChange={(updatedSocio) => {
                                        const newSocios = [...socios];
                                        newSocios[index] = updatedSocio;
                                        setSocios(newSocios);
                                    }}
                                    onRemove={() => removeSocio(index)}
                                    canRemove={socios.length > 1}
                                />
                            ))}
                        </div>
                    )}

                    {/* Dados do Imóvel */}
                    {authType && (
                        <div className="card">
                            <h2 className="text-xl font-bold mb-4">Dados do Imóvel</h2>
                            <div className="space-y-4">
                                <Textarea
                                    label="Endereço Completo"
                                    value={imovel.endereco}
                                    onChange={(v) => setImovel({ ...imovel, endereco: v })}
                                    placeholder="Rua, número, complemento, bairro, cidade, estado, CEP"
                                    rows={3}
                                    required
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Valor do Imóvel"
                                        type="number"
                                        value={imovel.valor}
                                        onChange={(v) => setImovel({ ...imovel, valor: v })}
                                        placeholder="0.00"
                                        required
                                    />
                                    <Input
                                        label="Matrícula"
                                        value={imovel.matricula}
                                        onChange={(v) => setImovel({ ...imovel, matricula: v })}
                                        placeholder="Número da matrícula"
                                    />
                                </div>
                                <PropertyFinancialFields
                                    matricula={imovel.matricula}
                                    adminCondominio={imovel.administradora}
                                    valorCondominio={parseFloat(imovel.valorCondominio) || 0}
                                    chamadaCapital={imovel.chamadaCapital}
                                    numParcelas={imovel.numeroParcelas}
                                    onChange={(field, value) => setImovel({ ...imovel, [field]: value })}
                                />
                                <Textarea
                                    label="Descrição do Imóvel"
                                    value={imovel.descricao}
                                    onChange={(v) => setImovel({ ...imovel, descricao: v })}
                                    placeholder="Detalhes adicionais sobre o imóvel"
                                    rows={4}
                                />
                            </div>
                        </div>
                    )}

                    {/* Botões de Ação */}
                    {authType && (
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
                                {loading ? 'Salvando...' : 'Salvar Autorização'}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}

export default function NovaAutorizacaoPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div>Carregando...</div></div>}>
            <NovaAutorizacaoForm />
        </Suspense>
    );
}
