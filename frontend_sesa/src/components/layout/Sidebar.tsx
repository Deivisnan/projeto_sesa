import Link from 'next/link';
import { Home, Package, Truck, Activity, Shield, Database, Users } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

export function Sidebar({ user }: { user: any }) {
    const isCAF = user?.unidade?.tipo === 'CAF';
    const isTI = user?.unidade?.tipo === 'TI';

    return (
        <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col transition-all duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
                <Activity className="text-teal-400 w-8 h-8" />
                <h1 className="text-2xl font-bold tracking-tight">SysFarma</h1>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2">
                {isTI ? (
                    <>
                        <SidebarLink href="/ti/dashboard" icon={<Shield />} label="Dashboard Admin" />
                        <SidebarLink href="/ti/unidades" icon={<Database />} label="Gestão de Unidades" />
                        <SidebarLink href="/ti/usuarios" icon={<Users />} label="Gestão de Usuários" />
                    </>
                ) : isCAF ? (
                    <>
                        <SidebarLink href="/caf/dashboard" icon={<Home />} label="Dashboard Principal" />

                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestão e Catálogo</p>
                        </div>
                        <SidebarLink href="/caf/unidades" icon={<Activity />} label="Rede de Unidades" />
                        <SidebarLink href="/caf/medicamentos" icon={<Activity />} label="Base de Medicamentos" />
                        <SidebarLink href="/caf/permissoes" icon={<Package />} label="Permissões de Catálogo" />
                        <SidebarLink href="/caf/fornecedores" icon={<Truck />} label="Fornecedores" />

                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Logística (Estoque)</p>
                        </div>
                        <SidebarLink href="/caf/estoque" icon={<Package />} label="Estoque Central" />
                        <SidebarLink href="/caf/solicitacoes" icon={<Activity />} label="Analisar Pedidos" />
                        <SidebarLink href="/caf/remessas" icon={<Truck />} label="Despachar Remessas" />
                    </>
                ) : (
                    <>
                        <SidebarLink href="/unidade/dashboard" icon={<Home />} label="Painel da Unidade" />
                        <SidebarLink href="/unidade/estoque" icon={<Package />} label="Meu Estoque" />
                        <SidebarLink href="/unidade/solicitacoes" icon={<Activity />} label="Solicitar Pedido" />
                        <SidebarLink href="/unidade/recebimentos" icon={<Truck />} label="Receber Remessa" />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col space-y-1">
                <p className="text-sm font-semibold text-slate-300">
                    {user?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 mb-2">
                    {user?.unidade?.nome || 'Unidade Desconhecida'} ({user?.papel})
                </p>
                <LogoutButton />
            </div>
        </aside>
    );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
    return (
        <Link href={href}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group cursor-pointer">
                <span className="group-hover:text-teal-400 transition-colors">{icon}</span>
                <span className="font-medium">{label}</span>
            </div>
        </Link>
    );
}
