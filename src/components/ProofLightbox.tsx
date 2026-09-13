import React from 'react';
import { X, ExternalLink } from 'lucide-react';

interface ProofLightboxProps {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  onClose: () => void;
}

export const ProofLightbox: React.FC<ProofLightboxProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-[#0D1424] border border-copper-border rounded-2xl shadow-2xl p-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-copper-dark/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            <h3 className="font-cinzel text-base sm:text-lg font-bold text-copper-shine truncate">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open full resolution in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/80 flex items-center justify-center border border-slate-800">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop';
            }}
          />
        </div>

        {/* Footer */}
        <div className="pt-3 mt-1 flex items-center justify-between text-xs text-slate-400 font-tactical">
          <span>MEMORIAL PROOF CLEARANCE VERIFIED</span>
          <span>ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
};

