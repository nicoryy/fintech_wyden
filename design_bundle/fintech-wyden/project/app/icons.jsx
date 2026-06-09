// icons.jsx — line + filled UI icons for the WYDEN finance prototype.
// Kept to simple, standard UI glyphs (no illustrative SVG).

function Icon({ name, size = 24, stroke = 'currentColor', fill = 'none', sw = 1.8, style = {} }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill, style,
    stroke, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'bell':
      return (<svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>);
    case 'info':
      return (<svg {...p}><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><circle cx="12" cy="8.2" r="0.6" fill={stroke} stroke="none"/></svg>);
    case 'arrow-up-right':
      return (<svg {...p}><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>);
    case 'arrow-down':
      return (<svg {...p}><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>);
    case 'arrow-down-right':
      return (<svg {...p}><path d="M7 7l10 10"/><path d="M17 8v9H8"/></svg>);
    case 'card':
      return (<svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 9.5h19"/></svg>);
    case 'wallet':
      return (<svg {...p}><path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v.5"/><rect x="3" y="7.5" width="18" height="12" rx="2.5"/><circle cx="16.5" cy="13.5" r="1.2" fill={stroke} stroke="none"/></svg>);
    case 'chevron-right':
      return (<svg {...p}><path d="m9 6 6 6-6 6"/></svg>);
    case 'chevron-left':
      return (<svg {...p}><path d="m15 6-6 6 6 6"/></svg>);
    case 'chevron-down':
      return (<svg {...p}><path d="m6 9 6 6 6-6"/></svg>);
    case 'close':
      return (<svg {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>);
    case 'check':
      return (<svg {...p}><path d="m4 12 5 5L20 6"/></svg>);
    case 'calendar':
      return (<svg {...p}><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/></svg>);
    case 'brain':
      return (<svg {...p}><path d="M9.5 4.5A2.5 2.5 0 0 0 7 7a2.6 2.6 0 0 0-1.5 4.7A2.6 2.6 0 0 0 7 16.4 2.5 2.5 0 0 0 12 17V5a2.5 2.5 0 0 0-2.5-2.5Z"/><path d="M14.5 4.5A2.5 2.5 0 0 1 17 7a2.6 2.6 0 0 1 1.5 4.7A2.6 2.6 0 0 1 17 16.4 2.5 2.5 0 0 1 12 17"/></svg>);
    case 'sparkle':
      return (<svg {...p} fill={stroke} stroke="none"><path d="M12 2c.4 3.7 1.9 5.6 6 6-4.1.4-5.6 2.3-6 6-.4-3.7-1.9-5.6-6-6 4.1-.4 5.6-2.3 6-6Z"/></svg>);
    // categories
    case 'bag':
      return (<svg {...p}><path d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>);
    case 'food':
      return (<svg {...p}><path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10"/><path d="M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4 2.5-1 2.5-4-1-5-2.5-5ZM16 16v5"/></svg>);
    case 'car':
      return (<svg {...p}><path d="M5 11l1.5-4A2 2 0 0 1 8.4 5.6h7.2A2 2 0 0 1 17.5 7L19 11"/><path d="M4 11h16v5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1v-1H7.5v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-5Z"/><path d="M7 14h.01M17 14h.01"/></svg>);
    case 'home':
      return (<svg {...p}><path d="M4 11.5 12 4l8 7.5"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9"/></svg>);
    case 'ticket':
      return (<svg {...p}><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h13A1.5 1.5 0 0 1 20 8.5v2a2 2 0 0 0 0 3v2A1.5 1.5 0 0 1 18.5 17h-13A1.5 1.5 0 0 1 4 15.5v-2a2 2 0 0 0 0-3v-2Z"/><path d="M12 7v10" strokeDasharray="1.5 2.5"/></svg>);
    case 'dots':
      return (<svg {...p} fill={stroke} stroke="none"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>);
    case 'health':
      return (<svg {...p}><path d="M12 20s-7-4.3-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7c0 5-7 9.3-7 9.3Z"/></svg>);
    case 'book':
      return (<svg {...p}><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5V5.5Z"/><path d="M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5V5.5Z"/></svg>);
    case 'repeat':
      return (<svg {...p}><path d="M17 3l3 3-3 3"/><path d="M20 6H8a4 4 0 0 0-4 4v1"/><path d="M7 21l-3-3 3-3"/><path d="M4 18h12a4 4 0 0 0 4-4v-1"/></svg>);
    // nav
    case 'nav-home':
      return (<svg {...p}><path d="M4 11 12 4l8 7"/><path d="M6 9.5V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.5"/></svg>);
    case 'nav-swap':
      return (<svg {...p}><path d="M7 4 4 7l3 3"/><path d="M4 7h13"/><path d="M17 20l3-3-3-3"/><path d="M20 17H7"/></svg>);
    case 'nav-chart':
      return (<svg {...p}><path d="M5 20V11M12 20V5M19 20v-6"/></svg>);
    case 'nav-user':
      return (<svg {...p}><circle cx="12" cy="8.5" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>);
    case 'plus':
      return (<svg {...p}><path d="M12 5v14M5 12h14"/></svg>);
    case 'pencil':
      return (<svg {...p}><path d="M4 20l4-1 9.5-9.5a1.5 1.5 0 0 0 0-2.1l-1-1a1.5 1.5 0 0 0-2.1 0L5 16l-1 4Z"/></svg>);
    case 'trend':
      return (<svg {...p}><path d="M3 16l5-5 4 3 8-8"/><path d="M20 6v5h-5" /></svg>);
    default:
      return null;
  }
}

window.Icon = Icon;
