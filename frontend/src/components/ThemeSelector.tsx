import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../state/themeContext';
import { themes } from '../themes';

export function ThemeSelector() {
  const { theme, setThemeId } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-medium text-white/85 backdrop-blur-xl transition hover:bg-white/[0.14]"
      >
        <span className="h-2 w-2 rounded-full bg-white/60" />
        {theme.name}
        <svg
          className={`h-3 w-3 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 top-full z-50 mt-1.5 w-44 rounded-xl border border-white/15 bg-black/70 py-1.5 shadow-xl backdrop-blur-2xl"
        >
          {themes.map((t) => (
            <button
              key={t.id}
              role="option"
              aria-selected={t.id === theme.id}
              type="button"
              onClick={() => {
                setThemeId(t.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-white/10 ${
                t.id === theme.id ? 'text-white' : 'text-white/65'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition ${
                  t.id === theme.id ? 'bg-white' : 'bg-transparent'
                }`}
              />
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
