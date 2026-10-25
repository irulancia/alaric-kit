// Turns configurator state (configurator/ui.js) into the app.css token set. Depends on the
// color math in configurator/color.js (hexToRgb, onColor, ensureContrast, composite, rgba, ...).

// Two lists, because the two jobs differ. Headings: half neutral, half with real character
// (all widely used, all available in the 400-700 weights the system asks for). Body: legibility
// first (large x-height, open letterforms), plus two serifs for an editorial feel.
// Fontshare (Indian Type Foundry, free for commercial use) adds modern grotesques Google Fonts doesn't have —
// added 2026-10-04. All three have 400-700.
const FONTSHARE_FONTS = ['Switzer', 'Satoshi', 'General Sans'];
const DISPLAY_FONTS = {
  Neutral: ['Inter', 'Poppins', 'Montserrat', 'Manrope', 'Quicksand'],
  'With character': ['Playfair Display', 'Fraunces', 'Space Grotesk', 'Oswald', 'Syne'],
  'Fontshare': FONTSHARE_FONTS,
};
const BODY_FONTS = {
  Sans: ['Inter', 'Roboto', 'Open Sans', 'Source Sans 3', 'Lato', 'DM Sans', 'IBM Plex Sans', 'Nunito'],
  Serif: ['Lora', 'Merriweather'],
  'Fontshare': FONTSHARE_FONTS,
};
const SERIF_FONTS = new Set(['Playfair Display', 'Fraunces', 'Lora', 'Merriweather']);
const fontNames = (groups) => Object.values(groups).flat();
const fontStack = (name) => `'${name}', ${SERIF_FONTS.has(name) ? 'Georgia, serif' : '-apple-system, sans-serif'}`;

// Corner radius is not one value for everything. The slider sets the radius of
// buttons and other controls; every other element type gets that value capped at
// its own ceiling, from Material 3's shape scale (text fields 4, chips 8, cards 12,
// large 16, dialogs and sheets 28). A control can be a pill while a card stays
// moderate, and a card never gets rounder than 16px. Items inside a container
// (menu and sidebar rows) use the concentric rule instead: container radius minus
// the container's padding, computed in the CSS.
const RADIUS_CAPS = { field: '0.375rem', chip: '0.5rem', surface: '1rem', overlay: '1.75rem' }; // 6 / 8 / 16 / 28px
function radiusTokens(px) {
  return {
    '--radius-control': `${px}px`,
    '--radius-field': `min(${px}px, ${RADIUS_CAPS.field})`,
    '--radius-chip': `min(${px}px, ${RADIUS_CAPS.chip})`,
    '--radius-surface': `min(${px}px, ${RADIUS_CAPS.surface})`,
    '--radius-overlay': `min(${Math.round(px * 1.5)}px, ${RADIUS_CAPS.overlay})`,
    '--radius-pill': '999px',
  };
}
// Resolved pixel values, for the slider's readout.
function radiusReadout(px) {
  const cap = (rem) => Math.min(px, parseFloat(rem) * 16);
  return `fields ${cap(RADIUS_CAPS.field)} / chips ${cap(RADIUS_CAPS.chip)} / cards ${cap(RADIUS_CAPS.surface)} / dialogs ${Math.min(Math.round(px * 1.5), 28)}px`;
}

// Base-unit grid (Material Design 3 density: density shifts the grid's base
// unit, not a percentage). Normal = 8px grid, Spacious = 12px. Compact = 6px, not 4px: at 4px the
// spacing fell by half while the text fell by 12%, and Compact came out glued together.
const SPACING_BASE = [0, 0.5, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20]; // multiples of the base unit, space-0..12
const SPACING_UNIT_REM = { compact: 0.375, normal: 0.5, spacious: 0.75 };

// Named modular-scale ratios applied upward from a 16px body for h3/h2/h1.
// small/xs use a fixed 0.875 step: compounding a large ratio downward gives
// unusably small text.
// Heading steps. Chosen so H1 is about 1.9-2.5x the body size at every density, the range of the
// references (Apple and Material about 2.0, Tailwind 2.25, GOV.UK 2.5). The Golden Ratio (1.618) on an
// 18px body gave a 76px H1, which is display size, not a page title.
const TYPE_RATIOS = { compact: 1.25, normal: 1.333, spacious: 1.333 }; // Major Third / Perfect Fourth / Perfect Fourth
// The body size is the base of that scale and follows density too: a compact interface reads at
// 14px (the size dense products such as GitHub use), Normal at the web standard 16px, Spacious at 18px.
// Body copy, links, buttons and labels all use it, so they change together with the headings.
const BODY_PX = { compact: 14, normal: 16, spacious: 18 };
// The text of CONTROLS (buttons, segmented, switch / check / radio labels, tabs, menus, the navbar's links) is not the
// text you READ: Material 3 (label-large 14 vs body-large 16), Carbon (body-compact 14 for UI), Apple (13pt controls).
// A 16px body doesn't make every control 16px: controls had taken the body size.
const UI_PX = { compact: 13, normal: 14, spacious: 16 };

// Button (and input-row) heights: three sizes 8px apart, and density moves the whole set by 8px, so
// there are nine values (Material's density scale also lowers component height per step). Normal is
// 36 / 44 / 52, where 44 meets the 44px target of WCAG 2.5.5. Compact md is 36px and its small is 28px:
// both still clear the 24px minimum of WCAG 2.5.8, but Compact is for dense desktop interfaces, not touch.
// Dense list rows (menu, sidebar, pagination) have their own height, --row-height.
const CONTROL_HEIGHTS = {
  compact: { sm: '1.75rem', md: '2.25rem', lg: '2.75rem', row: '2rem' },      // 28 / 36 / 44, rows 32
  normal: { sm: '2.25rem', md: '2.75rem', lg: '3.25rem', row: '2.5rem' },     // 36 / 44 / 52, rows 40
  spacious: { sm: '2.75rem', md: '3.25rem', lg: '3.75rem', row: '3rem' },     // 44 / 52 / 60, rows 48
};

// Icon sizes follow density, like type and spacing. Normal = the common 16 / 20 / 24px
// (small text or dense buttons / body-size labels / large controls). Compact and
// Spacious step down and up, in whole pixels so strokes stay crisp.
const ICON_SIZES = {
  compact: { sm: '0.875rem', md: '1.125rem', lg: '1.375rem' },  // 14 / 18 / 22
  normal: { sm: '1rem', md: '1.25rem', lg: '1.5rem' },          // 16 / 20 / 24
  spacious: { sm: '1.125rem', md: '1.5rem', lg: '2rem' },       // 18 / 24 / 32
};

// Shadow rules (Josh Comeau, Tailwind, Material):
// 1. Colour comes from the surface the shadow falls on (a dark version of the
//    page hue), never pure black, which washes out to grey. Brand colour is
//    not used: a brand-coloured shadow is a glow, not a shadow.
// 2. One light source: in Layered every layer keeps x = y / 2.
// 3. Layers, not a single shadow. Layered doubles offset and blur per layer
//    (1, 2, 4, 8, 16px) at a low constant opacity.
// Flat = hairline. Soft = Tailwind's own two-layer values with negative spread.
// Neumorphism excluded (contrast/accessibility issues).
// The shadow colour token (--shadow-color) is the neutral hue, dark; set in computeTokens.
const SHADOW_NAMES = ['flat', 'soft', 'layered'];
const shade = (a) => `hsl(var(--shadow-color) / ${a})`;
const layers = (count, alpha, scale = 1) => Array.from({ length: count }, (_, i) => {
  const y = 2 ** i * scale;
  return `${y / 2}px ${y}px ${y}px ${shade(alpha)}`;
}).join(', ');
const SHADOWS = {
  flat: { sm: `0 0 0 1px ${shade(0.1)}`, md: `0 0 0 1px ${shade(0.14)}`, hover: `0 0 0 1px ${shade(0.22)}` },
  soft: {
    sm: `0 1px 3px 0 ${shade(0.1)}, 0 1px 2px -1px ${shade(0.1)}`,
    md: `0 4px 6px -1px ${shade(0.1)}, 0 2px 4px -2px ${shade(0.1)}`,
    hover: `0 10px 15px -3px ${shade(0.1)}, 0 4px 6px -4px ${shade(0.1)}`,
  },
  layered: { sm: layers(3, 0.12), md: layers(5, 0.08), hover: layers(5, 0.08, 2) },
};

// Semantic colors are fixed. Each gets -strong (text on tint), -bg and -border.
const SEMANTIC = { success: '#2f8f5b', error: '#c8382d', warning: '#b7791f', info: '#2f6fa8' };

function roundRem(v) {
  if (v === 0) return '0';
  return (Math.round(v * 1000) / 1000) + 'rem';
}

// Elevation step: a raised surface (card, sidebar, navbar) is the page lifted toward white by a
// fixed perceptual lightness step, not always pure white. Material 3 steps its surface tones by 2
// (surface 98, surface-container-lowest 100); Radix lays white at 85% / 70% over the page. The
// default neutral page already sits 2.7 L* below white, so on it cards stay #fff; on a darker page
// (a cream at L* 93) plain white jumped ~7 L* and the cards looked pasted on.
const ELEVATION_STEP_L = 2.5;
const lightnessL = (hex) => {
  const y = luminance(hex);
  return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; // CIE L*, 0-100
};
function liftTowardWhite(page, stepL) {
  const target = Math.min(100, lightnessL(page) + stepL);
  let lo = 0, hi = 1;
  for (let i = 0; i < 20; i += 1) {
    const mid = (lo + hi) / 2;
    if (lightnessL(composite('#ffffff', mid, page)) < target) lo = mid; else hi = mid;
  }
  return composite('#ffffff', hi, page);
}

// Neutral surfaces, text and borders: the secondary colour's hue at very low
// saturation, so grays read as a faint tint of the brand, not as beige. Material 3
// builds neutrals at chroma ~4 (variants ~8); Radix pairs each accent with a
// tinted gray. Text and outlines are then pushed to their contrast targets.
// A custom page background (e.g. a brand cream) replaces the secondary as the source: the page is
// that exact colour, the other surfaces step down from its own lightness and saturation (so a cream
// stays cream instead of being flattened to a faint tint), and text and borders take its hue.
function computeNeutrals(secondary, background = null) {
  const { r, g, b } = hexToRgb(background || secondary);
  const hsl = rgbToHsl(r, g, b);
  const hue = hsl.h;
  // A gray, black or white secondary has no hue to lend (its hue reads as 0, red), so the
  // tint fades out with the secondary's own saturation instead of turning everything pink.
  const strength = Math.min(1, hsl.s / 30);
  const tone = (s, l) => hslToHex(hue, s * strength, l);
  // A step down from the page keeps the page's COLOURFULNESS (HSL chroma = (1 - |2L - 1|) x S), not its saturation figure.
  // Near white, a high S is almost invisible (#f8f1fa is S 47% but barely lilac); holding S while lowering L made the
  // surfaces and borders two to three times more colourful than the page — an intense mauve nobody chose (2026-10-14).
  const chroma = (100 - Math.abs(2 * hsl.l - 100)) * hsl.s;
  const step = (dl) => {
    const l = Math.max(0, hsl.l - dl);
    const room = 100 - Math.abs(2 * l - 100);
    return hslToHex(hue, room > 0 ? Math.min(100, chroma / room) : 0, l);
  };
  const surfaceTone = (s, l, dl) => (background ? step(dl) : tone(s, l));
  const page = background ? background.toLowerCase() : tone(8, 97);
  const card = liftTowardWhite(page, ELEVATION_STEP_L);
  const surface = surfaceTone(9, 94, 3), hover = surfaceTone(10, 92, 5);
  const on = [card, page, surface, hover];
  return {
    hue: Math.round(hue), card, page, surface, hover,
    subtle: surfaceTone(9, 92, 5), border: surfaceTone(10, 88, 10),
    control: ensureContrast(tone(10, 62), [card, page, surface], 3),
    text: ensureContrast(tone(14, 24), on, 8), // ~9:1: softer than near-black, well above AAA (7:1), clear of secondary (~5:1)
    textSecondary: ensureContrast(tone(9, 38), on, 4.5),
    label: ensureContrast(tone(9, 42), on, 4.5),
    disabledBg: surfaceTone(8, 92, 5), disabledText: tone(8, 62),
    overlay: rgba(tone(14, 13), 0.5),
  };
}

// One brand colour, three jobs (same idea as Radix Colors' steps 9 / 8 / 11):
//   fill (--accent)      the colour as chosen, for button backgrounds
//   ui   (--accent-ui)   outlines, underlines, switch tracks, progress: 3:1 (WCAG 1.4.11)
//   text (--accent-text) links, nav, labels on light surfaces: 4.5:1 (WCAG 1.4.3)
// A light brand colour therefore keeps its fills but gets a darker shade for text and outlines.
const DUO_TINT = 0.22; // fill strength of duotone pills and the destructive button (the regular tint is 0.12)
// Duotone primary and secondary buttons: part colour, part white, the page showing through
// the rest. The white keeps the colour clean on a tinted page (22% of an orange over a mint page went a muddy
// beige); the colour share sets the hierarchy, so it holds on a white page too, where the white changes nothing.
const DUO_FILLS = { primary: { colour: 0.12, white: 0.20 }, secondary: { colour: 0.07, white: 0.73 } };
// The fill as an rgba() token, and the colour it shows over a surface (what its text is checked against).
function duoFill(ui, { colour, white }) {
  const alpha = colour + white;
  const solid = composite(ui, colour / alpha, '#ffffff');
  return { css: rgba(solid, alpha), over: (surface) => composite(solid, alpha, surface) };
}
// Text in the secondary colour that stays readable on every surface, on its own light tint, on the
// duotone button's fill as drawn and on the outline button's hover (a tint of the text itself),
// same 4.6:1 target as --accent-text.
const OUTLINE_HOVER_TINT = DUO_TINT / 4; // components.css: .controls-outline hover
function secondaryText(secondary, ui, n) {
  const flat = [n.card, n.page, n.surface, n.hover];
  const fill = duoFill(ui, DUO_FILLS.secondary);
  let text = ensureContrast(secondary, [...flat, composite(secondary, 0.12, '#ffffff'), ...flat.map(fill.over)], 4.6);
  const onOwnHover = () => Math.min(...flat.map((s) => contrastRatio(text, composite(text, OUTLINE_HOVER_TINT, s))));
  for (let i = 0; i < 100 && onOwnHover() < 4.6; i++) text = adjustLightness(text, -1);
  return text;
}
function computeAccent(primary, n) {
  // Targets carry a small margin (3.05 / 4.6): browsers round each colour channel when they
  // blend a translucent tint, which was enough to land at 4.49:1 on some surfaces.
  const ui = ensureContrast(primary, [n.card, n.page, n.surface], 3.05);
  const tintAlpha = 0.12;
  const flat = [n.card, n.page, n.surface, n.hover];
  // The accent tints are OPAQUE, composited over white — not rgba() over whatever lies under them. A translucent teal over a
  // lilac page mixed into a grey-blue (#eaebf4) that was neither the brand's hue nor the page's; the
  // same bug the status tints had on a cream page. Over white the tint is clean on any page background.
  const tint = composite(ui, tintAlpha, '#ffffff');
  const tintSubtle = composite(ui, tintAlpha / 2, '#ffffff');
  const duo = duoFill(ui, DUO_FILLS.primary);
  const tintSurfaces = [tint, tintSubtle, ...flat.map((s) => composite(ui, DUO_TINT, s)), ...flat.map(duo.over)];
  const text = ensureContrast(primary, [...flat, ...tintSurfaces], 4.6);
  return {
    '--accent': primary,
    '--accent-hover': hoverColor(primary, onColor(primary), [n.card, n.page]),
    '--accent-ui': ui,
    '--accent-text': text,
    '--accent-text-hover': ensureContrast(adjustLightness(text, -8), [...flat, ...tintSurfaces], 4.6), // link hover: text-safe, unlike --accent-hover (a fill)
    '--accent-bg': tint,
    '--accent-bg-subtle': tintSubtle,
    '--duo-bg-primary': duo.css,
    '--on-accent': onColor(primary),
    '--focus-ring': ui,
  };
}
// Accent, secondary and semantic tokens together: everything computeTokens derives from the
// two chosen colours plus the fixed SEMANTIC palette.
function paletteTokens(primary, secondary, n) {
  const p = hexToRgb(primary);
  const s = hexToRgb(secondary);
  const secondaryUi = ensureContrast(secondary, [n.card, n.page, n.surface], 3);
  return {
    ...computeAccent(primary, n),
    '--accent-rgb': `${p.r}, ${p.g}, ${p.b}`,
    '--secondary': secondary,
    '--secondary-hover': hoverColor(secondary, onColor(secondary), [n.card, n.page]),
    '--secondary-ui': secondaryUi, // focus ring and duotone outline of secondary buttons
    '--secondary-text': secondaryText(secondary, secondaryUi, n),
    '--duo-tint': `${Math.round(DUO_TINT * 100)}%`,
    '--duo-bg-secondary': duoFill(secondaryUi, DUO_FILLS.secondary).css,
    '--secondary-bg': composite(secondary, 0.12, '#ffffff'),   // opaque, like the accent tints (see computeAccent)
    '--secondary-bg-subtle': composite(secondary, 0.06, '#ffffff'),
    '--secondary-rgb': `${s.r}, ${s.g}, ${s.b}`,
    '--on-secondary': onColor(secondary),
    ...computeSemantic(n),
    '--on-error': onColor(SEMANTIC.error),
  };
}

function computeTypeScale() {
  const ratio = TYPE_RATIOS[state.density];
  const bodyPx = BODY_PX[state.density];
  const h3 = bodyPx * ratio;
  const h2 = h3 * ratio;
  const h1 = h2 * ratio;
  // Hero/marketing size, kept off the modular scale (design.md) but tied to H1 so it's always
  // clearly bigger, at every density: 1.5x was picked so it never lands on the same pixel value
  // as H1 (it used to be a fixed 2.75rem, which at Spacious landed 1px from that density's H1).
  const display = h1 * 1.5;
  const small = bodyPx * 0.875;
  const xs = small * 0.875;
  const px = (v) => roundRem(Math.round(v) / 16); // whole pixels, same as design.md
  return { display: px(display), h1: px(h1), h2: px(h2), h3: px(h3), body: px(bodyPx), ui: px(UI_PX[state.density]), small: px(small), xs: px(xs) };
}

// -text: the status colour itself, darkened only as far as needed to read as text (4.6:1) on every
// surface. Outline buttons and pills use it for both text and border, so the two match exactly.
function computeSemantic(n) {
  const flat = [n.card, n.page, n.surface, n.hover];
  const out = {};
  Object.entries(SEMANTIC).forEach(([name, base]) => {
    out[`--${name}`] = base;
    out[`--${name}-strong`] = adjustLightness(base, -14);
    out[`--${name}-text`] = ensureContrast(base, flat, 4.6);
    // Opaque tints of white, not translucent: a 12% blue over a warm page or card (e.g. cream)
    // mixes into a muddy gray, since the two hues cancel out. Composited once over white, a
    // status color reads the same on any page background.
    out[`--${name}-bg`] = composite(base, 0.12, '#ffffff');
    out[`--${name}-border`] = composite(base, 0.35, '#ffffff');
  });
  return out;
}

// Density-dependent control and icon sizes. Control heights vary with density (see
// CONTROL_HEIGHTS above); STATIC_TOKENS below holds the sizes that don't.
function sizingTokens() {
  const heights = CONTROL_HEIGHTS[state.density];
  const icons = ICON_SIZES[state.density];
  return {
    '--control-height-sm': heights.sm,
    '--control-height': heights.md,
    '--control-height-lg': heights.lg,
    '--row-height': heights.row,
    '--icon-sm': icons.sm,
    '--icon-md': icons.md,
    '--icon-lg': icons.lg,
  };
}

// Field geometry (input/textarea): built from the same density inputs as everything else (the
// grid's base unit, the type scale's xs size), not picked by hand per density. The floated label
// (labelTop + xs * leading-tight) needs its own band above the text, so a single-line field's
// text starts below that band plus a small cushion, and a textarea's starts lower still. At
// Normal this formula reproduces the original hand-tuned values exactly (label 6px, pad-top
// 24px, multiline 30px, pad-bottom 8px, height 60px) -- the reference point it was checked against.
function fieldTokens(type) {
  const unit = SPACING_UNIT_REM[state.density] * 16; // px, same base unit as --space-*
  const xsPx = parseFloat(type.xs) * 16;
  const bodyPx = BODY_PX[state.density];
  const labelTop = Math.round(unit * 0.75);
  const padTop = Math.round(labelTop + xsPx * 1.2 + unit * 0.5);
  const padTopMultiline = Math.round(padTop + unit * 0.75);
  const padBottom = Math.round(unit);
  const height = Math.round(padTop + bodyPx * 1.5 + padBottom + unit * 0.5);
  const px = (v) => roundRem(v / 16);
  return {
    '--field-label-top': px(labelTop),
    '--field-pad-top': px(padTop),
    '--field-pad-top-multiline': px(padTopMultiline),
    '--field-pad-bottom': px(padBottom),
    '--field-height': px(height),
  };
}

// Tokens that never change with color or density: weights, tracking, line-height, z-index.
const STATIC_TOKENS = {
  '--weight-regular': '400',
  '--weight-medium': '500',
  '--weight-semibold': '600',
  '--weight-bold': '700',
  '--tracking-caps': '0.08em', // letter-spacing for uppercase text (overline, floated labels)
  '--tracking-wordmark': '0.24em', // wider, for an uppercase logotype
  '--leading-tight': '1.2',
  '--leading-loose': '1.5',
  '--z-dropdown': '10',
  '--z-overlay': '50',
  '--z-modal': '100',
  '--z-toast': '1000',
};

function computeTokens() {
  const shadow = SHADOWS[state.shadow];
  const unit = SPACING_UNIT_REM[state.density];
  const spacing = SPACING_BASE.map((v) => roundRem(v * unit));
  const type = computeTypeScale();
  const n = computeNeutrals(state.secondary, state.customBg ? state.background : null);

  return {
    ...paletteTokens(state.primary, state.secondary, n),
    '--font-display': fontStack(state.fontDisplay),
    '--font': fontStack(state.fontBody),
    '--font-mono': 'ui-monospace, SFMono-Regular, Consolas, monospace',
    ...radiusTokens(state.radius),
    '--shadow-color': `${n.hue} 25% 16%`,
    '--shadow-sm': shadow.sm,
    '--shadow-md': shadow.md,
    '--shadow-hover': shadow.hover,
    '--shadow-glow': `0 0 0 3px ${rgba(state.primary, 0.25)}`,
    '--bg-primary': n.page,
    '--bg-card': n.card,
    '--bg-surface': n.surface,
    '--bg-hover': n.hover,
    '--text-primary': n.text,
    '--text-secondary': n.textSecondary,
    '--text-label': n.label,
    '--border': n.border,
    '--border-subtle': n.subtle,
    '--border-control': n.control, // form-field outline, 3:1 on every surface (WCAG 1.4.11)
    '--disabled-bg': n.disabledBg,
    '--disabled-text': n.disabledText,
    '--overlay': n.overlay,
    '--text-display': type.display,
    '--text-h1': type.h1,
    '--text-h2': type.h2,
    '--text-h3': type.h3,
    '--text-body': type.body,
    '--text-ui': type.ui,
    '--text-small': type.small,
    '--text-xs': type.xs,
    ...STATIC_TOKENS,
    ...sizingTokens(),
    ...fieldTokens(type),
    ...Object.fromEntries(spacing.map((v, i) => [`--space-${i}`, v])),
  };
}
