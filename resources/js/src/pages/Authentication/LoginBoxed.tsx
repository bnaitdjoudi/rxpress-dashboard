import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { authApi } from '../../services/api';

const LoginBoxed = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Sign In'));
    });
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const submitForm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authApi.login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || err.errors?.email?.[0] || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center px-4 antialiased overflow-hidden">
            {/* Ambient blobs */}
            <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl" />
                <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-orange-500/10 blur-3xl" />
                <div className="absolute left-0 top-1/3 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
            </div>

            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <a href="/" className="inline-block text-2xl font-bold tracking-tight text-white">
                        <span className="text-cyan-400">RX</span>press <span className="font-light text-slate-400">Console</span>
                    </a>
                    <p className="mt-2 text-sm text-slate-400">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 shadow-xl shadow-black/30">
                    <form className="space-y-5" onSubmit={submitForm}>
                        {error && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="Email" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Email
                            </label>
                            <input
                                id="Email"
                                type="email"
                                autoComplete="email"
                                placeholder="you@example.com"
                                required
                                maxLength={50}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label htmlFor="Password" className="block text-sm font-medium text-slate-300 mb-1.5">
                                Password
                            </label>
                            <input
                                id="Password"
                                type="password"
                                autoComplete="current-password"
                                placeholder="••••••••"
                                required
                                minLength={8}
                                maxLength={100}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-full bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full flex items-center justify-center gap-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm py-2.5 px-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading && (
                                <span className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
                            )}
                            {loading ? 'Signing in…' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-400">
                        Don't have an account?{' '}
                        <a
                            href={`${import.meta.env.VITE_SAAS_URL}/sign-up`}
                            className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                            Sign up
                        </a>
                    </p>
                    <p className="mt-4 text-xs text-slate-500">
                        © {new Date().getFullYear()} RXpress — Webhook reliability for WordPress
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginBoxed;
