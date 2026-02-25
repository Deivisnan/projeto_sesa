import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = "force-dynamic";

export default async function TILayout({
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

    // Proteção: apenas o root de TI pode ver
    if (user?.unidade?.tipo !== 'TI') {
        if (user?.unidade?.tipo === 'CAF') redirect('/caf/dashboard');
        else redirect('/unidade/dashboard');
    }

    return (
        <>
            {children}
        </>
    );
}
