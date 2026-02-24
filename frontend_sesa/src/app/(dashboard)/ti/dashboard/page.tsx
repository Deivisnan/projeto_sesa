import React from 'react';
import { Shield, Database, Users, Server } from 'lucide-react';

export default function TIDashboardPage() {
    return (
        <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Tecnologia</h1>
                <p className="text-slate-500 mt-1">Gestão de acessos, infraestrutura de unidades e segurança (TI SESA).</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                    title="Serviço Ativo"
                    value="Online"
                    icon={<Server className="w-6 h-6 text-green-600" />}
                    trend="Sistema SYSFARMA Operante"
                    color="text-green-600"
                />
                <MetricCard
                    title="Unidades de Saúde"
                    value="--"
                    icon={<Database className="w-6 h-6 text-indigo-600" />}
                    trend="Total de hospitais, upas e postos"
                    color="text-indigo-600"
                />
                <MetricCard
                    title="Contas de Acesso"
                    value="--"
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    trend="Usuários autenticáveis ativos"
                    color="text-blue-600"
                />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-3xl mx-auto mt-12">
                <Shield className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Administração Root</h2>
                <p className="text-slate-500 mt-2">Você está na camada mais alta de permissões. Utilize os menus laterais para gerenciar quais postos de saúde da rede SESA têm acesso ao aplicativo e quais os funcionários de cada um.</p>
                <br />
                <p className="text-sm text-amber-600 font-semibold">Toda Deleção de Unidade ou Reset de Senha de conta exigirá seu Passe Mestre (senha master de TI).</p>
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
