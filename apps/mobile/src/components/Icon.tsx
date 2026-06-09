/**
 * Icon — line + filled UI glyphs ported from the prototype `icons.jsx` to
 * react-native-svg. Same names, same paths, same default stroke width.
 */
import React from 'react';
import Svg, { Path, Circle, Rect, type NumberProp } from 'react-native-svg';

export type IconName =
  | 'bell'
  | 'info'
  | 'arrow-up-right'
  | 'arrow-down'
  | 'arrow-down-right'
  | 'card'
  | 'wallet'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-down'
  | 'close'
  | 'check'
  | 'calendar'
  | 'brain'
  | 'sparkle'
  | 'bag'
  | 'food'
  | 'car'
  | 'home'
  | 'ticket'
  | 'dots'
  | 'health'
  | 'book'
  | 'repeat'
  | 'nav-home'
  | 'nav-swap'
  | 'nav-chart'
  | 'nav-user'
  | 'plus'
  | 'pencil'
  | 'trend';

export interface IconProps {
  name: IconName;
  size?: number;
  stroke?: string;
  fill?: string;
  /** stroke width */
  sw?: NumberProp;
}

export function Icon({
  name,
  size = 24,
  stroke = '#000',
  fill = 'none',
  sw = 1.8,
}: IconProps) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill,
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'bell':
      return (
        <Svg {...p}>
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...p}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M12 16v-4" />
          <Circle cx="12" cy="8.2" r="0.6" fill={stroke} stroke="none" />
        </Svg>
      );
    case 'arrow-up-right':
      return (
        <Svg {...p}>
          <Path d="M7 17 17 7" />
          <Path d="M8 7h9v9" />
        </Svg>
      );
    case 'arrow-down':
      return (
        <Svg {...p}>
          <Path d="M12 5v14" />
          <Path d="m6 13 6 6 6-6" />
        </Svg>
      );
    case 'arrow-down-right':
      return (
        <Svg {...p}>
          <Path d="M7 7l10 10" />
          <Path d="M17 8v9H8" />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...p}>
          <Rect x="2.5" y="5.5" width="19" height="13" rx="2.5" />
          <Path d="M2.5 9.5h19" />
        </Svg>
      );
    case 'wallet':
      return (
        <Svg {...p}>
          <Path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v.5" />
          <Rect x="3" y="7.5" width="18" height="12" rx="2.5" />
          <Circle cx="16.5" cy="13.5" r="1.2" fill={stroke} stroke="none" />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg {...p}>
          <Path d="m9 6 6 6-6 6" />
        </Svg>
      );
    case 'chevron-left':
      return (
        <Svg {...p}>
          <Path d="m15 6-6 6 6 6" />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg {...p}>
          <Path d="m6 9 6 6 6-6" />
        </Svg>
      );
    case 'close':
      return (
        <Svg {...p}>
          <Path d="M6 6l12 12M18 6 6 18" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...p}>
          <Path d="m4 12 5 5L20 6" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg {...p}>
          <Rect x="3.5" y="5" width="17" height="16" rx="2.5" />
          <Path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </Svg>
      );
    case 'brain':
      return (
        <Svg {...p}>
          <Path d="M9.5 4.5A2.5 2.5 0 0 0 7 7a2.6 2.6 0 0 0-1.5 4.7A2.6 2.6 0 0 0 7 16.4 2.5 2.5 0 0 0 12 17V5a2.5 2.5 0 0 0-2.5-2.5Z" />
          <Path d="M14.5 4.5A2.5 2.5 0 0 1 17 7a2.6 2.6 0 0 1 1.5 4.7A2.6 2.6 0 0 1 17 16.4 2.5 2.5 0 0 1 12 17" />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg {...p} fill={stroke} stroke="none">
          <Path d="M12 2c.4 3.7 1.9 5.6 6 6-4.1.4-5.6 2.3-6 6-.4-3.7-1.9-5.6-6-6 4.1-.4 5.6-2.3 6-6Z" />
        </Svg>
      );
    case 'bag':
      return (
        <Svg {...p}>
          <Path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z" />
          <Path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
        </Svg>
      );
    case 'food':
      return (
        <Svg {...p}>
          <Path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10" />
          <Path d="M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5ZM16 16v5" />
        </Svg>
      );
    case 'car':
      return (
        <Svg {...p}>
          <Path d="M5 11l1.5-4A2 2 0 0 1 8.4 5.6h7.2A2 2 0 0 1 17.5 7L19 11" />
          <Path d="M4 11h16v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H7.5v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z" />
          <Path d="M7 14h.01M17 14h.01" />
        </Svg>
      );
    case 'home':
      return (
        <Svg {...p}>
          <Path d="M4 11.5 12 4l8 7.5" />
          <Path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
        </Svg>
      );
    case 'ticket':
      return (
        <Svg {...p}>
          <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 3v2A1.5 1.5 0 0 1 18.5 17h-13A1.5 1.5 0 0 1 4 15.5v-2a2 2 0 0 0 0-3v-2Z" />
          <Path d="M12 7v10" strokeDasharray="1.5 2.5" />
        </Svg>
      );
    case 'dots':
      return (
        <Svg {...p} fill={stroke} stroke="none">
          <Circle cx="6" cy="12" r="1.6" />
          <Circle cx="12" cy="12" r="1.6" />
          <Circle cx="18" cy="12" r="1.6" />
        </Svg>
      );
    case 'health':
      return (
        <Svg {...p}>
          <Path d="M12 20s-7-4.3-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7c0 5-7 9.3-7 9.3Z" />
        </Svg>
      );
    case 'book':
      return (
        <Svg {...p}>
          <Path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5V5.5Z" />
          <Path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5V5.5Z" />
        </Svg>
      );
    case 'repeat':
      return (
        <Svg {...p}>
          <Path d="M17 3l3 3-3 3" />
          <Path d="M20 6H8a4 4 0 0 0-4 4v1" />
          <Path d="M7 21l-3-3 3-3" />
          <Path d="M4 18h12a4 4 0 0 0 4-4v-1" />
        </Svg>
      );
    case 'nav-home':
      return (
        <Svg {...p}>
          <Path d="M4 11 12 4l8 7" />
          <Path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5" />
        </Svg>
      );
    case 'nav-swap':
      return (
        <Svg {...p}>
          <Path d="M7 4 4 7l3 3" />
          <Path d="M4 7h13" />
          <Path d="M17 20l3-3-3-3" />
          <Path d="M20 17H7" />
        </Svg>
      );
    case 'nav-chart':
      return (
        <Svg {...p}>
          <Path d="M5 20V11M12 20V5M19 20v-6" />
        </Svg>
      );
    case 'nav-user':
      return (
        <Svg {...p}>
          <Circle cx="12" cy="8.5" r="3.5" />
          <Path d="M5 20a7 7 0 0 1 14 0" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...p}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case 'pencil':
      return (
        <Svg {...p}>
          <Path d="M4 20l4-1 9.5-9.5a1.5 1.5 0 0 0 0-2.1l-1-1a1.5 1.5 0 0 0-2.1 0L5 16l-1 4Z" />
        </Svg>
      );
    case 'trend':
      return (
        <Svg {...p}>
          <Path d="M3 16l5-5 4 3 8-8" />
          <Path d="M20 6v5h-5" />
        </Svg>
      );
    default:
      return null;
  }
}
