import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';

export default function Auth() {
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode');

    const [isLogin, setIsLogin] = useState(mode !== 'signup');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const navigate = useNavigate();
    const { signIn, signUp, user } = useAuth();

    // Sync isLogin state with mode search param
    useEffect(() => {
        setIsLogin(mode !== 'signup');
    }, [mode]);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Handle email/password form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            let result;
            if (isLogin) {
                result = await signIn(formData.email, formData.password);
            } else {
                if (formData.password.length < 6) {
                    setError('Password must be at least 6 characters.');
                    setIsLoading(false);
                    return;
                }
                result = await signUp(formData.email, formData.password, formData.name);
            }

            if (result.error) {
                setError(result.error.message || 'Authentication failed');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#0a0f1d] text-foreground relative overflow-hidden">
            {/* Background Decorative Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

            {/* Left Side — Form */}
            <div className="flex items-center justify-center p-6 md:p-12 z-10">
                <div className="w-full max-w-md space-y-8 bg-slate-950/40 border border-white/5 backdrop-blur-xl p-8 rounded-2xl shadow-2xl">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            {isLogin ? 'Welcome Back' : 'Create Account'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {isLogin
                                ? 'Access your automated application dashboard'
                                : 'Start tracking your career journey with AI'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-xl bg-red-950/30 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-in fade-in-0 duration-200">
                            {error}
                        </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {!isLogin && (
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-500" />
                                        </div>
                                        <Input
                                            id="name" name="name" type="text" required={!isLogin}
                                            className="pl-10 bg-slate-900/60 border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500" placeholder="John Doe"
                                            value={formData.name} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <Input
                                        id="email" name="email" type="email" autoComplete="email" required
                                        className="pl-10 bg-slate-900/60 border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500" placeholder="you@example.com"
                                        value={formData.email} onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <Input
                                        id="password" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password" required
                                        className="pl-10 pr-10 bg-slate-900/60 border-white/5 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500" placeholder="••••••••"
                                        value={formData.password} onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {!isLogin && (
                                    <p className="mt-1 text-xs text-slate-500">Minimum 6 characters</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium py-2.5 rounded-xl group transition-all duration-300 shadow-lg shadow-indigo-600/20" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-400">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', password: '' }); }}
                            className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side — Branding */}
            <div className="hidden md:block relative overflow-hidden bg-slate-950 border-l border-white/5 z-0">
                {/* Visual Accent Lines */}
                <div className="absolute top-[20%] left-[-20%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent rotate-12" />
                <div className="absolute top-[60%] left-[-20%] w-[140%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/10 to-transparent -rotate-12" />

                <div className="absolute inset-0 flex flex-col justify-center p-16 z-10">
                    <div className="max-w-md space-y-6">
                        <div className="inline-flex items-center gap-2.5 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                            ✨ AI Powered Track
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
                            NexusAI
                        </h1>
                        <p className="text-lg text-slate-400 leading-relaxed">
                            Your automated, smart job tracker. Link Gmail to securely ingest and classify emails with Llama 3 models instantly.
                        </p>
                        <div className="space-y-4 pt-4">
                            {[
                                'Auto-scrapes job application notifications',
                                'Classifies statuses (Applied, Interview, Selected, etc.)',
                                'Unified dashboard with metrics & manual tracking'
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                                    <span className="text-slate-300 text-sm font-medium">{item}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8 flex items-center gap-4">
                            <img
                                src="https://ui-avatars.com/api/?name=Sarah+Smith&background=6366f1&color=fff"
                                className="w-12 h-12 rounded-full border border-indigo-500/30"
                                alt="User testimonial"
                            />
                            <div>
                                <blockquote className="text-slate-400 italic text-sm">
                                    "Autopilot for my job search. Incredible!"
                                </blockquote>
                                <div className="font-semibold text-sm text-slate-200 mt-1">Sarah Smith · Product Designer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
