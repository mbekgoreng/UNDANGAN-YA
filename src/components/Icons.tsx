// ============================================================
// Icon helpers — lightweight inline SVG icons
// ============================================================
import React from 'react';

type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

const icon = (path: string) =>
  function Icon({ size = 14, className, style }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        style={style}
      >
        <path d={path} />
      </svg>
    );
  };

const iconFill = (path: string) =>
  function Icon({ size = 14, className, style }: IconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        style={style}
      >
        <path d={path} />
      </svg>
    );
  };

export const IconUndo = icon('M9 14 4 9l5-5M4 9h11a6 6 0 0 1 0 12h-1');
export const IconRedo = icon('M15 14l5-5-5-5M19 9H8a6 6 0 0 0 0 12h1');
export const IconZoomIn = icon('M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM11 8v6M8 11h6');
export const IconZoomOut = icon('M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zM8 11h6');
export const IconPlay = icon('M5 3l14 9-14 9V3z');
export const IconPause = icon('M6 4h4v16H6zM14 4h4v16h-4z');
export const IconStop = icon('M6 6h12v12H6z');
export const IconEye = icon('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z');
export const IconEyeOff = icon('M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22');
export const IconLock = icon('M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4');
export const IconUnlock = icon('M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 019.9-1');
export const IconTrash = icon('M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2');
export const IconPlus = icon('M12 5v14M5 12h14');
export const IconDuplicate = icon('M8 4H6a2 2 0 00-2 2v14a2 2 0 002 2h8a2 2 0 002-2v-2M8 4h6l4 4v10a2 2 0 01-2 2H8M8 4l4 4');
export const IconImage = icon('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 5h6M19 2v6M9 8.5L12 11l4-5 5 6H3l6-3.5z');
export const IconText = icon('M4 6h16M4 12h10M4 18h12');
export const IconShape = icon('M12 2L2 19.7h20L12 2z');
export const IconLayers = icon('M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5');
export const IconScene = icon('M15 10l4.553-2.17A1 1 0 0121 8.8V19a1 1 0 01-1.447.894L15 17.5M3 9a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V9z');
export const IconAssets = icon('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z');
export const IconTemplate = icon('M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z');
export const IconClose = icon('M18 6L6 18M6 6l12 12');
export const IconArrowUp = icon('M12 19V5M5 12l7-7 7 7');
export const IconArrowDown = icon('M12 5v14M5 12l7 7 7-7');
export const IconGear = icon('M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z');
export const IconExport = icon('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12');
export const IconImport = icon('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3');
export const IconFolder = icon('M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z');
export const IconChevronDown = icon('M6 9l6 6 6-6');
export const IconChevronRight = icon('M9 18l6-6-6-6');
export const IconMagicWand = icon('M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 11.8L19 13M17.8 6.2L19 5M12.2 6.2L11 5M12.2 11.8L11 13M21 21l-9-9');
export const IconMove = icon('M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20');
export const IconRotate = icon('M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15');
export const IconFlipH = icon('M8 3H5a2 2 0 00-2 2v14c0 1.1.9 2 2 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 20V4');
