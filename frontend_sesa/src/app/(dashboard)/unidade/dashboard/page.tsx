import React from 'react';
import { Activity, Package, Stethoscope, AlertCircle } from 'lucide-react';

export default function UnidadeDashboardPage() {
    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel da Unidade</h1>
                <p className="text-slate-500 mt-1">Bem-vindo(a). Acompanhe a atuação do seu Posto de Saúde perante à Secretaria.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    title="Volume Local (Un.)"
                    value="--"
                    icon={<Package className="w-6 h-6 text-indigo-600" />}
                    trend="Unidades físicas guardadas"
                    color="text-indigo-600"
                />
                <MetricCard
                    title="Pedidos em Análise"
                    value="0"
                    icon={<Activity className="w-6 h-6 text-amber-600" />}
                    trend="Aguardando liberação da CAF"
                    color="text-amber-600"
                />
                <MetricCard
                    title="Entregas Roteirizadas"
                    value="0"
                    icon={<Stethoscope className="w-6 h-6 text-teal-600" />}
                    trend="Chegando em breve no Posto"
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
                    <p className="text-slate-600 mt-2 text-sm max-w-md">Clique em "Solicitar Medicamento" na barra lateral esquerda. As caixinhas dinâmicas vão listar apenas os produtos que a CAF Central pré-autorizou e mapeou para a sua diretoria de saúde.</p>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon, trend, color }: { title: string, value: string, icon: any, trend: string, color: string }) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                    {icon}
                </div>
            </div>
            <div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={`mt-4 text-sm font-medium ${color}`}>
                {trend}
            </div>
        </div>
    )
}
