"use client"
import React, { useState, useEffect } from "react";
import { Pill, Plus, Search, Info, FlaskConical, Layers, Edit2, Trash2, X, AlertOctagon, HelpCircle, Activity, FileText, User } from "lucide-react";
import Link from "next/link";
import api from '@/services/api';
import Cookies from 'js-cookie';

function getStockBadge(atual: number, minimo: number) {
    if (minimo === 0) {
        if (atual === 0) return { label: 'Sem Estoque', class: 'bg-slate-800 text-slate-100 border border-slate-900' };
        return { label: 'Sem Limite', class: 'bg-slate-100 text-slate-600 border border-slate-200' };
    }

    const percent = atual / minimo;
    if (atual === 0) return { label: 'Sem Estoque', class: 'bg-slate-800 text-slate-100 border border-slate-900' };
    if (percent < 0.15) return { label: 'Crítico', class: 'bg-red-50 text-red-700 font-bold border-red-200 border shadow-sm' };
    if (percent < 0.40) return { label: 'Alerta', class: 'bg-orange-50 text-orange-700 font-bold border-orange-200 border shadow-sm' };
    return { label: 'Bom', class: 'bg-green-50 text-green-700 font-bold border-green-200 border shadow-sm' };
}

export default function MedicamentosPage() {
    const [grupos, setGrupos] = useState<any[]>([]);
    const [filteredGrupos, setFilteredGrupos] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Modal states
    const [editingItem, setEditingItem] = useState<{ tipo: 'grupo' | 'apresentacao', data: any, _parsed?: { numero: string, medida: string, forma: string } } | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ tipo: 'grupo' | 'apresentacao', id: string, name: string } | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [modalError, setModalError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Password Gate State
    const [passwordGate, setPasswordGate] = useState<{ action: 'edit' | 'delete', item: any } | null>(null);
    const [gatePassword, setGatePassword] = useState('');

    // Audit History State
    const [auditItem, setAuditItem] = useState<{ tipo: 'grupo' | 'apresentacao', id: string, name: string } | null>(null);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);

    // Health Info Modal
    const [healthInfoModal, setHealthInfoModal] = useState<any>(null);
    const [loadingAudit, setLoadingAudit] = useState(false);

    // Global Audit Tab State
    const [activeTab, setActiveTab] = useState<'catalogo' | 'auditoria'>('catalogo');
    const [globalAudit, setGlobalAudit] = useState<any[]>([]);
    const [loadingGlobalAudit, setLoadingGlobalAudit] = useState(false);

    const fetchCatalogs = async () => {
        try {
            const token = Cookies.get('sysfarma.token');
            if (token) {
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            }

            const res = await api.get('/medicamentos');
            setGrupos(res.data);
            setFilteredGrupos(res.data);
        } catch (err) {
            console.error("Erro ao puxar grupos", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCatalogs();
    }, []);

    const handleEditSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        setIsSubmitting(true);
        try {
            if (editingItem?.tipo === 'grupo') {
                await api.put(`/medicamentos/grupos/${editingItem.data.id}`, {
                    nome: editingItem.data.nome,
                    estoque_minimo: Number(editingItem.data.estoque_minimo)
                });
            } else if (editingItem?.tipo === 'apresentacao') {
                await api.put(`/medicamentos/${editingItem.data.id}`, {
                    apresentacao: editingItem.data.apresentacao,
                    codigo_br: editingItem.data.codigo_br,
                    estoque_minimo: Number(editingItem.data.estoque_minimo)
                });
            }
            setEditingItem(null);
            fetchCatalogs();
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Erro ao salvar alterações.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        setIsSubmitting(true);
        try {
            if (deletingItem?.tipo === 'grupo') {
                await api.delete(`/medicamentos/grupos/${deletingItem.id}`, { data: { senha: deletePassword } });
            } else if (deletingItem?.tipo === 'apresentacao') {
                await api.delete(`/medicamentos/${deletingItem.id}`, { data: { senha: deletePassword } });
            }
            setDeletingItem(null);
            setDeletePassword('');
            fetchCatalogs();
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Erro ao excluir item.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordGateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalError('');
        setIsSubmitting(true);
        try {
            await api.post('/auth/verify-password', { senha: gatePassword });

            // Se a senha for válida, abre o respectivo modal
            if (passwordGate?.action === 'edit') {
                if (passwordGate.item.tipo === 'apresentacao') {
                    let fullText = passwordGate.item.data.apresentacao || '';
                    let initialForma = "";
                    let initialMedida = "";
                    let initialNumero = "";

                    const formas = ["Comprimido(s)", "Cápsula(s)", "Drágea(s)", "Ampola(s)", "Frasco-ampola", "Frasco", "Gotas", "Gota(s)", "Bisnaga", "Seringa", "Tubo", "Envelope", "Supositório(s)", "Unidade(s)"];

                    for (const f of formas) {
                        if (fullText.endsWith(f)) {
                            initialForma = f;
                            fullText = fullText.substring(0, fullText.length - f.length).trim();
                            break;
                        }
                    }

                    if (!initialForma && fullText) {
                        initialForma = "Outros";
                    }

                    const medidas = ["mcg/ml", "mg/ml", "g/ml", "mcg", "mg", "ml", "g", "l", "ui", "mEq", "%"];
                    for (const m of medidas) {
                        if (fullText.toLowerCase().endsWith(m.toLowerCase())) {
                            initialMedida = m;
                            initialNumero = fullText.substring(0, fullText.length - m.length).trim();
                            break;
                        }
                    }

                    if (!initialMedida && fullText) {
                        // Se não encontrou unidade padrão, joga o resto no número (provavelmente é Outros/sem formatação)
                        initialMedida = "Outros";
                        initialNumero = fullText;
                    }

                    setEditingItem({
                        tipo: passwordGate.item.tipo,
                        data: { ...passwordGate.item.data },
                        _parsed: { numero: initialNumero, medida: initialMedida, forma: initialForma }
                    });
                } else {
                    setEditingItem({ tipo: passwordGate.item.tipo, data: { ...passwordGate.item.data } });
                }
            } else if (passwordGate?.action === 'delete') {
                setDeletingItem({ tipo: passwordGate.item.tipo, id: passwordGate.item.id, name: passwordGate.item.name });
            }

            setPasswordGate(null);
            setGatePassword('');
        } catch (err: any) {
            setModalError(err.response?.data?.message || 'Senha incorreta.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadAuditHistory = async (tipo: 'grupo' | 'apresentacao', id: string, name: string) => {
        setAuditItem({ tipo, id, name });
        setLoadingAudit(true);
        setAuditHistory([]);
        try {
            const entidade = tipo === 'grupo' ? 'MedicamentoGrupo' : 'Medicamento';
            const res = await api.get(`/medicamentos/auditoria/${entidade}/${id}`);
            setAuditHistory(res.data);
        } catch (err) {
            console.error("Erro ao puxar histórico", err);
        } finally {
            setLoadingAudit(false);
        }
    };

    const fetchGlobalAuditoria = async () => {
        if (globalAudit.length > 0) return; // Prevent unnecessary refetches
        setLoadingGlobalAudit(true);
        try {
            const token = Cookies.get('sysfarma.token');
            if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            const res = await api.get('/medicamentos/auditoria');
            setGlobalAudit(res.data);
        } catch (err) {
            console.error("Erro ao puxar auditoria global", err);
        } finally {
            setLoadingGlobalAudit(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'auditoria') {
            fetchGlobalAuditoria();
        }
    }, [activeTab]);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredGrupos(grupos);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();

        const filtered = grupos.reduce((acc: any[], grupo: any) => {
            // Se o nome do PRINCÍPIO ATIVO bater, incluímos ele inteiro!
            if (grupo.nome.toLowerCase().includes(lowerQuery)) {
                acc.push(grupo);
            } else {
                // Se o nome não bateu, procuramos dentro das APRESENTAÇÕES (filhos)
                const matchingApresentacoes = (grupo.medicamentos || []).filter((m: any) =>
                    m.apresentacao.toLowerCase().includes(lowerQuery) ||
                    (m.codigo_br && m.codigo_br.toLowerCase().includes(lowerQuery))
                );

                // Se houver alguma apresentação que bate, incluímos o grupo, mas com a lista de medicamentos filtrada!
                if (matchingApresentacoes.length > 0) {
                    acc.push({
                        ...grupo,
                        medicamentos: matchingApresentacoes
                    });
                }
            }
            return acc;
        }, []);

        setFilteredGrupos(filtered);
    }, [searchQuery, grupos]);

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Catálogo de Medicamentos</h1>
                    <p className="text-slate-500 mt-1">Gerencie a base de suprimentos e as apresentações/dosagens ativas no sistema</p>
                </div>
                <Link href="/caf/medicamentos/novo">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all focus:ring-4 focus:ring-teal-100 flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Novo Medicamento</span>
                    </button>
                </Link>
            </div>

            {/* Abas */}
            <div className="flex space-x-4 border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('catalogo')}
                    className={`pb-3 font-medium transition-colors relative ${activeTab === 'catalogo' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <div className="flex items-center space-x-2">
                        <Layers className="w-4 h-4" />
                        <span>Catálogo Ativo</span>
                    </div>
                    {activeTab === 'catalogo' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600 rounded-t-lg"></div>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('auditoria')}
                    className={`pb-3 font-medium transition-colors relative ${activeTab === 'auditoria' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                >
                    <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4" />
                        <span>Registro de Ações</span>
                    </div>
                    {activeTab === 'auditoria' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-lg"></div>
                    )}
                </button>
            </div>

            {activeTab === 'catalogo' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex space-x-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por princípio ativo, dosagem ou código..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
                            Carregando diretório de medicamentos...
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <tr>
                                    <th className="px-6 py-4">Apresentação Farmacêutica</th>
                                    <th className="px-6 py-4">Código (BR)</th>
                                    <th className="px-6 py-4 text-right">Estoque</th>
                                    <th className="px-6 py-4 text-center">Saúde</th>
                                    <th className="px-6 py-4 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredGrupos.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            Nenhum registro encontrado para "{searchQuery}".
                                        </td>
                                    </tr>
                                ) : (
                                    filteredGrupos.map((grupo: any) => (
                                        <React.Fragment key={grupo.id}>
                                            {/* Cabecalho do Grupo */}
                                            <tr className="bg-slate-50 border-b border-slate-100">
                                                <td colSpan={2} className="px-6 py-4 font-bold text-slate-800 border-l-4 border-teal-500">
                                                    <div className="flex items-center space-x-2">
                                                        <Layers className="w-4 h-4 text-teal-600" />
                                                        <span className="uppercase tracking-wider text-xs">{grupo.nome}</span>
                                                        <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">
                                                            {grupo.medicamentos?.length || 0} Variações
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-sm font-bold text-slate-700">{grupo.estoque_atual || 0} un.</span>
                                                        <span className="text-xs text-slate-400 font-medium">Min: {grupo.estoque_minimo || 0} un.</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {(() => {
                                                        const badge = getStockBadge(grupo.estoque_atual || 0, grupo.estoque_minimo || 0);
                                                        return <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${badge.class}`}>{badge.label}</span>;
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center space-x-3">
                                                        <button onClick={() => setHealthInfoModal({ data: grupo, isGrupo: true })} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Explicar Saúde do Estoque">
                                                            <HelpCircle className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setPasswordGate({ action: 'edit', item: { tipo: 'grupo', data: grupo } })} className="text-slate-400 hover:text-teal-600 transition-colors" title="Editar Princípio Ativo">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => setDeletingItem({ tipo: 'grupo', id: grupo.id, name: grupo.nome })} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir Princípio Ativo">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Sub-itens (Apresentações) */}
                                            {grupo.medicamentos?.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-10 py-3 text-sm text-slate-400 italic">
                                                        Nenhuma apresentação cadastrada.
                                                    </td>
                                                </tr>
                                            ) : (
                                                grupo.medicamentos.map((apresentacao: any) => (
                                                    <tr key={apresentacao.id} className="hover:bg-slate-50/80 transition-colors">
                                                        <td className="px-6 py-4 pl-10">
                                                            <div className="flex items-center space-x-3">
                                                                <div className="p-1.5 rounded-md bg-teal-50 text-teal-600">
                                                                    <FlaskConical className="w-4 h-4" />
                                                                </div>
                                                                <span className="font-medium text-slate-700">{apresentacao.apresentacao}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded-md bg-white text-slate-600 border border-slate-200 shadow-sm">
                                                                {apresentacao.codigo_br || 'N/A'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-sm font-bold text-slate-700">{apresentacao.estoque_atual || 0} un.</span>
                                                                <span className="text-xs text-slate-400 font-medium">Min: {apresentacao.estoque_minimo || 0} un.</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {(() => {
                                                                const badge = getStockBadge(apresentacao.estoque_atual || 0, apresentacao.estoque_minimo || 0);
                                                                return <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider ${badge.class}`}>{badge.label}</span>;
                                                            })()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex items-center justify-center space-x-3">
                                                                <button onClick={() => setHealthInfoModal({ data: apresentacao, isGrupo: false })} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Explicar Saúde do Estoque">
                                                                    <HelpCircle className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => setPasswordGate({ action: 'edit', item: { tipo: 'apresentacao', data: apresentacao } })} className="text-slate-400 hover:text-teal-600 transition-colors" title="Editar Dosagem">
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button onClick={() => setDeletingItem({ tipo: 'apresentacao', id: apresentacao.id, name: apresentacao.apresentacao })} className="text-slate-400 hover:text-red-600 transition-colors" title="Excluir Dosagem">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal Explicativo de Saúde */}
            {healthInfoModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Info className="w-5 h-5 text-indigo-500" />
                                Status da Saúde do Estoque
                            </h3>
                            <button onClick={() => setHealthInfoModal(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            {(() => {
                                const min = healthInfoModal.data.estoque_minimo || 0;
                                const atual = healthInfoModal.data.estoque_atual || 0;
                                const badge = getStockBadge(atual, min);
                                const nome = healthInfoModal.isGrupo ? healthInfoModal.data.nome : healthInfoModal.data.apresentacao;

                                return (
                                    <>
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            A saúde do item <strong className="text-slate-800">{nome}</strong> consta atualmente como:
                                        </p>
                                        <div className="flex justify-center my-4">
                                            <span className={`px-4 py-2 rounded text-sm font-bold uppercase tracking-wider ${badge.class}`}>
                                                {badge.label}
                                            </span>
                                        </div>
                                        {min === 0 ? (
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                Isso se dá pelo fato de <strong>não ter sido colocado um valor mínimo</strong> necessário que se tenha em estoque deste produto. O sistema não pode calcular a saúde adequadamente se não há uma meta estipulada. Edite o catálogo e adicione o estoque mínimo.
                                            </p>
                                        ) : (
                                            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                Pois a quantidade atual é de <strong className="text-slate-800">{atual} unidades</strong> e o <strong>Mínimo Estabelecido</strong> para que tenha em estoque foi de <strong className="text-slate-800">{min} unidades</strong>. O cálculo é feito comparando seu estoque atual com o ponto de segurança informado.
                                            </p>
                                        )}
                                    </>
                                );
                            })()}
                            <div className="pt-2 flex justify-end">
                                <button onClick={() => setHealthInfoModal(null)} className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors">Entendi</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'auditoria' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Histórico de Modificações do Catálogo
                        </h2>
                    </div>

                    {loadingGlobalAudit ? (
                        <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
                            Carregando histórico...
                        </div>
                    ) : (
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                                <tr>
                                    <th className="px-6 py-4 w-48">Data/Hora</th>
                                    <th className="px-6 py-4 w-40">Ação</th>
                                    <th className="px-6 py-4 w-60">Usuário</th>
                                    <th className="px-6 py-4">Detalhes da Edição</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {globalAudit.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            Nenhuma ação registrada até o momento.
                                        </td>
                                    </tr>
                                ) : (
                                    globalAudit.map((log: any) => {
                                        let parsedDetails: any = {};
                                        try {
                                            parsedDetails = JSON.parse(log.detalhes || '{}');
                                        } catch (e) {
                                            parsedDetails = { error: 'Invalid JSON' };
                                        }

                                        let AcaoBadge = null;
                                        if (log.acao === 'CRIACAO') AcaoBadge = <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 font-bold uppercase text-[10px] tracking-wider border border-green-200">Criação</span>;
                                        else if (log.acao === 'EDICAO') AcaoBadge = <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-700 font-bold uppercase text-[10px] tracking-wider border border-amber-200">Edição</span>;
                                        else if (log.acao === 'EXCLUSAO') AcaoBadge = <span className="px-2.5 py-1 rounded bg-red-50 text-red-700 font-bold uppercase text-[10px] tracking-wider border border-red-200">Exclusão</span>;

                                        return (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="px-6 py-4 text-slate-600 font-medium">
                                                    {new Date(log.data_hora).toLocaleString('pt-BR')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {AcaoBadge}
                                                    <div className="mt-1 text-xs text-slate-500">{log.entidade === 'MedicamentoGrupo' ? 'Princípio Ativo' : 'Variação/Dosagem'}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs uppercase">
                                                            {(log.usuario?.nome || '?').charAt(0)}
                                                        </div>
                                                        <span className="font-medium text-slate-700 truncate">{log.usuario?.nome || 'Desconhecido'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap" title={log.detalhes}>
                                                    {log.entidade === 'MedicamentoGrupo' ? (
                                                        <span className="text-slate-500">
                                                            {log.acao === 'CRIACAO' && `Criou ${parsedDetails.nome}`}
                                                            {log.acao === 'EDICAO' && `Alterou P. Ativo: ${parsedDetails.nome} | Min: ${parsedDetails.estoque_minimo || 0}`}
                                                            {log.acao === 'EXCLUSAO' && `Removeu ${parsedDetails.nome}`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-500">
                                                            {log.acao === 'CRIACAO' && `Criou ${parsedDetails.apresentacao} (p/ ${parsedDetails.grupo_nome || 'Desconhecido'})`}
                                                            {log.acao === 'EDICAO' && `Alterou Dosagem: ${parsedDetails.apresentacao || ''} (de ${parsedDetails.grupo_nome || 'Desconhecido'}) | Cód: ${parsedDetails.codigo_br || '-'} | Min: ${parsedDetails.estoque_minimo || 0}`}
                                                            {log.acao === 'EXCLUSAO' && `Removeu ${parsedDetails.apresentacao} (de ${parsedDetails.grupo_nome || 'Desconhecido'})`}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Modal de Validação de Senha (Password Gate) */}
            {passwordGate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-teal-600" />
                                Confirme sua Senha
                            </h3>
                            <button type="button" onClick={() => { setPasswordGate(null); setGatePassword(''); setModalError(''); }} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordGateSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                Por segurança, confirme sua senha para prosseguir com a ação de {passwordGate.action === 'edit' ? 'Edição' : 'Exclusão'}.
                            </p>

                            {modalError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                    <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <input
                                    required
                                    type="password"
                                    placeholder="Sua senha..."
                                    value={gatePassword}
                                    onChange={e => setGatePassword(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div className="pt-2 flex justify-end space-x-3">
                                <button type="button" onClick={() => { setPasswordGate(null); setGatePassword(''); setModalError(''); }} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting || !gatePassword} className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-xl transition-colors flex items-center">
                                    {isSubmitting ? 'Verificando...' : 'Confirmar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de EDIÇÃO */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Edit2 className="w-5 h-5 text-teal-600" />
                                Editar {editingItem.tipo === 'grupo' ? 'Princípio Ativo' : 'Apresentação'}
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleEditSave} className="p-6 space-y-4">
                            {modalError && (
                                <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                    <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                                    <span>{modalError}</span>
                                </div>
                            )}

                            {editingItem.tipo === 'grupo' ? (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Nome do Princípio Ativo</label>
                                        <input required type="text" value={editingItem.data.nome} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, nome: e.target.value } })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Estoque Mínimo Global</label>
                                        <input required type="number" min="0" value={editingItem.data.estoque_minimo} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, estoque_minimo: e.target.value } })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-slate-700">Dosagem <span className="text-red-500">*</span></label>
                                            <input
                                                required
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={editingItem._parsed?.numero || ''}
                                                onChange={e => {
                                                    const newNumero = e.target.value;
                                                    const medida = editingItem._parsed?.medida === 'Outros' ? '' : (editingItem._parsed?.medida || '');
                                                    const forma = editingItem._parsed?.forma === 'Outros' ? '' : (editingItem._parsed?.forma || '');

                                                    const newApres = `${newNumero}${medida} ${forma}`.trim();

                                                    setEditingItem({
                                                        ...editingItem,
                                                        data: { ...editingItem.data, apresentacao: newApres },
                                                        _parsed: { numero: newNumero, medida: editingItem._parsed?.medida || '', forma: editingItem._parsed?.forma || '' }
                                                    });
                                                }}
                                                placeholder="Ex: 500, 250, 10"
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-semibold text-slate-700">Medida <span className="text-red-500">*</span></label>
                                            <select
                                                value={editingItem._parsed?.medida || ''}
                                                onChange={e => {
                                                    const newMedida = e.target.value;
                                                    const num = editingItem._parsed?.numero || '';
                                                    const forma = editingItem._parsed?.forma === 'Outros' ? '' : (editingItem._parsed?.forma || '');

                                                    const strMedida = newMedida === 'Outros' ? '' : newMedida;
                                                    const newApres = `${num}${strMedida} ${forma}`.trim();

                                                    setEditingItem({
                                                        ...editingItem,
                                                        data: { ...editingItem.data, apresentacao: newApres },
                                                        _parsed: { numero: num, medida: newMedida, forma: editingItem._parsed?.forma || '' }
                                                    });
                                                }}
                                                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                                            >
                                                <option value="" disabled>Selecione...</option>
                                                <option value="mg">mg</option>
                                                <option value="g">g</option>
                                                <option value="mcg">mcg</option>
                                                <option value="ml">ml</option>
                                                <option value="mg/ml">mg/ml</option>
                                                <option value="mcg/ml">mcg/ml</option>
                                                <option value="g/ml">g/ml</option>
                                                <option value="l">Litros (L)</option>
                                                <option value="ui">UI</option>
                                                <option value="mEq">mEq</option>
                                                <option value="%">%</option>
                                                <option value="Outros">Nenhuma/Livre</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Forma Farmacêutica <span className="text-red-500">*</span></label>
                                        <select
                                            value={editingItem._parsed?.forma || ''}
                                            onChange={e => {
                                                const newForma = e.target.value;
                                                const num = editingItem._parsed?.numero || '';
                                                const medida = editingItem._parsed?.medida === 'Outros' ? '' : (editingItem._parsed?.medida || '');

                                                const strForma = newForma === 'Outros' ? '' : newForma;
                                                const newApres = `${num}${medida} ${strForma}`.trim();

                                                setEditingItem({
                                                    ...editingItem,
                                                    data: { ...editingItem.data, apresentacao: newApres },
                                                    _parsed: { numero: num, medida: editingItem._parsed?.medida || '', forma: newForma }
                                                });
                                            }}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                                        >
                                            <option value="" disabled>Escolha a Apresentação...</option>
                                            <option value="Comprimido(s)">Comprimido(s)</option>
                                            <option value="Cápsula(s)">Cápsula(s)</option>
                                            <option value="Drágea(s)">Drágea(s)</option>
                                            <option value="Ampola(s)">Ampola(s)</option>
                                            <option value="Frasco">Frasco (ex: Xarope)</option>
                                            <option value="Frasco-ampola">Frasco-ampola</option>
                                            <option value="Gota(s)">Gota(s)</option>
                                            <option value="Bisnaga">Bisnaga</option>
                                            <option value="Seringa">Seringa</option>
                                            <option value="Envelope">Envelope</option>
                                            <option value="Tubo">Tubo</option>
                                            <option value="Supositório(s)">Supositório(s)</option>
                                            <option value="Unidade(s)">Unidade(s)</option>
                                            <option value="Outros">Outros / Texto Livre</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Código (BR)</label>
                                        <input type="text" value={editingItem.data.codigo_br || ''} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, codigo_br: e.target.value } })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-slate-700">Estoque Mínimo da Variação</label>
                                        <input required type="number" min="0" value={editingItem.data.estoque_minimo} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, estoque_minimo: e.target.value } })} className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500" />
                                    </div>
                                </>
                            )}
                            <div className="pt-4 flex justify-end space-x-3">
                                <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-medium rounded-xl transition-colors shadow-sm">
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Modal de EXCLUSÃO */}
            {
                deletingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-6 py-4 border-b border-red-100 flex justify-between items-center bg-red-50">
                                <h3 className="font-bold text-red-800 flex items-center gap-2">
                                    <AlertOctagon className="w-5 h-5 text-red-600" />
                                    Confirmar Exclusão
                                </h3>
                                <button onClick={() => { setDeletingItem(null); setDeletePassword(''); setModalError(''); }} className="text-red-400 hover:text-red-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4">
                                <p className="text-slate-600">
                                    Você está prestes a excluir definitivamente <strong>{deletingItem.name}</strong> do catálogo central.
                                </p>
                                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl text-sm leading-relaxed">
                                    <strong>Atenção:</strong> Esta ação não pode ser desfeita. Se já houver lotes, notas fiscais ou histórico de movimentação atrelado a este item, o sistema bloqueará a exclusão para preservar a auditoria farmacêutica!
                                </div>

                                {modalError && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                                        <AlertOctagon className="w-4 h-4 flex-shrink-0" />
                                        <span>{modalError}</span>
                                    </div>
                                )}

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-sm font-semibold text-slate-700">Digite sua senha para confirmar a exclusão</label>
                                    <input
                                        required
                                        type="password"
                                        placeholder="Sua senha de acesso..."
                                        value={deletePassword}
                                        onChange={e => setDeletePassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end space-x-3">
                                    <button type="button" onClick={() => { setDeletingItem(null); setDeletePassword(''); setModalError(''); }} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting || !deletePassword} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors shadow-sm">
                                        {isSubmitting ? 'Excluindo...' : 'Sim, Excluir Item!'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
