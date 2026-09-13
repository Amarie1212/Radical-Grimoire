import React, { useState } from 'react';
import { signIn, signUp } from '../lib/supabase';
import { AppLanguage } from '../lib/types';
import { getText } from '../lib/i18n';
import {
  Shield,
  KeyRound,
  Mail,
  User as UserIcon,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';

interface AuthGateProps {
  onAuthenticated: (method: 'login' | 'register') => void;
  language?: AppLanguage;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onAuthenticated, language = 'id' }) => {
  const t = {
    signIn: getText(language, 'signIn'),
    register: getText(language, 'register'),
    email: getText(language, 'email'),
    password: getText(language, 'password'),
    username: getText(language, 'username'),
    emailPlaceholder: getText(language, 'emailPlaceholder'),
    passwordPlaceholder: getText(language, 'passwordPlaceholder'),
    usernamePlaceholder: getText(language, 'usernamePlaceholder'),
    authSuccess: getText(language, 'authSuccess'),
  };
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg(language === 'en' ? 'Please fill in email and password.' : 'Mohon isi email dan password.');
      return;
    }

    try {
      setLoading(true);
      if (isRegistering) {
        const res = await signUp(email.trim(), password, username.trim() || email.split('@')[0]);
        if (res?.session) {
          setSuccessMsg(language === 'en' ? 'Account created and signed in successfully!' : 'Akun berhasil dibuat & otomatis masuk!');
          setTimeout(() => {
            onAuthenticated('register');
          }, 800);
        } else {
          setSuccessMsg(t.authSuccess);
          setTimeout(() => {
            setIsRegistering(false);
            setSuccessMsg(null);
          }, 1500);
        }
      } else {
        await signIn(email.trim(), password);
        onAuthenticated('login');
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setErrorMsg(error.message || 'Gagal melakukan autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4efe7] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.75),transparent_30%),linear-gradient(180deg,#f4efe7_0%,#ebe1d1_100%)]" />

      <div className="relative z-10 w-full max-w-[560px] rounded-none border-[2px] border-[#1d2b39] bg-[#f3ead9]/95 p-4 shadow-none">
        <div className="relative overflow-hidden rounded-none border-[2px] border-[#d0ae73] bg-[#f7f2e8] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.35)]">
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'repeating-linear-gradient(to bottom, rgba(85,93,105,0.08) 0, rgba(85,93,105,0.08) 1px, transparent 1px, transparent 24px)' }} />

          <div className="relative flex flex-col items-center text-center mb-5">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[2px] border-[#1d2b39] bg-[#1d2b39] shadow-none">
              <svg
                viewBox="0 0 100 100"
                className="h-12 w-12 fill-none stroke-[#d97848] stroke-[5.5]"
                aria-hidden="true"
              >
                <polygon points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5" />
                <circle cx="50" cy="50" r="11" className="fill-[#d97848] stroke-transparent" />
              </svg>
            </div>

            <h1 className="font-serif text-[clamp(2.4rem,3.2vw,4rem)] font-black uppercase tracking-[-0.08em] text-[#1f2a36] leading-[0.9]">
              RADICAL DREAMER
            </h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5a6670]">
              NOTEBOOK ARCHIVE // VOL. IV
            </p>
          </div>

          <div className="relative mb-5 grid grid-cols-2 gap-0 rounded-none border-[2px] border-[#1d2b39] bg-[#f3efe8] p-0 shadow-none">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setErrorMsg(null);
              }}
              className={`min-h-[48px] rounded-none border-r-[2px] border-[#1d2b39] py-3 text-[12px] font-black uppercase tracking-[0.18em] transition-all ${
                !isRegistering
                  ? 'bg-[#f3efe8] text-[#1d2b39]'
                  : 'bg-[#f7f3ee] text-[#2f3e4f] hover:text-[#1f2a36]'
              }`}
            >
              {t.signIn}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setErrorMsg(null);
              }}
              className={`min-h-[48px] rounded-none py-3 text-[12px] font-black uppercase tracking-[0.18em] transition-all ${
                isRegistering
                  ? 'bg-[#f3efe8] text-[#1d2b39]'
                  : 'bg-[#f7f3ee] text-[#2f3e4f] hover:text-[#1f2a36]'
              }`}
            >
              {t.register}
            </button>
          </div>

          {errorMsg && (
            <div className="relative mb-4 flex items-center gap-2 rounded-lg border border-red-500/70 bg-red-950/70 px-3.5 py-2.5 text-xs text-red-100">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="relative mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/70 bg-emerald-950/70 px-3.5 py-2.5 text-xs text-emerald-100">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="new-password" className="relative space-y-5 text-xs sm:text-sm">
            {isRegistering && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2b3b48]">
                  {t.username}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder=""
                    className="w-full rounded-none border border-[#1d2b39] bg-[#f3ebdd] py-3 pl-10 pr-3 text-[15px] text-[#1a2b3d] placeholder:text-[#7a6a55] focus:border-[#d97848] focus:outline-none focus:ring-1 focus:ring-[#d97848]"
                  />
                  <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536779]" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2b3b48]">
                {t.email}
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="email"
                  name="account-email"
                  required
                  autoComplete="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=""
                  className="w-full rounded-none border border-[#1d2b39] bg-[#f3ebdd] py-3 pl-10 pr-3 text-[15px] text-[#1a2b3d] placeholder:text-[#7a6a55] focus:border-[#d97848] focus:outline-none focus:ring-1 focus:ring-[#d97848]"
                />
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536779]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#2b3b48]">
                {t.password}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className="w-full rounded-none border border-[#1d2b39] bg-[#f3ebdd] py-3 pl-10 pr-10 text-[15px] text-[#1a2b3d] placeholder:text-[#7a6a55] focus:border-[#d97848] focus:outline-none focus:ring-1 focus:ring-[#d97848]"
                />
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#536779]" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#536779] hover:text-[#1f2a36]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-3 rounded-none border-[2px] border-[#1d2b39] bg-[#f3ead9] px-4 py-3 text-[12px] font-black uppercase tracking-[0.14em] text-[#1d2b39] shadow-[0_0_0_1px_rgba(29,43,57,0.08)] transition-all duration-200 hover:bg-[#d97848] hover:text-[#1d2b39] disabled:opacity-60"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full border-[2px] border-[#1d2b39] bg-transparent">
                <Shield className="h-4 w-4" />
              </span>
              <span className="flex items-center gap-3">
                <span>{loading ? (language === 'en' ? 'AUTHENTICATING...' : 'MEMVERIFIKASI...') : isRegistering ? t.register : t.signIn}</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
