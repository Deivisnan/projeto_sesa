import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function IndexPage() {
    const cookieStore = await cookies();
    const userCookie = cookieStore.get('sysfarma.user');

    if (!userCookie?.value) {
        redirect('/login');
    }

    const user = JSON.parse(userCookie.value);

    if (user?.unidade?.tipo === 'CAF') {
        redirect('/caf/dashboard');
    } else {
        redirect('/unidade/dashboard');
    }
}
