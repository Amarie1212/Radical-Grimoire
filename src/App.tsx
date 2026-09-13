import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLanguage, AppThemeMode, Game, TabType } from './lib/types';
import {
  getSupabaseConfig,
  getCurrentUser,
  getSupabase,
  fetchGames,
  addGame,
  updateGame,
  deleteGame,
  markAsCleared,
  subscribeToGames,
  signOut,
  getStoredUserPreferences,
  getUserPreferences,
  saveUserPreferences,
} from './lib/supabase';
import { Navbar } from './components/Navbar';
import { GameGrid } from './components/GameGrid';
import { GameModal } from './components/GameModal';
import { EditGamePanel } from './components/EditGamePanel';
import { ConfigModal } from './components/ConfigModal';
import { AuthGate } from './components/AuthGate';
import { AchievementsView } from './components/AchievementsView';
import { ProofLightbox } from './components/ProofLightbox';
import { MemorialPlaque } from './components/MemorialPlaque';
import { JournalDashboard } from './components/JournalDashboard';
import { CheckCircle2, UserRound } from 'lucide-react';

import { User } from '@supabase/supabase-js';

export const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [config, setConfig] = useState(getSupabaseConfig());

  // Data State
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [isPlaqueOpen, setIsPlaqueOpen] = useState(false);
  const [hasInitializedSelection, setHasInitializedSelection] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('TIMELINE');
  const [themeMode, setThemeMode] = useState<AppThemeMode>('light');
  const [languageMode, setLanguageMode] = useState<AppLanguage>('id');

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPlatform, setSelectedPlatform] = useState('ALL');

  // Modals & Panels
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [lightboxProof, setLightboxProof] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  // Check initial Auth
  useEffect(() => {
    const initAuth = async () => {
      const cfg = getSupabaseConfig();
      setConfig(cfg);

      if (cfg.isConfigured) {
        const supabase = getSupabase();
        if (supabase) {
          const { data: { session } } = await supabase.auth.getSession();
          setUser(session?.user || null);

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
          });

          setAuthChecked(true);
          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      }
      setAuthChecked(true);
    };

    initAuth();
  }, []);

  // Reload Games Function
  const loadGames = useCallback(async () => {
    try {
      const data = await fetchGames(user?.id);
      setGames(data);

      if (data.length > 0 && !selectedGameId && !hasInitializedSelection) {
        setSelectedGameId(data[0].id);
        setHasInitializedSelection(true);
      }
    } catch (err) {
      console.error('Error loading games:', err);
    }
  }, [user?.id, selectedGameId, hasInitializedSelection]);

  useEffect(() => {
    const preferences = getStoredUserPreferences();
    setThemeMode(preferences.theme);
    setLanguageMode(preferences.language);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.lang = languageMode;
  }, [themeMode, languageMode]);

  useEffect(() => {
    if (user?.id) {
      getUserPreferences(user.id).then((preferences) => {
        setThemeMode(preferences.theme);
        setLanguageMode(preferences.language);
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      saveUserPreferences({ userId: user.id, theme: themeMode, language: languageMode });
    }
  }, [user?.id, themeMode, languageMode]);

  // Load games on auth change
  useEffect(() => {
    if (user || !config.isConfigured) {
      loadGames();
    }
  }, [user, config.isConfigured, loadGames]);

  // Real-time live sync subscription
  useEffect(() => {
    if (config.isConfigured && user) {
      const unsubscribe = subscribeToGames(() => {
        loadGames();
      });
      return () => {
        unsubscribe();
      };
    }
  }, [config.isConfigured, user, loadGames]);

  // Available Filter Options
  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();
    games.forEach((g) => {
      if (g.platform) {
        platforms.add(g.platform);
      }
    });
    return Array.from(platforms);
  }, [games]);

  // Filtered Games
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = g.title.toLowerCase().includes(q);
        const matchesPlatform = g.platform.toLowerCase().includes(q);
        if (!matchesTitle && !matchesPlatform) return false;
      }

      // Status
      if (selectedStatus !== 'ALL') {
        if (g.status !== selectedStatus) return false;
      }

      // Platform
      if (selectedPlatform !== 'ALL') {
        if (g.platform !== selectedPlatform) return false;
      }

      return true;
    });
  }, [games, searchQuery, selectedStatus, selectedPlatform]);

  const selectedGame = useMemo(() => {
    if (!selectedGameId) return null;
    return games.find((g) => g.id === selectedGameId) || null;
  }, [games, selectedGameId]);

  const handleSelectGame = (game: Game) => {
    setSelectedGameId(game.id);
  };

  // Handlers
  const handleSaveGame = async (gameData: Omit<Game, 'id' | 'duration_days'>, existingId?: string) => {
    let savedGame: Game;
    if (existingId) {
      savedGame = await updateGame(existingId, gameData, user?.id);
      setGames((currentGames) => currentGames.map((game) => (
        game.id === existingId ? savedGame : game
      )));
    } else {
      savedGame = await addGame(gameData, user?.id);
      setGames((currentGames) => [savedGame, ...currentGames]);
      setSelectedGameId(savedGame.id);
    }
    notify(existingId ? 'Data game berhasil diperbarui.' : 'Game berhasil ditambahkan.');
  };

  const handleDeleteGame = async (id: string) => {
    await deleteGame(id, user?.id);
    setGames((currentGames) => currentGames.filter((game) => game.id !== id));
    if (selectedGameId === id) {
      const remaining = games.filter((g) => g.id !== id);
      setSelectedGameId(remaining.length > 0 ? remaining[0].id : null);
    }
    notify('Game berhasil dihapus.');
  };

  const handleMarkCleared = async (id: string) => {
    await markAsCleared(id, undefined, user?.id);
    await loadGames();
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    notify('Berhasil keluar.');
  };

  const handleOpenEdit = (game: Game) => {
    setEditingGame(game);
    setIsEditPanelOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingGame(null);
    setIsGameModalOpen(true);
  };

  const handleViewProof = (url: string, title: string) => {
    setLightboxProof({ isOpen: true, url, title });
  };

  // Auth Gate check: If user not authenticated
  if (authChecked && !user) {
    return (
      <AuthGate
        language={languageMode}
        onAuthenticated={(method) => {
          getCurrentUser().then((currentUser) => {
            setUser(currentUser);
            notify(method === 'register' ? 'Registrasi berhasil.' : 'Login berhasil.');
          });
        }}
      />
    );
  }

  return (
    <div className="paper-world flex flex-col h-screen w-screen overflow-hidden select-none">
      {/* 1. Top Navigation Bar */}
      <Navbar
        language={languageMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        user={user}
        onSignOut={handleSignOut}
        onOpenAddModal={handleOpenAdd}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        isConfigured={config.isConfigured}
      />

      {/* 2. Main Content Body with Left Rail Arc */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Dynamic Center Work Area */}
        <main className="paper-stage flex-1 h-full overflow-y-auto relative">
          {/* TAB 1: LIBRARY (Grid of all games) */}
          {activeTab === 'LIBRARY' && (
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              <GameGrid
                language={languageMode}
                games={filteredGames}
                selectedGameId={selectedGame?.id || null}
                onSelectGame={handleSelectGame}
                onEditGame={handleOpenEdit}
                onDeleteGame={handleDeleteGame}
                onMarkCleared={handleMarkCleared}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
                availablePlatforms={availablePlatforms}
              />
            </div>
          )}

          {/* TAB 2: TIMELINE (1:1 Reference View with Centerpiece Memorial Plaque over Grid) */}
          {activeTab === 'TIMELINE' && (
            <div className="paper-dashboard max-w-7xl mx-auto">
              <JournalDashboard
                language={languageMode}
                games={filteredGames}
                selectedGame={selectedGame}
                onSelectGame={handleSelectGame}
                onEditGame={handleOpenEdit}
                onDeleteGame={handleDeleteGame}
              />
            </div>
          )}

          {/* TAB 3: ACHIEVEMENTS (Hall of Fame & Trophy Analytics) */}
          {activeTab === 'ACHIEVEMENTS' && (
            <div className="max-w-6xl mx-auto">
              <AchievementsView
                language={languageMode}
                games={games}
                onSelectGame={(g) => {
                  setSelectedGameId(g.id);
                  setIsPlaqueOpen(true);
                  setActiveTab('TIMELINE');
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* 3. Global Modals & Panels */}

      {/* Add Game Modal (registration - minimal form) */}
      <GameModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
        onSave={handleSaveGame}
        initialGame={null}
      />

      {/* Edit Game Panel (slide-in - full form) */}
      <EditGamePanel
        game={editingGame}
        isOpen={isEditPanelOpen}
        onClose={() => { setIsEditPanelOpen(false); setEditingGame(null); }}
        onSave={handleSaveGame}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        user={user}
        currentTheme={themeMode}
        currentLanguage={languageMode}
        onPreferencesSaved={(nextTheme, nextLanguage) => {
          setThemeMode(nextTheme);
          setLanguageMode(nextLanguage);
        }}
        onSaved={() => {
          setConfig(getSupabaseConfig());
          loadGames();
        }}
      />

      {isProfileOpen && (
        <div className="profile-modal-backdrop" onClick={() => setIsProfileOpen(false)}>
          <section className="profile-notebook" onClick={(event) => event.stopPropagation()}>
            <button className="profile-close" onClick={() => setIsProfileOpen(false)} aria-label="Close profile">×</button>
            <div className="profile-cover-mark"><UserRound size={42} strokeWidth={1.4} /></div>
            <span className="profile-kicker">PERSONAL ARCHIVE / VOL. IV</span>
            <h2>{user?.user_metadata?.username || user?.email?.split('@')[0] || 'Commander'}</h2>
            <p>{user?.email || 'Local notebook session'}</p>
            <div className="profile-rule" />
            <button className="profile-logout" onClick={handleSignOut}>LOG OUT</button>
          </section>
        </div>
      )}

      <ProofLightbox
        isOpen={lightboxProof.isOpen}
        imageUrl={lightboxProof.url}
        title={lightboxProof.title}
        onClose={() => setLightboxProof({ isOpen: false, url: '', title: '' })}
      />

      {toast && (
        <div className="app-toast" role="status">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
        </div>
      )}

      {isPlaqueOpen && selectedGame && (
        <div className="plaque-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <MemorialPlaque
            game={selectedGame}
            isModal
            onClose={() => setIsPlaqueOpen(false)}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteGame}
            onMarkCleared={handleMarkCleared}
            onViewProof={handleViewProof}
          />
        </div>
      )}
    </div>
  );
};
