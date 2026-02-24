"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Package, Stethoscope, AlertCircle, Loader2 } from 'lucide-react';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export default function UnidadeDashboardPage() {
    const { user } = useAuth();
    const [metrics, setMetrics] = useState({
        totalEstoque: 0,
        pedidosAnalise: 0,
        entregasTransito: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.unidade?.id) {
            loadDashboardData();
        }
    }, [user]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [stoqueRes, solicitacoesRes] = await Promise.all([
                api.get(`/estoque/${user?.unidade?.id}`),
                api.get('/solicitacoes')
            ]);

            const estoque = stoqueRes.data;
            const solicitacoes = solicitacoesRes.data;

            const totalEstoque = estoque.reduce((acc: number, item: any) => acc + item.quantidade, 0);
            const pedidosAnalise = solicitacoes.filter((s: any) => s.status === 'AGUARDANDO_ANALISE').length;
            const entregasTransito = solicitacoes.filter((s: any) => s.status === 'DESPACHADA').length;

            setMetrics({
                totalEstoque,
                pedidosAnalise,
                entregasTransito
            });
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard da unidade", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-slate-400 gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="font-medium">Carregando indicadores locais...</p>
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-center md:text-left">Painel da Unidade</h1>
                <p className="text-slate-500 mt-1 text-center md:text-left">Bem-vindo(a), <b>{user?.nome}</b>. Esta é a situação atual da sua farmácia local.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Volume em Armário"
                    value={metrics.totalEstoque.toLocaleString()}
                    unit=" un"
                    icon={<Package className="w-6 h-6 text-indigo-600" />}
                    trend="Saldo físico total disponível"
                    color="text-indigo-600"
                />
                <MetricCard
                    title="Pedidos em Análise"
                    value={metrics.pedidosAnalise.toString()}
                    icon={<Activity className="w-6 h-6 text-amber-600" />}
                    trend="Aguardando liberação da CAF"
                    color="text-amber-600"
                />
                <MetricCard
                    title="Remessas em Trânsito"
                    value={metrics.entregasTransito.toString()}
                    icon={<Stethoscope className="w-6 h-6 text-teal-600" />}
                    trend="Expedidos a caminho da Unidade"
                    color="text-teal-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-12 text-center">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col justify-center items-center">
                    <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
                    <h2 className="text-xl font-bold text-slate-800">Seu Estoque Local</h2>
                    <p className="text-slate-500 mt-2 text-sm max-w-md">Para visualizar o inventário físico detalhado e a situação de abastecimento da sua farmácia, navegue até a tabela "Meu Estoque Local" no menu.</p>
                </div>
                <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-8 flex flex-col justify-center items-center">
                    <Activity className="w-12 h-12 text-indigo-300 mb-4" />
                    <h2 className="text-xl font-bold text-indigo-900">Como Pedir Insumos?</h2>
                    <p className="text-slate-600 mt-2 text-sm max-w-md">As caixinhas dinâmicas vão listar apenas os produtos que a CAF Central pré-autorizou e mapeou para a sua diretoria de saúde.</p>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, unit = "", icon, trend, color }: { title: string, value: string, unit?: string, icon: any, trend: string, color: string }) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}<span className="text-lg font-bold text-slate-400 ml-1">{unit}</span></p>
            </div>
            <div className={`mt-4 text-sm font-medium ${color}`}>
                {trend}
            </div>
        </div>
    )
}
