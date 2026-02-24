"use client"
import React, { useState, useEffect } from 'react';
import { PackagePlus, LayoutList, AlertCircle, Save, Plus, Search, ArrowLeft } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/services/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function EntradaEstoquePage() {
    const router = useRouter();
    const [grupos, setGrupos] = useState<any[]>([]);
    const [fornecedores, setFornecedores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Selected state
    const [selectedGrupoId, setSelectedGrupoId] = useState('');
    const [searchGrupo, setSearchGrupo] = useState('');
    const [showGrupoDropdown, setShowGrupoDropdown] = useState(false);

    const [selectedApresentacaoId, setSelectedApresentacaoId] = useState('');
    const [isNovaApresentacao, setIsNovaApresentacao] = useState(false);

    // Apresentacao fields for NEW presentation
    const [compDosagem, setCompDosagem] = useState('');
    const [compUnidade, setCompUnidade] = useState('mg');
    const [compForma, setCompForma] = useState('Comprimido(s)');

    const [formData, setFormData] = useState({
        id_fornecedor: '',
        codigo_lote: '',
        data_fabricacao: '',
        data_validade: '',
        quantidade: ''
    });

    useEffect(() => {
        async function fetchCatalogs() {
            try {
                const token = Cookies.get('sysfarma.token');
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                const [medRes, fornRes] = await Promise.all([
                    api.get('/medicamentos/grupos'), // Usar a listagem crua de Grupos e Variações
                    api.get('/fornecedores')
                ]);
                setGrupos(medRes.data);
                setFornecedores(fornRes.data);
            } catch (err) {
                setError('Erro ao carregar os catálogos base. Verifique sua conexão.');
            } finally {
                setLoading(false);
            }
        }
        fetchCatalogs();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGrupoSelect = (id: string, text: string) => {
        setSelectedGrupoId(id);
        setSearchGrupo(text);
        setShowGrupoDropdown(false);
        setSelectedApresentacaoId('');
        setIsNovaApresentacao(false);
    };

    const handleApresentacaoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'NOVA') {
            setIsNovaApresentacao(true);
            setSelectedApresentacaoId('');
        } else {
            setIsNovaApresentacao(false);
            setSelectedApresentacaoId(val);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (Number(formData.quantidade) <= 0) {
            setError('A quantidade deve ser maior que zero.');
            return;
        }

        if (!selectedGrupoId) {
            setError('Por favor, selecione o grupo farmacológico (Pai).');
            return;
        }

        setIsSaving(true);
        try {
            let finalMedicamentoId = selectedApresentacaoId;

            // Se o usuário digitou uma NOVA apresentação, salva na hora no Banco!
            if (isNovaApresentacao) {
                if (!compDosagem) {
                    setError('Por favor, informe a quantidade da dosagem nova.');
                    setIsSaving(false);
                    return;
                }
                const nomeFinal = `${compDosagem}${compUnidade} ${compForma}`.trim();
                const resApres = await api.post(`/medicamentos/grupos/${selectedGrupoId}/apresentacoes`, {
                    apresentacao: nomeFinal,
                    estoque_minimo: 0,
                });
                finalMedicamentoId = resApres.data.id;
            }

            if (!finalMedicamentoId) {
                setError('Por favor, selecione ou digite a apresentação do medicamento.');
                setIsSaving(false);
                return;
            }

            // Depois registra o Lote para esse medicamento
            await api.post('/estoque/entrada', {
                ...formData,
                id_medicamento: finalMedicamentoId,
                quantidade: Number(formData.quantidade)
            });

            setSuccess('Entrada de Estoque registrada com sucesso! Auditoria gravada.');

            // Recarrega os grupos no background para a nova apresentação aparecer no futuro
            api.get('/medicamentos').then(r => setGrupos(r.data));

            // Clear current inputs softly
            setFormData({ ...formData, codigo_lote: '', quantidade: '' });
            setCompDosagem('');
            setIsNovaApresentacao(false);
            setSelectedApresentacaoId(finalMedicamentoId);

        } catch (err: any) {
            console.error("ERRO COMPLETO DA API:", err.response?.data || err);
            setError(err.response?.data?.message || 'Erro ao registrar a entrada no estoque.');
        } finally {
            setIsSaving(false);
        }
    };

    // Extrair as variações associadas dinamicamente
    const apresentacoesAtuais = React.useMemo(() => {
        const agrp = grupos.find(g => g.id === selectedGrupoId);
        console.log("Grupo selecionado agora:", agrp);
        return agrp?.medicamentos || [];
    }, [grupos, selectedGrupoId]);

    if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Carregando catálogos de suprimentos...</div>;

    return (
        <div className="p-8 w-full max-w-4xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/caf/estoque">
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Registro de Recebimento</h1>
                    <p className="text-slate-500 mt-1">Dê entrada física de novos lotes no Estoque Central da CAF</p>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl hidden sm:block">
                    <PackagePlus className="w-8 h-8 text-teal-600" />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center space-x-3">
                    <LayoutList className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Formulário Inteligente de Entrada</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center space-x-3">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm font-medium flex items-center space-x-3">
                            <PackagePlus className="w-5 h-5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="p-5 bg-teal-50/50 border border-teal-100 rounded-xl space-y-4">
                        <h3 className="text-sm font-bold text-teal-800">1. Identificação do Produto</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block text-teal-800">Princípio Ativo (Pai)</label>
                                <div className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-400" />
                                        <input
                                            type="text"
                                            value={searchGrupo}
                                            onChange={(e) => {
                                                setSearchGrupo(e.target.value);
                                                setShowGrupoDropdown(true);
                                            }}
                                            onFocus={() => setShowGrupoDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowGrupoDropdown(false), 200)}
                                            placeholder="Buscar substância..."
                                            className="w-full pl-10 pr-4 py-3 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white"
                                        />
                                    </div>

                                    {showGrupoDropdown && (
                                        <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                            {grupos.filter(g => g.nome.toLowerCase().includes(searchGrupo.toLowerCase())).map(g => (
                                                <div
                                                    key={g.id}
                                                    className={`px-4 py-3 cursor-pointer hover:bg-teal-50 transition-colors ${selectedGrupoId === g.id ? 'bg-teal-50 font-bold text-teal-700' : 'text-slate-700'}`}
                                                    onClick={() => handleGrupoSelect(g.id, g.nome)}
                                                >
                                                    {g.nome}
                                                </div>
                                            ))}
                                            {grupos.filter(g => g.nome.toLowerCase().includes(searchGrupo.toLowerCase())).length === 0 && (
                                                <div className="px-4 py-4 text-center text-slate-500 italic text-sm">
                                                    Nenhuma substância encontrada.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block text-teal-800">Variação / Dosagem (Filho)</label>
                                <select
                                    required={!isNovaApresentacao}
                                    value={isNovaApresentacao ? 'NOVA' : selectedApresentacaoId}
                                    onChange={handleApresentacaoChange}
                                    disabled={!selectedGrupoId}
                                    className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                >
                                    <option value="" disabled>Escolha a dosagem do lote...</option>
                                    {apresentacoesAtuais.map((a: any) => (
                                        <option key={a.id} value={a.id}>{a.apresentacao}</option>
                                    ))}
                                    {selectedGrupoId && (
                                        <option value="NOVA">➕ Outro valor? (Adicionar Manualmente)</option>
                                    )}
                                </select>
                            </div>

                            {/* Campo Mágico que cadastra na hora */}
                            {isNovaApresentacao && (
                                <div className="space-y-4 md:col-start-2 animate-in fade-in slide-in-from-top-2 p-5 bg-teal-50/80 border-2 border-teal-200 rounded-xl">
                                    <label className="text-sm font-semibold text-teal-800 block">Qual é a nova variação recebida?</label>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <input
                                                required
                                                type="number"
                                                step="any"
                                                min="0.01"
                                                value={compDosagem}
                                                onChange={(e) => setCompDosagem(e.target.value)}
                                                placeholder="Ex: 500"
                                                className="w-full px-3 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <select
                                                required
                                                value={compUnidade}
                                                onChange={(e) => setCompUnidade(e.target.value)}
                                                className="w-full px-2 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                                            >
                                                <option value="mg">mg</option>
                                                <option value="mcg">mcg</option>
                                                <option value="g">g</option>
                                                <option value="ml">ml</option>
                                                <option value="UI">UI</option>
                                                <option value="%">%</option>
                                                <option value="mEq">mEq</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <select
                                                required
                                                value={compForma}
                                                onChange={(e) => setCompForma(e.target.value)}
                                                className="w-full px-2 py-2 border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
                                            >
                                                <option value="Comprimido(s)">Comprimido(s)</option>
                                                <option value="Cápsula(s)">Cápsula(s)</option>
                                                <option value="Drágea(s)">Drágea(s)</option>
                                                <option value="Ampola(s)">Ampola(s)</option>
                                                <option value="Frasco(s)">Frasco(s)</option>
                                                <option value="Frasco-ampola">Frasco-ampola</option>
                                                <option value="Bisnaga(s)">Bisnaga(s)</option>
                                                <option value="Gotas">Gotas</option>
                                                <option value="Envelope(s)">Envelope(s)</option>
                                                <option value="Seringa(s)">Seringa(s)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-xs text-teal-700 font-medium mt-2">
                                        Ao avançar, o sistema salvará: <strong>{compDosagem ? `${compDosagem}${compUnidade} ${compForma}` : '...'}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block">Laboratório / Fornecedor</label>
                            <select
                                required
                                name="id_fornecedor"
                                value={formData.id_fornecedor}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50"
                            >
                                <option value="">Selecione a origem...</option>
                                {fornecedores.map(f => (
                                    <option key={f.id} value={f.id}>{f.razao_social}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 block">Código Serial do Lote</label>
                            <input
                                required
                                type="text"
                                name="codigo_lote"
                                value={formData.codigo_lote}
                                onChange={handleChange}
                                placeholder="Ex: L-4928A"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block">Fabricação</label>
                                <input required type="date" name="data_fabricacao" value={formData.data_fabricacao} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700 block">Validade</label>
                                <input required type="date" name="data_validade" value={formData.data_validade} onChange={handleChange} className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50" />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-2 mt-4">
                            <label className="text-sm font-semibold text-slate-700 block">Quantidade Recebida (Caixas/Unid.)</label>
                            <input
                                required
                                type="number"
                                min="1"
                                name="quantidade"
                                value={formData.quantidade}
                                onChange={handleChange}
                                placeholder="Digite a quantidade total que entrou no galpão..."
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50 text-xl font-bold text-teal-700"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-slate-900/20 transition-all focus:ring-4 focus:ring-slate-200"
                        >
                            <Save className="w-5 h-5 text-teal-400" />
                            <span>{isSaving ? 'Gravando Operação...' : 'Gravar Entrada no Estoque'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
