import React, { useState } from 'react';
import { authService } from '../services/auth.service';
import { User } from '../models/chess';
import { Crown, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (user: User) => void;
  onNavigateRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await authService.login(email, password);
      onSuccess(user);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('magnus@chessarena.com');
    setPassword('ChessPass123!');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 items-center justify-center text-amber-400 shadow-md">
            <Crown className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Sign In to Chess Arena</h2>
          <p className="text-xs text-stone-400">
            Log in to record ratings, climb the leaderboard, and save games.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 text-xs focus:border-amber-400 outline-none transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-950/80 border border-stone-800 text-stone-100 text-xs focus:border-amber-400 outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        {/* Demo Account Button */}
        <div className="pt-2 border-t border-stone-800 text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="inline-flex items-center space-x-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Use Demo Account (MagnusC, 2840 ELO)</span>
          </button>
        </div>

        {/* Register link */}
        <div className="text-center text-xs text-stone-400">
          Don't have an account?{' '}
          <button
            onClick={onNavigateRegister}
            className="text-amber-400 hover:underline font-bold cursor-pointer"
          >
            Create one now
          </button>
        </div>
      </div>
    </div>
  );
};
