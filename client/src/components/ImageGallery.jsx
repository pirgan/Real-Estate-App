/**
 * components/ImageGallery.jsx
 *
 * Photo viewer matching the design reference (s3-property-detail.png).
 *
 * Layout:
 *   - Large hero image takes up ~75% of the width on the left
 *   - Vertical thumbnail strip on the right (up to 4 thumbnails)
 *   - A "+N" overflow badge on the last thumbnail if more images exist
 *   - Clicking any image or the hero opens a full-screen lightbox
 *   - Lightbox supports left/right arrow navigation and × to close
 */
import { useState } from 'react';

export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images.length) {
    return (
      <div className="bg-slate-100 rounded-2xl h-80 flex items-center justify-center text-slate-400">
        No photos available
      </div>
    );
  }

  // Show at most 4 thumbnails in the right strip
  const thumbs = images.slice(0, 4);
  const overflow = images.length - 4;

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  return (
    <>
      {/* ── Gallery grid ── */}
      <div className="flex gap-2 h-80 rounded-2xl overflow-hidden">
        {/* Hero image (left, ~75%) */}
        <div
          className="flex-1 cursor-zoom-in relative overflow-hidden bg-slate-200"
          onClick={() => setLightbox(true)}
        >
          <img
            src={images[active].url}
            alt={images[active].caption || 'Property photo'}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Vertical thumbnail strip (right, ~25%) */}
        {images.length > 1 && (
          <div className="w-28 flex flex-col gap-2">
            {thumbs.map((img, i) => {
              const isLast = i === thumbs.length - 1 && overflow > 0;
              return (
                <button
                  key={i}
                  onClick={() => { setActive(i); if (isLast) setLightbox(true); }}
                  className={`flex-1 relative overflow-hidden rounded-lg border-2 transition-colors ${
                    i === active ? 'border-amber-500' : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {/* +N overflow badge on last visible thumbnail */}
                  {isLast && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">+{overflow}</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-5 right-6 text-white text-4xl leading-none hover:text-slate-300"
            onClick={() => setLightbox(false)}
          >
            ×
          </button>

          <button
            className="absolute left-4 text-white text-5xl px-4 hover:text-slate-300"
            onClick={(e) => { e.stopPropagation(); prev(); }}
          >
            ‹
          </button>

          <img
            src={images[active].url}
            alt=""
            className="max-h-[88vh] max-w-[85vw] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-4 text-white text-5xl px-4 hover:text-slate-300"
            onClick={(e) => { e.stopPropagation(); next(); }}
          >
            ›
          </button>

          {/* Counter */}
          <span className="absolute bottom-5 text-white/60 text-sm">
            {active + 1} / {images.length}
          </span>
        </div>
      )}
    </>
  );
}
