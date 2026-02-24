"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Package, CheckCircle2, Clock, MapPin, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function UnidadeRecebimentosPage() {
    const { user } = useAuth();
    const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processando, setProcessando] = useState<string | null>(null);

    useEffect(() => {
        if (user?.unidade?.id) {
            loadSolicitacoes();
        }
    }, [user]);

    const loadSolicitacoes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/solicitacoes');
            // Como a rota /solicitacoes ja filtra se for Unidade (Controller verifica tipo_unidade)
            setSolicitacoes(res.data);
        } catch (error) {
            console.error("Erro ao carregar remessas da unidade", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReceber = async (id: string) => {
        if (!confirm("Confirmar que você recebeu as caixas físicas listadas na nota?")) return;

        try {
            setProcessando(id);
            await api.post(`/solicitacoes/${id}/receber`);
            alert("Recebimento confirmado! Remessa registrada como concluída.");
            loadSolicitacoes();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao confirmar recebimento");
        } finally {
            setProcessando(null);
        }
    };

    // Apenas pacotes que saíram da CAF (Despachadas) ou que já foram Entregues/Recusados.
    const filtradas = solicitacoes.filter(s =>
        (s.status === 'DESPACHADA' || s.status === 'ATENDIDA_INTEGRAL' || s.status === 'RECUSADA')
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Truck className="w-8 h-8 text-indigo-600" />
                        Receber Remessas
                    </h1>
                    <p className="text-slate-500 mt-1">Acuse o recebimento físico dos pacotes expedidos pelo Almoxarifado Central.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white border flex flex-col items-center justify-center border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <Package className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg">Você não possui entregas a caminho no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtradas.map(sol => (
                        <div key={sol.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-5 border-b border-slate-100 bg-slate-50">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded">
                                        PROTOCOLO: {sol.id.split('-')[0].toUpperCase()}
                                    </div>
                                    {sol.status === 'DESPACHADA' ? (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                            A Caminho
                                        </span>
                                    ) : sol.status === 'RECUSADA' ? (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
                                            Cancelada
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                            Recebida
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-indigo-500" /> CAF Municipal
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    Pedido de: {new Date(sol.data_solicitacao).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div className="p-5 flex-1 bg-white">
                                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">Conteúdo do Caminhão</h4>
                                <div className="space-y-2">
                                    {sol.itens?.filter((i: any) => i.quantidade_aprovada > 0).map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center text-sm pb-2 border-b border-slate-50 last:border-0">
                                            <span className="text-slate-700 font-medium truncate max-w-[180px]" title={item.medicamento?.grupo?.nome}>
                                                {item.medicamento?.grupo?.nome}
                                            </span>
                                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                {item.quantidade_aprovada} un
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {sol.status === 'DESPACHADA' && (
                                <div className="p-4 border-t border-slate-100 bg-blue-50">
                                    <button
                                        onClick={() => handleReceber(sol.id)}
                                        disabled={processando === sol.id}
                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {processando === sol.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                                        Confirmar Recebimento (Lote Entregue)
                                    </button>
                                </div>
                            )}
                            {sol.status === 'ATENDIDA_INTEGRAL' && (
                                <div className="p-4 border-t border-slate-100 bg-green-50 text-center">
                                    <p className="text-sm font-bold text-green-700 flex justify-center items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Entregue com Sucesso!
                                    </p>
                                </div>
                            )}
                            {sol.status === 'RECUSADA' && (
                                <div className="p-4 border-t border-slate-100 bg-rose-50 text-center">
                                    <p className="text-sm font-bold text-rose-700 flex flex-col justify-center items-center gap-1">
                                        <span>Pedido Cancelado por Falta de Estoque na CAF.</span>
                                        <span className="text-xs font-normal">Tente realizar um novo pedido em outra data ou contate o Coordenador Logístico.</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
