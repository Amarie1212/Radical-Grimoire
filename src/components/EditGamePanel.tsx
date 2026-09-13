import React, { useState, useEffect, useRef } from 'react';
import { Game } from '../lib/types';
import {
  X, CheckCircle, Image, Upload, Search, Loader2,
  Calendar, ScrollText, Camera, FileText, Star, Tag, Plus,
  ArrowLeft, ArrowRight,
} from 'lucide-react';

interface EditGamePanelProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (gameData: Omit<Game, 'id' | 'duration_days'>, existingId?: string) => Promise<void>;
}

const PLATFORM_OPTIONS = [
  'PC (.exe)',
  'PC (Steam)',
  'PC (Epic / GOG)',
  'PlayStation 2 (PS2)',
  'PlayStation 1 (PSX)',
  'PlayStation Portable (PSP)',
  'PlayStation 3 (PS3)',
  'PlayStation 4 (PS4)',
  'PlayStation 5 (PS5)',
  'Nintendo Switch',
  'Nintendo (Retro / Emulator)',
  'Xbox',
  'Other / Custom',
];

const STATUS_OPTIONS: Game['status'][] = ['Planned', 'In Progress', 'Cleared', 'Dropped'];

const normalizeProofs = (game: Game | null): string[] => {
  if (!game) return [''];

  if (game.proofs && game.proofs.length > 0) {
    return game.proofs.slice(0, 10);
  }

  const direct = [game.proof_clear, game.proof_credits, game.proof_achievement].filter(Boolean) as string[];
  return direct.length > 0 ? direct.slice(0, 10) : [''];
};

export const EditGamePanel: React.FC<EditGamePanelProps> = ({ game, isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('');
  const [customPlatform, setCustomPlatform] = useState('');
  const [status, setStatus] = useState<Game['status'] | ''>('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [startedOn, setStartedOn] = useState('');
  const [finishedOn, setFinishedOn] = useState('');
  const [genre, setGenre] = useState('');
  const [rating, setRating] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [proofs, setProofs] = useState<string[]>(['']);
  const [page, setPage] = useState(0);
  const [searchingOnline, setSearchingOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const proofInputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (game && isOpen) {
      setTitle(game.title || '');
      const savedPlatform = game.platform === 'PC (Standalone / .exe)' ? 'PC (.exe)' : game.platform;
      const isKnown = PLATFORM_OPTIONS.includes(savedPlatform);
      setPlatform(isKnown ? savedPlatform : 'Other / Custom');
      setCustomPlatform(isKnown ? '' : savedPlatform || '');
      setStatus(game.status || '');
      setCoverImageUrl(game.cover_image_url || '');
      setStartedOn(game.started_on || '');
      setFinishedOn(game.finished_on || '');
      setGenre(game.genre || '');
      setRating(game.rating ?? '');
      setNotes(game.notes || '');
      setProofs(normalizeProofs(game));
      setPage(0);
      setError(null);
    }
  }, [game, isOpen]);

  if (!isOpen) return null;

  const addProof = () => {
    setProofs((prev) => (prev.length >= 10 ? prev : [...prev, '']));
  };

  const updateProof = (index: number, value: string) => {
    setProofs((prev) => prev.map((item, i) => (i === index ? value : item)));
  };

  const removeProof = (index: number) => {
    setProofs((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Pilih file gambar (JPG/PNG/WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
        setError(null);
      }
    };
    reader.onerror = () => setError('Gagal membaca file.');
    reader.readAsDataURL(file);
  };

  const handleSearchOnline = async () => {
    if (!title.trim()) {
      setError('Ketik judul game dulu untuk mencari poster.');
      return;
    }

    try {
      setSearchingOnline(true);
      setError(null);
      const results = [
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
      ];
      const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setCoverImageUrl(results[hash % results.length]);
    } catch {
      setError('Gagal mencari poster online.');
    } finally {
      setSearchingOnline(false);
    }
  };

  const isTitleValid = title.trim().length > 0;
  const isPlatformValid = Boolean(platform) && (platform !== 'Other / Custom' || customPlatform.trim().length > 0);
  const isStatusValid = Boolean(status);

  const goToNextPage = () => {
    if (page === 0 && !isTitleValid) {
      setError('Mohon masukkan judul game terlebih dahulu.');
      return;
    }

    if (page === 1 && !isPlatformValid) {
      setError('Mohon pilih platform terlebih dahulu.');
      return;
    }

    if (page === 2 && !isStatusValid) {
      setError('Mohon pilih status game terlebih dahulu.');
      return;
    }

    setError(null);
    setPage((current) => Math.min(current + 1, 4));
  };

  const handleSubmit = async () => {
    const safeTitle = title.trim();
    const finalPlatform = platform === 'Other / Custom' ? customPlatform.trim() || 'Custom' : platform;
    const cleanedProofs = proofs.map((p) => p.trim()).filter(Boolean).slice(0, 10);
    const finalCover = coverImageUrl.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop';

    try {
      setLoading(true);
      setError(null);

      await onSave({
        title: safeTitle || 'Untitled Game',
        platform: finalPlatform,
        status: status || 'Planned',
        started_on: startedOn || null,
        finished_on: finishedOn || null,
        genre: genre || undefined,
        rating: rating !== '' ? Number(rating) : undefined,
        cover_image_url: finalCover,
        notes: notes || undefined,
        proof_clear: cleanedProofs[0] || undefined,
        proof_credits: cleanedProofs[1] || undefined,
        proof_achievement: cleanedProofs[2] || undefined,
        proofs: cleanedProofs.length > 0 ? cleanedProofs : undefined,
      }, game?.id);

      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Gagal menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-[#162238] text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs sm:text-sm';
  const labelCls = 'block text-slate-300 font-tactical font-semibold tracking-wider text-xs sm:text-sm flex items-center gap-1.5';
  const sectionLabelCls = 'text-[10px] font-tactical tracking-widest text-slate-500 uppercase border-b border-slate-800 pb-1 flex items-center gap-1.5 mb-3';

  return (
    <div className="notebook-entry-overlay fixed inset-0 flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="notebook-entry-modal w-full max-w-[760px] overflow-hidden my-4 flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-3.5 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="font-cinzel text-base sm:text-lg font-bold uppercase tracking-wider">
              {`NOTEBOOK CHANGE ${page + 1} / 5`}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-lg transition-colors hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
            }
          }}
          className="p-5 space-y-4 text-xs sm:text-sm overflow-y-auto"
        >
          {error && (
            <div className="bg-red-950/60 border border-red-500 text-red-200 px-3.5 py-2 rounded-lg text-xs">
              {error}
            </div>
          )}

          {page === 0 && (
            <div className="notebook-page-content space-y-1">
              <label className="block text-slate-300 font-tactical font-semibold tracking-wider">
                GAME TITLE *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Resident Evil 4 / Elden Ring"
                className="w-full bg-[#162238] text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            </div>
          )}

          {page === 1 && (
            <div className="notebook-page-content space-y-4">
              <label className="block text-slate-300 font-tactical font-semibold tracking-wider">
                PLATFORM *
              </label>
              <select
                value={platform}
                required
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full bg-[#162238] text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none cursor-pointer"
              >
                <option value="" disabled>
                  -- Pilih Platform --
                </option>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>

              {platform === 'Other / Custom' && (
                <input
                  type="text"
                  placeholder="Ketik nama platform..."
                  value={customPlatform}
                  onChange={(e) => setCustomPlatform(e.target.value)}
                  className="w-full mt-1.5 bg-[#162238] text-white px-3 py-1.5 rounded-lg border border-slate-700 text-xs focus:border-brand-orange"
                />
              )}
            </div>
          )}

          {page === 2 && (
            <div className="notebook-page-content space-y-4">
              <label className="block text-slate-300 font-tactical font-semibold tracking-wider">
                STATUS *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Game['status'])}
                className="w-full bg-[#162238] text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none cursor-pointer"
              >
                <option value="" disabled>-- Pilih Status --</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {page === 3 && (
            <div className="notebook-page-content space-y-4">
              <div className="space-y-2">
                <label className="block text-slate-300 font-tactical font-semibold tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Image className="w-3.5 h-3.5 text-brand-orange" />
                    COVER POSTER
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Online / File Device</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSearchOnline}
                    disabled={searchingOnline}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-copper-shine px-3 py-1.5 rounded-lg border border-copper-dark/60 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {searchingOnline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Cari Online</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-brand-orange" />
                    <span>Cari di Device</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setCoverImageUrl)}
                    className="hidden"
                  />
                </div>

                <input
                  type="url"
                  value={coverImageUrl.startsWith('data:') ? '[File Gambar dari Perangkat Terpilih]' : coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="Atau paste link URL gambar langsung..."
                  className="w-full bg-[#162238] text-white px-3 py-1.5 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none text-xs"
                />

                {coverImageUrl && (
                  <div className="flex items-center gap-3 p-2 bg-[#111a2d] rounded-xl border border-slate-800">
                    <img
                      src={coverImageUrl}
                      alt="Preview"
                      className="w-12 h-16 object-cover rounded-lg border border-copper-border shadow"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=200&auto=format&fit=crop';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-bold text-emerald-400 block">Poster Siap Digunakan</span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {coverImageUrl.startsWith('data:') ? 'Gambar Lokal Device' : coverImageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCoverImageUrl('')}
                        className="text-[10px] text-red-400 hover:text-red-300 mt-0.5"
                      >
                        Hapus / Ganti
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className={labelCls}><Tag className="w-3.5 h-3.5 text-teal-400" /> GENRE</label>
                <input type="text" value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="RPG, Action, Horror..." className={inputCls} />
              </div>

              <div className="space-y-1">
                <label className={labelCls}><Star className="w-3.5 h-3.5 text-yellow-400" /> RATING (1–10)</label>
                <input type="number" min={1} max={10} value={rating} onChange={(e) => setRating(e.target.value === '' ? '' : Number(e.target.value))} placeholder="8" className={inputCls} />
              </div>

              <div className="space-y-3">
                <div className={sectionLabelCls}><Calendar className="w-3 h-3" /> TANGGAL MAIN</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400 font-semibold">Started</label>
                    <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] text-slate-400 font-semibold">Finished</label>
                    <input type="date" value={finishedOn} onChange={(e) => setFinishedOn(e.target.value)} className={inputCls} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === 4 && (
            <div className="notebook-page-content space-y-4">
              <div className="space-y-2">
                <div className={sectionLabelCls}><ScrollText className="w-3 h-3" /> JOURNEY NOTES</div>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Ceritakan pengalaman mainmu..." className="w-full bg-[#162238] text-white px-3 py-2 rounded-lg border border-slate-700 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange text-xs resize-none" />
              </div>

              <div className="space-y-3">
                <div className={sectionLabelCls}><Camera className="w-3 h-3" /> MEMORIAL PLAQUE PROOFS</div>

                {proofs.map((proofUrl, index) => (
                  <div key={`${index}-${proofUrl || 'empty'}`} className="space-y-1">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><FileText className="w-3 h-3" /> Bukti {index + 1}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={proofUrl.startsWith('data:') ? '[File terpilih]' : proofUrl}
                        onChange={(e) => updateProof(index, e.target.value)}
                        placeholder="URL atau upload gambar..."
                        className={`${inputCls} flex-1`}
                      />
                      <button type="button" onClick={() => proofInputsRef.current[index]?.click()} className="px-2.5 bg-[#162238] hover:bg-slate-700 border border-slate-700 hover:border-brand-orange rounded-lg transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <input
                        ref={(el) => {
                          proofInputsRef.current[index] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, (v) => updateProof(index, v))}
                      />
                      {proofs.length > 1 && (
                        <button type="button" onClick={() => removeProof(index)} className="px-2.5 bg-red-950/30 hover:bg-red-900/40 border border-red-500/50 rounded-lg text-red-300 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addProof} className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-slate-600 text-slate-300 rounded-lg hover:border-brand-orange hover:text-brand-orange transition-colors text-[11px] font-semibold uppercase tracking-wider">
                  <Plus className="w-3.5 h-3.5" /> Tambah Proof
                </button>
              </div>
            </div>
          )}

          <div className="notebook-page-footer pt-3 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={page === 0 ? onClose : () => setPage((current) => Math.max(current - 1, 0))}
              className="notebook-nav-button"
            >
              {page === 0 ? 'CANCEL' : <><ArrowLeft size={14} /> BACK</>}
            </button>

            {page < 4 ? (
              <button
                type="button"
                onClick={goToNextPage}
                disabled={(page === 0 && !isTitleValid) || (page === 1 && !isPlatformValid) || (page === 2 && !isStatusValid)}
                className="notebook-nav-button primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                NEXT <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="notebook-nav-button primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-4 h-4" /> {loading ? 'SAVING...' : 'SAVE CHANGES'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
