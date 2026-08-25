import React, { useState } from 'react';
import { OccasionTheme } from '../themes';

interface ThemeDecorationsProps {
  theme: OccasionTheme;
  onThemeClick?: () => void;
}

export const ThemeHeaderGraphic: React.FC<ThemeDecorationsProps> = ({ theme, onThemeClick }) => {
  const [hovered, setHovered] = useState(false);

  if (theme.id === 'default') {
    return null;
  }

  // Visual Graphic Logos & Emblems next to title
  return (
    <div 
      className="inline-flex items-center gap-1.5 ml-1 select-none cursor-pointer group/theme-decor"
      onClick={onThemeClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${theme.name} — Click to customize theme settings`}
    >
      {/* Christmas: Santa Hat, Snowman & Pine Badge */}
      {theme.id === 'christmas' && (
        <div className="flex items-center gap-1.5 bg-red-950/90 hover:bg-red-900 border border-red-500/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5 text-red-500 animate-bounce" viewBox="0 0 36 36" fill="currentColor">
            {/* Santa Hat */}
            <path fill="#DC2626" d="M4 26 C4 26 14 10 28 8 C30 8 32 14 30 26 Z" />
            <path fill="#B91C1C" d="M12 24 C16 16 26 10 28 8 C29 11 30 18 29 26 Z" opacity="0.3" />
            {/* Hat Fluffy Brim */}
            <rect x="2" y="24" width="30" height="7" rx="3.5" fill="#FFFFFF" />
            {/* Pompom */}
            <circle cx="29" cy="8" r="4.5" fill="#FFFFFF" className="animate-pulse" />
          </svg>
          <div className="flex items-center gap-1">
            <span className="text-xs font-black text-emerald-300 drop-shadow">FESTIVE SEASON</span>
          </div>
        </div>
      )}

      {/* Bonfire Night: Glowing Fireworks & Guy Fawkes Bonfire Emblem */}
      {theme.id === 'bonfire_night' && (
        <div className="flex items-center gap-1.5 bg-amber-950/90 hover:bg-amber-900 border border-amber-500/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5" viewBox="0 0 36 36">
            {/* Logs */}
            <rect x="6" y="26" width="24" height="6" rx="2" fill="#78350F" transform="rotate(-10 18 29)" />
            <rect x="6" y="26" width="24" height="6" rx="2" fill="#92400E" transform="rotate(10 18 29)" />
            {/* Fire flame */}
            <path d="M18 4 C14 12 8 16 10 26 C12 30 24 30 26 26 C28 16 22 12 18 4 Z" fill="#F59E0B" />
            <path d="M18 12 C16 16 12 19 13 25 C14 28 22 28 23 25 C24 19 20 16 18 12 Z" fill="#EF4444" />
            <path d="M18 18 C17 20 15 22 16 25 C17 26 19 26 20 25 C21 22 19 20 18 18 Z" fill="#FEF08A" />
          </svg>
          <span className="text-xs font-black text-amber-300 drop-shadow">5TH NOV BONFIRE</span>
        </div>
      )}

      {/* Royal Bank Holiday: Crown & Union Jack Ribbon */}
      {theme.id === 'bank_holiday' && (
        <div className="flex items-center gap-1.5 bg-blue-950/90 hover:bg-blue-900 border border-blue-400/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5" viewBox="0 0 36 36" fill="none">
            {/* Crown */}
            <path d="M4 24 L8 10 L18 18 L28 10 L32 24 Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
            <rect x="4" y="24" width="28" height="6" rx="2" fill="#DC2626" />
            <circle cx="8" cy="10" r="2" fill="#EF4444" />
            <circle cx="18" cy="18" r="2" fill="#3B82F6" />
            <circle cx="28" cy="10" r="2" fill="#EF4444" />
            <circle cx="11" cy="27" r="1.5" fill="#FFFFFF" />
            <circle cx="18" cy="27" r="1.5" fill="#FFFFFF" />
            <circle cx="25" cy="27" r="1.5" fill="#FFFFFF" />
          </svg>
          <span className="text-xs font-black text-blue-200 drop-shadow">ROYAL JUBILEE</span>
        </div>
      )}

      {/* Halloween: Spooky Jack-o-Lantern & Bat */}
      {theme.id === 'halloween' && (
        <div className="flex items-center gap-1.5 bg-purple-950/90 hover:bg-purple-900 border border-purple-500/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5" viewBox="0 0 36 36">
            {/* Stem */}
            <path d="M18 4 C18 4 19 8 16 10" stroke="#15803D" strokeWidth="3" strokeLinecap="round" />
            {/* Pumpkin */}
            <ellipse cx="18" cy="22" rx="14" ry="11" fill="#EA580C" />
            <ellipse cx="18" cy="22" rx="7" ry="11" fill="#F97316" />
            {/* Eyes and mouth */}
            <polygon points="12,18 15,21 10,21" fill="#18181B" />
            <polygon points="24,18 26,21 21,21" fill="#18181B" />
            <polygon points="18,22 19.5,24 16.5,24" fill="#18181B" />
            <path d="M12 26 Q18 31 24 26 Q22 29 18 29 Q14 29 12 26 Z" fill="#18181B" />
          </svg>
          <span className="text-xs font-black text-orange-400 drop-shadow">HALLOWEEN</span>
        </div>
      )}

      {/* Spring / Easter: Blossom & Bunny Ears */}
      {theme.id === 'spring_easter' && (
        <div className="flex items-center gap-1.5 bg-pink-950/90 hover:bg-pink-900 border border-pink-400/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5" viewBox="0 0 36 36">
            {/* Bunny ears */}
            <ellipse cx="12" cy="12" rx="4" ry="10" fill="#FFFFFF" />
            <ellipse cx="12" cy="12" rx="2" ry="7" fill="#F472B6" />
            <ellipse cx="24" cy="12" rx="4" ry="10" fill="#FFFFFF" />
            <ellipse cx="24" cy="12" rx="2" ry="7" fill="#F472B6" />
            {/* Egg base */}
            <path d="M8 26 C8 18 28 18 28 26 C28 32 8 32 8 26 Z" fill="#FEF08A" stroke="#F472B6" strokeWidth="1.5" />
            <circle cx="14" cy="25" r="1.5" fill="#38BDF8" />
            <circle cx="22" cy="25" r="1.5" fill="#EC4899" />
          </svg>
          <span className="text-xs font-black text-pink-300 drop-shadow">SPRING & EASTER</span>
        </div>
      )}

      {/* Summer Solstice: Sunburst & Sunglasses */}
      {theme.id === 'summer_solstice' && (
        <div className="flex items-center gap-1.5 bg-amber-950/90 hover:bg-amber-900 border border-amber-400/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5 animate-[spin_12s_linear_infinite]" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="9" fill="#FBBF24" />
            {/* Sun rays */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line
                key={deg}
                x1="18"
                y1="3"
                x2="18"
                y2="7"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${deg} 18 18)`}
              />
            ))}
          </svg>
          <span className="text-xs font-black text-amber-300 drop-shadow">SUMMER SOLSTICE</span>
        </div>
      )}

      {/* St. Patrick's: Pot of Gold & Clover */}
      {theme.id === 'st_patricks' && (
        <div className="flex items-center gap-1.5 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-400/50 px-2.5 py-0.5 rounded-full shadow-lg transition-all transform hover:scale-105">
          <svg className="w-5 h-5" viewBox="0 0 36 36">
            {/* Clover */}
            <circle cx="13" cy="14" r="5" fill="#10B981" />
            <circle cx="23" cy="14" r="5" fill="#10B981" />
            <circle cx="13" cy="22" r="5" fill="#10B981" />
            <circle cx="23" cy="22" r="5" fill="#10B981" />
            <path d="M18 18 Q20 32 18 34" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="18" r="3" fill="#34D399" />
          </svg>
          <span className="text-xs font-black text-emerald-300 drop-shadow">ST. PATRICK'S</span>
        </div>
      )}
    </div>
  );
};

// Hanging Garlands, Icicles and Lights on Header Bar
export const ThemeHeaderGarland: React.FC<{ theme: OccasionTheme }> = ({ theme }) => {
  if (theme.id === 'default') return null;

  return (
    <div className="absolute -bottom-2.5 left-0 right-0 h-3 pointer-events-none overflow-hidden z-20 flex justify-between px-2 opacity-85">
      {/* Christmas: Hanging Icicles & Twinkling Holiday Fairy Lights */}
      {theme.id === 'christmas' && (
        <div className="w-full flex justify-between items-start">
          {Array.from({ length: 32 }).map((_, i) => {
            const height = (i % 3 === 0 ? 10 : i % 2 === 0 ? 7 : 5) + (i % 4);
            const lightColor = ['#ef4444', '#22c55e', '#fbbf24', '#38bdf8', '#a855f7'][i % 5];
            return (
              <div key={i} className="flex flex-col items-center">
                {/* Icicle */}
                <div
                  className="w-1 bg-gradient-to-b from-sky-200 to-white rounded-b-full shadow-xs"
                  style={{ height: `${height}px` }}
                />
                {/* Fairy light bulb */}
                {i % 2 === 0 && (
                  <div
                    className="w-2 h-2 rounded-full -mt-1 shadow-md animate-pulse"
                    style={{
                      backgroundColor: lightColor,
                      animationDuration: `${1 + (i % 3) * 0.5}s`,
                      boxShadow: `0 0 6px ${lightColor}`,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bonfire Night: Glowing Sparkles & Bunting */}
      {theme.id === 'bonfire_night' && (
        <div className="w-full flex justify-around items-start">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"
              style={{
                animationDuration: `${1.2 + (i % 4) * 0.4}s`,
                boxShadow: '0 0 8px #f59e0b',
              }}
            />
          ))}
        </div>
      )}

      {/* Bank Holiday: Union Jack Triangular Bunting */}
      {theme.id === 'bank_holiday' && (
        <div className="w-full flex justify-between items-start">
          {Array.from({ length: 28 }).map((_, i) => {
            const colors = ['#dc2626', '#2563eb', '#ffffff'];
            return (
              <div
                key={i}
                className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[9px] shadow-xs"
                style={{
                  borderTopColor: colors[i % 3],
                  transform: `rotate(${Math.sin(i) * 6}deg)`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* Halloween: Spooky Web & Orange Bunting */}
      {theme.id === 'halloween' && (
        <div className="w-full flex justify-between items-start">
          {Array.from({ length: 26 }).map((_, i) => (
            <div
              key={i}
              className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] opacity-80"
              style={{
                borderTopColor: i % 2 === 0 ? '#ea580c' : '#7e22ce',
              }}
            />
          ))}
        </div>
      )}

      {/* Spring / Easter: Flower Garland */}
      {theme.id === 'spring_easter' && (
        <div className="w-full flex justify-around items-start">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-pink-300 shadow-xs animate-bounce"
              style={{
                animationDuration: `${2 + (i % 3) * 0.5}s`,
                backgroundColor: ['#f472b6', '#fda4af', '#fef08a', '#a7f3d0'][i % 4],
              }}
            />
          ))}
        </div>
      )}

      {/* Summer Solstice: Golden Sunburst Dots */}
      {theme.id === 'summer_solstice' && (
        <div className="w-full flex justify-around items-start">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-sm"
              style={{ animationDuration: `${1 + (i % 3) * 0.4}s` }}
            />
          ))}
        </div>
      )}

      {/* St. Patrick's: Green Clover String */}
      {theme.id === 'st_patricks' && (
        <div className="w-full flex justify-around items-start">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs"
              style={{
                backgroundColor: i % 3 === 0 ? '#fbbf24' : '#10b981',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
