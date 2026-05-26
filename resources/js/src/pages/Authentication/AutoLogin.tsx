import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AutoLogin = () => {
    const [params] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = params.get('token');
        const user  = params.get('user');

        if (token) {
            localStorage.setItem('token', token);
            if (user) {
                try {
                    localStorage.setItem('user', JSON.stringify(JSON.parse(decodeURIComponent(user))));
                } catch {
                    // user param malformé — le dashboard le rechargera depuis /api/user
                }
            }
        }

        navigate('/', { replace: true });
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#060818]">
            <span className="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block" />
        </div>
    );
};

export default AutoLogin;
