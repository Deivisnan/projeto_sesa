import { ArrowRight } from "lucide-react";
import { cookies } from "next/headers";
import EstoqueTable from "./EstoqueTable";
import Link from "next/link";

async function getEstoqueCentral(id_unidade: string) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('sysfarma.token')?.value;

        const res = await fetch(`http://127.0.0.1:3333/api/estoque/${id_unidade}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (!res.ok) throw new Error('Failed to fetch data');
        return await res.json();
    } catch (err) {
        console.error("Error fetching", err);
        return [];
    }
}

export default async function EstoquePage() {
    const cookieStore = await cookies();
    const user = JSON.parse(cookieStore.get('sysfarma.user')?.value || '{}');
    const estoque = await getEstoqueCentral(user.unidade?.id);

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Estoque Central da CAF</h1>
                    <p className="text-slate-500 mt-1">Visão em tempo real de suprimentos nos galpões centrais</p>
                </div>
                <Link href="/caf/estoque/entrada">
                    <button className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all focus:ring-4 focus:ring-slate-200 flex items-center space-x-2">
                        <span>Lançar Entrada de Lote</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </Link>
            </div>

            <EstoqueTable estoqueInicial={estoque} />
        </div>
    );
}
