"use client";

import React, { useState, useMemo } from 'react';
import { Package, Layers, Search, LayoutGrid, ChevronDown, ChevronRight, List, Filter, HelpCircle, X, Download, ShieldAlert } from "lucide-react";
import Link from 'next/link';

export default function EstoqueTable({ estoqueInicial }: { estoqueInicial: any[] }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedGrupos, setExpandedGrupos] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [showSupplyTooltip, setShowSupplyTooltip] = useState(false);

    // Agrupamento do estoque
    const agrupado = useMemo(() => {
        const mapa = new Map<string, any>();

        estoqueInicial.forEach((item: any) => {
            const medId = item.lote.medicamento.id;

            if (!mapa.has(medId)) {
                mapa.set(medId, {
                    medicamentoId: medId,
                    nomePai: item.lote.medicamento.grupo?.nome || 'Desconhecido',
                    apresentacao: item.lote.medicamento.apresentacao,
                    codigoBr: item.lote.medicamento.codigo_br,
                    estoqueMinimo: item.lote.medicamento.estoque_minimo,
                    quantidadeTotal: 0,
                    lotes: []
                });
            }

            const grupo = mapa.get(medId)!;
            grupo.quantidadeTotal += item.quantidade;
            grupo.lotes.push({
                ...item.lote,
                estoqueAtual: item.quantidade
            });
        });

        const arr = Array.from(mapa.values());

        // Aplica filtro de busca se houver
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return arr.filter(g =>
                g.nomePai.toLowerCase().includes(q) ||
                g.apresentacao.toLowerCase().includes(q) ||
                g.lotes.some((l: any) => l.codigo_lote.toLowerCase().includes(q))
            );
        }

        return arr;
    }, [estoqueInicial, searchQuery]);

    const toggleExpand = (medId: string) => {
        setExpandedGrupos(prev =>
            prev.includes(medId) ? prev.filter(id => id !== medId) : [...prev, medId]
        );
    };

    const handleExportarPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF('portrait');
            doc.setFontSize(14);
            doc.text(`Relatório do Estoque Central CAF - ${new Date().toLocaleDateString('pt-BR')}`, 14, 15);

            const rows: any[] = [];

            // Usamos os dados 'agrupado' para exportar a mesma visão filtrada atual
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            agrupado.forEach((grupo: any) => {
                const isLowStock = grupo.quantidadeTotal <= grupo.estoqueMinimo;

                // Encontra a data de validade mais próxima (crítica) dentre os lotes ativos
                let validadeMaisProxima: Date | null = null;
                let isVencido = false;

                if (grupo.lotes && grupo.lotes.length > 0) {
                    const sortedLotes = [...grupo.lotes].sort((a: any, b: any) =>
                        new Date(a.data_validade).getTime() - new Date(b.data_validade).getTime()
                    );
                    validadeMaisProxima = new Date(sortedLotes[0].data_validade);
                    validadeMaisProxima.setHours(0, 0, 0, 0);
                    isVencido = validadeMaisProxima < hoje;
                }

                const validadeStr = validadeMaisProxima
                    ? `${validadeMaisProxima.toLocaleDateString('pt-BR')} ${isVencido ? '(VENCIDO)' : ''}`
                    : 'N/A';

                rows.push([
                    grupo.nomePai,
                    grupo.apresentacao,
                    grupo.estoqueMinimo,
                    grupo.lotes.length,
                    `${grupo.quantidadeTotal.toLocaleString()} ${isLowStock ? '(ALERTA)' : ''}`,
                    validadeStr
                ]);
            });

            if (rows.length === 0) {
                alert("Nenhum dado disponível para exportar no arquivo atual.");
                return;
            }

            autoTable(doc, {
                startY: 20,
                head: [['Medicamento', 'Apresentação', 'Estq Mín.', 'Qtd Lotes', 'Volume Físico', 'Vencimento Mais Próximo']],
                body: rows,
                theme: 'striped',
                styles: { fontSize: 8 },
                headStyles: { fillColor: [15, 23, 42] } // slate-900 color
            });

            doc.save(`estoque_central_caf_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err: any) {
            console.error("Erro ao gerar PDF:", err);
            alert("Não foi possível gerar o arquivo PDF.");
        }
    };

    // Calculate supply status metrics
    const lowStockCount = agrupado.filter(g => g.quantidadeTotal <= g.estoqueMinimo).length;
    const totalItems = agrupado.length;
    const lowStockRatio = totalItems > 0 ? lowStockCount / totalItems : 0;

    const volumeTotalUnidades = agrupado.reduce((acc, curr) => acc + curr.quantidadeTotal, 0);

    let supplyStatus = "Saudável";
    let supplyClass = "from-teal-600 to-slate-900";
    let supplySubtext = "Todos os itens dentro do ideal";

    if (totalItems > 0) {
        if (lowStockRatio >= 0.7) {
            supplyStatus = "Crítico";
            supplyClass = "from-red-600 to-slate-900";
            supplySubtext = "Mais de 70% dos itens do catálogo abaixo do mínimo";
        } else if (lowStockRatio >= 0.15) {
            supplyStatus = "Em Alerta";
            supplyClass = "from-amber-500 to-slate-900";
            supplySubtext = "Verifique os itens em baixa";
        } else if (lowStockCount > 0) {
            supplyStatus = "Atenção";
            supplyClass = "from-indigo-600 to-slate-900";
            supplySubtext = `${lowStockCount} item(s) com estoque baixo`;
        }
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Variedades no Galpão</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {agrupado.length}
                        </h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Volume Físico (Un.)</p>
                        <h3 className="text-2xl font-bold text-slate-900">{volumeTotalUnidades.toLocaleString('pt-BR')}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                        <List className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Lotes Únicos</p>
                        <h3 className="text-2xl font-bold text-slate-900">{estoqueInicial.length}</h3>
                    </div>
                </div>
                <div className={`bg-gradient-to-br ${supplyClass} p-6 rounded-2xl shadow-md border border-slate-100 flex flex-col justify-center text-white relative`}>
                    <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-white/80">Status de Abastecimento</p>
                        <button onClick={() => setShowSupplyTooltip(!showSupplyTooltip)} className="text-white/50 hover:text-white transition-colors focus:outline-none" title="Entenda o cálculo">
                            <HelpCircle className="w-4 h-4 cursor-pointer" />
                        </button>
                    </div>
                    <h3 className="text-2xl font-bold">{supplyStatus}</h3>
                    <span className="text-xs text-white/60 mt-1">{supplySubtext}</span>

                    {/* Tooltip Explicativo */}
                    {showSupplyTooltip && (
                        <div className="absolute top-14 left-1/2 -translate-x-1/2 w-72 bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in slide-in-from-top-2 duration-200">
                            <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                <span className="font-bold text-white uppercase tracking-wider text-[10px]">Glossário de Saúde</span>
                                <button onClick={() => setShowSupplyTooltip(false)} className="text-slate-500 hover:text-white">
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div><strong className="text-teal-400">Saudável:</strong> 100% da variedade de princípios ativos opera com segurança acima do limite mínimo estipulado.</div>
                                <div><strong className="text-indigo-400">Atenção:</strong> Pelo menos 1 tipo de medicamento entrou em defasagem (abaixo do mínimo). Fique de olho.</div>
                                <div><strong className="text-amber-400">Em Alerta:</strong> Mais de 15% de toda a variedade de medicamentos do galpão quebrou o estoque de segurança mínimo. Ação preventiva para repor o mix sugerida.</div>
                                <div><strong className="text-red-400">Crítico:</strong> 70% ou mais dos tipos de medicamentos do galpão encontram-se abaixo dos níveis de segurança (Risco de Desabastecimento Amplo). Ação imediata!</div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mb-6 flex justify-end">
                <Link href="/caf/estoque/vencidos">
                    <button className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 px-4 py-2 rounded-xl transition-all shadow-sm font-bold shadow-rose-100/50">
                        <ShieldAlert className="w-5 h-5" />
                        Acessar Quarentena (Vencidos)
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar no galpão por nome ou lote..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Visualização em Lista"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-md flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
                                title="Visualização em Cards"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleExportarPDF}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm flex items-center shadow-sm transition-colors space-x-2"
                            title="Baixar lista atual em PDF"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar PDF</span>
                        </button>
                        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg text-sm hover:bg-slate-50 flex items-center space-x-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>

                {viewMode === "list" ? (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                            <tr>
                                <th className="w-12 px-4 py-4"></th>
                                <th className="px-6 py-4">Medicamento / Suprimento</th>
                                <th className="px-6 py-4">Estoque Mínimo</th>
                                <th className="px-6 py-4">Lotes Ativos</th>
                                <th className="px-6 py-4 text-right">Quantidade Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {agrupado.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        Nenhum estoque registrado na CAF ou filtro não encontrou resultados.
                                    </td>
                                </tr>
                            ) : (
                                agrupado.map((grupo: any) => {
                                    const isExpanded = expandedGrupos.includes(grupo.medicamentoId);
                                    const isLowStock = grupo.quantidadeTotal <= grupo.estoqueMinimo;

                                    return (
                                        <React.Fragment key={grupo.medicamentoId}>
                                            {/* Row PAI */}
                                            <tr
                                                onClick={() => toggleExpand(grupo.medicamentoId)}
                                                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-4 text-center">
                                                    <button className="text-slate-400 group-hover:text-teal-600 transition-colors">
                                                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-900">{grupo.nomePai}</span>
                                                        <span className="text-sm text-slate-500">{grupo.apresentacao}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {grupo.estoqueMinimo} un.
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                                                        {grupo.lotes.length} lote(s)
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className={`text-xl font-bold tracking-tight border-b-2 pb-0.5 ${isLowStock ? 'text-red-600 border-red-500/30' : 'text-slate-900 border-teal-500/30'}`}>
                                                            {grupo.quantidadeTotal.toLocaleString()} un.
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Rows FILHAS */}
                                            {isExpanded && grupo.lotes.map((lote: any) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const validade = new Date(lote.data_validade);
                                                validade.setHours(0, 0, 0, 0);

                                                // Diff in days
                                                const diffTime = validade.getTime() - today.getTime();
                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                let statusColor = 'bg-teal-400';
                                                let textStatusColor = 'text-teal-700';
                                                let tagBg = 'bg-teal-50';
                                                let labelValidade = 'No Prazo';

                                                if (diffDays < 0) {
                                                    statusColor = 'bg-red-500';
                                                    textStatusColor = 'text-red-700';
                                                    tagBg = 'bg-red-50 border-red-200';
                                                    labelValidade = 'Vencido';
                                                } else if (diffDays <= 90) {
                                                    statusColor = 'bg-amber-400';
                                                    textStatusColor = 'text-amber-700';
                                                    tagBg = 'bg-amber-50 border-amber-200';
                                                    labelValidade = diffDays === 0 ? 'Vence Hoje' : `${diffDays} dias`;
                                                }

                                                return (
                                                    <tr key={lote.id} className="bg-slate-50/80 border-t border-dashed border-slate-200 hover:bg-slate-100/80 transition-colors">
                                                        <td className="px-4 py-3"></td>
                                                        <td className="px-6 py-3 pl-12" colSpan={2}>
                                                            <div className="flex items-center space-x-3">
                                                                <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
                                                                <span className="text-sm font-medium text-slate-700">
                                                                    Lote: <span className="font-mono text-indigo-700">{lote.codigo_lote}</span>
                                                                </span>
                                                                <span className="text-xs text-slate-500 px-2 border-l border-slate-300">
                                                                    {lote.fornecedor.razao_social}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Validade</span>
                                                                    <span className={`text-sm font-bold ${diffDays < 0 ? 'text-red-600' : 'text-slate-700'}`}>
                                                                        {validade.toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${tagBg} ${textStatusColor}`}>
                                                                    {labelValidade}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            <span className="text-sm font-semibold text-slate-700 bg-white px-3 py-1 rounded border border-slate-200">
                                                                {lote.estoqueAtual.toLocaleString()} un.
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50/50">
                        {agrupado.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                Nenhum estoque registrado na CAF ou filtro não encontrou resultados.
                            </div>
                        ) : (
                            agrupado.map((grupo: any) => {
                                const isExpanded = expandedGrupos.includes(grupo.medicamentoId);
                                const isLowStock = grupo.quantidadeTotal <= grupo.estoqueMinimo;

                                return (
                                    <div key={grupo.medicamentoId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                                        <div className="p-5 border-b border-slate-100 flex-1">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1 pr-3">
                                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{grupo.nomePai}</h4>
                                                    <p className="text-sm text-slate-500 mt-1">{grupo.apresentacao}</p>
                                                </div>
                                                <div className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${isLowStock ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>
                                                    {grupo.quantidadeTotal.toLocaleString()} un.
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 mt-4 bg-slate-50 p-2 rounded-lg">
                                                <div className="flex items-center space-x-1.5">
                                                    <Package className="w-3.5 h-3.5 text-slate-400" />
                                                    <span><span className="font-semibold text-slate-700">{grupo.lotes.length}</span> lote(s)</span>
                                                </div>
                                                <div className="flex items-center space-x-1.5">
                                                    <span>Min: <span className="font-semibold text-slate-700">{grupo.estoqueMinimo}</span></span>
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="bg-slate-50/80 p-4 border-b border-slate-100 flex flex-col space-y-3 max-h-[300px] overflow-y-auto">
                                                {grupo.lotes.map((lote: any) => {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const validade = new Date(lote.data_validade);
                                                    validade.setHours(0, 0, 0, 0);

                                                    const diffTime = validade.getTime() - today.getTime();
                                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                    let statusColor = 'bg-teal-400';
                                                    let textStatusColor = 'text-teal-700';
                                                    let tagBg = 'bg-teal-50';
                                                    let labelValidade = 'No Prazo';

                                                    if (diffDays < 0) {
                                                        statusColor = 'bg-red-500';
                                                        textStatusColor = 'text-red-700';
                                                        tagBg = 'bg-red-50 border-red-200';
                                                        labelValidade = 'Vencido';
                                                    } else if (diffDays <= 90) {
                                                        statusColor = 'bg-amber-400';
                                                        textStatusColor = 'text-amber-700';
                                                        tagBg = 'bg-amber-50 border-amber-200';
                                                        labelValidade = diffDays === 0 ? 'Vence Hoje' : `${diffDays} dias`;
                                                    }

                                                    return (
                                                        <div key={lote.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm relative">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${statusColor}`}></div>
                                                            <div className="flex justify-between items-start pl-2 mb-2">
                                                                <div>
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Lote</div>
                                                                    <div className="font-mono text-sm font-bold text-indigo-700">{lote.codigo_lote}</div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Qtd.</div>
                                                                    <div className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{lote.estoqueAtual.toLocaleString()}</div>
                                                                </div>
                                                            </div>
                                                            <div className="flex justify-between items-end pl-2 mt-3">
                                                                <div className="text-xs text-slate-500 truncate max-w-[120px] font-medium" title={lote.fornecedor.razao_social}>
                                                                    {lote.fornecedor.razao_social}
                                                                </div>
                                                                <div className="flex flex-col items-end space-y-1">
                                                                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded border ${tagBg} ${textStatusColor}`}>
                                                                        {labelValidade}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-slate-600">{validade.toLocaleDateString()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <button
                                            onClick={() => toggleExpand(grupo.medicamentoId)}
                                            className="w-full py-3 bg-slate-50 hover:bg-slate-100/80 text-teal-600 text-sm font-semibold flex items-center justify-center space-x-1.5 transition-colors border-t border-slate-100"
                                        >
                                            <span>{isExpanded ? "Ocultar Lotes" : "Ver Lotes"}</span>
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
