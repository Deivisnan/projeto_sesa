"use client";

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckSquare, Square, Building2, Save } from 'lucide-react';
import api from '@/services/api';

export default function CAFPermissoesPage() {
    const [unidades, setUnidades] = useState<any[]>([]);
    const [medicamentos, setMedicamentos] = useState<any[]>([]);
    const [selectedUnidade, setSelectedUnidade] = useState<string | null>(null);
    const [allowedMedicamentos, setAllowedMedicamentos] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadBases();
    }, []);

    const loadBases = async () => {
        try {
            const [resUnidades, resMeds] = await Promise.all([
                api.get('/unidades'),
                api.get('/medicamentos')
            ]);
            const consumers = resUnidades.data.filter((u: any) => !['CAF', 'TI'].includes(u.tipo));
            setUnidades(consumers);
            // FlatMap the groups into a simple list of specific presentations (medicamentos)
            const allMeds = resMeds.data.flatMap((grupo: any) =>
                grupo.medicamentos.map((med: any) => ({
                    ...med,
                    nome: grupo.nome // Puxamos o nome do princípio ativo do pai
                }))
            );
            setMedicamentos(allMeds);

            if (consumers.length > 0) {
                handleSelectUnidade(consumers[0].id);
            }
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    const handleSelectUnidade = async (id_unidade: string) => {
        setSelectedUnidade(id_unidade);
        setAllowedMedicamentos([]); // Clear during load
        try {
            const res = await api.get(`/unidades/${id_unidade}/medicamentos-permitidos`);
            // The API returns full medication objects. We just need their IDs
            const permittedIds = res.data.map((m: any) => m.id);
            setAllowedMedicamentos(permittedIds);
        } catch (error) {
            console.error("Erro ao carregar permissões", error);
        }
    };

    const toggleMedicamento = (id_medicamento: string) => {
        setAllowedMedicamentos(prev => {
            if (prev.includes(id_medicamento)) {
                return prev.filter(id => id !== id_medicamento);
            } else {
                return [...prev, id_medicamento];
            }
        });
    };

    const handleSave = async () => {
        if (!selectedUnidade) return;
        setLoading(true);
        try {
            await api.post(`/unidades/${selectedUnidade}/medicamentos-permitidos`, {
                ids_medicamentos: allowedMedicamentos
            });
            alert('Catálogo de permissões salvo com sucesso!');
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || 'Erro ao salvar permissões');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Arquitetura de Catálogo</h1>
                <p className="text-slate-500 mt-1">Defina cirurgicamente quis apresentações de medicamentos cada Unidade de Saúde pode enxergar e solicitar.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0">
                {/* Lateral Esquerda - Lista de Unidades */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h2 className="font-semibold text-slate-800">Selecione o Alvo</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {unidades.map(unidade => (
                            <button
                                key={unidade.id}
                                onClick={() => handleSelectUnidade(unidade.id)}
                                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${selectedUnidade === unidade.id ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                            >
                                <div>
                                    <p className={`font-medium ${selectedUnidade === unidade.id ? 'text-indigo-900' : 'text-slate-700'}`}>{unidade.nome}</p>
                                    <p className={`text-xs ${selectedUnidade === unidade.id ? 'text-indigo-600' : 'text-slate-500'}`}>{unidade.tipo}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Área Principal - Mosaico de Medicamentos */}
                <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col relative">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <ShieldCheck className="w-5 h-5 text-teal-600" />
                            <h2 className="font-semibold text-slate-800">Catálogo Autorizado</h2>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={loading || !selectedUnidade}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Gravar Permissões</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                        {selectedUnidade ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {medicamentos.map(med => {
                                    const isAllowed = allowedMedicamentos.includes(med.id);
                                    return (
                                        <div
                                            key={med.id}
                                            onClick={() => toggleMedicamento(med.id)}
                                            className={`p-4 rounded-xl cursor-pointer border-2 transition-all flex items-start space-x-3 ${isAllowed ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                        >
                                            <div className="mt-0.5">
                                                {isAllowed ? (
                                                    <CheckSquare className="w-5 h-5 text-teal-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-300" />
                                                )}
                                            </div>
                                            <div>
                                                <p className={`font-bold ${isAllowed ? 'text-teal-900' : 'text-slate-700'}`}>{med.nome}</p>
                                                <p className={`text-sm ${isAllowed ? 'text-teal-700' : 'text-slate-500'}`}>{med.apresentacao}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Building2 className="w-16 h-16 mb-4 opacity-20" />
                                <p>Selecione uma Unidade de Saúde à esquerda para gerenciar seu catálogo.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
