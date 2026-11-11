import React from 'react';

interface SchoolLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  customLogoUrl?: string;
}

export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  customLogoUrl,
}) => {
  // Dimension definitions for clean, background-free transparent emblem
  const imgHeightClasses = {
    xs: 'h-8 sm:h-9 max-w-[100px]',
    sm: 'h-11 sm:h-12 max-w-[140px]',
    md: 'h-16 sm:h-20 max-w-[200px]',
    lg: 'h-24 sm:h-28 max-w-[280px]',
    xl: 'h-36 sm:h-40 max-w-[360px]',
    '2xl': 'h-48 sm:h-56 max-w-[460px]',
  };

  // Official Transparent Cutout Logo (Never changes across all views, documents, and exports)
  const defaultOfficialLogo = '/assets/aistudio/tns_logo_transparent.png';
  const logoSrc = customLogoUrl || defaultOfficialLogo;

  return (
    <div className={`inline-flex flex-col items-center select-none bg-transparent ${className}`}>
      {/* Background-free, Cutout Transparent School Emblem */}
      <img
        src={logoSrc}
        alt="شعار مدارس التربية النموذجية - مفرغ وبدون خلفية"
        className={`${imgHeightClasses[size]} w-auto object-contain pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:scale-105`}
        loading="eager"
        onError={(e) => {
          // Fallback to permanent transparent logo if custom logo fails
          const target = e.currentTarget as HTMLImageElement;
          if (target.src !== defaultOfficialLogo) {
            target.src = defaultOfficialLogo;
          }
        }}
      />

      {showSubtitle && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-[11px] sm:text-xs font-black text-amber-300 tracking-wide">
          <span className="text-amber-400 text-[10px]">✦</span>
          <span>مدارس التربية النموذجية</span>
          <span className="text-amber-400 text-[10px]">✦</span>
        </div>
      )}
    </div>
  );
};
