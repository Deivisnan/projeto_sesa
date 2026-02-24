"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Beaker, FileText, CheckCircle2, Clock, MapPin, Search, Loader2, Download } from 'lucide-react';
import api from '@/services/api';

export default function CAFSolicitacoesPage() {
    const [solicitacoes, setSolicitacoes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [termo, setTermo] = useState('');
    const [processando, setProcessando] = useState<string | null>(null);
    const [quantidadesAprovadas, setQuantidadesAprovadas] = useState<Record<string, Record<string, number>>>({});
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [modalAlert, setModalAlert] = useState<{ show: boolean, solId: string, item: string, tentou: number, disponivel: number, itemId: string } | null>(null);

    useEffect(() => {
        loadSolicitacoes();
    }, []);

    const loadSolicitacoes = async () => {
        try {
            setLoading(true);
            const res = await api.get('/solicitacoes');
            // Inicializar state com quantidade total igual à solicitada
            const initialQtds: Record<string, Record<string, number>> = {};
            res.data.forEach((sol: any) => {
                if (sol.status === 'AGUARDANDO_ANALISE') {
                    initialQtds[sol.id] = {};
                    sol.itens.forEach((it: any) => {
                        initialQtds[sol.id][it.id] = it.quantidade_solicitada;
                    });
                }
            });
            setQuantidadesAprovadas(initialQtds);
            setSolicitacoes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAprovar = async (solic: any) => {
        try {
            setProcessando(solic.id);
            const itensAprovados = solic.itens.map((it: any) => ({
                id_item_solicitacao: it.id,
                id_medicamento: it.id_medicamento,
                quantidade_aprovada: quantidadesAprovadas[solic.id]?.[it.id] ?? 0
            }));

            await api.post(`/solicitacoes/${solic.id}/aprovar`, { itens: itensAprovados });
            alert("Pedido aprovado e enviado para separação com sucesso!");
            loadSolicitacoes();
        } catch (err: any) {
            const erroMsg = err.response?.data?.message || err.response?.data?.error || "";
            if (erroMsg.startsWith("ESTOQUE_INSUFICIENTE|")) {
                const parts = erroMsg.split("|");
                setModalAlert({
                    show: true,
                    solId: solic.id,
                    item: parts[1],
                    disponivel: parseInt(parts[2]),
                    tentou: parseInt(parts[3]),
                    itemId: parts[4]
                });
            } else {
                alert(erroMsg || "Erro ao aprovar pedido");
            }
        } finally {
            setProcessando(null);
        }
    };

    const handleRecusar = async (id: string, motivoAutom?: string) => {
        const motivo = motivoAutom || prompt("Motivo da recusa (opcional):", "Falta de estoque");
        if (motivo === null) return;

        try {
            setProcessando(id);
            await api.post(`/solicitacoes/${id}/recusar`, { motivo });
            alert("Solicitação recusada com sucesso.");
            loadSolicitacoes();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao recusar");
        } finally {
            setProcessando(null);
        }
    };

    const handleAjustarEstoque = () => {
        if (!modalAlert) return;
        handleQtdChange(modalAlert.solId, modalAlert.itemId, modalAlert.disponivel.toString());
        setModalAlert(null);
        alert(`A quantidade de ${modalAlert.item} foi ajustada para ${modalAlert.disponivel}. Você pode revisar e então tentar Aprovar novamente na tabela externa.`);
    };

    const handleQtdChange = (id_solic: string, id_item: string, val: string) => {
        setQuantidadesAprovadas(prev => ({
            ...prev,
            [id_solic]: {
                ...prev[id_solic],
                [id_item]: parseInt(val) || 0
            }
        }));
    };

    const handleExportar = async (formato: 'csv' | 'pdf') => {
        if (!dataInicio || !dataFim) {
            alert("Selecione a data de Início e Fim para exportar o relatório.");
            return;
        }

        try {
            // Agora a API retorna JSON puro
            const response = await api.get(`/solicitacoes/relatorio?start=${dataInicio}&end=${dataFim}`);
            const solicitacoes = response.data;

            if (!solicitacoes || solicitacoes.length === 0) {
                alert("Nenhum dado encontrado neste período.");
                return;
            }

            // Preparar matriz de dados
            const rows: any[] = [];
            solicitacoes.forEach((sol: any) => {
                sol.itens.forEach((it: any) => {
                    rows.push([
                        sol.id.split('-')[0].toUpperCase(),
                        new Date(sol.data_solicitacao).toLocaleDateString('pt-BR'),
                        sol.status,
                        sol.unidade?.nome || 'Desconhecida',
                        `${it.medicamento?.grupo?.nome} - ${it.medicamento?.apresentacao}`,
                        it.quantidade_solicitada,
                        it.quantidade_aprovada
                    ]);
                });
            });

            if (formato === 'csv') {
                const header = "Protocolo;Data;Status;Unidade;Medicamento;Qtd Solicitada;Qtd Aprovada\n";
                const csvContent = header + rows.map(r => r.map((c: any) => `"${c}"`).join(';')).join('\n');

                const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('link');
                link.href = url;
                link.setAttribute('download', `relatorio_caf_${dataInicio}_a_${dataFim}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
            } else if (formato === 'pdf') {
                const { jsPDF } = await import('jspdf');
                const autoTable = (await import('jspdf-autotable')).default;

                const doc = new jsPDF('landscape');
                doc.setFontSize(14);
                doc.text(`Relatório Logístico CAF - Período: ${new Date(dataInicio).toLocaleDateString('pt-BR')} até ${new Date(dataFim).toLocaleDateString('pt-BR')}`, 14, 15);

                autoTable(doc, {
                    startY: 20,
                    head: [['Protocolo', 'Data', 'Status', 'Unidade', 'Medicamento', 'Solicitado', 'Aprovado']],
                    body: rows,
                    theme: 'striped',
                    styles: { fontSize: 8 }
                });

                doc.save(`relatorio_caf_${dataInicio}_a_${dataFim}.pdf`);
            }
        } catch (err: any) {
            console.error(err);
            alert("Erro ao exportar relatório. Verifique se há dados no período ou se a API está online.");
        }
    };

    const filtradas = solicitacoes.filter(s =>
        s.unidade?.nome.toLowerCase().includes(termo.toLowerCase()) ||
        s.id.includes(termo)
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Análise de Pedidos (Triagem)</h1>
                    <p className="text-slate-500 mt-1">Visualize e despache os pedidos de suprimentos feitos pelas Unidades da rede.</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 py-2 shadow-sm">
                        <input
                            type="date"
                            className="text-sm text-slate-600 outline-none bg-transparent"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                        />
                        <span className="text-slate-400">até</span>
                        <input
                            type="date"
                            className="text-sm text-slate-600 outline-none bg-transparent"
                            value={dataFim}
                            onChange={e => setDataFim(e.target.value)}
                        />
                        <button
                            onClick={() => handleExportar('csv')}
                            className="ml-2 flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                            <Download className="w-3 h-3" /> CSV
                        </button>
                        <button
                            onClick={() => handleExportar('pdf')}
                            className="ml-1 flex items-center gap-1 bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded text-xs font-bold transition-colors"
                        >
                            <Download className="w-3 h-3" /> PDF
                        </button>
                    </div>

                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por unidade ou protocolo..."
                            className="pl-9 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                            value={termo}
                            onChange={e => setTermo(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white border flex flex-col items-center justify-center border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                    <Activity className="w-16 h-16 mb-4 text-slate-300" />
                    <p className="text-lg">Nenhum pedido encontrado na fila de análise.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filtradas.map((sol) => (
                        <div key={sol.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-indigo-500" />
                                        {sol.unidade?.nome}
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 ml-2">{sol.unidade?.tipo}</span>
                                    </h3>
                                    <p className="text-sm text-slate-500 flex items-center gap-1">
                                        <FileText className="w-4 h-4" /> Protocolo: <span className="font-mono text-xs">{sol.id.split('-')[0]}</span>
                                        <span className="mx-2">•</span>
                                        <Clock className="w-4 h-4" /> {new Date(sol.data_solicitacao).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {sol.status === 'AGUARDANDO_ANALISE' ? (
                                        <>
                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-sm font-semibold rounded-full border border-amber-200 mr-2">
                                                <Clock className="w-4 h-4" /> Pendente
                                            </span>
                                            <button
                                                onClick={() => handleRecusar(sol.id)}
                                                disabled={processando === sol.id}
                                                className="px-4 py-2 bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 disabled:opacity-50 text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
                                            >
                                                Recusar
                                            </button>
                                            <button
                                                onClick={() => handleAprovar(sol)}
                                                disabled={processando === sol.id}
                                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-lg shadow transition-colors flex items-center gap-2"
                                            >
                                                {processando === sol.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                                Aprovar e Separar
                                            </button>
                                        </>
                                    ) : sol.status === 'RECUSADA' ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 text-sm font-semibold rounded-full border border-rose-200">
                                            Recusada
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-semibold rounded-full border border-indigo-200">
                                            <CheckCircle2 className="w-4 h-4" /> Em Separação
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 bg-white">
                                <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Itens Solicitados ({sol.itens?.length || 0})</h4>
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {sol.itens?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                                            <div className="flex gap-3 items-center flex-1">
                                                <div className="bg-indigo-100 p-2 rounded text-indigo-600"><Beaker className="w-4 h-4" /></div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm line-clamp-1">{item.medicamento?.grupo?.nome || 'Desconhecido'}</p>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{item.medicamento?.apresentacao}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs text-slate-500 font-medium pb-1">Solicitado: {item.quantidade_solicitada}</span>
                                                    {sol.status === 'AGUARDANDO_ANALISE' ? (
                                                        <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                                                            <span className="bg-slate-100 px-2 py-1 text-xs text-slate-500 font-semibold border-r border-slate-300">Aprovar:</span>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="w-16 px-2 py-1 text-sm font-bold text-indigo-700 outline-none"
                                                                value={quantidadesAprovadas[sol.id]?.[item.id] !== undefined ? quantidadesAprovadas[sol.id][item.id] : item.quantidade_solicitada}
                                                                onChange={(e) => handleQtdChange(sol.id, item.id, e.target.value)}
                                                            />
                                                        </div>
                                                    ) : (
                                                        <p className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-sm">Aprovado: {item.quantidade_aprovada}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
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
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Estoque Insuficiente em Sistema</h3>
                                <p className="text-sm text-slate-600 mt-1">Fora de prateleira na CAF Municipal.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-slate-600 leading-relaxed">
                                Você tentou aprovar <strong>{modalAlert.tentou} un</strong> de <strong className="text-indigo-600">{modalAlert.item}</strong>, mas o depósito central acusa saldo de apenas <strong className="text-rose-600">{modalAlert.disponivel} un</strong> na prateleira atual.
                            </p>

                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 flex gap-3 mt-4 text-amber-800 text-sm">
                                <p>Como a quantidade contida na remessa é maior do que a nossa estocagem suporta hoje, a etapa de separação física irá falhar. Escolha como proceder o envio da carga:</p>
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end items-center gap-3">
                            <button
                                onClick={() => setModalAlert(null)}
                                className="w-full sm:w-auto px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Reavaliar Manuais
                            </button>
                            <button
                                onClick={() => { handleRecusar(modalAlert.solId, `Sem estoque de ${modalAlert.item}`); setModalAlert(null); }}
                                className="w-full sm:w-auto px-4 py-2 bg-white border border-rose-300 font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shadow-sm"
                            >
                                Abortar Remessa Inteira
                            </button>
                            <button
                                onClick={handleAjustarEstoque}
                                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 border border-transparent font-bold text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
                            >
                                Enviar o que Tem ({modalAlert.disponivel})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
