"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, History, Filter, Loader2, MinusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function UnidadeEstoquePage() {
    const { user } = useAuth();
    const [estoqueLocal, setEstoqueLocal] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    // Modal de Dispensação
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [dispenseQty, setDispenseQty] = useState(1);
    const [dispenseObs, setDispenseObs] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user?.unidade?.id) {
            loadEstoque();
        }
    }, [user]);

    const loadEstoque = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/estoque/${user?.unidade?.id}`);
            setEstoqueLocal(res.data);
        } catch (error) {
            console.error("Erro ao carregar estoque local", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDispensar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItem) return;

        try {
            setIsSaving(true);
            await api.post('/estoque/dispensacao', {
                id_lote: selectedItem.lote.id,
                quantidade: dispenseQty,
                observacao: dispenseObs
            });
            alert("Dispensação realizada com sucesso!");
            setSelectedItem(null);
            setDispenseQty(1);
            setDispenseObs("");
            loadEstoque();
        } catch (err: any) {
            alert(err.response?.data?.message || "Erro ao realizar dispensação");
        } finally {
            setIsSaving(false);
        }
    };

    const filtered = estoqueLocal.filter(item =>
        item.lote?.medicamento?.grupo?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lote?.medicamento?.apresentacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lote?.codigo_lote?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Farmácia Local</h1>
                    <p className="text-slate-500 mt-1">Acervo disponível nos armários físicos da sua Unidade de Saúde.</p>
                </div>
                <button
                    className="bg-white text-slate-600 px-5 py-2.5 rounded-lg flex items-center space-x-2 font-medium border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                    <History className="w-5 h-5" />
                    <span>Histórico de Saídas</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar no armário local..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-x-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-slate-600">
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Medicamento / Apresentação</th>
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Lote / Validade</th>
                                <th className="p-4 font-semibold text-center uppercase text-xs tracking-wider">Saldo</th>
                                <th className="p-4 font-semibold text-right uppercase text-xs tracking-wider">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="w-5 h-5 animate-spin" /> Carregando prateleiras...
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
                                            <Package className="w-16 h-16 opacity-30" />
                                            <h3 className="text-xl font-bold text-slate-600">Seu armário está vazio.</h3>
                                            <p className="max-w-md text-sm">Não há nenhum lote de medicamento vinculado à sua unidade no sistema. Confirme o recebimento de remessas para abastecer.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-800">{item.lote?.medicamento?.grupo?.nome}</p>
                                            <p className="text-xs text-slate-500">{item.lote?.medicamento?.apresentacao}</p>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-medium text-slate-700">{item.lote?.codigo_lote}</p>
                                            <p className={`text-xs ${new Date(item.lote?.data_validade) < new Date() ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                                Val: {new Date(item.lote?.data_validade).toLocaleDateString()}
                                            </p>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-lg text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{item.quantidade}</span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedItem(item)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-1 ml-auto"
                                            >
                                                <MinusCircle className="w-4 h-4" /> Dispensar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de Dispensação */}
            {selectedItem && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 bg-indigo-600 text-white flex items-center gap-3">
                            <Package className="w-6 h-6" />
                            <div>
                                <h2 className="text-xl font-bold">Dispensar Medicamento</h2>
                                <p className="text-indigo-100 text-xs">Baixa direta do estoque local para o paciente.</p>
                            </div>
                        </div>
                        <form onSubmit={handleDispensar} className="p-6 space-y-4">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <p className="text-xs text-slate-500">ITEM SELECIONADO</p>
                                <p className="font-bold text-slate-800">{selectedItem.lote?.medicamento?.grupo?.nome}</p>
                                <p className="text-sm text-slate-600">{selectedItem.lote?.medicamento?.apresentacao}</p>
                                <div className="flex justify-between mt-2 text-xs">
                                    <span>Lote: <b>{selectedItem.lote?.codigo_lote}</b></span>
                                    <span>Saldo Atual: <b className="text-indigo-600">{selectedItem.quantidade} un</b></span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1">Quantidade a Entregar *</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        max={selectedItem.quantidade}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-bold text-lg"
                                        value={dispenseQty}
                                        onChange={e => setDispenseQty(parseInt(e.target.value))}
                                    />
                                    {dispenseQty > selectedItem.quantidade && (
                                        <p className="text-red-500 font-bold text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Saldo insuficiente!
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Observação / Paciente</label>
                                    <textarea
                                        rows={2}
                                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                                        placeholder="Ex: Nome do paciente ou nº do prontuário..."
                                        value={dispenseObs}
                                        onChange={e => setDispenseObs(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving || dispenseQty > selectedItem.quantidade || dispenseQty <= 0}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-white" />}
                                    Confirmar Entrega
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
