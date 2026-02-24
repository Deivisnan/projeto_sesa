"use client";

import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, ShieldAlert, Lock, Unlock, Pencil, X } from 'lucide-react';
import api from '@/services/api';

interface Usuario {
    id: string;
    nome: string;
    email: string;
    papel: string;
    ativo: boolean;
    id_unidade: string;
    unidade?: { id: string; nome: string; tipo: string };
}

export default function TIUsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [unidades, setUnidades] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState<Usuario | null>(null);
    const [masterPassword, setMasterPassword] = useState("");

    // Create Form state
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [idUnidade, setIdUnidade] = useState("");
    const [papel, setPapel] = useState("USUARIO");

    // Edit Form state
    const [editNome, setEditNome] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editIdUnidade, setEditIdUnidade] = useState("");
    const [editPapel, setEditPapel] = useState("");

    // Reset Form State
    const [novaSenha, setNovaSenha] = useState("");

    const loadData = async () => {
        try {
            const [resUsers, resUnids] = await Promise.all([
                api.get('/usuarios'),
                api.get('/unidades')
            ]);
            setUsuarios(resUsers.data);
            setUnidades(resUnids.data);
            if (resUnids.data.length > 0) setIdUnidade(resUnids.data[0].id);
        } catch (error) {
            console.error("Erro ao carregar dados", error);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/usuarios', { nome, email, senha, id_unidade: idUnidade, papel });
            setShowModal(false);
            setNome(""); setEmail(""); setSenha(""); setPapel("USUARIO");
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao criar usuário");
        }
    };

    const handleOpenEdit = (usuario: Usuario) => {
        setShowEditModal(usuario);
        setEditNome(usuario.nome);
        setEditEmail(usuario.email);
        setEditIdUnidade(usuario.id_unidade);
        setEditPapel(usuario.papel);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showEditModal) return;
        try {
            await api.patch(`/usuarios/${showEditModal.id}`, {
                nome: editNome,
                email: editEmail,
                id_unidade: editIdUnidade,
                papel: editPapel,
            });
            setShowEditModal(null);
            loadData();
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Erro ao editar usuário");
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/auth/verify-password', { senha: masterPassword });
            await api.patch(`/usuarios/${showResetModal}/reset-senha`, { nova_senha: novaSenha });
            setShowResetModal(null);
            setMasterPassword("");
            setNovaSenha("");
            alert("Senha do usuário redefinida com sucesso.");
        } catch (err: any) {
            alert(err.response?.data?.message || err.response?.data?.error || "Acesso Negado ou Erro ao Redefinir Senha");
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        try {
            await api.patch(`/usuarios/${id}/status`, { ativo: !currentStatus });
            loadData();
        } catch (err) {
            console.error("Erro ao alterar status:", err);
        }
    }

    const filtered = usuarios.filter(u =>
        u.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestão de Autenticação</h1>
                    <p className="text-slate-500 mt-1">Crie credenciais para servidores da SESA e vincule aos postos correspondentes.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors font-medium shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Nova Credencial</span>
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
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
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Conta (E-mail)</th>
                                <th className="p-4 font-semibold">Base de Operação</th>
                                <th className="p-4 font-semibold">Papel do Sistema</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(usuario => (
                                <tr key={usuario.id} className={`hover:bg-slate-50 transition-colors ${!usuario.ativo && 'opacity-60'}`}>
                                    <td className="p-4 font-medium text-slate-800">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shadow-inner">
                                                {usuario.nome.slice(0, 2).toUpperCase()}
                                            </div>
                                            <span>{usuario.nome}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-slate-600">{usuario.email}</td>
                                    <td className="p-4">
                                        {usuario.unidade?.nome}
                                        <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded border border-slate-200">
                                            {usuario.unidade?.tipo}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-semibold text-indigo-700">{usuario.papel}</td>
                                    <td className="p-4 flex gap-2 justify-end">
                                        {/* Edit button */}
                                        <button
                                            onClick={() => handleOpenEdit(usuario)}
                                            className="p-2 rounded-lg transition-colors border border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                            title="Editar Credencial"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {/* Toggle status */}
                                        <button
                                            onClick={() => handleToggleStatus(usuario.id, usuario.ativo)}
                                            className={`p-2 rounded-lg transition-colors border ${usuario.ativo ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                                            title={usuario.ativo ? "Bloquear Acesso" : "Liberar Acesso"}
                                        >
                                            {usuario.ativo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                        </button>
                                        {/* Reset password */}
                                        <button
                                            onClick={() => setShowResetModal(usuario.id)}
                                            className="p-2 rounded-lg transition-colors border border-amber-200 text-amber-600 hover:bg-amber-50"
                                            title="Reset Admin de Senha"
                                        >
                                            <ShieldAlert className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Nenhum usuário encontrado na Secretaria.
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
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-900">Emissão de Credencial SESA</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={nome} onChange={e => setNome(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">E-mail (Login institucional)</label>
                                    <input required type="email" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Senha Primária</label>
                                    <input required type="password" placeholder="***" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={senha} onChange={e => setSenha(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vincular Unidade (Base Física)</label>
                                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={idUnidade} onChange={e => setIdUnidade(e.target.value)}>
                                    {unidades.map(u => (
                                        <option key={u.id} value={u.id}>({u.tipo}) {u.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Papel Administrativo</label>
                                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={papel} onChange={e => setPapel(e.target.value)}>
                                    <option value="USUARIO">Enfermeiro / Funcionário Local</option>
                                    <option value="ADMIN">Diretor / Admin</option>
                                    <option value="COORDENADOR">Gestão Setorial</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Abortar</button>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Emitir Credencial</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-indigo-100 bg-indigo-50 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <Pencil className="w-5 h-5 text-indigo-600" />
                                <h2 className="text-xl font-bold text-indigo-900">Editar Credencial</h2>
                            </div>
                            <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleEdit} className="p-6 space-y-4">
                            <p className="text-sm text-slate-500">Editando: <span className="font-semibold text-slate-700">{showEditModal.email}</span></p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                                <input required type="text" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editNome} onChange={e => setEditNome(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                                <input required type="email" className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vincular Unidade (Base Física)</label>
                                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editIdUnidade} onChange={e => setEditIdUnidade(e.target.value)}>
                                    {unidades.map(u => (
                                        <option key={u.id} value={u.id}>({u.tipo}) {u.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Papel Administrativo</label>
                                <select required className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500" value={editPapel} onChange={e => setEditPapel(e.target.value)}>
                                    <option value="USUARIO">Enfermeiro / Funcionário Local</option>
                                    <option value="ADMIN">Diretor / Admin</option>
                                    <option value="COORDENADOR">Gestão Setorial</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setShowEditModal(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Salvar Alterações</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-amber-100 bg-amber-50 flex items-center space-x-3">
                            <ShieldAlert className="w-6 h-6 text-amber-600" />
                            <h2 className="text-xl font-bold text-amber-900">Force Reset de Senha</h2>
                        </div>
                        <form onSubmit={handleReset} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Emitir uma nova senha base salt-hash sobrepondo a credencial atual deste usuário no banco de dados. Exige permissões operacionais Root da TI.
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha (para o usuário)</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    value={novaSenha}
                                    onChange={e => setNovaSenha(e.target.value)}
                                />
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <label className="block text-sm font-medium text-red-600 mb-1">Confirme SUA Senha Master de TI *</label>
                                <input
                                    required
                                    type="password"
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500"
                                    value={masterPassword}
                                    onChange={e => setMasterPassword(e.target.value)}
                                />
                            </div>
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => { setShowResetModal(null); setMasterPassword(""); setNovaSenha(""); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm">Injetar Nova Senha</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
