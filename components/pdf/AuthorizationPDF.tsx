import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { PDFGenerationData } from '@/types/authorization';

// Cores da marca Beehouse
const COLORS = {
    primary: '#000000',
    highlight: '#f9b410',
    gray: '#555555',
    white: '#ffffff',
};

// Estilos do PDF
const styles = StyleSheet.create({
    page: {
        padding: '30 50 30 30',
        fontSize: 8,
        fontFamily: 'Helvetica',
        backgroundColor: COLORS.white,
    },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    logo: {
        width: 180,
        height: 60,
        objectFit: 'contain',
    },
    companyInfo: {
        width: 250,
        textAlign: 'right',
    },
    companyTitle: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        marginBottom: 2,
    },
    companyDetails: {
        fontSize: 8,
        marginBottom: 2,
    },
    // Blocos com etiquetas verticais
    blockContainer: {
        marginBottom: 15,
    },
    blockWithLabel: {
        flexDirection: 'row',
        border: `1pt solid ${COLORS.primary}`,
    },
    verticalLabel: {
        width: 22,
        borderRight: `1pt solid ${COLORS.primary}`,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
    verticalText: {
        fontSize: 9,
        fontFamily: 'Helvetica-Bold',
        transform: 'rotate(-90deg)',
        width: 100,
        textAlign: 'center',
    },
    blockContent: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        borderBottom: `1pt solid ${COLORS.primary}`,
        minHeight: 20,
        alignItems: 'center',
    },
    rowLast: {
        flexDirection: 'row',
        minHeight: 20,
        alignItems: 'center',
    },
    column: {
        flex: 1,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 7,
        paddingBottom: 7,
    },
    columnWithBorder: {
        flex: 1,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 7,
        paddingBottom: 7,
        borderLeft: `1pt solid ${COLORS.primary}`,
    },
    label: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
    },
    value: {
        fontFamily: 'Helvetica',
        fontSize: 8,
    },
    // Texto jurídico
    legalText: {
        fontSize: 8,
        textAlign: 'justify',
        lineHeight: 1.4,
        marginBottom: 5,
    },
    clauseContainer: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    clauseNumber: {
        width: 20,
        fontFamily: 'Helvetica-Bold',
    },
    clauseText: {
        flex: 1,
        textAlign: 'justify',
    },
    // Assinaturas
    signatureBlock: {
        marginTop: 20,
    },
    signatureLine: {
        borderTop: `1pt solid ${COLORS.primary}`,
        width: 240,
        paddingTop: 5,
        marginBottom: 5,
    },
    signatureTitle: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        textAlign: 'center',
    },
    signatureLabel: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 8,
        textAlign: 'center',
        marginTop: 5,
    },
    signatureSubLabel: {
        fontFamily: 'Helvetica',
        fontSize: 8,
        textAlign: 'center',
        marginTop: 2,
    },
    signaturesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // Checkboxes
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    checkbox: {
        width: 8,
        height: 8,
        border: `1pt solid ${COLORS.primary}`,
        marginRight: 2,
        position: 'relative',
    },
    checkboxChecked: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        position: 'absolute',
        top: -2,
        left: 0,
    },
});

// Função auxiliar para formatar moeda
function formatCurrency(value?: number): string {
    if (!value || isNaN(value)) return '';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Função auxiliar para formatar data
function formatDate(): string {
    return new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

interface AuthorizationPDFProps {
    data: PDFGenerationData;
}

const AuthorizationPDF: React.FC<AuthorizationPDFProps> = ({ data }) => {
    const { authType } = data;
    const isPJ = authType === 'pj';
    const isPFCasado = authType === 'pf-casado' || authType === 'casado';
    const isSocios = authType === 'socios';
    const numSocios = parseInt(String(data.numSocios || 1), 10);

    // Texto dinâmico baseado no tipo
    const preambuloTexto = isPJ
        ? 'A Contratante autoriza a Beehouse Investimentos Imobiliários, inscrita no '
        : 'O(s) Contratante(s) autoriza(m) a Beehouse Investimentos Imobiliários, inscrita no ';

    const comissaoTexto = isPJ
        ? 'A Contratante pagará a Contratada'
        : 'O(s) Contratante(s) pagará(ão) a Contratada';

    const declaracaoTexto = isPJ
        ? 'A Contratante declara que os imóveis encontram-se livres e desembaraçados de quaisquer ônus, tendo plenos poderes para proceder a sua venda.'
        : 'O(s) Contratante(s) declara(m) que os imóveis encontram-se livres e desembaraçados de quaisquer ônus, tendo plenos poderes para proceder a sua venda.';

    // Lógica de exclusividade
    const prazoNum = parseInt(String(data.contratoPrazo), 10);
    const temExclusividade = !isNaN(prazoNum) && prazoNum > 0;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.companyTitle}>BEEHOUSE</Text>
                    </View>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyTitle}>Autorização de Venda</Text>
                        <Text style={[styles.companyDetails, { fontFamily: 'Helvetica-Bold' }]}>
                            Beehouse Investimentos Imobiliários
                        </Text>
                        <Text style={styles.companyDetails}>
                            R. Jacob Eisenhut, 223 - SL 801 - Atiradores - Joinville/SC
                        </Text>
                        <Text style={styles.companyDetails}>
                            www.beehouse.imb.br | Fone: (47) 99287-9066
                        </Text>
                    </View>
                </View>

                {/* Bloco PJ */}
                {isPJ && (
                    <>
                        <View style={styles.blockContainer} wrap={false}>
                            <View style={styles.blockWithLabel}>
                                <View style={styles.verticalLabel}>
                                    <Text style={styles.verticalText}>CONTRATANTE</Text>
                                </View>
                                <View style={styles.blockContent}>
                                    {/* Linha 1: Razão Social */}
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Razão Social: <Text style={styles.value}>{data.empresaRazaoSocial || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Linha 2: CNPJ e Email */}
                                    <View style={styles.row}>
                                        <View style={[styles.column, { flex: 1 }]}>
                                            <Text style={styles.label}>
                                                CNPJ: <Text style={styles.value}>{data.empresaCnpj || ''}</Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                            <Text style={styles.label}>
                                                Email: <Text style={styles.value}>{data.empresaEmail || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Linha 3: Telefone e IE */}
                                    <View style={styles.row}>
                                        <View style={[styles.column, { flex: 1 }]}>
                                            <Text style={styles.label}>
                                                Telefone: <Text style={styles.value}>{data.empresaTelefone || ''}</Text>
                                            </Text>
                                        </View>
                                        <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                            <Text style={styles.label}>
                                                Inscrição Est./Mun.: <Text style={styles.value}>{data.empresaIe || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Linha 4: Endereço da Sede */}
                                    <View style={styles.rowLast}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Endereço da Sede: <Text style={styles.value}>{data.empresaEndereco || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Bloco Representante Legal */}
                        <View style={styles.blockContainer} wrap={false}>
                            <View style={styles.blockWithLabel}>
                                <View style={styles.verticalLabel}>
                                    <Text style={styles.verticalText}>REP. LEGAL</Text>
                                </View>
                                <View style={styles.blockContent}>
                                    {/* Linha 1: Nome */}
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Nome: <Text style={styles.value}>{data.repNome || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Linha 2: CPF */}
                                    <View style={styles.row}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                CPF: <Text style={styles.value}>{data.repCpf || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Linha 3: Cargo */}
                                    <View style={styles.rowLast}>
                                        <View style={styles.column}>
                                            <Text style={styles.label}>
                                                Cargo: <Text style={styles.value}>{data.repCargo || ''}</Text>
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Bloco PF/Sócios */}
                {!isPJ && (
                    <>
                        {isSocios ? (
                            // Múltiplos sócios
                            <>
                                {Array.from({ length: numSocios }).map((_, i) => {
                                    const prefix = `socio${i + 1}`;
                                    const titulo = `CONTRATANTE ${i + 1}`;

                                    return (
                                        <View key={i} style={styles.blockContainer} wrap={false}>
                                            <View style={styles.blockWithLabel}>
                                                <View style={styles.verticalLabel}>
                                                    <Text style={styles.verticalText}>{titulo}</Text>
                                                </View>
                                                <View style={styles.blockContent}>
                                                    {/* Linha 1: Nome e Profissão */}
                                                    <View style={styles.row}>
                                                        <View style={[styles.column, { flex: 1 }]}>
                                                            <Text style={styles.label}>
                                                                Nome: <Text style={styles.value}>{(data as any)[`${prefix}Nome`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                        <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                                            <Text style={styles.label}>
                                                                Profissão: <Text style={styles.value}>{(data as any)[`${prefix}Profissao`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {/* Linha 2: CPF */}
                                                    <View style={styles.row}>
                                                        <View style={styles.column}>
                                                            <Text style={styles.label}>
                                                                CPF: <Text style={styles.value}>{(data as any)[`${prefix}Cpf`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {/* Linha 3: Estado Civil e Regime */}
                                                    <View style={styles.row}>
                                                        <View style={[styles.column, { flex: 1 }]}>
                                                            <Text style={styles.label}>
                                                                Estado Civil: <Text style={styles.value}>{(data as any)[`${prefix}EstadoCivil`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                        <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                                            <Text style={styles.label}>
                                                                Regime Casamento: <Text style={styles.value}>{(data as any)[`${prefix}RegimeCasamento`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {/* Linha 4: Endereço */}
                                                    <View style={styles.row}>
                                                        <View style={styles.column}>
                                                            <Text style={styles.label}>
                                                                Endereço: <Text style={styles.value}>{(data as any)[`${prefix}Endereco`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {/* Linha 5: Email */}
                                                    <View style={styles.rowLast}>
                                                        <View style={styles.column}>
                                                            <Text style={styles.label}>
                                                                Email: <Text style={styles.value}>{(data as any)[`${prefix}Email`] || ''}</Text>
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    );
                                })}
                            </>
                        ) : (
                            // Contratante único (solteiro ou casado)
                            <View style={styles.blockContainer} wrap={false}>
                                <View style={styles.blockWithLabel}>
                                    <View style={styles.verticalLabel}>
                                        <Text style={styles.verticalText}>CONTRATANTE</Text>
                                    </View>
                                    <View style={styles.blockContent}>
                                        {/* Linha 1: Nome e Profissão */}
                                        <View style={styles.row}>
                                            <View style={[styles.column, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    Nome: <Text style={styles.value}>{data.contratanteNome || ''}</Text>
                                                </Text>
                                            </View>
                                            <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    Profissão: <Text style={styles.value}>{data.contratanteProfissao || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 2: CPF */}
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.label}>
                                                    CPF: <Text style={styles.value}>{data.contratanteCpf || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 3: Estado Civil e Regime */}
                                        <View style={styles.row}>
                                            <View style={[styles.column, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    Estado Civil: <Text style={styles.value}>{data.contratanteEstadoCivil || ''}</Text>
                                                </Text>
                                            </View>
                                            <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    Regime Casamento: <Text style={styles.value}>{data.contratanteRegimeCasamento || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 4: Endereço */}
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.label}>
                                                    Endereço: <Text style={styles.value}>{data.contratanteEndereco || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 5: Email */}
                                        <View style={styles.rowLast}>
                                            <View style={styles.column}>
                                                <Text style={styles.label}>
                                                    Email: <Text style={styles.value}>{data.contratanteEmail || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Bloco Cônjuge (se casado) */}
                        {isPFCasado && (
                            <View style={styles.blockContainer} wrap={false}>
                                <View style={styles.blockWithLabel}>
                                    <View style={styles.verticalLabel}>
                                        <Text style={styles.verticalText}>CÔNJUGE</Text>
                                    </View>
                                    <View style={styles.blockContent}>
                                        {/* Linha 1: Nome e CPF */}
                                        <View style={styles.row}>
                                            <View style={[styles.column, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    Nome: <Text style={styles.value}>{data.conjugeNome || ''}</Text>
                                                </Text>
                                            </View>
                                            <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                                <Text style={styles.label}>
                                                    CPF: <Text style={styles.value}>{data.conjugeCpf || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 2: Profissão */}
                                        <View style={styles.row}>
                                            <View style={styles.column}>
                                                <Text style={styles.label}>
                                                    Profissão: <Text style={styles.value}>{data.conjugeProfissao || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                        {/* Linha 3: Email */}
                                        <View style={styles.rowLast}>
                                            <View style={styles.column}>
                                                <Text style={styles.label}>
                                                    Email: <Text style={styles.value}>{data.conjugeEmail || ''}</Text>
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}
                    </>
                )}

                {/* Bloco Imóvel */}
                <View style={styles.blockContainer} wrap={false}>
                    <View style={styles.blockWithLabel}>
                        <View style={styles.verticalLabel}>
                            <Text style={styles.verticalText}>IMÓVEL</Text>
                        </View>
                        <View style={styles.blockContent}>
                            {/* Linha 1: Descrição e Valor */}
                            <View style={styles.row}>
                                <View style={[styles.column, { flex: 2 }]}>
                                    <Text style={styles.label}>
                                        Descrição: <Text style={styles.value}>{data.imovelDescricao || ''}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                    <Text style={styles.label}>
                                        Valor: <Text style={styles.value}>{formatCurrency(data.imovelValor)}</Text>
                                    </Text>
                                </View>
                            </View>
                            {/* Linha 2: Endereço */}
                            <View style={styles.row}>
                                <View style={styles.column}>
                                    <Text style={styles.label}>
                                        Endereço do Empreendimento: <Text style={styles.value}>{data.imovelEndereco || ''}</Text>
                                    </Text>
                                </View>
                            </View>
                            {/* Linha 3: Matrícula */}
                            <View style={styles.row}>
                                <View style={styles.column}>
                                    <Text style={styles.label}>
                                        Inscrição Imobiliária / Matrícula: <Text style={styles.value}>{data.imovelMatricula || ''}</Text>
                                    </Text>
                                </View>
                            </View>
                            {/* Linha 4: Administradora */}
                            <View style={styles.row}>
                                <View style={styles.column}>
                                    <Text style={styles.label}>
                                        Administradora de Condomínio: <Text style={styles.value}>{data.imovelAdminCondominio || ''}</Text>
                                    </Text>
                                </View>
                            </View>
                            {/* Linha 5: Valor Condomínio, Chamada Capital, Parcelas */}
                            <View style={styles.row}>
                                <View style={[styles.column, { flex: 1 }]}>
                                    <Text style={styles.label}>
                                        Valor Condomínio: <Text style={styles.value}>{formatCurrency(data.imovelValorCondominio)}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                    <Text style={styles.label}>
                                        Chamada Capital: <Text style={styles.value}>{data.imovelChamadaCapital || ''}</Text>
                                    </Text>
                                </View>
                                <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                    <Text style={styles.label}>
                                        Parcelas: <Text style={styles.value}>{data.imovelNumParcelas || ''}</Text>
                                    </Text>
                                </View>
                            </View>
                            {/* Linha 6: Exclusividade e Prazo */}
                            <View style={styles.rowLast}>
                                <View style={[styles.column, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                                    <Text style={styles.label}>Exclusividade(*): </Text>
                                    <View style={styles.checkboxContainer}>
                                        <View style={styles.checkbox}>
                                            {temExclusividade && <Text style={styles.checkboxChecked}>X</Text>}
                                        </View>
                                        <Text style={styles.value}>SIM</Text>
                                    </View>
                                    <View style={styles.checkboxContainer}>
                                        <View style={styles.checkbox}>
                                            {!temExclusividade && <Text style={styles.checkboxChecked}>X</Text>}
                                        </View>
                                        <Text style={styles.value}>NÃO</Text>
                                    </View>
                                </View>
                                <View style={[styles.columnWithBorder, { flex: 1 }]}>
                                    <Text style={styles.label}>
                                        Prazo de exclusividade: <Text style={styles.value}>{temExclusividade ? data.contratoPrazo : '0'} dias</Text>
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Texto Jurídico */}
                <View wrap={false}>
                    <Text style={styles.legalText}>
                        {preambuloTexto}
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>CNPJ sob nº 14.477.349/0001-23</Text>
                        , com inscrição no{' '}
                        <Text style={{ fontFamily: 'Helvetica-Bold' }}>CRECI/SC sob o nº 7.965-J</Text>
                        , situada nesta cidade, na Rua Jacob Eisenhut, 223 - SL 801 Bairro Atiradores, Cep: 89.203-070 - Joinville-SC, a promover a venda dos imóveis com as descrições acima, mediante as seguintes condições:
                    </Text>
                </View>

                {/* Cláusulas */}
                <View wrap={false}>
                    <View style={styles.clauseContainer}>
                        <Text style={styles.clauseNumber}>1º</Text>
                        <Text style={styles.clauseText}>
                            A venda é concebida a contar desta data pelo prazo e forma acima definidos. Após esse período o contrato se encerra.
                        </Text>
                    </View>

                    <View style={styles.clauseContainer}>
                        <Text style={styles.clauseNumber}>2º</Text>
                        <Text style={styles.clauseText}>
                            {comissaoTexto} {data.contratoComissaoPct || 6}% (seis por cento) sobre o valor da venda, no ato do recebimento do sinal. Esta comissão é devida também mesmo fora do prazo desta autorização desde que a venda do imóvel seja efetuado por cliente apresentado pela Contratada ou nos caso em que, comprovadamente, a negociação tiver sido por esta iniciada, observando também o artigo 727 do Código Civil Brasileiro.
                        </Text>
                    </View>

                    <View style={styles.clauseContainer}>
                        <Text style={styles.clauseNumber}>3º</Text>
                        <Text style={styles.clauseText}>
                            A Contratada compromete-se a fazer publicidade dos imóveis, podendo colocar placas, anunciar em jornais e meios de divulgação do imóvel ao público.
                        </Text>
                    </View>

                    <View style={styles.clauseContainer}>
                        <Text style={styles.clauseNumber}>4º</Text>
                        <Text style={styles.clauseText}>
                            {declaracaoTexto}
                        </Text>
                    </View>

                    <View style={styles.clauseContainer}>
                        <Text style={styles.clauseNumber}>5º</Text>
                        <Text style={styles.clauseText}>
                            Em caso de qualquer controversia decorrente deste contrato, as partes elegem o Foro da Comarca de Joinville/SC para dirimir quaisquer dúvidas deste contrato, renunciando qualquer outro, por mais privilégio que seja.
                        </Text>
                    </View>

                    <Text style={[styles.legalText, { marginTop: 5 }]}>
                        Assim por estarem juntos e contratados, obrigam-se a si e seus herdeiros a cumprir e fazer cumprir o disposto neste contrato, assinando-os em duas vias de igual teor e forma a tudo presentes.
                    </Text>

                    <Text style={[styles.legalText, { marginTop: 10, fontFamily: 'Helvetica-Bold' }]}>
                        Local e data:{' '}
                        <Text style={{ fontFamily: 'Helvetica' }}>Joinville, {formatDate()}</Text>
                    </Text>
                </View>

                {/* Assinaturas */}
                <View style={styles.signatureBlock} wrap={false}>
                    <View style={styles.signaturesRow}>
                        {/* Contratada */}
                        <View>
                            <View style={styles.signatureLine}>
                                <Text style={styles.signatureTitle}>CONTRATADA</Text>
                            </View>
                            <Text style={styles.signatureLabel}>Beehouse Investimentos Imobiliários</Text>
                            <Text style={styles.signatureSubLabel}>CNPJ 14.477.349/0001-23</Text>
                        </View>

                        {/* Contratante(s) */}
                        {isPJ ? (
                            <View>
                                <View style={styles.signatureLine}>
                                    <Text style={styles.signatureTitle}>CONTRATANTE</Text>
                                </View>
                                <Text style={styles.signatureLabel}>{data.empresaRazaoSocial || ''}</Text>
                                <Text style={styles.signatureSubLabel}>
                                    p.p. {data.repNome} - CPF: {data.repCpf}
                                </Text>
                            </View>
                        ) : (
                            <View>
                                <View style={styles.signatureLine}>
                                    <Text style={styles.signatureTitle}>CONTRATANTE</Text>
                                </View>
                                <Text style={styles.signatureLabel}>{data.contratanteNome || (data as any).socio1Nome || ''}</Text>
                                <Text style={styles.signatureSubLabel}>
                                    CPF: {data.contratanteCpf || (data as any).socio1Cpf || ''}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Assinatura do cônjuge (se casado) */}
                    {isPFCasado && (
                        <View style={[styles.signaturesRow, { marginTop: 30, justifyContent: 'flex-end' }]}>
                            <View>
                                <View style={styles.signatureLine}>
                                    <Text style={styles.signatureTitle}>CÔNJUGE</Text>
                                </View>
                                <Text style={styles.signatureLabel}>{data.conjugeNome || ''}</Text>
                                <Text style={styles.signatureSubLabel}>CPF: {data.conjugeCpf || ''}</Text>
                            </View>
                        </View>
                    )}

                    {/* Assinaturas adicionais de sócios */}
                    {isSocios && numSocios > 1 && (
                        <>
                            {Array.from({ length: numSocios - 1 }).map((_, k) => {
                                const idx = k + 2;
                                const prefix = `socio${idx}`;
                                return (
                                    <View key={k} style={[styles.signaturesRow, { marginTop: 30, justifyContent: 'flex-end' }]}>
                                        <View>
                                            <View style={styles.signatureLine}>
                                                <Text style={styles.signatureTitle}>CONTRATANTE {idx}</Text>
                                            </View>
                                            <Text style={styles.signatureLabel}>{(data as any)[`${prefix}Nome`] || ''}</Text>
                                            <Text style={styles.signatureSubLabel}>CPF: {(data as any)[`${prefix}Cpf`] || ''}</Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </>
                    )}
                </View>
            </Page>
        </Document>
    );
};

export default AuthorizationPDF;
