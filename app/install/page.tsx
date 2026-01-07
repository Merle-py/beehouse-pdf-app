'use client';

import { useEffect, useState } from 'react';

export default function InstallPage() {
    const [status, setStatus] = useState('Iniciando...');
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, `> ${msg}`]);

    useEffect(() => {
        const install = () => {
            if (typeof window === 'undefined' || !(window as any).BX24) {
                setStatus("ERRO FATAL");
                addLog("BX24 não encontrado. Abra esta página DENTRO do Bitrix24.");
                return;
            }

            (window as any).BX24.init(() => {
                setStatus("Conectado ao Bitrix24");
                addLog("Iniciando instalação...");

                // CONFIGURAÇÕES PARA MENU LATERAL ESQUERDO
                const PLACEMENT = 'APP_SIDEBAR'; // Menu lateral esquerdo principal
                // Substitua pela sua URL na Vercel
                const HANDLER = 'https://beehouse-pdf-app-git-testesw-beehouses-projects.vercel.app/';
                const APP_TITLE = 'Autorizações Beehouse.';
                const APP_DESCRIPTION = 'Sistema de Autorizações de Venda';

                addLog("Placement: " + PLACEMENT);
                addLog("Handler: " + HANDLER);

                // 1. LIMPA INSTALAÇÕES ANTIGAS
                addLog("Limpando instalações antigas...");

                (window as any).BX24.callMethod(
                    'placement.unbind',
                    {
                        PLACEMENT: PLACEMENT,
                        HANDLER: HANDLER
                    },
                    () => {
                        // 2. CRIA NOVA INSTALAÇÃO NO MENU LATERAL
                        addLog("Criando item no menu lateral...");

                        (window as any).BX24.callMethod(
                            'placement.bind',
                            {
                                PLACEMENT: PLACEMENT,
                                HANDLER: HANDLER,
                                TITLE: APP_TITLE,
                                DESCRIPTION: APP_DESCRIPTION
                            },
                            (resBind: any) => {
                                if (resBind.error()) {
                                    console.error("Erro Bind:", resBind.error());
                                    setStatus("FALHA NA INSTALAÇÃO");
                                    addLog("❌ Erro ao criar item no menu: " + JSON.stringify(resBind.error()));
                                    addLog("Verifique se a permissão 'Embedding of applications' está ativa.");
                                } else {
                                    // 3. FINALIZA INSTALAÇÃO
                                    addLog("Finalizando instalação...");
                                    (window as any).BX24.installFinish();

                                    setStatus("INSTALAÇÃO CONCLUÍDA!");
                                    addLog("✅ Item criado no menu lateral esquerdo!");
                                    addLog("✅ Instalação finalizada com sucesso!");
                                    addLog("");
                                    addLog("📍 Agora você pode encontrar 'Autorizações Beehouse'");
                                    addLog("   no menu lateral esquerdo do Bitrix24!");
                                }
                            }
                        );
                    }
                );
            });
        };

        const timer = setTimeout(install, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-10 font-mono text-sm">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-xl border border-gray-200">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Instalador Beehouse</h1>
                        <p className="text-xs text-gray-600 mt-1">Sistema de Autorizações de Venda</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.includes('CONCLUÍDA')
                        ? 'bg-green-100 text-green-700'
                        : status.includes('FALHA')
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                        {status}
                    </span>
                </div>

                <div className="bg-gray-900 text-green-400 p-4 rounded-md h-80 overflow-y-auto shadow-inner font-mono">
                    {logs.length === 0 && <span className="opacity-50">Carregando...</span>}
                    {logs.map((l, i) => (
                        <div key={i} className="mb-1 whitespace-pre-wrap">{l}</div>
                    ))}
                </div>

                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md text-sm">
                    <p className="font-semibold text-blue-900 mb-2">ℹ️ Após a instalação:</p>
                    <ul className="text-blue-800 space-y-1 text-xs">
                        <li>• Procure por "Autorizações Beehouse" no menu lateral esquerdo</li>
                        <li>• Clique para abrir o sistema de autorizações</li>
                        <li>• Configure as variáveis de ambiente na Vercel (B24_ADMIN_WEBHOOK_URL)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
