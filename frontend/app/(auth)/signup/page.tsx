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

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type SignupFields = z.infer<typeof signupSchema>;

export default function SignupPage() {
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
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFields) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.signup(data);
      login(res.token, res.user);
      router.push('/profile-setup'); // Redirect to profile setup first
    } catch (err: any) {
      setError(err.message || 'Failed to register account. Email might be in use.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base grid-pattern relative flex items-center justify-center px-4 text-txt-primary">
      <div className="w-full max-w-md relative z-10">
        
        {/* Logo banner */}
        <div className="flex flex-col items-center mb-8 text-center">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
              <Mic className="w-4 h-4 text-base" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-txt-primary">Intrvyu AI</span>
          </Link>
          <h2 className="text-xl font-display font-semibold text-txt-primary">Create your account</h2>
          <p className="text-xs text-txt-secondary leading-relaxed">Get prepared for mock interview sessions</p>
        </div>

        {/* Card Form */}
        <div className="flat-card rounded-xl bg-surface border-hairline p-6 md:p-8 shadow-2xl space-y-6">
          {error && (
            <div className="bg-weak/10 border border-weak/30 text-weak text-xs p-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                {...register('name')}
                className="w-full bg-base border border-hairline focus:border-accent rounded px-4 py-2.5 text-xs text-txt-primary placeholder-txt-secondary/40 outline-none transition-all"
              />
              {errors.name && (
                <span className="text-xs text-weak mt-1 block font-mono">{errors.name.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                className="w-full bg-base border border-hairline focus:border-accent rounded px-4 py-2.5 text-xs text-txt-primary placeholder-txt-secondary/40 outline-none transition-all"
              />
              {errors.email && (
                <span className="text-xs text-weak mt-1 block font-mono">{errors.email.message}</span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-txt-secondary uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full bg-base border border-hairline focus:border-accent rounded pl-4 pr-12 py-2.5 text-xs text-txt-primary placeholder-txt-secondary/40 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-secondary hover:text-txt-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <span className="text-xs text-weak mt-1 block font-mono">{errors.password.message}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-2 bg-accent text-base font-semibold px-4 py-3 rounded hover:bg-opacity-95 transition-all text-xs active:scale-[0.98] disabled:opacity-40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-xs font-sans border-t border-hairline pt-4">
            <span className="text-txt-secondary">Already have an account? </span>
            <Link href="/login" className="text-accent hover:underline font-semibold transition-colors">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
