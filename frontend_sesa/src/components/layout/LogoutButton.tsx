"use client";
import { LogOut } from 'lucide-react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
    const router = useRouter();

    const handleLogout = () => {
        Cookies.remove('sysfarma.token');
        Cookies.remove('sysfarma.user');
        router.push('/login');
    };

    return (
        <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 mt-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors group cursor-pointer"
        >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
    );
}
