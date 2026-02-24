"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, LogIn, AlertCircle } from 'lucide-react';
import Cookies from 'js-cookie';
import api from '@/services/api';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/auth/login', { email, senha });

            const { token, user } = response.data;

            // Salva o token nos cookies para uso no Next.js Server Components
            Cookies.set('sysfarma.token', token, { expires: 1 });
            Cookies.set('sysfarma.user', JSON.stringify(user), { expires: 1 });

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            // Redireciona baseado no Tipo da Unidade
            if (user.unidade.tipo === 'TI') {
                router.push('/ti/dashboard');
            } else if (user.unidade.tipo === 'CAF') {
                router.push('/caf/dashboard');
            } else {
                router.push('/unidade/dashboard');
            }

        } catch (err: any) {
            setError(err.response?.data?.error || 'Falha ao autenticar.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-teal-600 p-3 rounded-xl shadow-lg shadow-teal-500/30">
                        <Activity className="text-white w-10 h-10" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
                    SysFarma
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    Acesso Restrito ao Sistema de Gestão Farmacêutica
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleLogin}>
                        {error && (
                            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium flex items-center space-x-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                                E-mail Institucional
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all sm:text-sm text-slate-900 bg-slate-50 focus:bg-white"
                                    placeholder="exemplo@saude.gov.br"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="senha" className="block text-sm font-semibold text-slate-700">
                                Senha de Acesso
                            </label>
                            <div className="mt-2">
                                <input
                                    id="senha"
                                    name="senha"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all sm:text-sm text-slate-900 bg-slate-50 focus:bg-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:opacity-70 disabled:cursor-not-allowed transition-all relative overflow-hidden group"
                            >
                                {loading ? 'Autenticando...' : (
                                    <span className="flex items-center space-x-2">
                                        <ShieldCheck className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                                        <span>Entrar no Sistema</span>
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-8 text-center bg-slate-50 rounded-lg p-4 border border-dashed border-slate-200">
                        <p className="text-xs text-slate-500 text-center flex items-center justify-center space-x-2">
                            <LogIn className="w-4 h-4" />
                            <span>Autenticação Governamental Segura via JWT</span>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
