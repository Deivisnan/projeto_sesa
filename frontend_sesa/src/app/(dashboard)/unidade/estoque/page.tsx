"use client";

import React, { useState, useEffect } from 'react';
import { Package, Search, History, Filter } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function UnidadeEstoquePage() {
    const { user } = useAuth();
    const [estoqueLocal, setEstoqueLocal] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.unidade?.id) {
            // Placeholder/Simulação de Estoque Local. 
            // Numa versão futura da API SESA o endpoint seria /estoque/unidades/{id_unidade}
            // Por hora listaremos vazio. A ideia é mostrar a tela estruturada.
            setEstoqueLocal([]);
            setLoading(false);
        }
    }, [user]);

    const filtered = estoqueLocal.filter(item =>
        item.medicamento?.grupo?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.medicamento?.apresentacao?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Farmácia Local</h1>
                    <p className="text-slate-500 mt-1">Acervo disponível nos armários físicos da sua Unidade de Saúde.</p>
                </div>
                <button
                    disabled
                    className="bg-slate-100 text-slate-400 px-5 py-2.5 rounded-lg flex items-center space-x-2 font-medium border border-slate-200 cursor-not-allowed"
                >
                    <History className="w-5 h-5" />
                    <span>Baixas Recentes</span>
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
                    <button className="flex items-center space-x-2 px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors font-medium">
                        <Filter className="w-4 h-4" />
                        <span>Filtros</span>
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white border-b border-slate-200 text-slate-600">
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Identificação do Insumo</th>
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Lote / Validade</th>
                                <th className="p-4 font-semibold uppercase text-xs tracking-wider">Forma Física</th>
                                <th className="p-4 font-semibold text-right uppercase text-xs tracking-wider">Saldo em Prateleira</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-slate-400">Carpindo prateleiras...</td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-4 text-slate-400">
                                            <Package className="w-16 h-16 opacity-30" />
                                            <h3 className="text-xl font-bold text-slate-600">Seu armário está vazio.</h3>
                                            <p className="max-w-md text-sm">Não há nenhum lote de medicamento vinculado à sua unidade no sistema até o momento. Solicite medicamentos à CAF para abastecer seu posto.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-slate-800">{item.medicamento?.grupo?.nome}</p>
                                            <p className="text-xs text-slate-500">{item.medicamento?.apresentacao}</p>
                                        </td>
                                        <td className="p-4 text-slate-600">
                                            {item.lote}
                                        </td>
                                        <td className="p-4">
                                            {item.medicamento?.forma_farmaceutica}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-bold text-lg text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100">{item.quantidade}</span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
