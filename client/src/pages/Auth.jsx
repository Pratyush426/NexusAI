import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isAuthorizing, setIsAuthorizing] = useState(false);
    const navigate = useNavigate();
    const { loginLocal, user } = useAuth(); // Get loginLocal and user

    // Google Auth Configuration
    const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
    const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
    const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';

    let tokenClient;
    let gapiInited = false;
    let gisInited = false;

    useEffect(() => {
        let interval;

        const initGoogle = async () => {
            // Initialize GAPI
            await window.gapi.client.init({
                apiKey: API_KEY,
                discoveryDocs: [DISCOVERY_DOC],
            });

            // Initialize Token Client
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: () => { }, // set dynamically later
            });


        };

        // Wait until both scripts are available
        interval = setInterval(() => {
            if (window.gapi && window.google) {
                clearInterval(interval);
                window.gapi.load("client", initGoogle);
            }
        }, 300);

        return () => clearInterval(interval);
    }, []);


    const handleAuthClick = () => {
        if (!tokenClient) {
            // Re-init if needed
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: '',
            });
        }

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                throw resp;
            }
            setIsAuthorizing(true);
            await listMessages();
            setIsAuthorizing(false);
            loginLocal(); // Ensure user is logged in
            navigate('/dashboard');
        };

        if (window.gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    };

    const listMessages = async () => {
        try {
            const response = await window.gapi.client.gmail.users.messages.list({
                'userId': 'me',
                'maxResults': 25,
                'labelIds': ['INBOX'],
            });

            const messages = response.result.messages;
            if (!messages) {
                alert('No messages found.');
                return;
            }

            for (const msg of messages) {
                const fullMessage = await getMessage(msg.id);
                const headers = fullMessage.payload.headers;
                const from = headers.find(h => h.name === 'From')?.value || '';
                const date = headers.find(h => h.name === 'Date')?.value || '';
                const subject = headers.find(h => h.name === 'Subject')?.value || '';

                let body = '';
                if (fullMessage.payload.parts) {
                    const part = fullMessage.payload.parts.find(p => p.mimeType === 'text/plain');
                    if (part && part.body && part.body.data) {
                        body = atob(part.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                    }
                } else if (fullMessage.payload.body && fullMessage.payload.body.data) {
                    body = atob(fullMessage.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
                }

                // Send to Backend
                await fetch('/api/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        MessageId: msg.id,
                        from,
                        date,
                        subject,
                        body
                    })
                });
            }
            alert('Emails synchronized with JobTrack backend!');
        } catch (err) {
            console.error(err);
            alert('Error syncing emails: ' + err.message);
        }
    };

    const getMessage = async (messageId) => {
        const response = await window.gapi.client.gmail.users.messages.get({
            'userId': 'me',
            'id': messageId,
            'format': 'full',
        });
        return response.result;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email');
        const password = formData.get('password');
        const name = formData.get('name');

        try {
            const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
            const payload = isLogin
                ? { email, password }
                : { name, email, password };

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || 'Authentication failed');
                return;
            }

            // Success
            loginLocal(data.user);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white">
            {/* Left Side - Form */}
            <div className="flex items-center justify-center p-8 md:p-16 animate-in slide-in-from-left-4 duration-700">
                <div className="w-full max-w-md space-y-8">
                    <div className="text-center md:text-left">
                        {/* Branding moved to right panel */}
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {isLogin ? 'Enter your details to access your account' : 'Start your journey to your dream job today'}
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            {!isLogin && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <User className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <Input
                                            id="name"
                                            name="name"
                                            type="text"
                                            required
                                            className="pl-10"
                                            placeholder="John Doe"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        className="pl-10"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-400" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        className="pl-10"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        {isLogin && (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input
                                        id="remember-me"
                                        name="remember-me"
                                        type="checkbox"
                                        className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                                    />
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-500">
                                        Remember me
                                    </label>
                                </div>
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-primary hover:text-primary/80">
                                        Forgot password?
                                    </a>
                                </div>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full group"
                        >
                            {isLogin ? 'Sign in' : 'Sign up'}
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Button type="button" variant="outline" className="w-full">
                                <Github className="w-5 h-5 mr-2" />
                                Github
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn("w-full relative overflow-hidden", isAuthorizing && "cursor-wait opacity-80")}
                                onClick={handleAuthClick}
                                disabled={isAuthorizing}
                            >
                                <Chrome className="w-5 h-5 mr-2 text-rose-500" />
                                {isAuthorizing ? 'Syncing...' : 'Google'}
                                {isAuthorizing && (
                                    <div className="absolute bottom-0 left-0 h-1 bg-primary animate-progress w-full"></div>
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="mt-4 text-center text-sm text-slate-500">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="font-medium text-primary hover:text-primary/80 transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Log in'}
                        </button>
                    </p>
                </div>
            </div>

            {/* Right Side - Image/Gradient */}
            <div className="hidden md:block relative overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80 mix-blend-multiply" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80')] bg-cover bg-center opacity-50" />
                <div className="absolute inset-0 flex flex-col justify-center p-16 text-white z-10">
                    <div className="max-w-md animate-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-backwards">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-brand font-bold tracking-tight mb-6">
                            <span className="gradient-text">JobTrackr.Co</span>
                        </h1>
                        <blockquote className="text-2xl font-medium mb-6">
                            "This platform completely transformed my job search. I landed my dream role in 2 weeks!"
                        </blockquote>
                        <div className="flex items-center gap-4">
                            <img src="https://ui-avatars.com/api/?name=Sarah+Smith&background=random" className="w-12 h-12 rounded-full border-2 border-white/50" alt="User" />
                            <div>
                                <div className="font-bold">Sarah Smith</div>
                                <div className="text-indigo-200 text-sm">Product Designer at Airbnb</div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-8">
                            <div className="w-12 h-1 bg-white rounded-full"></div>
                            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                            <div className="w-2 h-1 bg-white/30 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;
