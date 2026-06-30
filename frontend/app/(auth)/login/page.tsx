'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../../store/authStore';
import { api } from '../../../services/api';
import { Mic, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.login(data);
      login(res.token, res.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid-pattern relative flex items-center justify-center px-4">
      {/* Background radial glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo banner */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-2xl tracking-tight text-white">Intrvyu AI</span>
          </Link>
          <h2 className="text-xl font-bold text-white">Welcome back</h2>
          <p className="text-sm text-neutral-400">Sign in to resume mock interview practice</p>
        </div>

        {/* Card Form */}
        <div className="glass-card rounded-2xl border border-white/[0.08] p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all"
              />
              {errors.email && (
                <span className="text-xs text-red-400 mt-1 block">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-neutral-900 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-red-400 mt-1 block">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 disabled:from-indigo-500/50 disabled:to-violet-600/50 text-white font-medium px-4 py-3 rounded-xl transition-all select-none active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-sm">
            <span className="text-neutral-400">Don&apos;t have an account? </span>
            <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
