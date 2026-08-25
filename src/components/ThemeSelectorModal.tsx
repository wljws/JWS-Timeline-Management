import React, { useState } from 'react';
import { Icons } from '../icons';
import { OccasionTheme, OccasionThemeId, OCCASION_THEMES } from '../themes';

interface ThemeSelectorModalProps {
  currentTheme: OccasionTheme;
  onSelectTheme: (themeId: OccasionThemeId) => void;
  animationEnabled: boolean;
  onToggleAnimation: (enabled: boolean) => void;
  animationIntensity: 'low' | 'medium' | 'high';
  onChangeIntensity: (intensity: 'low' | 'medium' | 'high') => void;
  onClose: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  currentTheme,
  onSelectTheme,
  animationEnabled,
  onToggleAnimation,
  animationIntensity,
  onChangeIntensity,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'British Holidays', 'Festive & Winter', 'Seasonal', 'Standard'];

  const filteredThemes = OCCASION_THEMES.filter(
    (t) => selectedCategory === 'All' || t.category === selectedCategory
  );

  const getThemeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Snowflake':
        return <Icons.Snowflake className="w-5 h-5 text-sky-400" />;
      case 'Flame':
        return <Icons.Flame className="w-5 h-5 text-amber-500" />;
      case 'Crown':
        return <Icons.Crown className="w-5 h-5 text-blue-400" />;
      case 'Ghost':
        return <Icons.Ghost className="w-5 h-5 text-purple-400" />;
      case 'Flower':
        return <Icons.Flower className="w-5 h-5 text-pink-400" />;
      case 'Sun':
        return <Icons.Sun className="w-5 h-5 text-yellow-400" />;
      case 'Clover':
        return <Icons.Clover className="w-5 h-5 text-emerald-400" />;
      default:
        return <Icons.Layout className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div 
        id="theme-selector-modal-container"
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col text-slate-100 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
              <Icons.Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Seasonal Themes & Occasions
              </h2>
              <p className="text-xs text-slate-400">
                Customize the workspace atmosphere with British holiday themes & live ambient animations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Icons.X />
          </button>
        </div>

        {/* Animation & Intensity Controls Bar */}
        <div className="bg-slate-800/80 border-b border-slate-700/60 p-3 md:px-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={animationEnabled}
                onChange={(e) => onToggleAnimation(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-700 border-slate-600"
              />
              <span className="text-xs font-semibold text-slate-200">
                Live Animations (Snow, Fireworks, Petals, etc.)
              </span>
            </label>
            <span
              className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                animationEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-slate-700 text-slate-400 border-slate-600'
              }`}
            >
              {animationEnabled ? 'Active' : 'Disabled'}
            </span>
          </div>

          {animationEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Intensity:</span>
              <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => onChangeIntensity(level)}
                    className={`px-2.5 py-1 text-[11px] font-bold capitalize rounded-md transition-colors ${
                      animationIntensity === level
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-900/50">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Theme Cards Grid */}
        <div className="p-4 md:p-5 overflow-y-auto flex-1 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredThemes.map((theme) => {
            const isSelected = currentTheme.id === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => onSelectTheme(theme.id)}
                className={`relative rounded-xl border p-4 cursor-pointer transition-all duration-200 flex flex-col justify-between group text-left ${
                  isSelected
                    ? 'border-blue-500 bg-slate-850 shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-500'
                    : 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                {/* Header Preview Bar Mockup */}
                <div
                  className={`w-full h-8 rounded-lg mb-3 flex items-center justify-between px-2.5 border text-[11px] font-bold ${theme.headerBg} ${theme.headerBorder}`}
                >
                  <div className="flex items-center gap-1.5">
                    {getThemeIcon(theme.iconName)}
                    <span className="truncate max-w-[120px] text-white">{theme.name}</span>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${theme.badgeBg}`}>
                    {theme.badgeText}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                      {theme.name}
                    </h3>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[10px] font-extrabold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                        <Icons.Check className="w-3 h-3 stroke-[3]" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 leading-tight">
                    {theme.subtitle}
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-2 pt-1">
                    {theme.description}
                  </p>

                  {theme.charactersDescription && theme.id !== 'default' && (
                    <div className="mt-2 py-1 px-2 rounded-md bg-slate-900/80 border border-slate-700/60 text-[10.5px] text-amber-200/90 font-medium flex items-center gap-1.5">
                      <Icons.Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{theme.charactersDescription}</span>
                    </div>
                  )}
                </div>

                {/* Animation Tag */}
                <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Icons.Sparkles className="w-3 h-3 text-amber-400" />
                    {theme.animationName}
                  </span>
                  <span className="text-slate-400 font-mono text-[9.5px]">
                    {theme.category}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 md:px-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Active Theme:</span>
            <span className="font-bold text-white flex items-center gap-1">
              {getThemeIcon(currentTheme.iconName)}
              {currentTheme.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            Apply & Done
          </button>
        </div>
      </div>
    </div>
  );
};
