# Hesde — color tokens

Brand tokens (`--brand-*`) stay the same in both themes. Semantic tokens swap per mode.

## Brand (shared)

| Token | Hex |
|---|---|
| `--brand-burgundy` | `#340C0E` |
| `--brand-red` | `#CC383E` |
| `--brand-light` | `#F8C6C8` |
| `--brand-ivory` | `#F3EFE8` |
| `--brand-charcoal` | `#191718` |

---

## Light mode

*(unchanged)*

### Neutrals

| Token | Value |
|---|---|
| `--bg` | `#F3EFE8` |
| `--bg-alt` | `#ECE6DC` |
| `--surface` | `#FBF9F5` |
| `--surface-2` | `#F5F1EA` |
| `--ink` | `#191718` |
| `--ink-2` | `#3A3234` |
| `--muted` | `#6B6163` |
| `--line` | `#E2DBD0` |
| `--line-strong` | `#CFC5B7` |
| `--grid-line` | `rgba(52, 12, 14, 0.06)` |

### Primary

| Token | Value |
|---|---|
| `--primary` | `#340C0E` |
| `--primary-hover` | `#4A1316` |
| `--primary-ink` | `#F8C6C8` |
| `--primary-text` | `#340C0E` |
| `--primary-soft` | `#F6E3E1` |
| `--focus` | `#340C0E` |
| `--selection-bg` | `#F8C6C8` |
| `--selection-ink` | `#340C0E` |

### Severity

| Level | Text | Soft | Line | Chart |
|---|---|---|---|---|
| Crit | `#B42318` | `#FDECEA` | `#F5C2BC` | `#D92D20` |
| High | `#B54708` | `#FEF0E6` | `#F9CDA9` | `#EF6820` |
| Mid | `#8A5A00` | `#FDF5DC` | `#F0D896` | `#DCA00B` |
| Low | `#55606E` | `#ECEEF1` | `#CDD3DB` | `#98A2B3` |
| Info | `#1F5FCC` | `#E6EEFB` | `#BCD0F5` | `#3B7BE8` |
| Ok | `#157A42` | `#E4F3EA` | `#B5DEC5` | `#2E9E5B` |

### Bands / chrome

| Token | Value |
|---|---|
| `--band-security-bg` | `#340C0E` |
| `--band-security-ink` | `#F3EFE8` |
| `--band-security-muted` | `#D9B8B9` |
| `--band-security-line` | `rgba(248, 198, 200, 0.18)` |
| `--band-cta-bg` | `#CC383E` |
| `--band-cta-ink` | `#F3EFE8` |
| `--footer-bg` | `#191718` |
| `--footer-ink` | `#F3EFE8` |
| `--footer-muted` | `#A99D98` |
| `--footer-line` | `transparent` |
| `--header-bg` | `rgba(243, 239, 232, 0.82)` |
| `--overlay` | `rgba(25, 23, 24, 0.5)` |

---

## Dark mode

**Idea:** in dark mode the brand *red* carries the identity, not the pale pink. Pink-filled buttons read as "soft/pastel" — wrong for security. Red fills + pink only for text/links keeps it burgundy-heavy and serious. Neutrals are kept near-neutral (0–3% saturation): on dark backgrounds any tint gets amplified, especially next to red, so color lives only in the accents.

### Neutrals

| Token | Value | Note |
|---|---|---|
| `--bg` | `#121212` | Pure neutral, darker than charcoal so surfaces can lift |
| `--bg-alt` | `#171616` | Alternating sections |
| `--surface` | `#1C1B1B` | Cards |
| `--surface-2` | `#242222` | Inputs, nested cards, hover rows |
| `--ink` | `#F3EFE8` | Ivory stays — the only warmth in the neutrals. 16.4:1 on bg |
| `--ink-2` | `#D4CDC6` | 10.9:1 on surface |
| `--muted` | `#A09A97` | 6.8:1 on bg, 5.7:1 on surface-2 |
| `--line` | `#2C2A2A` | |
| `--line-strong` | `#433F3F` | |
| `--grid-line` | `rgba(243, 239, 232, 0.04)` | Ivory, not red |

### Primary

| Token | Value | Note |
|---|---|---|
| `--primary` | `#C4343A` | Button / fill. Brand red, slightly deepened |
| `--primary-hover` | `#B02D33` | Hover goes *darker*, not lighter (avoids glow) |
| `--primary-ink` | `#FBF7F2` | Text on primary — 5.1:1 |
| `--primary-text` | `#F28B8F` | **New token.** Links, active nav, accent text — 7.9:1 on bg |
| `--primary-soft` | `rgba(204, 56, 62, 0.16)` | Tinted badges/pills; primary-text on it = 7:1 |
| `--focus` | `#F28B8F` | Focus ring, 7.9:1 on bg |
| `--selection-bg` | `rgba(204, 56, 62, 0.40)` | |
| `--selection-ink` | `#FFFFFF` | |

### Severity

Crit nudged warmer/brighter so it doesn't blend with the brand red. All text values ≥ 6:1 on bg and surface.

| Level | Text | Soft | Line | Chart |
|---|---|---|---|---|
| Crit | `#FF6B63` | `rgba(255, 107, 99, .14)` | `rgba(255, 107, 99, .32)` | `#FF6B63` |
| High | `#F38744` | `rgba(243, 135, 68, .14)` | `rgba(243, 135, 68, .32)` | `#F38744` |
| Mid | `#F5C451` | `rgba(245, 196, 81, .12)` | `rgba(245, 196, 81, .30)` | `#F5C451` |
| Low | `#A3AEC1` | `rgba(163, 174, 193, .12)` | `rgba(163, 174, 193, .28)` | `#A3AEC1` |
| Info | `#7AA4F7` | `rgba(122, 164, 247, .14)` | `rgba(122, 164, 247, .32)` | `#7AA4F7` |
| Ok | `#47CD89` | `rgba(71, 205, 137, .12)` | `rgba(71, 205, 137, .30)` | `#47CD89` |

### Bands / chrome

Every token listed explicitly — no inheritance from light.

| Token | Value | Note |
|---|---|---|
| `--band-security-bg` | `#3A0F12` | Lighter than old `#2A0A0C`, which vanished into bg |
| `--band-security-ink` | `#F3EFE8` | 14.6:1 |
| `--band-security-muted` | `#D9B8B9` | 9.2:1 |
| `--band-security-line` | `rgba(248, 198, 200, 0.14)` | Use as top/bottom border to separate from page |
| `--band-cta-bg` | `#A82A30` | Deeper than light mode — full `#CC383E` is too loud on dark |
| `--band-cta-ink` | `#F3EFE8` | 6:1 |
| `--footer-bg` | `#0E0E0E` | |
| `--footer-ink` | `#F3EFE8` | |
| `--footer-muted` | `#A09A97` | 7:1 |
| `--footer-line` | `#2C2A2A` | |
| `--header-bg` | `rgba(18, 18, 18, 0.80)` | Matches new bg |
| `--overlay` | `rgba(6, 6, 6, 0.70)` | |

---

## Implementation notes

- **Add `--primary-text`** and use it everywhere a primary color sits on a dark background as text (links, active tabs, eyebrow labels, icons). Use `--primary` only for fills. In light mode it equals `--primary`, so nothing changes there.
- Give the security band `border-block: 1px solid var(--band-security-line)` in dark mode — burgundy on near-black is a hue shift, not a brightness one, so the edge helps.
- Crit severity and brand red are both reds. Always pair severity with an icon/label, never color alone.
