"use client";

import React, { useState, useEffect } from 'react';
import { Truck, Package, MapPin, Search, Loader2, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';

export default function CAFRemessasPage() {
    const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termo, setTermo] = useState('');
    const [processando, setProcessando] = useState<string | null>(null);
    const [modalAlert, setModalAlert] = useState<{ show: boolean, solId: string, item: string, tentou: number, disponivel: number, itemId: string, idMedicamento: string } | null>(null);

    useEffect(() => {
        loadSolicitacoes();
    }, []);

    const loadSolicitacoes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/solicitacoes');
            setSolicitacoes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDespachar = async (id: string) => {
        if (!confirm("Confirmar o despacho físico desta remessa para a Unidade? O status será alterado para DESPACHADA.")) return;

        try {
            setProcessando(id);
            await api.post(`/solicitacoes/${id}/despachar`);
            alert("Remessa despachada com sucesso!");
            loadSolicitacoes();
        } catch (err: any) {
            const erroMsg = err.response?.data?.message || err.response?.data?.error || "";
            if (erroMsg.startsWith("ESTOQUE_INSUFICIENTE|")) {
                const parts = erroMsg.split("|");
                setModalAlert({
                    show: true,
                    solId: id,
                    item: parts[1],
                    disponivel: parseInt(parts[2]),
                    tentou: parseInt(parts[3]),
                    itemId: parts[4],
                    idMedicamento: parts[5]
                });
            } else {
                alert(erroMsg || "Erro ao despachar remessa");
            }
        } finally {
            setProcessando(null);
        }
    };

    const handleAjustarEstoque = async () => {
        if (!modalAlert) return;
        try {
            setProcessando(modalAlert.solId);
            // Salva a nova aprovação truncada pelo estoque disponível
            await api.post(`/solicitacoes/${modalAlert.solId}/aprovar`, {
                itens: [{
                    id_item_solicitacao: modalAlert.itemId,
                    id_medicamento: modalAlert.idMedicamento,
                    quantidade_aprovada: modalAlert.disponivel
                }]
            });
            // Tenta Despachar novamente
            await api.post(`/solicitacoes/${modalAlert.solId}/despachar`);
            alert("Remessa ajustada para o estoque disponível e despachada com sucesso!");
            setModalAlert(null);
            loadSolicitacoes();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao ajustar e despachar");
        } finally {
            setProcessando(null);
        }
    };

    const handleRecusar = async (id: string, motivoAutom?: string) => {
        const motivo = motivoAutom || prompt("Motivo para cancelar a remessa:", "Cancelado por falta de estoque durante separação física.");
        if (motivo === null) return;

        try {
            setProcessando(id);
            await api.post(`/solicitacoes/${id}/recusar`, { motivo });
            alert("Remessa cancelada com sucesso.");
            loadSolicitacoes();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao cancelar remessa");
        } finally {
            setProcessando(null);
        }
    };

    // Aqui queremos focar principalmente nas solicitações que já foram aprovadas (EM_SEPARACAO) 
    // ou mostrar um log das despachadas.
    const filtradas = solicitacoes.filter(s =>
        (s.status === 'EM_SEPARACAO' || s.status === 'DESPACHADA' || s.status === 'ATENDIDA_INTEGRAL') &&
        (s.unidade?.nome.toLowerCase().includes(termo.toLowerCase()) || s.id.includes(termo))
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Truck className="w-8 h-8 text-indigo-600" />
                        Despachar Remessas
                    </h1>
                    <p className="text-slate-500 mt-1">Gerencie a logística final de entrega das caixas que já foram separadas.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar unidade ou remessa..."
                        className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={termo}
                        onChange={e => setTermo(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white border flex flex-col items-center justify-center border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <Package className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg">Não há remessas em separação no momento.</p>
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
                                    {sol.status === 'EM_SEPARACAO' ? (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
                                            Aguardando Envio
                                        </span>
                                    ) : sol.status === 'DESPACHADA' ? (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">
                                            A Caminho
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-bold rounded-full">
                                            Concluída
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                                    <MapPin className="w-4 h-4 text-indigo-500" /> {sol.unidade?.nome}
                                </h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    Aprovado em: {new Date(sol.data_solicitacao).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <div className="p-5 flex-1 bg-white">
                                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase">Conteúdo Aprovado</h4>
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
                            {sol.status === 'EM_SEPARACAO' && (
                                <div className="p-4 border-t border-slate-100 bg-slate-50">
                                    <button
                                        onClick={() => handleDespachar(sol.id)}
                                        disabled={processando === sol.id}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {processando === sol.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Truck className="w-5 h-5" />}
                                        Confirmar Despacho
                                    </button>
                                </div>
                            )}
                            {sol.status === 'DESPACHADA' && (
                                <div className="p-4 border-t border-slate-100 bg-blue-50 text-center">
                                    <p className="text-sm font-bold text-blue-700 flex justify-center items-center gap-2">
                                        <Truck className="w-4 h-4" /> Remessa a caminho do Posto
                                    </p>
                                </div>
                            )}
                            {sol.status === 'ATENDIDA_INTEGRAL' && (
                                <div className="p-4 border-t border-slate-100 bg-green-50 text-center">
                                    <p className="text-sm font-bold text-green-700 flex justify-center items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4" /> Entrega Concluída
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Alerta de Estoque */}
            {modalAlert && modalAlert.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
                        <div className="p-6 border-b border-slate-100 bg-rose-50 flex items-center gap-4">
                            <div className="bg-rose-100 p-3 rounded-full text-rose-600">
                                <Package className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Corte na Separação</h3>
                                <p className="text-sm text-slate-600 mt-1">O estoque baixou desde a etapa de Triagem.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 leading-relaxed">
                                A carga de aprovação listava <strong>{modalAlert.tentou} un</strong> de <strong className="text-indigo-600">{modalAlert.item}</strong>, mas ao tentar despachar o sistema apontou que só restam <strong className="text-rose-600">{modalAlert.disponivel} un</strong> no armazém atualmente.
                            </p>

                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex gap-3 mt-4 text-amber-800 text-sm">
                                <p>Outra liberação recente pode ter consumido esse lote. O sistema bloqueará o envio deste caminhão para evitar furos de balanço. O que deseja fazer?</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-3">
                            <button
                                onClick={() => setModalAlert(null)}
                                className="w-full sm:w-auto px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Reavaliar Manualmente
                            </button>
                            <button
                                onClick={() => { handleRecusar(modalAlert.solId, `Sem estoque de ${modalAlert.item} na fase de expedição de roleta.`); setModalAlert(null); }}
                                className="w-full sm:w-auto px-4 py-2 bg-white border border-rose-300 font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shadow-sm"
                            >
                                Impedir Viagem (Cancelar Carga)
                            </button>
                            <button
                                onClick={handleAjustarEstoque}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 border border-transparent font-bold text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                Reajustar com o que Tem ({modalAlert.disponivel})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
