import React, { useEffect, useState } from 'react';
import { getSupabaseConfig, saveSupabaseConfig, updateUserPassword } from '../lib/supabase';
import { AppLanguage, AppThemeMode } from '../lib/types';
import { X, CheckCircle2 } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: User | null;
  currentTheme?: AppThemeMode;
  currentLanguage?: AppLanguage;
  onPreferencesSaved?: (theme: AppThemeMode, language: AppLanguage) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  user,
  currentTheme = 'light',
  currentLanguage = 'id',
  onPreferencesSaved,
}) => {
  const currentConfig = getSupabaseConfig();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword || confirmPassword) {
      if (newPassword.length < 6) {
        setStatus('Password baru minimal 6 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setStatus('Konfirmasi password tidak cocok.');
        return;
      }
      try {
        await updateUserPassword(newPassword);
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Gagal mengubah password.');
        return;
      }
    }

    if (currentConfig.url && currentConfig.anonKey) {
      saveSupabaseConfig(currentConfig.url, currentConfig.anonKey);
    }

    onPreferencesSaved?.(currentTheme, currentLanguage);
    setStatus('Preferences saved successfully.');
    setTimeout(() => {
      onSaved();
      onClose();
    }, 800);
  };

  return (
    <div className="notebook-entry-overlay fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="notebook-entry-modal w-full max-w-[620px] overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-cinzel text-[28px] sm:text-[34px] font-bold uppercase tracking-[0.06em] leading-none text-[#1d1d1c]">
              SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg transition-colors hover:bg-slate-200/60"
            aria-label="Close settings"
          >
            <X className="w-7 h-7 text-[#1d1d1c]" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs sm:text-sm overflow-y-auto">
          {status && (
            <div className="bg-emerald-950/60 border border-emerald-500 text-emerald-100 px-3.5 py-2 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{status}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-3">
              {user && (
                <>
                  <div className="space-y-2">
                    <label className="block text-[#5a5750] font-tactical font-semibold tracking-[0.18em] text-[10px] sm:text-[11px] uppercase">
                      CHANGE PASSWORD
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full bg-[#f7f3ea] text-slate-800 px-3 py-3 text-base border border-[#8f8c83] outline-none focus:border-[#3f7e7d] focus:shadow-[0_0_0_2px_rgba(63,126,125,0.12)]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[#5a5750] font-tactical font-semibold tracking-[0.18em] text-[10px] sm:text-[11px] uppercase">
                      CONFIRM PASSWORD
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-[#f7f3ea] text-slate-800 px-3 py-3 text-base border border-[#8f8c83] outline-none focus:border-[#3f7e7d] focus:shadow-[0_0_0_2px_rgba(63,126,125,0.12)]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="min-w-[90px] border border-[#1d1d1d] bg-[#f8f5ef] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#1d1d1d] transition-colors hover:bg-[#f1ebdf]"
                style={{ fontFamily: "'Courier New', 'Segoe UI', monospace" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-w-[90px] border border-[#d56b61] bg-[#f7e0d8] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#d56b61] transition-colors hover:bg-[#f3d3ca]"
                style={{ fontFamily: "'Courier New', 'Segoe UI', monospace" }}
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

