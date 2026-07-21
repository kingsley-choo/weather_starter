export interface Theme {
  id: string;
  name: string;
  vars: Record<string, string>;
}

export const themes: Theme[] = [
  {
    id: 'apple',
    name: 'Apple',
    vars: {
      '--bg': [
        'radial-gradient(120% 80% at 70% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)',
        'radial-gradient(90% 70% at 10% 100%, rgba(80,110,150,0.55) 0%, transparent 60%)',
        'linear-gradient(170deg, #6f8aa8 0%, #5a7591 35%, #4a627c 65%, #3c5066 100%)',
      ].join(','),
      '--card-bg': 'rgba(255,255,255,0.08)',
      '--card-border': 'rgba(255,255,255,0.15)',
      '--card-active-bg': 'rgba(255,255,255,0.20)',
      '--card-active-border': 'rgba(255,255,255,0.30)',
      '--card-hover-bg': 'rgba(255,255,255,0.12)',
      '--card-idle-bg': 'rgba(255,255,255,0.07)',
      '--sidebar-bg': 'rgba(0,0,0,0.20)',
      '--sidebar-border': 'rgba(255,255,255,0.05)',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Oil',
    vars: {
      '--bg': [
        'radial-gradient(80% 60% at 80% 0%, rgba(201,168,76,0.12) 0%, transparent 60%)',
        'linear-gradient(160deg, #0a1220 0%, #0d1b2a 50%, #060e18 100%)',
      ].join(','),
      '--card-bg': 'rgba(201,168,76,0.06)',
      '--card-border': 'rgba(201,168,76,0.18)',
      '--card-active-bg': 'rgba(201,168,76,0.14)',
      '--card-active-border': 'rgba(201,168,76,0.38)',
      '--card-hover-bg': 'rgba(201,168,76,0.10)',
      '--card-idle-bg': 'rgba(201,168,76,0.04)',
      '--sidebar-bg': 'rgba(0,0,0,0.40)',
      '--sidebar-border': 'rgba(201,168,76,0.10)',
    },
  },
  {
    id: 'neon',
    name: 'Neon Forecast',
    vars: {
      '--bg': [
        'radial-gradient(80% 50% at 60% 0%, rgba(0,255,200,0.08) 0%, transparent 60%)',
        'radial-gradient(60% 40% at 0% 100%, rgba(255,0,200,0.07) 0%, transparent 55%)',
        'linear-gradient(170deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      ].join(','),
      '--card-bg': 'rgba(0,255,200,0.05)',
      '--card-border': 'rgba(0,255,200,0.20)',
      '--card-active-bg': 'rgba(0,255,200,0.12)',
      '--card-active-border': 'rgba(0,255,200,0.42)',
      '--card-hover-bg': 'rgba(0,255,200,0.09)',
      '--card-idle-bg': 'rgba(0,255,200,0.03)',
      '--sidebar-bg': 'rgba(0,0,0,0.50)',
      '--sidebar-border': 'rgba(0,255,200,0.10)',
    },
  },
  {
    id: 'desert',
    name: 'Desert Heat',
    vars: {
      '--bg': [
        'radial-gradient(100% 70% at 70% 0%, rgba(255,200,100,0.25) 0%, transparent 55%)',
        'radial-gradient(80% 60% at 0% 100%, rgba(180,80,20,0.30) 0%, transparent 60%)',
        'linear-gradient(160deg, #8b4513 0%, #a0522d 30%, #7a3b1e 65%, #5c2a10 100%)',
      ].join(','),
      '--card-bg': 'rgba(255,180,80,0.08)',
      '--card-border': 'rgba(255,180,80,0.20)',
      '--card-active-bg': 'rgba(255,180,80,0.18)',
      '--card-active-border': 'rgba(255,180,80,0.40)',
      '--card-hover-bg': 'rgba(255,180,80,0.13)',
      '--card-idle-bg': 'rgba(255,180,80,0.05)',
      '--sidebar-bg': 'rgba(0,0,0,0.25)',
      '--sidebar-border': 'rgba(255,180,80,0.12)',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Ink',
    vars: {
      '--bg': '#f5f4f0',
      '--card-bg': 'rgba(0,0,0,0.025)',
      '--card-border': 'rgba(0,0,0,0.10)',
      '--card-active-bg': 'rgba(0,102,204,0.07)',
      '--card-active-border': 'rgba(0,102,204,0.22)',
      '--card-hover-bg': 'rgba(0,0,0,0.05)',
      '--card-idle-bg': 'rgba(0,0,0,0.015)',
      '--sidebar-bg': 'rgba(0,0,0,0.03)',
      '--sidebar-border': 'rgba(0,0,0,0.08)',
    },
  },
  {
    id: 'arctic',
    name: 'Arctic Glass',
    vars: {
      '--bg': [
        'radial-gradient(120% 70% at 50% 0%, rgba(200,230,255,0.35) 0%, transparent 55%)',
        'radial-gradient(80% 60% at 0% 100%, rgba(100,160,220,0.20) 0%, transparent 60%)',
        'linear-gradient(170deg, #c8dff5 0%, #a8c8e8 35%, #88b0d8 65%, #6890b8 100%)',
      ].join(','),
      '--card-bg': 'rgba(255,255,255,0.22)',
      '--card-border': 'rgba(255,255,255,0.50)',
      '--card-active-bg': 'rgba(255,255,255,0.40)',
      '--card-active-border': 'rgba(255,255,255,0.70)',
      '--card-hover-bg': 'rgba(255,255,255,0.32)',
      '--card-idle-bg': 'rgba(255,255,255,0.16)',
      '--sidebar-bg': 'rgba(255,255,255,0.18)',
      '--sidebar-border': 'rgba(255,255,255,0.35)',
    },
  },
];

export const DEFAULT_THEME_ID = 'apple';
