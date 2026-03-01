import Link from 'next/link';
import { Home, Package, Truck, Activity, Shield, Database, Users, X } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

interface SidebarProps {
    user: any;
    isOpen?: boolean;
    setIsOpen?: (isOpen: boolean) => void;
}

export function Sidebar({ user, isOpen = false, setIsOpen }: SidebarProps) {
    const isCAF = user?.unidade?.tipo === 'CAF';
    const isTI = user?.unidade?.tipo === 'TI';

    const handleLinkClick = () => {
        if (setIsOpen) setIsOpen(false);
    };

    return (
        <aside
            className={`
                fixed md:static inset-y-0 left-0 z-50
                w-64 bg-slate-900 text-white min-h-screen flex flex-col 
                transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}
        >
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <Activity className="text-teal-400 w-8 h-8 flex-shrink-0" />
                    <h1 className="text-2xl font-bold tracking-tight">SysFarma</h1>
                </div>
                {/* Mobile Close Button */}
                <button
                    className="md:hidden text-slate-400 hover:text-white transition-colors"
                    onClick={() => setIsOpen && setIsOpen(false)}
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                {isTI ? (
                    <>
                        <SidebarLink onClick={handleLinkClick} href="/ti/dashboard" icon={<Shield />} label="Dashboard Admin" />
                        <SidebarLink onClick={handleLinkClick} href="/ti/unidades" icon={<Database />} label="Gestão de Unidades" />
                        <SidebarLink onClick={handleLinkClick} href="/ti/usuarios" icon={<Users />} label="Gestão de Usuários" />
                    </>
                ) : isCAF ? (
                    <>
                        <SidebarLink onClick={handleLinkClick} href="/caf/dashboard" icon={<Home />} label="Dashboard Principal" />

                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gestão e Catálogo</p>
                        </div>
                        <SidebarLink onClick={handleLinkClick} href="/caf/unidades" icon={<Activity />} label="Rede de Unidades" />
                        <SidebarLink onClick={handleLinkClick} href="/caf/medicamentos" icon={<Activity />} label="Base de Medicamentos" />
                        <SidebarLink onClick={handleLinkClick} href="/caf/permissoes" icon={<Package />} label="Permissões de Catálogo" />
                        <SidebarLink onClick={handleLinkClick} href="/caf/fornecedores" icon={<Truck />} label="Fornecedores" />

                        <div className="pt-4 pb-2">
                            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Logística (Estoque)</p>
                        </div>
                        <SidebarLink onClick={handleLinkClick} href="/caf/estoque" icon={<Package />} label="Estoque Central" />
                        <SidebarLink onClick={handleLinkClick} href="/caf/solicitacoes" icon={<Activity />} label="Analisar Pedidos" />
                        <SidebarLink onClick={handleLinkClick} href="/caf/remessas" icon={<Truck />} label="Despachar Remessas" />
                    </>
                ) : (
                    <>
                        <SidebarLink onClick={handleLinkClick} href="/unidade/dashboard" icon={<Home />} label="Painel da Unidade" />
                        <SidebarLink onClick={handleLinkClick} href="/unidade/estoque" icon={<Package />} label="Meu Estoque" />
                        <SidebarLink onClick={handleLinkClick} href="/unidade/solicitacoes" icon={<Activity />} label="Solicitar Pedido" />
                        <SidebarLink onClick={handleLinkClick} href="/unidade/recebimentos" icon={<Truck />} label="Receber Remessa" />
                    </>
                )}
            </nav>

            <div className="p-4 border-t border-slate-800 flex flex-col space-y-1 flex-shrink-0">
                <p className="text-sm font-semibold text-slate-300 truncate">
                    {user?.nome || 'Usuário'}
                </p>
                <p className="text-xs text-slate-500 mb-2 truncate" title={`${user?.unidade?.nome || 'Unidade Desconhecida'} (${user?.papel})`}>
                    {user?.unidade?.nome || 'Unidade Desconhecida'} ({user?.papel})
                </p>
                <div onClick={handleLinkClick}>
                    <LogoutButton />
                </div>
            </div>
        </aside>
    );
}

function SidebarLink({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick?: () => void }) {
    return (
        <Link href={href} onClick={onClick}>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors group cursor-pointer">
                <span className="group-hover:text-teal-400 transition-colors">{icon}</span>
                <span className="font-medium truncate">{label}</span>
            </div>
        </Link>
    );
}
