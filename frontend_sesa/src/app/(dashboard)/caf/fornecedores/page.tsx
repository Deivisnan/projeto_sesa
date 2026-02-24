import { Truck, Plus, Search, Building2 } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";

async function getFornecedores() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('sysfarma.token')?.value;

        const res = await fetch('http://127.0.0.1:3333/api/fornecedores', {
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

export default async function FornecedoresPage() {
    const fornecedores = await getFornecedores();

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Fornecedores Homologados</h1>
                    <p className="text-slate-500 mt-1">Gerencie os laboratórios e empresas fornecedoras do Estado</p>
                </div>
                <Link href="/caf/fornecedores/novo">
                    <button className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-all focus:ring-4 focus:ring-teal-100 flex items-center space-x-2">
                        <Plus className="w-5 h-5" />
                        <span>Novo Fornecedor</span>
                    </button>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex space-x-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por Razão Social ou CNPJ..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                        <tr>
                            <th className="px-6 py-4">Razão Social</th>
                            <th className="px-6 py-4">CNPJ</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {fornecedores.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                    Nenhum fornecedor cadastrado no sistema.
                                </td>
                            </tr>
                        ) : (
                            fornecedores.map((forn: any) => (
                                <tr key={forn.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <span className="font-medium text-slate-900">{forn.razao_social}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 text-sm font-mono rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                            {forn.cnpj || 'Não informado'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center space-x-1.5">
                                            <span className={`w-2 h-2 rounded-full ${forn.ativo ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm text-slate-700">{forn.ativo ? 'Ativo' : 'Inativo'}</span>
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
