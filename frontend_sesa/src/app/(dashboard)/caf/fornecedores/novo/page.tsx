"use client"
import { useState } from 'react';
import { Building2, LayoutList, AlertCircle, Save, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';

export default function NovoFornecedorPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        razao_social: '',
        cnpj: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await api.post('/fornecedores', formData);
            setSuccess('Fornecedor cadastrado com sucesso!');
            setTimeout(() => {
                router.push('/caf/fornecedores');
            }, 1000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao cadastrar fornecedor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 w-full max-w-3xl mx-auto">
            <div className="flex items-center space-x-4 mb-8">
                <Link href="/caf/fornecedores">
                    <button className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Novo Fornecedor</h1>
                    <p className="text-slate-500 mt-1">Homologue um novo laboratório ou distribuidora</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 p-6 flex items-center space-x-3">
                    <LayoutList className="w-5 h-5 text-slate-500" />
                    <h2 className="text-lg font-semibold text-slate-800">Dados da Empresa</h2>
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
                            <Building2 className="w-5 h-5 flex-shrink-0" />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700 block">Razão Social <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                name="razao_social"
                                value={formData.razao_social}
                                onChange={handleChange}
                                placeholder="Nome da empresa ou laboratório completo"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50"
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-slate-700 block">CNPJ <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00.000.000/0000-00"
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 bg-slate-50 font-mono"
                            />
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex justify-end space-x-3">
                        <Link href="/caf/fornecedores">
                            <button type="button" className="px-6 py-3.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                                Cancelar
                            </button>
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-8 py-3.5 rounded-xl font-medium shadow-lg shadow-teal-500/20 transition-all focus:ring-4 focus:ring-teal-100"
                        >
                            <Save className="w-5 h-5 text-teal-100" />
                            <span>{loading ? 'Salvando...' : 'Salvar Fornecedor'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
