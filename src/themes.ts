import React from 'react';

export type OccasionThemeId = 
  | 'default'
  | 'christmas'
  | 'bonfire_night'
  | 'bank_holiday'
  | 'halloween'
  | 'spring_easter'
  | 'summer_solstice'
  | 'st_patricks';

export interface OccasionTheme {
  id: OccasionThemeId;
  name: string;
  category: 'Standard' | 'Festive & Winter' | 'British Holidays' | 'Seasonal';
  subtitle: string;
  description: string;
  iconName: 'Layout' | 'Snowflake' | 'Flame' | 'Crown' | 'Ghost' | 'Flower' | 'Sun' | 'Clover';
  badgeText: string;
  badgeBg: string;
  headerBg: string;
  headerBorder: string;
  accentColor: string;
  glowColor: string;
  animationType: 'none' | 'snowing' | 'fireworks' | 'confetti' | 'halloween' | 'blossom' | 'sunlight' | 'shamrocks';
  animationName: string;
  animationDescription: string;
  charactersDescription?: string;
  previewBg: string;
}

export const OCCASION_THEMES: OccasionTheme[] = [
  {
    id: 'default',
    name: 'Classic Slate',
    category: 'Standard',
    subtitle: 'Standard Clean & Professional',
    description: 'Clean architectural neutral palette for everyday project planning.',
    iconName: 'Layout',
    badgeText: 'Classic',
    badgeBg: 'bg-slate-700 text-slate-200 border-slate-600',
    headerBg: 'bg-slate-900',
    headerBorder: 'border-slate-800',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.2)',
    animationType: 'none',
    animationName: 'No Animation',
    animationDescription: 'Standard static interface without canvas effects',
    charactersDescription: 'None',
    previewBg: 'from-slate-900 via-slate-800 to-slate-900',
  },
  {
    id: 'christmas',
    name: 'Christmas & Boxing Day',
    category: 'Festive & Winter',
    subtitle: 'Winter Wonderland Snowfall',
    description: 'Festive holiday atmosphere with drifting snowflakes, Santa hat title emblem & icicle fairy lights.',
    iconName: 'Snowflake',
    badgeText: 'Festive Season',
    badgeBg: 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-red-950/80 to-emerald-950',
    headerBorder: 'border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.15)]',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.25)',
    animationType: 'snowing',
    animationName: 'Falling Snowflakes',
    animationDescription: 'Gentle falling snowflakes with wind sway and soft crystalline sparkles',
    charactersDescription: 'Alpine Skier + Animated Snowman + Flying Santa & Rudolph Sleigh',
    previewBg: 'from-slate-950 via-red-950 to-emerald-950',
  },
  {
    id: 'bonfire_night',
    name: 'Bonfire Night (Guy Fawkes)',
    category: 'British Holidays',
    subtitle: '5th of November Fireworks',
    description: 'Rising glowing embers & sparkling sky rockets with bonfire badge and sparkler runner.',
    iconName: 'Flame',
    badgeText: '5th November',
    badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-amber-950/70 to-slate-950',
    headerBorder: 'border-amber-500/40 shadow-[0_4px_20px_rgba(245,158,11,0.18)]',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    animationType: 'fireworks',
    animationName: 'Bonfire Embers & Fireworks',
    animationDescription: 'Warm embers floating upward with periodic celebratory firework bursts',
    charactersDescription: 'Guy Fawkes Sparkler Runner with Dynamic Sparks',
    previewBg: 'from-slate-950 via-amber-950 to-orange-950',
  },
  {
    id: 'bank_holiday',
    name: 'Royal Jubilee & Bank Holiday',
    category: 'British Holidays',
    subtitle: 'Union Jack Confetti & Ribbons',
    description: 'British Bank Holiday celebration with patriotic red, white and royal blue floating confetti and Royal Guard.',
    iconName: 'Crown',
    badgeText: 'Bank Holiday',
    badgeBg: 'bg-blue-950 text-blue-200 border-blue-400/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-blue-950/80 to-red-950/60',
    headerBorder: 'border-blue-400/40 shadow-[0_4px_20px_rgba(59,130,246,0.18)]',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.3)',
    animationType: 'confetti',
    animationName: 'Jubilee Confetti',
    animationDescription: 'Fluttering ribbons and celebratory red, white and navy confetti stream',
    charactersDescription: "Marching King's Guard with Bearskin Hat & Parading Salute",
    previewBg: 'from-blue-950 via-slate-900 to-red-950',
  },
  {
    id: 'halloween',
    name: 'Halloween & All Hallows',
    category: 'Seasonal',
    subtitle: 'Spooky Spirits & Ghostly Fog',
    description: 'Eerie Halloween atmosphere with gently floating spirits, glowing orbs, jack-o-lantern logo & flying witch.',
    iconName: 'Ghost',
    badgeText: 'Halloween',
    badgeBg: 'bg-purple-950 text-purple-200 border-purple-500/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-purple-950/80 to-amber-950/50',
    headerBorder: 'border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.2)]',
    accentColor: '#a855f7',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    animationType: 'halloween',
    animationName: 'Ghostly Wisps & Embers',
    animationDescription: 'Floating ethereal wisps, subtle spooky glowing particles, and eerie embers',
    charactersDescription: 'Flying Witch on Broomstick with Magic Sparkle Trail',
    previewBg: 'from-slate-950 via-purple-950 to-slate-900',
  },
  {
    id: 'spring_easter',
    name: 'Spring Blossom & Easter',
    category: 'Seasonal',
    subtitle: 'Spring Equinox Flower Petals',
    description: 'Fresh botanical spring theme with pastel cherry blossom petals and hopping Easter bunny.',
    iconName: 'Flower',
    badgeText: 'Spring & Easter',
    badgeBg: 'bg-pink-950/80 text-pink-200 border-pink-400/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-pink-950/60 to-emerald-950/60',
    headerBorder: 'border-pink-400/40 shadow-[0_4px_20px_rgba(244,114,182,0.15)]',
    accentColor: '#f472b6',
    glowColor: 'rgba(244, 114, 182, 0.25)',
    animationType: 'blossom',
    animationName: 'Drifting Petals',
    animationDescription: 'Delicate pastel sakura and spring petals dancing softly across the workspace',
    charactersDescription: 'Hopping Easter Bunny with Decorative Egg Basket',
    previewBg: 'from-slate-950 via-pink-950 to-emerald-950',
  },
  {
    id: 'summer_solstice',
    name: 'Summer Solstice & BST',
    category: 'Seasonal',
    subtitle: 'British Summer Time Sunbeams',
    description: 'Warm golden solstice rays with shimmering sun dust particles, sun logo and roller skater.',
    iconName: 'Sun',
    badgeText: 'Summer Solstice',
    badgeBg: 'bg-amber-950/80 text-amber-200 border-amber-400/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-amber-950/60 to-cyan-950/60',
    headerBorder: 'border-amber-400/40 shadow-[0_4px_20px_rgba(251,191,36,0.15)]',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    animationType: 'sunlight',
    animationName: 'Golden Sunbeams & Dust',
    animationDescription: 'Luminescent golden light motes, radiant sun glimmers, and floating summer dust',
    charactersDescription: 'Cruising Roller Skater with Surfboard & Spinning Wheels',
    previewBg: 'from-slate-950 via-amber-950 to-cyan-950',
  },
  {
    id: 'st_patricks',
    name: "St. Patrick's & Celtic Day",
    category: 'British Holidays',
    subtitle: 'Emerald Shamrocks & Lucky Gold',
    description: 'Emerald isle celebration with floating 4-leaf shamrocks, golden clover logo and dancing Leprechaun.',
    iconName: 'Clover',
    badgeText: "St. Patrick's",
    badgeBg: 'bg-emerald-950 text-emerald-200 border-emerald-400/40',
    headerBg: 'bg-gradient-to-r from-slate-950 via-emerald-950/80 to-yellow-950/50',
    headerBorder: 'border-emerald-400/40 shadow-[0_4px_20px_rgba(160,185,129,0.2)]',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    animationType: 'shamrocks',
    animationName: 'Floating Shamrocks & Gold Dust',
    animationDescription: 'Lucky green clover leaves and twinkling gold specks floating across the screen',
    charactersDescription: 'Dancing Celtic Leprechaun with Pot of Gold & Irish Jig',
    previewBg: 'from-slate-950 via-emerald-950 to-slate-900',
  }
];

export const getThemeById = (id: OccasionThemeId | string): OccasionTheme => {
  return OCCASION_THEMES.find(t => t.id === id) || OCCASION_THEMES[0];
};
