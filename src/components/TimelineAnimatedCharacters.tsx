import React, { useState, useEffect } from 'react';
import { OccasionTheme } from '../themes';

interface TimelineAnimatedCharactersProps {
  theme: OccasionTheme;
  enabled: boolean;
}

export const TimelineAnimatedCharacters: React.FC<TimelineAnimatedCharactersProps> = ({
  theme,
  enabled,
}) => {
  if (!enabled || theme.id === 'default') {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-35 overflow-hidden select-none">
      {theme.id === 'christmas' && <ChristmasCharacters />}
      {theme.id === 'bonfire_night' && <BonfireCharacters />}
      {theme.id === 'bank_holiday' && <RoyalGuardCharacter />}
      {theme.id === 'halloween' && <HalloweenWitchCharacter />}
      {theme.id === 'spring_easter' && <EasterBunnyCharacter />}
      {theme.id === 'summer_solstice' && <SummerSkaterCharacter />}
      {theme.id === 'st_patricks' && <LeprechaunCharacter />}
    </div>
  );
};

// =========================================================================
// 1. CHRISTMAS: DETAILED ARTICULATED SKIER, ANIMATED SNOWMAN & SANTA SLEIGH
// =========================================================================
const ChristmasCharacters: React.FC = () => {
  // Skier State
  const [skierX, setSkierX] = useState(60);
  const [skierY, setSkierY] = useState(0);
  const [skierDir, setSkierDir] = useState<1 | -1>(1);
  const [skierJump, setSkierJump] = useState(false);
  const [poleAngle, setPoleAngle] = useState(0);
  const [skierBubble, setSkierBubble] = useState<string | null>(null);

  // Snowman State
  const [snowmanWave, setSnowmanWave] = useState(false);
  const [snowmanBlink, setSnowmanBlink] = useState(false);
  const [snowmanBubble, setSnowmanBubble] = useState<string | null>(null);

  // Santa Sleigh State
  const [sleighX, setSleighX] = useState(-420);
  const [reindeerLeg, setReindeerLeg] = useState(0);

  // Animate Skier along the timeline track
  useEffect(() => {
    let animId: number;
    let pos = 80;
    let dir: 1 | -1 = 1;
    const speed = 1.7;

    const loop = () => {
      const screenW = window.innerWidth;
      pos += dir * speed;

      if (pos > screenW - 140) {
        dir = -1;
        setSkierDir(-1);
      } else if (pos < 40) {
        dir = 1;
        setSkierDir(1);
      }

      setSkierX(pos);
      // Gentle carving motion up and down
      setSkierY(Math.sin(pos * 0.045) * 5);
      // Pole rhythm
      setPoleAngle(Math.sin(pos * 0.09) * 22);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Snowman blinking timer
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setSnowmanBlink(true);
      setTimeout(() => setSnowmanBlink(false), 220);
    }, 4500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Animate Santa & Reindeer gallop & flight across the sky
  useEffect(() => {
    let gallopInterval = setInterval(() => {
      setReindeerLeg((prev) => (prev + 1) % 4);
    }, 120);

    const flightTimer = setInterval(() => {
      setSleighX(-450);
      let curX = -450;
      const flyInterval = setInterval(() => {
        curX += 4.0;
        setSleighX(curX);
        if (curX > window.innerWidth + 500) {
          clearInterval(flyInterval);
        }
      }, 25);
    }, 24000);

    // Initial delayed flight
    const initialFlight = setTimeout(() => {
      let curX = -450;
      const flyInterval = setInterval(() => {
        curX += 4.0;
        setSleighX(curX);
        if (curX > window.innerWidth + 500) {
          clearInterval(flyInterval);
        }
      }, 25);
    }, 2000);

    return () => {
      clearInterval(gallopInterval);
      clearInterval(flightTimer);
      clearTimeout(initialFlight);
    };
  }, []);

  const handleSkierClick = () => {
    setSkierJump(true);
    const phrases = [
      'Powder day carving! 🎿❄️',
      'Fresh alpine snow! 🏔️',
      'Merry Christmas & happy skiing! 🎄',
      'Triple spin 360 jump! ⛷️',
      'Watch this slope trick! 🏂',
    ];
    setSkierBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setSkierJump(false), 1000);
    setTimeout(() => setSkierBubble(null), 3500);
  };

  const handleSnowmanClick = () => {
    setSnowmanWave(true);
    const phrases = [
      'Brrr! Happy winter season! ⛄',
      'Warm holiday wishes! ❄️',
      'Fresh snowfall on the timeline! 🌨️',
      'Cozy scarves & gingerbread! 🧣',
    ];
    setSnowmanBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setSnowmanWave(false), 1400);
    setTimeout(() => setSnowmanBubble(null), 3500);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 🎅 SANTA'S REINDEER & SLEIGH (Full Vector Animated Flight) */}
      {/* ========================================================= */}
      {sleighX > -430 && sleighX < window.innerWidth + 450 && (
        <div
          className="absolute top-12 pointer-events-auto cursor-pointer transition-transform duration-75 z-40 filter drop-shadow-lg"
          style={{
            left: `${sleighX}px`,
            top: `${48 + Math.sin(sleighX * 0.02) * 14}px`,
          }}
          onClick={() => {
            setSkierBubble('Ho Ho Ho! Merry Christmas to all! 🎅🎁✨');
            setTimeout(() => setSkierBubble(null), 3500);
          }}
          title="Santa & Rudolph soaring through the winter sky!"
        >
          <svg width="220" height="70" viewBox="0 0 220 70" fill="none">
            {/* Sparkle magical trail behind sleigh */}
            <circle cx="10" cy="40" r="2.5" fill="#FEF08A" opacity="0.8" className="animate-ping" />
            <circle cx="20" cy="44" r="1.5" fill="#FEF08A" opacity="0.9" />
            <circle cx="30" cy="38" r="2.0" fill="#FDE047" opacity="0.8" className="animate-pulse" />
            <path d="M5 42 Q 25 38 45 42" stroke="#FEF08A" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

            {/* --- SANTA'S SLEIGH --- */}
            {/* Gold Runners & Skids */}
            <path d="M35 56 Q 65 57 95 56 Q 105 56 112 48" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
            <path d="M40 50 L42 56 M75 50 L75 56 M95 48 L95 56" stroke="#D97706" strokeWidth="2" />
            <path d="M32 54 Q 30 50 35 48" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

            {/* Sleigh Body (Crimson Red with Gold Trim) */}
            <path
              d="M40 48 Q 38 32 50 32 L 88 32 Q 105 32 108 44 Q 106 50 96 50 L 46 50 Q 40 50 40 48 Z"
              fill="#DC2626"
              stroke="#B91C1C"
              strokeWidth="1.5"
            />
            {/* Gold Sleigh Swirl Trim */}
            <path d="M42 34 Q 65 30 102 34 Q 107 42 98 48 L 48 48" stroke="#FBBF24" strokeWidth="2" fill="none" />

            {/* Wrapped Gift Packages in Back */}
            <rect x="44" y="24" width="12" height="10" rx="1.5" fill="#16A34A" />
            <line x1="50" y1="24" x2="50" y2="34" stroke="#FEF08A" strokeWidth="1.5" />
            <rect x="54" y="22" width="10" height="12" rx="1.5" fill="#3B82F6" />
            <line x1="59" y1="22" x2="59" y2="34" stroke="#F43F5E" strokeWidth="1.5" />
            <rect x="49" y="16" width="9" height="9" rx="1" fill="#F59E0B" />
            <line x1="53.5" y1="16" x2="53.5" y2="25" stroke="#FFFFFF" strokeWidth="1.5" />

            {/* SANTA CLAUS */}
            {/* Red Coat Body */}
            <path d="M68 36 C68 28 84 28 84 36 Z" fill="#DC2626" />
            {/* Black Belt with Gold Buckle */}
            <rect x="69" y="33" width="15" height="3" fill="#18181B" />
            <rect x="74" y="32" width="5" height="5" fill="#F59E0B" rx="1" />
            <rect x="75" y="33" width="3" height="3" fill="#18181B" />
            {/* Head & Face */}
            <circle cx="76" cy="22" r="5.5" fill="#FED7AA" />
            <circle cx="78" cy="21" r="0.9" fill="#1E293B" />
            <circle cx="80" cy="22" r="1.2" fill="#F87171" /> {/* Rosy Cheek */}
            {/* Big Fluffy White Beard */}
            <path d="M72 23 C72 32 82 32 82 23 Q 77 26 72 23 Z" fill="#FFFFFF" />
            <path d="M74 24 Q 77 28 80 24" fill="#FFFFFF" />
            {/* Santa Hat */}
            <path d="M71 19 C71 12 85 14 85 19 Z" fill="#DC2626" />
            <path d="M85 17 Q 88 20 86 24" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
            <circle cx="86" cy="25" r="2.5" fill="#FFFFFF" />
            <rect x="70" y="18" width="13" height="3" rx="1.5" fill="#FFFFFF" />
            {/* Waving Mitten */}
            <circle cx="83" cy="28" r="2.5" fill="#FFFFFF" />
            <line x1="78" y1="30" x2="83" y2="28" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />

            {/* Reins Connecting Sleigh to Reindeer */}
            <path d="M85 34 Q 120 40 148 35" stroke="#78350F" strokeWidth="1.2" strokeDasharray="4 2" />

            {/* --- REINDEER (RUDOLPH) --- */}
            {/* Body */}
            <ellipse cx="165" cy="38" rx="16" ry="9" fill="#854D0E" />
            {/* Harness & Gold Bells */}
            <path d="M154 36 Q 165 42 176 36" stroke="#DC2626" strokeWidth="2" />
            <circle cx="160" cy="40" r="1.5" fill="#FBBF24" />
            <circle cx="165" cy="41" r="1.5" fill="#FBBF24" />
            <circle cx="170" cy="40" r="1.5" fill="#FBBF24" />

            {/* Legs (Animated Galloping Cycles) */}
            {reindeerLeg % 2 === 0 ? (
              <>
                {/* Front legs forward */}
                <path d="M176 42 L188 48 L194 56" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M174 42 L182 50 L186 58" stroke="#59300B" strokeWidth="2.5" strokeLinecap="round" />
                {/* Back legs kicked back */}
                <path d="M152 42 L142 50 L136 56" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M155 42 L146 48 L142 54" stroke="#59300B" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                {/* Front legs bent */}
                <path d="M176 42 L182 52 L178 60" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M174 42 L186 48 L188 56" stroke="#59300B" strokeWidth="2.5" strokeLinecap="round" />
                {/* Back legs extended */}
                <path d="M152 42 L148 52 L152 60" stroke="#713F12" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M155 42 L140 48 L134 54" stroke="#59300B" strokeWidth="2.5" strokeLinecap="round" />
              </>
            )}

            {/* Neck & Head */}
            <path d="M175 36 L186 24" stroke="#854D0E" strokeWidth="6" strokeLinecap="round" />
            <ellipse cx="188" cy="22" rx="7" ry="5" fill="#854D0E" transform="rotate(-15 188 22)" />
            {/* Eye */}
            <circle cx="188" cy="20" r="1.2" fill="#1E293B" />
            <circle cx="188.5" cy="19.5" r="0.4" fill="#FFFFFF" />
            {/* Glowing Rudolph Red Nose */}
            <circle cx="195" cy="23" r="3.2" fill="#EF4444" className="animate-pulse" />
            <circle cx="195" cy="23" r="1.5" fill="#FCA5A5" />

            {/* Majestic Antlers */}
            <path
              d="M184 18 L182 8 M182 12 L176 10 M182 10 L186 6 M185 17 L190 7 M190 11 L196 10"
              stroke="#59300B"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}

      {/* ========================================================= */}
      {/* ⛷️ THE ARTICULATED SKIER CHARACTER (Sliding along Timeline) */}
      {/* ========================================================= */}
      <div
        className={`absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40 transition-transform duration-150 ${
          skierJump ? '-translate-y-12 rotate-12 scale-110' : ''
        }`}
        style={{
          left: `${skierX}px`,
          bottom: `${12 + skierY}px`,
          transform: `${skierDir === -1 ? 'scaleX(-1)' : 'scaleX(1)'} ${
            skierJump ? 'translateY(-26px) rotate(12deg)' : ''
          }`,
        }}
        onClick={handleSkierClick}
        title="Click the Skier to perform an alpine jump trick!"
      >
        {/* Skier Speech Bubble */}
        {skierBubble && (
          <div
            className="absolute -top-14 left-1/2 bg-white/95 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-2xl border-2 border-red-500 whitespace-nowrap z-50 animate-bounce"
            style={{
              transform: skierDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <span>{skierBubble}</span>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-red-500" />
          </div>
        )}

        {/* Vector Skier Illustration */}
        <div className="relative group/skier filter drop-shadow-md">
          {/* Dynamic Snow Spray Particles behind skis */}
          <div className="absolute -left-4 bottom-1 flex gap-1 opacity-90">
            <span
              className="w-2 h-2 rounded-full bg-white animate-ping"
              style={{ animationDuration: '0.6s' }}
            />
            <span className="w-1.5 h-1.5 rounded-full bg-sky-200 animate-pulse" />
            <span className="w-1 h-1 rounded-full bg-sky-100" />
          </div>

          <svg width="58" height="58" viewBox="0 0 60 60" fill="none">
            {/* Pair of Curved Alpine Skis */}
            <path
              d="M4 54 Q 28 52 54 48 Q 58 44 59 40"
              stroke="#0284C7"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M8 56 Q 30 54 56 50 Q 60 46 61 42"
              stroke="#0369A1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Ski Bindings */}
            <rect x="25" y="47" width="8" height="4" rx="1.5" fill="#1E293B" />
            <rect x="27" y="49" width="8" height="4" rx="1.5" fill="#334155" />

            {/* Left Ski Pole (Behind) */}
            <g
              transform={`rotate(${poleAngle} 26 28)`}
              className="transition-transform duration-100"
            >
              <line x1="26" y1="28" x2="10" y2="54" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
              <circle cx="10" cy="54" r="3" fill="#94A3B8" />
              <line x1="8" y1="53" x2="12" y2="55" stroke="#1E293B" strokeWidth="1.5" />
            </g>

            {/* Skier Legs & Puffer Snowpants */}
            <path
              d="M24 38 L22 48 L27 50 M28 38 L27 48 L32 50"
              stroke="#1E293B"
              strokeWidth="5.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Torso & Red Winter Jacket */}
            <ellipse cx="28" cy="30" rx="9" ry="11" fill="#DC2626" transform="rotate(-15 28 30)" />
            {/* Jacket Zipper & Trim */}
            <path d="M25 21 L31 38" stroke="#991B1B" strokeWidth="1.5" />
            {/* Puffer Quilted Lines */}
            <path d="M21 27 Q 28 30 35 26" stroke="#B91C1C" strokeWidth="1.5" />
            <path d="M22 33 Q 29 36 36 32" stroke="#B91C1C" strokeWidth="1.5" />

            {/* Cozy Knit Scarf Fluttering in Wind */}
            <path
              d="M26 21 Q 20 23 14 21 Q 9 20 6 24"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M6 24 L5 28" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />

            {/* Skier Head & Winter Hat */}
            <circle cx="32" cy="16" r="7" fill="#FED7AA" />
            <circle cx="34" cy="18" r="1.5" fill="#FCA5A5" /> {/* Rosy Cheek */}
            {/* Ski Goggles with Mirror Reflection */}
            <rect
              x="29"
              y="13"
              width="10"
              height="5"
              rx="2.5"
              fill="#0284C7"
              stroke="#075985"
              strokeWidth="1"
            />
            <line x1="31" y1="14" x2="35" y2="16" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
            <path d="M28 15 L26 15" stroke="#1E293B" strokeWidth="1.5" />

            {/* Beanie Knit Hat with Pompom */}
            <path d="M26 14 C26 6 39 7 40 14 Z" fill="#16A34A" />
            <rect x="25" y="13" width="16" height="3" rx="1.5" fill="#15803D" />
            <circle cx="33" cy="5" r="3.5" fill="#FEF08A" className="animate-pulse" />

            {/* Right Ski Pole (In Front with Glove) */}
            <g
              transform={`rotate(${-poleAngle} 34 30)`}
              className="transition-transform duration-100"
            >
              <line x1="34" y1="30" x2="48" y2="52" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
              <circle cx="48" cy="52" r="3" fill="#94A3B8" />
              <line x1="46" y1="51" x2="50" y2="53" stroke="#1E293B" strokeWidth="1.5" />
              {/* Ski Glove Hand */}
              <circle cx="34" cy="30" r="3" fill="#1E293B" />
            </g>
          </svg>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ⛄ THE ANIMATED SNOWMAN (Interactive Vector Companion) */}
      {/* ========================================================= */}
      <div
        className="absolute bottom-3 right-6 pointer-events-auto cursor-pointer select-none z-40 transition-transform duration-200 hover:scale-110"
        onClick={handleSnowmanClick}
        title="Click the Snowman to wave and chat!"
      >
        {/* Snowman Speech Bubble */}
        {snowmanBubble && (
          <div className="absolute -top-16 right-2 bg-white/95 text-slate-900 text-xs font-black px-3.5 py-1.5 rounded-xl shadow-2xl border-2 border-emerald-500 whitespace-nowrap z-50 animate-bounce">
            <div className="flex items-center gap-1.5">
              <span>{snowmanBubble}</span>
            </div>
            <div className="absolute -bottom-2 right-8 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-500" />
          </div>
        )}

        {/* Snow Mound Ground */}
        <div className="absolute -bottom-1 -left-4 -right-4 h-3.5 bg-white/95 rounded-full blur-[1px] shadow-sm border-t border-sky-100" />

        {/* Snowman Vector Graphic */}
        <svg width="60" height="70" viewBox="0 0 60 70" fill="none" className="filter drop-shadow-md">
          {/* Bottom Large Snowball with Soft Shading */}
          <circle cx="30" cy="50" r="16" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <path d="M18 56 Q 30 66 42 56 Q 30 62 18 56 Z" fill="#E2E8F0" opacity="0.6" />
          {/* Coal Buttons */}
          <circle cx="30" cy="44" r="1.8" fill="#1E293B" />
          <circle cx="30" cy="50" r="1.8" fill="#1E293B" />
          <circle cx="30" cy="56" r="1.8" fill="#1E293B" />

          {/* Twig Arm (Left - Animated Waving) */}
          <path
            d={
              snowmanWave
                ? 'M16 40 L4 26 L1 29 M4 26 L2 22'
                : 'M16 42 L5 36 L2 39 M5 36 L4 31'
            }
            stroke="#78350F"
            strokeWidth="2.8"
            strokeLinecap="round"
            className="transition-all duration-300"
          />

          {/* Twig Arm (Right) */}
          <path
            d="M44 42 L55 37 L58 33 M55 37 L57 41"
            stroke="#78350F"
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* Head Snowball */}
          <circle cx="30" cy="26" r="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <path d="M22 30 Q 30 36 38 30 Q 30 33 22 30 Z" fill="#E2E8F0" opacity="0.6" />

          {/* Rosy Blush */}
          <circle cx="23" cy="28" r="2" fill="#FCA5A5" opacity="0.7" />
          <circle cx="37" cy="28" r="2" fill="#FCA5A5" opacity="0.7" />

          {/* Coal Eyes (With Blinking State) */}
          {snowmanBlink ? (
            <>
              <line x1="24" y1="24" x2="28" y2="24" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
              <line x1="32" y1="24" x2="36" y2="24" stroke="#1E293B" strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="26" cy="24" r="1.5" fill="#1E293B" />
              <circle cx="26.5" cy="23.5" r="0.5" fill="#FFFFFF" />
              <circle cx="34" cy="24" r="1.5" fill="#1E293B" />
              <circle cx="34.5" cy="23.5" r="0.5" fill="#FFFFFF" />
            </>
          )}

          {/* 3D Carrot Nose */}
          <polygon points="30,27 40,29 30,31" fill="#F97316" stroke="#EA580C" strokeWidth="0.8" />

          {/* Smiling Coal Mouth */}
          <circle cx="25" cy="31" r="1" fill="#1E293B" />
          <circle cx="28" cy="32.5" r="1" fill="#1E293B" />
          <circle cx="32" cy="32.5" r="1" fill="#1E293B" />
          <circle cx="35" cy="31" r="1" fill="#1E293B" />

          {/* Cozy Knitted Red & White Scarf with Fringe */}
          <rect x="20" y="33" width="20" height="5" rx="2.5" fill="#DC2626" />
          <line x1="25" y1="33" x2="25" y2="38" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="30" y1="33" x2="30" y2="38" stroke="#FFFFFF" strokeWidth="1.5" />
          <line x1="35" y1="33" x2="35" y2="38" stroke="#FFFFFF" strokeWidth="1.5" />
          <path d="M33 36 Q 38 42 39 48" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
          <line x1="37" y1="48" x2="41" y2="48" stroke="#FEF08A" strokeWidth="1.5" />

          {/* Gentleman's Top Hat */}
          <rect x="18" y="15" width="24" height="3" rx="1.5" fill="#18181B" />
          <rect x="22" y="5" width="16" height="11" rx="1.5" fill="#18181B" />
          {/* Emerald Green Ribbon on Hat */}
          <rect x="22" y="12" width="16" height="3" fill="#16A34A" />
          {/* Holly Berry on Hat */}
          <circle cx="25" cy="13.5" r="1.5" fill="#EF4444" />
          <circle cx="27" cy="13" r="1.3" fill="#EF4444" />
          <path d="M24 11 L22 9 M28 11 L30 9" stroke="#15803D" strokeWidth="1" />
        </svg>
      </div>
    </>
  );
};

// =========================================================================
// 2. BONFIRE NIGHT: ILLUSTRATED GUY FAWKES RUNNER WITH SPARKLER
// =========================================================================
const BonfireCharacters: React.FC = () => {
  const [runnerX, setRunnerX] = useState(80);
  const [runnerDir, setRunnerDir] = useState<1 | -1>(1);
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = 100;
    let dir: 1 | -1 = 1;
    let s = 0;

    const loop = () => {
      pos += dir * 2.0;
      s += 0.15;
      if (pos > window.innerWidth - 140) {
        dir = -1;
        setRunnerDir(-1);
      } else if (pos < 60) {
        dir = 1;
        setRunnerDir(1);
      }
      setRunnerX(pos);
      setStep(s);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = () => {
    const phrases = [
      'Remember, remember the 5th of November! 🎆',
      'Gunpowder, treason and plot! 🔥',
      'Sparklers & roaring bonfire! 🎇',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setBubble(null), 3500);
  };

  const legOffset = Math.sin(step) * 12;

  return (
    <div
      className="absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40 transition-transform"
      style={{
        left: `${runnerX}px`,
        transform: runnerDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onClick={handleClick}
      title="Click the Sparkler Runner!"
    >
      {bubble && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-amber-950 text-amber-200 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-amber-400 shadow-2xl whitespace-nowrap animate-bounce z-50"
          style={{ transform: runnerDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)' }}
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
        </div>
      )}

      {/* Vector Sparkler Runner */}
      <svg width="56" height="60" viewBox="0 0 56 60" fill="none" className="filter drop-shadow-md">
        {/* Dynamic Sparkler Sparks */}
        <g transform="translate(44, 14)">
          <circle cx="0" cy="0" r="3" fill="#FEF08A" className="animate-ping" />
          <circle cx="0" cy="0" r="2" fill="#F59E0B" />
          <line x1="-6" y1="-6" x2="6" y2="6" stroke="#FEF08A" strokeWidth="1.2" />
          <line x1="6" y1="-6" x2="-6" y2="6" stroke="#FDE047" strokeWidth="1.2" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#FEF08A" strokeWidth="1" />
          <line x1="-8" y1="0" x2="8" y2="0" stroke="#FEF08A" strokeWidth="1" />
        </g>
        {/* Sparkler Stick */}
        <line x1="32" y1="26" x2="44" y2="14" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />

        {/* Animated Running Legs */}
        <line
          x1="24"
          y1="40"
          x2={`${16 - legOffset}`}
          y2="54"
          stroke="#451A03"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <line
          x1="28"
          y1="40"
          x2={`${36 + legOffset}`}
          y2="54"
          stroke="#451A03"
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Flowing Cloak */}
        <path d="M14 26 C10 36 6 48 10 52 C16 48 24 44 26 38 Z" fill="#78350F" />

        {/* Torso / 17th Century Doublet */}
        <rect x="20" y="24" width="14" height="16" rx="3" fill="#92400E" />
        <rect x="18" y="34" width="18" height="3" fill="#18181B" />
        <rect x="25" y="33" width="4" height="5" fill="#F59E0B" rx="1" />

        {/* Arm Holding Sparkler */}
        <path d="M26 26 L34 26" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
        <circle cx="34" cy="26" r="2.5" fill="#FED7AA" />

        {/* Head */}
        <circle cx="26" cy="18" r="6" fill="#FED7AA" />
        <circle cx="28" cy="17" r="0.9" fill="#1E293B" />
        {/* Moustache */}
        <path d="M26 21 Q 30 20 32 23" stroke="#451A03" strokeWidth="1.5" strokeLinecap="round" />

        {/* Cavalier Wide-Brimmed Hat with Feather */}
        <ellipse cx="26" cy="13" rx="14" ry="4" fill="#18181B" />
        <rect x="18" y="6" width="16" height="8" rx="2" fill="#18181B" />
        <path d="M16 10 Q 10 4 6 8" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// =========================================================================
// 3. ROYAL BANK HOLIDAY: MARCHING KING'S GUARD WITH BEARSKIN & SALUTE
// =========================================================================
const RoyalGuardCharacter: React.FC = () => {
  const [guardX, setGuardX] = useState(100);
  const [guardDir, setGuardDir] = useState<1 | -1>(1);
  const [salute, setSalute] = useState(false);
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = 120;
    let dir: 1 | -1 = 1;
    let s = 0;

    const loop = () => {
      if (!salute) {
        pos += dir * 1.2;
        s += 0.12;
        if (pos > window.innerWidth - 150) {
          dir = -1;
          setGuardDir(-1);
        } else if (pos < 60) {
          dir = 1;
          setGuardDir(1);
        }
        setGuardX(pos);
        setStep(s);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [salute]);

  const handleClick = () => {
    setSalute(true);
    const phrases = [
      'God Save the King! 👑🇬🇧',
      'Attention! Presenting arms! 💂‍♂️',
      'Splendid British holiday! ☕',
      'Eyes right! Saluting! 🎖️',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setSalute(false), 2400);
    setTimeout(() => setBubble(null), 3800);
  };

  const legSwing = salute ? 0 : Math.sin(step) * 10;
  const armSwing = salute ? 0 : Math.sin(step) * 14;

  return (
    <div
      className="absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40 transition-transform"
      style={{
        left: `${guardX}px`,
        transform: guardDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onClick={handleClick}
      title="Click the Royal Guard to halt and salute!"
    >
      {bubble && (
        <div
          className="absolute -top-16 left-1/2 -translate-x-1/2 bg-blue-950 text-white text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-blue-400 shadow-2xl whitespace-nowrap animate-bounce z-50"
          style={{ transform: guardDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)' }}
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-blue-950" />
        </div>
      )}

      {/* Vector King's Guard */}
      <svg width="48" height="74" viewBox="0 0 48 74" fill="none" className="filter drop-shadow-md">
        {/* Animated Marching Legs */}
        <line
          x1="21"
          y1="54"
          x2={`${18 - legSwing}`}
          y2="70"
          stroke="#1E293B"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line
          x1="27"
          y1="54"
          x2={`${30 + legSwing}`}
          y2="70"
          stroke="#0F172A"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Shiny Black Boots */}
        <rect x={`${13 - legSwing}`} y="67" width="8" height="4" rx="2" fill="#000000" />
        <rect x={`${27 + legSwing}`} y="67" width="8" height="4" rx="2" fill="#000000" />

        {/* Scarlet Military Tunic Uniform */}
        <rect x="15" y="34" width="18" height="22" rx="3" fill="#DC2626" stroke="#B91C1C" strokeWidth="1" />
        {/* Gold Bullion Buttons */}
        <circle cx="24" cy="38" r="1.2" fill="#FBBF24" />
        <circle cx="24" cy="43" r="1.2" fill="#FBBF24" />
        <circle cx="24" cy="48" r="1.2" fill="#FBBF24" />
        {/* White Cross Belt */}
        <line x1="16" y1="35" x2="32" y2="55" stroke="#FFFFFF" strokeWidth="3" />
        <rect x="22" y="52" width="10" height="3" fill="#FFFFFF" />

        {/* Arms: Swinging or Saluting */}
        {salute ? (
          // Saluting Arm with White Glove
          <path d="M30 36 L36 30 L31 24" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <line
            x1="30"
            y1="36"
            x2={`${30 + armSwing}`}
            y2="48"
            stroke="#DC2626"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
        <circle cx={salute ? 31 : 30 + armSwing} cy={salute ? 24 : 48} r="2.5" fill="#FFFFFF" />

        {/* Face */}
        <circle cx="24" cy="28" r="5" fill="#FED7AA" />
        <circle cx="26" cy="27" r="0.9" fill="#1E293B" />
        {/* Gold Chin Strap */}
        <path d="M19 28 Q 24 33 29 28" stroke="#F59E0B" strokeWidth="1.5" fill="none" />

        {/* Tall Bearskin Hat */}
        <rect x="15" y="2" width="18" height="24" rx="8" fill="#18181B" />
        <path d="M15 20 Q 24 24 33 20" stroke="#3F3F46" strokeWidth="1.5" />
      </svg>
    </div>
  );
};

// =========================================================================
// 4. HALLOWEEN: FLYING WITCH ON BROOMSTICK WITH MAGIC TRAIL
// =========================================================================
const HalloweenWitchCharacter: React.FC = () => {
  const [witchX, setWitchX] = useState(-140);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = -140;

    const loop = () => {
      pos += 2.4;
      if (pos > window.innerWidth + 180) {
        pos = -160;
      }
      setWitchX(pos);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = () => {
    const phrases = [
      'Heeheehee! Spooky All Hallows Eve! 🎃',
      'Double, double toil and trouble! 🧪',
      'Midnight flight over the timeline! 🦇',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setBubble(null), 3500);
  };

  return (
    <div
      className="absolute top-28 pointer-events-auto cursor-pointer select-none z-40 transition-transform"
      style={{
        left: `${witchX}px`,
        top: `${80 + Math.sin(witchX * 0.03) * 16}px`,
      }}
      onClick={handleClick}
      title="Click the flying witch!"
    >
      {bubble && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-purple-950 text-purple-200 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-purple-400 shadow-2xl whitespace-nowrap animate-bounce z-50">
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-purple-950" />
        </div>
      )}

      {/* Vector Flying Witch */}
      <svg width="74" height="60" viewBox="0 0 74 60" fill="none" className="filter drop-shadow-lg">
        {/* Magic Purple Sparkle Trail behind broom */}
        <circle cx="6" cy="46" r="2.5" fill="#C084FC" className="animate-ping" />
        <circle cx="14" cy="42" r="1.5" fill="#E879F9" />
        <circle cx="20" cy="47" r="2" fill="#F472B6" />

        {/* Broomstick */}
        <line x1="12" y1="46" x2="68" y2="34" stroke="#78350F" strokeWidth="3.5" strokeLinecap="round" />
        {/* Broom Bristles */}
        <path d="M12 46 L2 38 L4 54 Z" fill="#CA8A04" stroke="#A16207" strokeWidth="1" />
        <line x1="10" y1="43" x2="10" y2="49" stroke="#78350F" strokeWidth="2" />

        {/* Flowing Purple Cloak */}
        <path d="M28 32 C20 40 18 52 24 50 C32 46 42 42 44 36 Z" fill="#6B21A8" />

        {/* Witch Body */}
        <ellipse cx="42" cy="32" rx="7" ry="9" fill="#581C87" transform="rotate(-15 42 32)" />
        <line x1="38" y1="36" x2="48" y2="34" stroke="#9333EA" strokeWidth="2" />

        {/* Hand Holding Broom */}
        <circle cx="50" cy="34" r="2.5" fill="#86EFAC" /> {/* Green Witch Hand */}

        {/* Witch Head */}
        <circle cx="44" cy="22" r="6" fill="#86EFAC" />
        <circle cx="46" cy="21" r="0.9" fill="#18181B" />
        {/* Crooked Nose */}
        <polygon points="46,22 51,24 46,25" fill="#4ADE80" />

        {/* Tall Pointed Witch Hat with Buckle */}
        <ellipse cx="44" cy="18" rx="14" ry="4" fill="#18181B" />
        <path d="M36 17 L44 2 L48 17 Z" fill="#18181B" />
        <rect x="37" y="14" width="12" height="3" fill="#9333EA" />
        <rect x="41" y="13.5" width="4" height="4" fill="#FBBF24" rx="0.5" />
      </svg>
    </div>
  );
};

// =========================================================================
// 5. SPRING / EASTER: ARTICULATED HOPPING EASTER BUNNY WITH BASKET
// =========================================================================
const EasterBunnyCharacter: React.FC = () => {
  const [bunnyX, setBunnyX] = useState(80);
  const [bunnyDir, setBunnyDir] = useState<1 | -1>(1);
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = 100;
    let dir: 1 | -1 = 1;
    let s = 0;

    const loop = () => {
      pos += dir * 1.6;
      s += 0.08;
      if (pos > window.innerWidth - 140) {
        dir = -1;
        setBunnyDir(-1);
      } else if (pos < 50) {
        dir = 1;
        setBunnyDir(1);
      }
      setBunnyX(pos);
      setStep(s);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = () => {
    const phrases = [
      'Hippity hop! Happy Spring & Easter! 🌸',
      'Fresh spring blossoms & painted eggs! 🥚',
      'Sunny days are here! 🐰',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setBubble(null), 3500);
  };

  const hopY = Math.abs(Math.sin(step * 3)) * 18;

  return (
    <div
      className="absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40"
      style={{
        left: `${bunnyX}px`,
        bottom: `${12 + hopY}px`,
        transform: bunnyDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onClick={handleClick}
      title="Click the Hopping Easter Bunny!"
    >
      {bubble && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-pink-950 text-pink-200 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-pink-400 shadow-2xl whitespace-nowrap animate-bounce z-50"
          style={{ transform: bunnyDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)' }}
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-400" />
        </div>
      )}

      {/* Vector Easter Bunny */}
      <svg width="54" height="64" viewBox="0 0 54 64" fill="none" className="filter drop-shadow-md">
        {/* Fluffy Tail */}
        <circle cx="8" cy="44" r="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

        {/* Bunny Body */}
        <ellipse cx="22" cy="42" rx="14" ry="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />

        {/* Bunny Feet */}
        <ellipse cx="16" cy="54" rx="7" ry="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />
        <ellipse cx="26" cy="54" rx="7" ry="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

        {/* Woven Easter Basket */}
        <ellipse cx="42" cy="46" rx="8" ry="6" fill="#D97706" stroke="#92400E" strokeWidth="1" />
        <path d="M34 46 Q 42 34 50 46" stroke="#B45309" strokeWidth="2" fill="none" />
        {/* Decorated Easter Eggs in Basket */}
        <ellipse cx="38" cy="42" rx="3.5" ry="5" fill="#F472B6" transform="rotate(-15 38 42)" />
        <ellipse cx="44" cy="40" rx="3.5" ry="5" fill="#38BDF8" />
        <ellipse cx="48" cy="43" rx="3.5" ry="5" fill="#FACC15" transform="rotate(15 48 43)" />

        {/* Bunny Head */}
        <circle cx="28" cy="24" r="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
        <circle cx="24" cy="26" r="2" fill="#FCA5A5" opacity="0.8" /> {/* Rosy Cheek */}
        {/* Cute Face */}
        <circle cx="27" cy="22" r="1.3" fill="#1E293B" />
        <polygon points="31,24 33,26 29,26" fill="#F472B6" />
        {/* Whiskers */}
        <line x1="33" y1="24" x2="40" y2="22" stroke="#94A3B8" strokeWidth="1" />
        <line x1="33" y1="26" x2="40" y2="27" stroke="#94A3B8" strokeWidth="1" />

        {/* Tall Bunny Ears with Pink Interior */}
        <g className="animate-pulse" style={{ transformOrigin: '28px 16px' }}>
          <ellipse cx="24" cy="9" rx="4" ry="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" transform="rotate(-10 24 9)" />
          <ellipse cx="24" cy="9" rx="2" ry="7" fill="#F472B6" transform="rotate(-10 24 9)" />
          <ellipse cx="32" cy="8" rx="4" ry="10" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" transform="rotate(10 32 8)" />
          <ellipse cx="32" cy="8" rx="2" ry="7" fill="#F472B6" transform="rotate(10 32 8)" />
        </g>
      </svg>
    </div>
  );
};

// =========================================================================
// 6. SUMMER SOLSTICE: CRUISING ROLLER SKATER WITH SUNGLASSES
// =========================================================================
const SummerSkaterCharacter: React.FC = () => {
  const [skaterX, setSkaterX] = useState(60);
  const [skaterDir, setSkaterDir] = useState<1 | -1>(1);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = 80;
    let dir: 1 | -1 = 1;

    const loop = () => {
      pos += dir * 2.2;
      if (pos > window.innerWidth - 140) {
        dir = -1;
        setSkaterDir(-1);
      } else if (pos < 50) {
        dir = 1;
        setSkaterDir(1);
      }
      setSkaterX(pos);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = () => {
    const phrases = [
      'Catching the British Summer sun! ☀️',
      'Longest day of the year vibes! 🏖️',
      'Cruising down the timeline! 🏄‍♂️',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setBubble(null), 3500);
  };

  return (
    <div
      className="absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40 transition-transform"
      style={{
        left: `${skaterX}px`,
        transform: skaterDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onClick={handleClick}
      title="Click the Summer Cruiser!"
    >
      {bubble && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-amber-950 text-amber-200 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-amber-400 shadow-2xl whitespace-nowrap animate-bounce z-50"
          style={{ transform: skaterDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)' }}
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400" />
        </div>
      )}

      {/* Vector Summer Roller Skater */}
      <svg width="58" height="64" viewBox="0 0 58 64" fill="none" className="filter drop-shadow-md">
        {/* Surfboard on Back */}
        <path d="M12 18 C8 28 8 46 16 52 C20 44 20 26 12 18 Z" fill="#06B6D4" stroke="#0891B2" strokeWidth="1.5" />
        <line x1="12" y1="20" x2="15" y2="48" stroke="#FBBF24" strokeWidth="2" />

        {/* Roller Skates with Spinning Wheels */}
        <rect x="22" y="52" width="10" height="4" rx="2" fill="#EC4899" />
        <circle cx="24" cy="58" r="2.5" fill="#FEF08A" stroke="#1E293B" strokeWidth="1" className="animate-spin" />
        <circle cx="30" cy="58" r="2.5" fill="#FEF08A" stroke="#1E293B" strokeWidth="1" className="animate-spin" />

        <rect x="34" y="52" width="10" height="4" rx="2" fill="#EC4899" />
        <circle cx="36" cy="58" r="2.5" fill="#FEF08A" stroke="#1E293B" strokeWidth="1" className="animate-spin" />
        <circle cx="42" cy="58" r="2.5" fill="#FEF08A" stroke="#1E293B" strokeWidth="1" className="animate-spin" />

        {/* Skater Legs & Shorts */}
        <line x1="26" y1="42" x2="26" y2="52" stroke="#FED7AA" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="36" y1="42" x2="38" y2="52" stroke="#FED7AA" strokeWidth="4.5" strokeLinecap="round" />
        <rect x="22" y="36" width="18" height="8" rx="2" fill="#3B82F6" />

        {/* Hawaiian Floral Shirt */}
        <rect x="22" y="24" width="18" height="14" rx="3" fill="#F59E0B" />
        <circle cx="26" cy="28" r="1.5" fill="#EF4444" />
        <circle cx="34" cy="32" r="1.5" fill="#EF4444" />

        {/* Head with Cool Sunglasses */}
        <circle cx="30" cy="16" r="6.5" fill="#FED7AA" />
        {/* Sunglasses */}
        <rect x="27" y="14" width="9" height="4" rx="1.5" fill="#18181B" />
        <line x1="29" y1="15" x2="32" y2="16" stroke="#60A5FA" strokeWidth="1" />

        {/* Sun Visor Cap */}
        <path d="M24 13 Q 32 10 38 13" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
        <path d="M30 13 L40 12" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};

// =========================================================================
// 7. ST. PATRICK'S: DANCING CELTIC LEPRECHAUN WITH POT OF GOLD
// =========================================================================
const LeprechaunCharacter: React.FC = () => {
  const [lepX, setLepX] = useState(90);
  const [lepDir, setLepDir] = useState<1 | -1>(1);
  const [step, setStep] = useState(0);
  const [bubble, setBubble] = useState<string | null>(null);

  useEffect(() => {
    let animId: number;
    let pos = 100;
    let dir: 1 | -1 = 1;
    let s = 0;

    const loop = () => {
      pos += dir * 1.7;
      s += 0.14;
      if (pos > window.innerWidth - 140) {
        dir = -1;
        setLepDir(-1);
      } else if (pos < 50) {
        dir = 1;
        setLepDir(1);
      }
      setLepX(pos);
      setStep(s);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleClick = () => {
    const phrases = [
      "Top o' the mornin' to ya! ☘️",
      'May the luck of the Irish be with you! 🌈',
      'Follow the rainbow to the pot of gold! 💰',
    ];
    setBubble(phrases[Math.floor(Math.random() * phrases.length)]);
    setTimeout(() => setBubble(null), 3500);
  };

  const jigY = Math.abs(Math.sin(step * 2)) * 10;
  const kickAngle = Math.sin(step * 2) * 20;

  return (
    <div
      className="absolute bottom-2 pointer-events-auto cursor-pointer select-none z-40"
      style={{
        left: `${lepX}px`,
        bottom: `${12 + jigY}px`,
        transform: lepDir === -1 ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onClick={handleClick}
      title="Click the Dancing Leprechaun!"
    >
      {bubble && (
        <div
          className="absolute -top-14 left-1/2 -translate-x-1/2 bg-emerald-950 text-emerald-200 text-xs font-black px-3.5 py-1.5 rounded-xl border-2 border-emerald-400 shadow-2xl whitespace-nowrap animate-bounce z-50"
          style={{ transform: lepDir === -1 ? 'scaleX(-1) translateX(50%)' : 'scaleX(1) translateX(-50%)' }}
        >
          {bubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-400" />
        </div>
      )}

      {/* Vector Dancing Leprechaun */}
      <svg width="56" height="64" viewBox="0 0 56 64" fill="none" className="filter drop-shadow-md">
        {/* Pot of Gold by side */}
        <ellipse cx="44" cy="50" rx="7" ry="5" fill="#18181B" />
        <ellipse cx="44" cy="47" rx="6" ry="3" fill="#FBBF24" />
        <circle cx="43" cy="46" r="1.5" fill="#FEF08A" className="animate-pulse" />
        <circle cx="46" cy="46" r="1.2" fill="#FEF08A" />

        {/* Dancing Kicking Legs */}
        <g transform={`rotate(${kickAngle} 24 44)`}>
          <line x1="20" y1="44" x2="16" y2="56" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
          {/* Buckle Boot */}
          <rect x="11" y="54" width="7" height="4" rx="2" fill="#18181B" />
          <rect x="13" y="54" width="3" height="3" fill="#FBBF24" />
        </g>
        <line x1="28" y1="44" x2="30" y2="56" stroke="#047857" strokeWidth="4.5" strokeLinecap="round" />
        <rect x="28" y="54" width="7" height="4" rx="2" fill="#18181B" />
        <rect x="30" y="54" width="3" height="3" fill="#FBBF24" />

        {/* Emerald Green Coat with Gold Buttons */}
        <rect x="16" y="28" width="18" height="18" rx="3" fill="#059669" />
        <rect x="14" y="38" width="22" height="3" fill="#18181B" />
        <rect x="22" y="37" width="5" height="5" fill="#FBBF24" rx="1" />
        <circle cx="25" cy="32" r="1" fill="#FBBF24" />

        {/* Head & Ginger Beard */}
        <circle cx="25" cy="22" r="6" fill="#FED7AA" />
        <path d="M19 23 C19 32 31 32 31 23 Z" fill="#EA580C" /> {/* Red/Orange Beard */}
        <circle cx="27" cy="20" r="0.9" fill="#1E293B" />
        <circle cx="28" cy="22" r="1.2" fill="#FCA5A5" />

        {/* Tall Green Hat with Four-Leaf Clover */}
        <rect x="14" y="14" width="22" height="3" rx="1.5" fill="#047857" />
        <rect x="17" y="4" width="16" height="11" rx="1.5" fill="#047857" />
        <rect x="17" y="11" width="16" height="3" fill="#18181B" />
        <rect x="22" y="10.5" width="5" height="4" fill="#FBBF24" rx="0.5" />
        {/* Shamrock Pin */}
        <circle cx="29" cy="8" r="1.2" fill="#34D399" />
      </svg>
    </div>
  );
};
