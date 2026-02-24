"use client";

import React, { useState, useEffect } from 'react';
import { Database, Search, Plus, Trash2, ShieldAlert } from 'lucide-react';
import api from '@/services/api';

export default function TIUnidadesPage() {
    const [unidades, setUnidades] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [masterPassword, setMasterPassword] = useState("");

    // Form state
    const [nome, setNome] = useState("");
    const [cnes, setCnes] = useState("");
    const [tipo, setTipo] = useState("UBS");
    const [endereco, setEndereco] = useState("");

    const loadUnidades = async () => {
        try {
            const res = await api.get('/unidades');
            setUnidades(res.data);
        } catch (error) {
            console.error("Erro ao carregar unidades", error);
        }
    };

    useEffect(() => {
        loadUnidades();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/unidades', { nome, cnes, tipo, endereco });
            setShowModal(false);
            setNome(""); setCnes(""); setTipo("UBS"); setEndereco("");
            loadUnidades();
        } catch (err: any) {
            alert(err.response?.data?.error || "Erro ao criar unidade");
        }
    };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // First verify master password
            await api.post('/auth/verify-password', { senha: masterPassword });

            // Delete request
            await api.delete(`/unidades/${showDeleteModal}`);
            setShowDeleteModal(null);
            setMasterPassword("");
            loadUnidades();
        } catch (err: any) {
            alert(err.response?.data?.error || "Senha Incorreta ou Erro ao Deletar");
        }
    };

    const filtered = unidades.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.cnes && u.cnes.includes(searchTerm))
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Unidades</h1>
                    <p className="text-slate-500 mt-1">Crie ou remova estruturas físicas de saúde (Hospitais, UPAs, Postos).</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nova Unidade</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou CNES..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <th className="p-4 font-semibold">Nome da Unidade</th>
                                <th className="p-4 font-semibold">CNES</th>
                                <th className="p-4 font-semibold">Tipo</th>
                                <th className="p-4 font-semibold">Status / Endereço</th>
                                <th className="p-4 font-semibold text-right">Ação Restrita</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(unidade => (
                                <tr key={unidade.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{unidade.nome}</td>
                                    <td className="p-4 text-slate-600">{unidade.cnes || 'N/A'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200`}>
                                            {unidade.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-sm">
                                        {!unidade.ativo ? (
                                            <span className="text-red-600 font-bold">DESATIVADA</span>
                                        ) : (
                                            unidade.endereco || 'Sem endereço'
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setShowDeleteModal(unidade.id)}
                                            disabled={!unidade.ativo}
                                            className={`p-2 rounded-lg transition-colors ${unidade.ativo ? 'text-slate-400 hover:bg-red-50 hover:text-red-600' : 'text-slate-200 cursor-not-allowed'}`}
                                            title="Deletar Estrutura"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Nenhuma unidade encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">Cadastrar Nova Unidade</h2>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={nome} onChange={e => setNome(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">CNES</label>
                                    <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={cnes} onChange={e => setCnes(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
                                    <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={tipo} onChange={e => setTipo(e.target.value)}>
                                        <option value="UBS">UBS</option>
                                        <option value="UPA">UPA</option>
                                        <option value="HOSPITAL">Hospital</option>
                                        <option value="CAF">Polo CAF</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Endereço</label>
                                <input type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={endereco} onChange={e => setEndereco(e.target.value)} />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Cadastrar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-red-100 bg-red-50 flex items-center space-x-3">
                            <ShieldAlert className="w-6 h-6 text-red-600" />
                            <h2 className="text-xl font-bold text-red-900">Ação Destrutiva</h2>
                        </div>
                        <form onSubmit={handleDelete} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Você está prestes a desativar uma Unidade de Saúde do banco de dados (Soft Delete). Contas de usuários atreladas a ela poderão perder o acesso caso o sistema não reconheça o vínculo.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirme sua Senha (TI)</label>
                                <input
                                    required
                                    type="password"
                                    autoFocus
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                    value={masterPassword}
                                    onChange={e => setMasterPassword(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => { setShowDeleteModal(null); setMasterPassword(""); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Confirmar Exclusão</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
