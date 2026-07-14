import clsx from 'clsx';
import { useId } from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const SIZE_PX: Record<LogoSize, number> = {
  xs: 20,
  sm: 28,
  md: 40,
  lg: 56,
  xl: 96,
  '2xl': 160,
};

interface EcoSphereLogoProps {
  size?: LogoSize;
  animated?: boolean;
  showRing?: boolean;
  showHalo?: boolean;
  className?: string;
}

/**
 * A high-fidelity, 3D-styled EcoSphere globe rendered as pure SVG.
 *
 *  · Layered radial gradients build sphere shading (light → mid → shadow terminator).
 *  · Stylised continent land-masses tinted emerald sit on an atmospheric ocean.
 *  · A soft specular highlight and outer atmospheric halo sell the depth.
 *  · An optional tilted orbital ring reinforces the "sphere" identity.
 *  · Optional slow-rotation animates continents *inside* the sphere clip.
 */
export function EcoSphereLogo({
  size = 'md',
  animated = false,
  showRing = true,
  showHalo = true,
  className,
}: EcoSphereLogoProps) {
  const uid = useId().replace(/:/g, '');
  const px = SIZE_PX[size];

  const oceanId = `ocean-${uid}`;
  const specId = `spec-${uid}`;
  const shadowId = `shadow-${uid}`;
  const haloId = `halo-${uid}`;
  const landId = `land-${uid}`;
  const ringId = `ring-${uid}`;
  const clipId = `clip-${uid}`;
  const glossId = `gloss-${uid}`;

  return (
    <svg
      viewBox="0 0 120 120"
      width={px}
      height={px}
      role="img"
      aria-label="EcoSphere globe logo"
      className={clsx('block select-none', className)}
    >
      <defs>
        {/* ── Ocean sphere: bright teal highlight → emerald mid → deep abyss ─── */}
        <radialGradient id={oceanId} cx="35%" cy="28%" r="80%">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="18%" stopColor="#34d399" />
          <stop offset="42%" stopColor="#10b981" />
          <stop offset="72%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </radialGradient>

        {/* Terminator: soft shadow across the far side */}
        <radialGradient id={shadowId} cx="82%" cy="78%" r="80%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
          <stop offset="55%" stopColor="rgba(0,0,0,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Specular highlight (glossy top-left) */}
        <radialGradient id={specId} cx="32%" cy="24%" r="30%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.75)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Curved glass gloss band on the upper hemisphere */}
        <linearGradient id={glossId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.06)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Atmospheric halo (soft green bloom around edge) */}
        <radialGradient id={haloId} cx="50%" cy="50%" r="55%">
          <stop offset="70%" stopColor="rgba(52,211,153,0)" />
          <stop offset="86%" stopColor="rgba(52,211,153,0.35)" />
          <stop offset="94%" stopColor="rgba(16,185,129,0.18)" />
          <stop offset="100%" stopColor="rgba(16,185,129,0)" />
        </radialGradient>

        {/* Land-mass gradient (bright top → mossy shadow bottom) */}
        <linearGradient id={landId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ecfdf5" />
          <stop offset="55%" stopColor="#a7f3d0" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>

        {/* Orbital ring — subtle gold/violet gradient */}
        <linearGradient id={ringId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(139,92,246,0)" />
          <stop offset="25%" stopColor="rgba(139,92,246,0.65)" />
          <stop offset="55%" stopColor="rgba(251,191,36,0.85)" />
          <stop offset="80%" stopColor="rgba(52,211,153,0.65)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0)" />
        </linearGradient>

        <clipPath id={clipId}>
          <circle cx="60" cy="60" r="46" />
        </clipPath>
      </defs>

      {/* Outer atmospheric halo */}
      {showHalo ? <circle cx="60" cy="60" r="58" fill={`url(#${haloId})`} /> : null}

      {/* Base ocean sphere */}
      <circle cx="60" cy="60" r="46" fill={`url(#${oceanId})`} />

      {/* Continents & meridians live inside the sphere */}
      <g clipPath={`url(#${clipId})`}>
        <g
          fill={`url(#${landId})`}
          style={{
            transformOrigin: '60px 60px',
            animation: animated ? 'ecosphere-rotate 22s linear infinite' : undefined,
          }}
        >
          {/* Americas — vertical crescent on the west */}
          <path d="M24,44 C31,40 34,48 33,56 C36,62 34,72 30,78 C26,84 22,80 22,72 C20,66 20,58 22,52 C22,48 22,46 24,44 Z" />
          {/* North African hump */}
          <path d="M52,40 C60,36 68,42 70,50 C72,58 66,64 58,62 C50,60 46,52 48,46 C48,42 50,40 52,40 Z" />
          {/* Southern Africa */}
          <path d="M56,64 C62,64 66,70 64,78 C62,86 54,90 50,84 C46,78 48,68 52,66 C54,64 55,64 56,64 Z" />
          {/* Eurasia belt */}
          <path d="M68,36 C80,32 92,36 96,44 C98,52 90,54 82,50 C74,50 68,46 66,42 C66,38 66,36 68,36 Z" />
          {/* Australia / Oceania */}
          <path d="M78,70 C86,68 92,74 90,80 C88,86 80,84 76,80 C72,76 74,72 78,70 Z" />
          {/* Micro islands for realism */}
          <circle cx="86" cy="60" r="1.4" />
          <circle cx="42" cy="82" r="1.6" />
          <circle cx="70" cy="86" r="1.2" />
        </g>

        {/* Faint meridian & equator grid for planet feel */}
        <g fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6">
          <ellipse cx="60" cy="60" rx="46" ry="14" />
          <ellipse cx="60" cy="60" rx="46" ry="28" />
          <ellipse cx="60" cy="60" rx="14" ry="46" />
          <ellipse cx="60" cy="60" rx="28" ry="46" />
        </g>

        {/* Terminator shadow (day/night boundary) */}
        <circle cx="60" cy="60" r="46" fill={`url(#${shadowId})`} />

        {/* Glass gloss band */}
        <ellipse cx="60" cy="42" rx="34" ry="18" fill={`url(#${glossId})`} opacity="0.65" />
      </g>

      {/* Sphere rim highlight */}
      <circle
        cx="60"
        cy="60"
        r="46"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.6"
      />

      {/* Bright specular hotspot */}
      <ellipse cx="46" cy="40" rx="14" ry="8" fill={`url(#${specId})`} opacity="0.9" />

      {/* Orbital ring */}
      {showRing ? (
        <g style={{ transformOrigin: '60px 60px' }} transform="rotate(-22 60 60)">
          <ellipse
            cx="60"
            cy="60"
            rx="56"
            ry="15"
            fill="none"
            stroke={`url(#${ringId})`}
            strokeWidth="1.2"
          />
          {/* Orbit "satellite" pip */}
          <circle
            cx="112"
            cy="60"
            r="1.6"
            fill="#fbbf24"
            style={{
              transformOrigin: '60px 60px',
              animation: animated ? 'ecosphere-orbit 14s linear infinite' : undefined,
            }}
          />
        </g>
      ) : null}
    </svg>
  );
}

/** Compact wordmark: 3D globe + EcoSphere lockup with optional tagline. */
export function EcoSphereWordmark({
  size = 'md',
  tagline,
  animated,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  tagline?: string;
  animated?: boolean;
  className?: string;
}) {
  const logoSize: LogoSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md';
  const nameClass =
    size === 'lg'
      ? 'text-2xl'
      : size === 'sm'
        ? 'text-sm'
        : 'text-lg';
  const tagClass = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <EcoSphereLogo size={logoSize} animated={animated} />
      <div className="min-w-0">
        <p className={clsx('font-display font-bold leading-none tracking-tight text-white', nameClass)}>
          Eco<span className="text-gradient-brand">Sphere</span>
        </p>
        {tagline ? (
          <p
            className={clsx(
              'mt-1 font-semibold uppercase tracking-[0.24em] text-slate-500',
              tagClass,
            )}
          >
            {tagline}
          </p>
        ) : null}
      </div>
    </div>
  );
}
