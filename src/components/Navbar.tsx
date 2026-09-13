import React from 'react';
import { Gamepad2, Plus, Settings, UserRound } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { AppLanguage } from '../lib/types';

interface NavbarProps {
  language: AppLanguage;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  user: User | null;
  onSignOut: () => void;
  onOpenAddModal: () => void;
  onOpenConfigModal: () => void;
  onOpenProfile: () => void;
  isConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onOpenAddModal,
  searchQuery: _searchQuery,
  onSearchChange: _onSearchChange,
  user: _user,
  onSignOut: _onSignOut,
  onOpenConfigModal,
  onOpenProfile,
  isConfigured: _isConfigured,
}) => {
  const addTitle = language === 'en' ? 'Add game' : 'Tambah game';
  return (
    <header className="journal-header">
      <div className="journal-header-title">
        <Gamepad2 size={24} strokeWidth={1.35} />
        <div>
          <h1>RADICAL DREAMER</h1>
        </div>
      </div>

      <div className="journal-header-actions">
        <span>NO. 021 / 028</span>
        <button className="journal-add-action" onClick={onOpenAddModal} aria-label={addTitle} title={addTitle}>
          <Plus size={18} />
        </button>
        <button className="journal-icon-action" onClick={onOpenConfigModal} aria-label={language === 'en' ? 'Open settings' : 'Buka pengaturan'} title={language === 'en' ? 'Settings' : 'Pengaturan'}>
          <Settings size={17} />
        </button>
        <button className="journal-profile-action" onClick={onOpenProfile} aria-label={language === 'en' ? 'Profile' : 'Profil'} title={language === 'en' ? 'Profile' : 'Profil'}>
          <UserRound size={17} />
        </button>
      </div>
    </header>
  );
};
