import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export function useAuth() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const userCookie = Cookies.get('sysfarma.user');
        if (userCookie) {
            try {
                setUser(JSON.parse(userCookie));
            } catch (err) {
                console.error('Error parsing user cookie in useAuth hook:', err);
            }
        }
    }, []);

    return { user };
}
