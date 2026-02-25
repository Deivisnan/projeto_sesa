import { Activity, Package } from "lucide-react";
import { cookies } from "next/headers";
import { API_URL } from "@/services/apiConfig";

export const dynamic = "force-dynamic";

async function getUnidades() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('sysfarma.token')?.value;

        const res = await fetch(`${API_URL}/unidades`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error('Failed to fetch data')
        }

        return await res.json();
    } catch (err) {
        console.error("Error fetching", err);
        return [];
    }
}

export default async function UnidadesPage() {
    const unidades = await getUnidades();

    return (
        <div className="p-8 w-full max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Painel de Unidades</h1>
                    <p className="text-slate-500 mt-1">Consulte a Rede de Unidades pertencentes ao pólo</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
                        <tr>
                            <th className="px-6 py-4">Nome da Unidade</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {unidades.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                                    Nenhuma unidade cadastrada no sistema ainda.
                                </td>
                            </tr>
                        ) : (
                            unidades.map((unidade: any) => (
                                <tr key={unidade.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`p-2 rounded-lg ${unidade.tipo === 'CAF' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {unidade.tipo === 'CAF' ? <Package className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{unidade.nome}</p>
                                                <p className="text-sm text-slate-500">{unidade.endereco || 'Sem endereço'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${unidade.tipo === 'CAF' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {unidade.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center space-x-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            <span className="text-sm text-slate-700">Ativa</span>
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
