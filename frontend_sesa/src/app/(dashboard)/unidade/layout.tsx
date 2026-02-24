import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function UnidadesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('sysfarma.user');

    if (!userCookie?.value) {
        redirect('/login');
    }

    const user = JSON.parse(userCookie.value);

    // Proteção estrutural: CAF e TI não entram na visada local de posto
    if (['CAF', 'TI'].includes(user?.unidade?.tipo)) {
        if (user?.unidade?.tipo === 'TI') redirect('/ti/dashboard');
        else redirect('/caf/dashboard');
    }

    return (
        <>
            {children}
        </>
    );
}
