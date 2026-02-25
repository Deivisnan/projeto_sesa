"use client";

import React, { useState, useEffect } from 'react';
import { PackagePlus, Send, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function SolicitacaoMedicamentosPage() {
    const { user } = useAuth();
    const [medicamentosAutorizados, setMedicamentosAutorizados] = useState<any[]>([]);
    const [carrinho, setCarrinho] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (user?.unidade?.id) {
            loadCatalogo(user.unidade.id);
        }
    }, [user]);

    const loadCatalogo = async (id_unidade: string) => {
        try {
            setLoading(true);
            const res = await api.get(`/unidades/${id_unidade}/medicamentos-permitidos`);
            setMedicamentosAutorizados(res.data);
        } catch (error) {
            console.error("Erro ao carregar catálogo base", error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (id_medicamento: string, qtd: number) => {
        setCarrinho(prev => {
            const finalCount = Math.max(0, (prev[id_medicamento] || 0) + qtd);
            const draft = { ...prev };
            if (finalCount === 0) {
                delete draft[id_medicamento];
            } else {
                draft[id_medicamento] = finalCount;
            }
            return draft;
        });
    };

    const handleManualChange = (id_medicamento: string, value: string) => {
        const num = value === "" ? 0 : parseInt(value);
        if (isNaN(num)) return;

        setCarrinho(prev => {
            const finalCount = Math.max(0, num);
            const draft = { ...prev };
            if (finalCount === 0) {
                delete draft[id_medicamento];
            } else {
                draft[id_medicamento] = finalCount;
            }
            return draft;
        });
    };

    const handleSolicitacao = async () => {
        if (Object.keys(carrinho).length === 0) return alert('Adicione pelo menos 1 item ao pedido!');
        setEnviando(true);

        try {
            const orderPayload = {
                itens: Object.entries(carrinho).map(([id_medicamento, quantidade_solicitada]) => ({
                    id_medicamento,
                    quantidade_solicitada
                }))
            };

            await api.post('/solicitacoes', orderPayload); // We need to write this endpoint in Backend later optionally
            setCarrinho({});
            alert('A CAF Municipal registrou seu pedido. Eles vão analisar e despachar via Remessas.');
        } catch (err: any) {
            alert(err.response?.data?.error || 'Ainda há uma necessidade de rota no Backend para solicitações');
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8 flex flex-col h-[calc(100vh-4rem)]">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Nova Requisição</h1>
                <p className="text-slate-500 mt-1">Solicite remessas diretamente da Central (CAF). O cardápio exibe somente insumos mapeados para a sua Unidade.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                {/* Catálogo de Caixinhas */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex space-x-2 items-center">
                        <PackagePlus className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-slate-800">Cardápio Oficial ({medicamentosAutorizados.length})</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {loading ? (
                            <div className="flex justify-center items-center h-full text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin" />
                            </div>
                        ) : medicamentosAutorizados.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                                <AlertCircle className="w-16 h-16 mb-4 opacity-50" />
                                <h3 className="text-lg font-bold text-slate-600 mb-2">Seu acesso está restrito</h3>
                                <p>A Central Administrativa (CAF) não atribuiu nenhum produto ao portfólio da sua unidade ({user?.unidade?.nome}). Eles devem logar na conta SESA deles, acessar o menu "Permissões de Catálogo" e vincular caixas à diretoria de sua localidade para que as abram aqui.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {medicamentosAutorizados.map(med => {
                                    const qtdNoCarrinho = carrinho[med.id] || 0;
                                    return (
                                        <div key={med.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md border border-slate-200 transition-all flex flex-col justify-between">
                                            <div className="mb-4">
                                                <h3 className="font-bold text-slate-900 mb-1 leading-tight">{med.grupo?.nome}</h3>
                                                <p className="text-sm font-medium text-slate-500 line-clamp-2">{med.apresentacao}</p>
                                            </div>
                                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                                <div className="flex items-center bg-slate-50 rounded-lg border border-slate-300">
                                                    <button type="button" onClick={() => addToCart(med.id, -1)} className="px-3 py-1 font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-l-lg transition-colors border-r border-slate-200">-</button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={qtdNoCarrinho === 0 ? "" : qtdNoCarrinho}
                                                        placeholder="0"
                                                        onChange={(e) => handleManualChange(med.id, e.target.value)}
                                                        className="w-14 bg-white text-center font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none py-1"
                                                    />
                                                    <button type="button" onClick={() => addToCart(med.id, 1)} className="px-3 py-1 font-bold text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-r-lg transition-colors border-l border-slate-200">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Resumo do Pedido (Lateral) */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-indigo-100 bg-indigo-50 flex items-center space-x-2">
                        <Send className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-indigo-900">Seu Pedido</h2>
                        <span className="ml-auto bg-indigo-200 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">{Object.keys(carrinho).length}</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {Object.keys(carrinho).length === 0 ? (
                            <p className="text-sm text-slate-400 text-center mt-6">Selecione produtos ao lado ( + ) para iniciar uma Requisição de Insumos.</p>
                        ) : (
                            Object.entries(carrinho).map(([id_med, qtd]) => {
                                const medInfo = medicamentosAutorizados.find(m => m.id === id_med);
                                return (
                                    <div key={id_med} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                                        <div className="max-w-[150px]">
                                            <p className="font-semibold text-slate-800 truncate">{medInfo?.grupo?.nome}</p>
                                            <p className="text-xs text-slate-500 truncate">{medInfo?.apresentacao}</p>
                                        </div>
                                        <div className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">x{qtd}</div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button
                            disabled={enviando || Object.keys(carrinho).length === 0}
                            onClick={handleSolicitacao}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
                        >
                            {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            <span>Gerar Protocolo CAF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
