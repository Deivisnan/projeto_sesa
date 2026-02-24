"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Trash2, CalendarX, ArrowLeft, History, Filter } from "lucide-react";
import Link from "next/link";
import Cookies from 'js-cookie';
import api from '@/services/api';

export default function LotesVencidosPage() {
    const [estoqueVencido, setEstoqueVencido] = useState<any[]>([]);
    const [historicoDescartes, setHistoricoDescartes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processando, setProcessando] = useState<string | null>(null);
    const [aba, setAba] = useState<'A_DESCARTAR' | 'HISTORICO'>('A_DESCARTAR');

    const loadVencidos = async () => {
        try {
            setLoading(true);
            const userStr = Cookies.get('sysfarma.user');
            if (!userStr) throw new Error("Usuário não encontrado nos Cookies");

            const user = JSON.parse(userStr);
            const idToFetch = user.unidade?.id || user.id_unidade;
            const res = await api.get(`/estoque/vencidos/${idToFetch}`);
            setEstoqueVencido(res.data);

            const resHist = await api.get(`/estoque/descarte/historico/${idToFetch}`);
            setHistoricoDescartes(resHist.data);
        } catch (err) {
            console.error("Erro ao carregar vencidos", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVencidos();
    }, []);

    const handleDescartar = async (idEstoque: string, loteStr: string) => {
        if (!confirm(`Tem certeza que deseja registrar o descarte do Lote Vencido ${loteStr}? A quantia será permanentemente zerada no sistema e um log de auditoria será gravado.`)) return;

        try {
            setProcessando(idEstoque);
            await api.post(`/estoque/descarte/${idEstoque}`);
            alert('Descarte registrado com sucesso!');
            loadVencidos();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao descartar");
        } finally {
            setProcessando(null);
        }
    };

    const totalUnidadesVencidas = estoqueVencido.reduce((acc, curr) => acc + curr.quantidade, 0);

    return (
        <div className="p-8 w-full max-w-7xl mx-auto min-h-[85vh]">
            <div className="mb-8">
                <Link href="/caf/estoque" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-indigo-600 mb-4 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Voltar para Estoque Central
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <ShieldAlert className="w-8 h-8 text-rose-600" /> Quarentena (Lotes Vencidos)
                        </h1>
                        <p className="text-slate-500 mt-1">Isolamento virtual de registros físicos para descarte administrativo seguro.</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-right">
                        <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">Saldo Morto na CAF</p>
                        <p className="text-2xl font-black text-rose-700">{totalUnidadesVencidas.toLocaleString('pt-BR')} <span className="text-sm font-medium text-rose-600">un</span></p>
                    </div>
                </div>
            </div>

            <div className="flex space-x-2 mb-6 border-b border-slate-200">
                <button
                    onClick={() => setAba('A_DESCARTAR')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${aba === 'A_DESCARTAR' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <CalendarX className="w-5 h-5" />
                    Lotes na Quarentena
                </button>
                <button
                    onClick={() => setAba('HISTORICO')}
                    className={`px-6 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${aba === 'HISTORICO' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                >
                    <History className="w-5 h-5" />
                    Histórico de Descartes
                </button>
            </div>

            {aba === 'A_DESCARTAR' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                        <CalendarX className="w-5 h-5 text-slate-400" />
                        <span className="font-semibold text-slate-700">Lotes Agendados para Destruição</span>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Lote / Validade</th>
                                <th className="px-6 py-4">Medicamento Categoria</th>
                                <th className="px-6 py-4 text-center">Dias Vencidos</th>
                                <th className="px-6 py-4 text-center">Unidades</th>
                                <th className="px-6 py-4 text-right">Ação Logística</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-500">
                                        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
                                        Inspecionando armazéns virtuais...
                                    </td>
                                </tr>
                            ) : estoqueVencido.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-16 text-center text-slate-500 flex-col items-center">
                                        <ShieldAlert className="w-12 h-12 text-teal-200 mx-auto mb-3" />
                                        <p className="text-lg font-medium text-slate-700">Galpão Saudável!</p>
                                        <p className="text-sm mt-1">Nenhum lote com data de validade estourada encontrado no momento.</p>
                                    </td>
                                </tr>
                            ) : (
                                estoqueVencido.map((item) => {
                                    const msAtraso = new Date().getTime() - new Date(item.lote.data_validade).getTime();
                                    const diasAtraso = Math.floor(msAtraso / (1000 * 60 * 60 * 24));

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 font-mono tracking-tight">{item.lote.codigo_lote}</div>
                                                <div className="text-xs font-semibold text-rose-500 mt-0.5">Venceu em: {new Date(item.lote.data_validade).toLocaleDateString('pt-BR')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{item.lote.medicamento?.grupo?.nome}</div>
                                                <div className="text-xs text-slate-500">{item.lote.medicamento?.apresentacao}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm">
                                                    - {diasAtraso} dias
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-lg font-black text-slate-700">{item.quantidade}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDescartar(item.id, item.lote.codigo_lote)}
                                                    disabled={processando === item.id}
                                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                                                >
                                                    {processando === item.id ? (
                                                        <div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                    Registrar Descarte
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {aba === 'HISTORICO' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-slate-400" />
                            <span className="font-semibold text-slate-700">Comprovantes de Baixa Administrativa</span>
                        </div>
                    </div>

                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Data e Hora</th>
                                <th className="px-6 py-4">Lote Destruído</th>
                                <th className="px-6 py-4">Responsável</th>
                                <th className="px-6 py-4 text-center">Unidades Perdidas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {historicoDescartes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-12 text-center text-slate-500">
                                        Nenhum registro de descarte efetuado nesta unidade.
                                    </td>
                                </tr>
                            ) : (
                                historicoDescartes.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                            {new Date(log.data_movimentacao).toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-900 font-mono text-sm">{log.lote.codigo_lote}</div>
                                            <div className="text-xs text-slate-500">{log.lote.medicamento?.grupo?.nome} - {log.lote.medicamento?.apresentacao}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                            {log.usuario.nome}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex font-bold px-2 py-1 rounded bg-slate-100 text-slate-800">
                                                {Math.abs(log.quantidade)}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
