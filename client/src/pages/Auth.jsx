import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Chrome, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useAuth } from '../hooks/useAuth';
import { useGmailSync } from '../hooks/useGmailSync';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });

    const navigate = useNavigate();
    const { signIn, signUp, user } = useAuth();

    const { handleGmailSync, isGmailSyncing } = useGmailSync();

    // Redirect if already logged in
    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    // Handle email/password form
    const handleSubmit = async (e) => {
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

    const handleInputChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (error) setError('');
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
            {/* Left Side — Form */}
            <div className="flex items-center justify-center p-8 md:p-16 animate-in slide-in-from-left-4 duration-700">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                            {isLogin ? 'Welcome back' : 'Create your account'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {isLogin
                                ? 'Sign in to track your job applications'
                                : 'Start tracking your job applications today'}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 animate-in fade-in-0 duration-200">
                            {error}
                        </div>
                    )}

                    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <Input
                                            id="name" name="name" type="text" required={!isLogin}
                                            className="pl-10" placeholder="John Doe"
                                            value={formData.name} onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                                    Email address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="email" name="email" type="email" autoComplete="email" required
                                        className="pl-10" placeholder="you@example.com"
                                        value={formData.email} onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="password" name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete="current-password" required
                                        className="pl-10 pr-10" placeholder="••••••••"
                                        value={formData.password} onChange={handleInputChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {!isLogin && (
                                    <p className="mt-1 text-xs text-slate-400">Minimum 6 characters</p>
                                )}
                            </div>
                        </div>

                        <Button type="submit" className="w-full group" disabled={isLoading}>
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isLogin ? 'Signing in...' : 'Creating account...'}
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    {isLogin ? 'Sign in' : 'Create account'}
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>

                        <div className="relative my-4">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">After signing in, sync Gmail</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full relative overflow-hidden"
                            onClick={() => handleGmailSync(() => { if (user) navigate('/dashboard'); })}
                            disabled={isGmailSyncing}
                        >
                            <Chrome className="w-5 h-5 mr-2 text-rose-500" />
                            {isGmailSyncing ? 'Syncing your inbox...' : 'Sync Gmail Inbox'}
                            {isGmailSyncing && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-primary animate-pulse w-full" />
                            )}
                        </Button>
                        <p className="text-xs text-center text-slate-400">
                            Sign in first → then click above to auto-import job emails
                        </p>
                    </form>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(''); setFormData({ name: '', email: '', password: '' }); }}
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side — Branding */}
            <div className="hidden md:block relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80 mix-blend-multiply" />
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-50"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1950&q=80')" }}
                />
                <div className="absolute inset-0 flex flex-col justify-center p-16 text-white z-10">
                    <div className="max-w-md animate-in slide-in-from-right-8 duration-1000">
                        <h1 className="text-5xl font-bold tracking-tight mb-4">JobTrack</h1>
                        <p className="text-xl text-white/80 mb-8">
                            Your AI-powered job application tracker. Connect Gmail, let our AI classify your applications automatically.
                        </p>
                        <div className="space-y-4">
                            {['Auto-detects job emails from your Gmail', 'AI classifies status: Applied, Interview, Rejected', 'Beautiful dashboard to track your progress'].map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-white rounded-full flex-shrink-0" />
                                    <span className="text-white/90">{item}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-12 flex items-center gap-4">
                            <img
                                src="https://ui-avatars.com/api/?name=Sarah+Smith&background=random"
                                className="w-12 h-12 rounded-full border-2 border-white/50"
                                alt="User testimonial"
                            />
                            <div>
                                <blockquote className="text-white/90 italic text-sm">
                                    "Landed my dream role in 2 weeks using this!"
                                </blockquote>
                                <div className="font-semibold text-sm mt-1">Sarah Smith · Product Designer</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
