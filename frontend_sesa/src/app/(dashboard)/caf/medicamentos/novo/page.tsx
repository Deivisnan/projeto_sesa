"use client";
import { useState } from 'react';
import { Pill, LayoutList, AlertCircle, Save, ArrowLeft, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';

export default function NovoMedicamentoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Group Form State
    const [nomeGrupo, setNomeGrupo] = useState('');
    const [estoqueMinimoGrupo, setEstoqueMinimoGrupo] = useState('0');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            if (!nomeGrupo.trim()) throw new Error("O nome do princípio ativo é obrigatório.");

            await api.post('/medicamentos/grupos', {
                nome: nomeGrupo,
                estoque_minimo: Number(estoqueMinimoGrupo)
            });

            setSuccess('Princípio Ativo registrado com sucesso no Catálogo!');
            setTimeout(() => {
                router.push('/caf/medicamentos');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Erro ao cadastrar medicamento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/caf/medicamentos">
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Novo Princípio Ativo</h1>
                    <p className="text-slate-500 mt-1">Crie a raiz de um medicamento no catálogo para posterior vínculo de dosagens no estoque.</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <LayoutList className="w-5 h-5 text-slate-500" />
                        <h2 className="text-lg font-semibold text-slate-800">Associação de Grupo</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium flex items-center space-x-3">
                            <Pill className="w-5 h-5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    {/* Section 1: Grupo Farmacologico (Pai) */}
                    <div className="p-5 bg-teal-50/30 border border-teal-100 rounded-xl space-y-6">
                        <label className="text-sm font-bold text-teal-800 block border-b border-teal-100 pb-2">
                            1. Princípio Ativo Genérico (Pai)
                        </label>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Nome do Princípio Ativo <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="text"
                                    value={nomeGrupo}
                                    onChange={(e) => setNomeGrupo(e.target.value)}
                                    placeholder="Ex: Dipirona Sódica, Paracetamol, Amoxicilina..."
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-slate-700 block mb-1">Estoque Mínimo Global (Soma de Todas as Apresentações) <span className="text-red-500">*</span></label>
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    value={estoqueMinimoGrupo}
                                    onChange={(e) => setEstoqueMinimoGrupo(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                                />
                                <p className="text-xs text-slate-500 mt-2">Isto criará a raiz no catálogo onde todas as dosagens de {nomeGrupo || '...'} ficarão organizadas e analisarão a saúde global com base neste limite.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                        <Link href="/caf/medicamentos">
                            <button type="button" className="px-6 py-3.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                Cancelar
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={loading || !nomeGrupo.trim()}
                            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 disabled:text-slate-500 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-teal-500/20 transition-all focus:ring-4 focus:ring-teal-100"
                        >
                            <Save className="w-5 h-5" />
                            <span>{loading ? 'Salvando...' : 'Registrar no Catálogo'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
