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

                // Instalação Simples (Sem binding de placement)
                addLog("Finalizando instalação...");
                (window as any).BX24.installFinish();

                setStatus("INSTALAÇÃO CONCLUÍDA!");
                addLog("✅ Instalação finalizada com sucesso!");
                addLog("");
                addLog("📍 O aplicativo foi instalado na conta Bitrix24.");
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
