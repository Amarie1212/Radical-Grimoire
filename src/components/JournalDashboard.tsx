import React from 'react';
import { ArrowLeft, ChevronRight, Edit2, MoreHorizontal, Search, Trash2 } from 'lucide-react';
import { AppLanguage, Game } from '../lib/types';
import { getText } from '../lib/i18n';

interface JournalDashboardProps {
  language?: AppLanguage;
  games: Game[];
  selectedGame: Game | null;
  onSelectGame: (game: Game) => void;
  onEditGame: (game: Game) => void;
  onDeleteGame: (id: string) => void;
}

const formatDate = (value: string | null, fallback: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const hasText = (value?: string | null) => Boolean(value && value.trim().length > 0);
const formatPlatform = (value: string) => value.replace('Standalone / ', '');

export const JournalDashboard: React.FC<JournalDashboardProps> = ({
  language = 'id',
  games,
  selectedGame,
  onSelectGame,
  onEditGame,
  onDeleteGame,
}) => {
  const t = {
    searchGame: getText(language, 'searchGame'),
    noGames: getText(language, 'noGames'),
    noGamesHint: getText(language, 'noGamesHint'),
    edit: getText(language, 'edit'),
    delete: getText(language, 'delete'),
    filterBy: getText(language, 'filterBy'),
    all: getText(language, 'all'),
  };
  const game = selectedGame || games[0];
  const [gameSearch, setGameSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | Game['status']>('ALL');
  const [isSortOpen, setIsSortOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Game | null>(null);
  const [mobileView, setMobileView] = React.useState<'list' | 'detail'>('list');
  const visibleGames = games.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(gameSearch.trim().toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeFilterLabel = statusFilter === 'ALL' ? 'ALL GAMES' : statusFilter.toUpperCase();
  const statusClass = (status: Game['status']) => `status-${status.toLowerCase().replace(' ', '-')}`;
  const attachedProofs = (game?.proofs && game.proofs.length > 0
    ? game.proofs
    : [game?.proof_clear, game?.proof_credits, game?.proof_achievement].filter(Boolean) as string[]
  );
  const visibleProofs = attachedProofs;
  const hasMilestones = Boolean(game?.started_on || game?.finished_on || game?.duration_days);

  return (
    <div className="journal-page" data-mobile-view={mobileView}>
      <div className="journal-columns">
        <aside className="quest-log">
          <div className="journal-section-heading">
            <div className="quest-heading-copy">
              <span>{games.length} GAMES RECORDED</span>
              <div className="quest-heading-row">
                <div className="quest-controls">
                  <label className="quest-search">
                    <Search size={15} />
                    <input
                      type="search"
                      value={gameSearch}
                      onChange={(event) => setGameSearch(event.target.value)}
                      placeholder={t.searchGame}
                      aria-label="Search games"
                    />
                  </label>
                  <div className="quest-sort-wrap">
                    <span className="quest-sort-label">{activeFilterLabel}</span>
                    <button
                      className="quest-sort-button"
                      onClick={() => setIsSortOpen((open) => !open)}
                      aria-label="Filter games by status"
                      aria-expanded={isSortOpen}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {isSortOpen && (
                      <div className="quest-sort-menu">
                        {(['ALL', 'Cleared', 'Planned', 'Dropped', 'In Progress'] as const).map((filter) => (
                          <button
                            key={filter}
                            className={statusFilter === filter ? 'is-selected' : ''}
                            onClick={() => {
                              setStatusFilter(filter);
                              setIsSortOpen(false);
                            }}
                          >
                            {filter === 'ALL' ? 'All games' : filter}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="quest-list">
            {visibleGames.length === 0 && <p className="journal-empty">{language === 'en' ? 'No matching games.' : 'Tidak ada game yang cocok.'}</p>}
            {visibleGames.map((item, index) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectGame(item);
                  setMobileView('detail');
                }}
                className={`quest-entry ${game?.id === item.id ? 'is-selected' : ''}`}
                style={{ ['--delay' as any]: `${index * 40}ms` }}
              >
                <span className="quest-dot" />
                <span className="quest-copy">
                  <strong>{item.title}</strong>
                  <small>{formatPlatform(item.platform)} &nbsp;•&nbsp; {item.duration_days || '--'} Days</small>
                  <em>Rank: {item.difficulty || 'NORMAL'}</em>
                </span>
                <span className={`quest-status ${statusClass(item.status)}`}>{item.status.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </aside>

        {game ? (
          <main className="journal-sheet">
            <div className="sheet-toolbar">
              <button className="mobile-back-to-list" onClick={() => setMobileView('list')} aria-label="Back to game list">
                <ArrowLeft size={12} /> Games
              </button>
              <div className="sheet-toolbar-actions">
                <button onClick={() => onEditGame(game)}><Edit2 size={11} /> Edit</button>
                <button className="delete" onClick={() => setDeleteTarget(game)}><Trash2 size={11} /> Erase</button>
              </div>
            </div>

            <div className="sheet-scroll-content">
              <section className="journal-profile">
              <div className="journal-cover">
                <img src={game.cover_image_url} alt={game.title} />
                <span>Cover / {game.title}.jpg</span>
              </div>
              <div className="journal-profile-copy">
                <span className="journal-label">SUBJECT TITLE / ARCHIVE #{String(games.findIndex((item) => item.id === game.id) + 1).padStart(3, '0')}</span>
                <h2>{game.title}</h2>
                {hasText(game.platform) && <p>Platform&nbsp; : {formatPlatform(game.platform)}</p>}
                {hasText(game.genre) && <p>Genre&nbsp;&nbsp;&nbsp; : {game.genre}</p>}
                {hasText(game.difficulty) && <p>Diff. Run : {game.difficulty} (Full Campaign)</p>}
                {game.rating && <p className="rating">RATING: {'■'.repeat(Math.round(game.rating))} &nbsp; {game.rating.toFixed(1)} / 10</p>}
                {hasText(game.status) && <span className={`official-stamp ${statusClass(game.status)}`}>✓ {game.status === 'Cleared' ? 'OFFICIAL CLEARED' : game.status.toUpperCase()}</span>}
              </div>
              </section>

              {hasMilestones && (
                <section className="journey-section">
                  <h3>□ EXPEDITION MILESTONES (CALENDAR)</h3>
                  <div className="milestone-strip">
                    <div><span>DEPARTURE (START DATE)</span><strong>{formatDate(game.started_on, '—')}</strong><small>First boot / campaign opened</small></div>
                    <ChevronRight className="milestone-arrow" />
                    <div><span>CONQUERED (FINISH DATE)</span><strong>{formatDate(game.finished_on, '—')}</strong><small>Credits roll / save file verified</small></div>
                    <div className="duration-note"><span>TOTAL TIME SPENT</span><strong>{game.duration_days ? `${game.duration_days} DAYS` : '—'}</strong></div>
                  </div>
                </section>
              )}

              {visibleProofs.length > 0 && (
                <section className="journey-section proofs-section">
                  <h3>□ ATTACHED PROOFS ({visibleProofs.length} POLAROID)</h3>
                  <div className="proof-row">
                    {visibleProofs.map((image, index) => (
                      <div className={`proof-paper proof-${index}`} key={`${image}-${index}`}>
                        <div><img src={image} alt={`Attached proof ${index + 1}`} /></div>
                        <strong>PHOTO {index + 1}: ATTACHED PROOF</strong>
                        <small>Game progress evidence</small>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {game.notes && (
                <section className="memo-section">
                  <h3>□ ADVENTURER'S MEMO (HANDWRITTEN JOURNAL)</h3>
                  <p>"{game.notes}"</p>
                </section>
              )}
            </div>
          </main>
        ) : (
          <main className="journal-sheet journal-empty-sheet">Select a quest entry to open its journal page.</main>
        )}
      </div>

      {deleteTarget && (
        <div className="journal-confirm-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="journal-confirm-modal" onClick={(event) => event.stopPropagation()}>
            <p>Erase this archive entry?</p>
            <strong>{deleteTarget.title}</strong>
            <div className="journal-confirm-actions">
              <button type="button" className="journal-confirm-cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                type="button"
                className="journal-confirm-erase"
                onClick={() => {
                  onDeleteGame(deleteTarget.id);
                  setDeleteTarget(null);
                }}
              >
                Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
