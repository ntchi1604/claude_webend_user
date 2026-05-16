# Design System Inspired by Claude

## 1. Visual Theme & Atmosphere

The Claude design system embodies a sophisticated, developer-centric aesthetic that balances approachability with technical precision. It features a refined monochromatic foundation with warm accent colors—specifically burnt orange and slate blue—that convey trustworthiness and innovation. The design celebrates clean typography, ample whitespace, and purposeful use of color to guide user attention toward key interactions. The atmosphere is one of clarity and capability: the interface feels intelligent yet accessible, built for professionals who value efficiency and elegance. Warm orange accents pop against cool neutrals, creating visual rhythm that energizes without overwhelming. The overall impression is premium, thoughtful, and aligned with the cutting-edge nature of AI-assisted coding.

**Key Characteristics**

- Monochromatic neutral palette anchored by deep charcoal and off-white
- Warm burnt orange (`#C46849`) and cool blue (`#2C84DB`) accents for hierarchy and interactivity
- Clean, generous whitespace with deliberate negative space
- Serif and sans-serif pairing for typographic contrast and sophistication
- High contrast text for readability and accessibility
- Subtle elevation and shadow effects to suggest depth without distraction
- Minimalist aesthetic with purposeful color application
- Developer-friendly, terminal-inspired dark mode sensibility in product UI

## 2. Color Palette & Roles

### Primary

- **Brand Orange** (`#C46849`): Primary accent for key UI elements, CTAs, and brand markers. Warm, inviting tone that suggests both innovation and approachability.
- **Brand Blue** (`#2C84DB`): Secondary primary accent used extensively for interactive elements, links, and data visualization. Cool tone that conveys trust and technical competence.

### Accent Colors

- **Deep Red** (`#DF6666`): Supporting accent color used for highlights, secondary CTAs, and decorative elements.
- **Muted Green** (`#629987`): Accent for tertiary interactions or success-adjacent states.
- **Soft Teal** (`#BCD1CA`): Light accent for subtle backgrounds or hover states.
- **Periwinkle** (`#6A9BCC`): Secondary blue tone for varied interactive states.
- **Mauve** (`#C46686`): Purple-toned accent for premium or special features.

### Interactive

- **Primary CTA** (`#141413`): Solid dark button background for the highest-priority actions.
- **Secondary CTA** (`#5E5D59`): Medium-tone button text for secondary interactions.
- **Ghost Button Text** (`#5E5D59`): Text-only buttons on light backgrounds.
- **Link Color** (`#2C84DB`): Blue link text inline within content.

### Neutral Scale

- **Charcoal 900** (`#141413`): Primary text color, dominant UI element. Darkest neutral.
- **Charcoal 800** (`#30302E`): Secondary text and fine detail color.
- **Stone 600** (`#5E5D59`): Tertiary text, muted labels, and disabled states.
- **Lavender 100** (`#CBCADB`): Subtle UI elements and very light text backgrounds.
- **Cream 100** (`#FAF9F5`): Light background, near-white but slightly warmed.
- **Cream 50** (`#F0EEE6`): Soft background alternative to cream 100.
- **Beige 100** (`#E3DACC`): Warm off-white for subtle contrast areas.
- **Pure White** (`#FFFFFF`): Maximum contrast applications (rare).
- **Pure Black** (`#000000`): Maximum contrast applications (rare).

### Surface & Borders

- **Surface Default** (`#FFFFFF` or `#FAF9F5`): Primary page and card backgrounds.
- **Surface Elevated** (`#F0EEE6`): Elevated surface for modals, popovers, and floating elements.
- **Border Light** (`#CBCADB`): Subtle borders between sections.
- **Border Neutral** (`#5E5D59`): Standard borders for inputs and containers.

### Semantic / Status

- **Error** (`#B53333`): Error states, validation failures, and destructive actions.
- **Success** (`#629987`): Success messages and positive confirmations.

## 3. Typography Rules

### Font Family

**Primary:** Anthropic Sans (sans-serif) — modern, clean, and accessible. Fallback stack: `"Anthropic Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

**Secondary:** Anthropic Serif (serif) — used for display and premium headings. Fallback stack: `"Anthropic Serif", Georgia, "Times New Roman", serif`

**Tertiary:** Anthropic Mono (monospace) — reserved for code blocks, terminal output, and technical content. Fallback stack: `"Anthropic Mono", "Courier New", monospace`

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| Display XL | Anthropic Serif | 48px | 500 | 56px | -0.5px | Hero headlines, page titles |
| Display Large | Anthropic Serif | 40px | 500 | 48px | -0.3px | Major section headers |
| Display Medium | Anthropic Serif | 32px | 500 | 40px | 0px | Section headers |
| Heading 1 | Anthropic Sans | 28px | 500 | 36px | 0px | Primary page heading |
| Heading 2 | Anthropic Sans | 24px | 400 | 32px | 0px | Secondary heading |
| Heading 3 | Anthropic Serif | 25px | 500 | 30px | 0px | Tertiary heading |
| Heading 4 | Anthropic Sans | 20px | 400 | 32px | 0px | Subheading |
| Heading 5 | Anthropic Sans | 18px | 500 | 28px | 0px | Card title |
| Heading 6 | Anthropic Sans | 12px | 500 | 15px | 0px | Overline label |
| Body Large | Anthropic Serif | 18px | 400 | 28px | 0px | Long-form content |
| Body | Anthropic Serif | 15px | 400 | 24px | 0px | Default body text |
| Body Small | Anthropic Sans | 14px | 400 | 21px | 0px | Supporting text |
| Label | Anthropic Sans | 13px | 500 | 20px | 0px | Form labels, badges |
| Button | Anthropic Sans | 15px | 400 | 24px | 0px | Button text; fallback to 17px for larger buttons |
| Caption | Anthropic Sans | 12px | 400 | 18px | 0px | Metadata, timestamps |
| Code | Anthropic Mono | 13px | 400 | 20px | 0px | Inline code snippets |
| Code Block | Anthropic Mono | 12px | 400 | 18px | 0px | Block code, terminal |

### Principles

- **Contrast hierarchy:** Serif fonts elevate premium moments (display and hero headings); sans-serif drives everyday content.
- **Readability:** Generous line heights (1.4x–1.6x font size) ensure comfortable reading across device sizes.
- **Developer clarity:** Monospace font used exclusively for code and terminal output to signal technical context.
- **Weight restraint:** Most text uses 400 weight for calm elegance; 500 weight reserved for labels and headings to focus attention.
- **Spacing consistency:** Line height always equals or exceeds font size plus `8px` for breathing room.
- **Accessible contrast:** All text meets WCAG AA standards (4.5:1 minimum for body, 3:1 for large text).

## 4. Component Stylings

### Buttons

#### Primary Button

- **Background:** `#141413`
- **Text Color:** `#FFFFFF`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 24px`
- **Border Radius:** `8px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background darkens to `#000000`, text remains `#FFFFFF`
- **Active State:** Background `#30302E`, text `#FFFFFF`
- **Disabled State:** Background `#CBCADB`, text `#5E5D59`, opacity `0.6`

#### Primary Button (Large)

- **Background:** `#141413`
- **Text Color:** `#FFFFFF`
- **Font Size:** `17px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `14px 28px`
- **Border Radius:** `8px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `none`
- **Line Height:** `27px`
- **Hover State:** Background darkens to `#000000`, text remains `#FFFFFF`

#### Secondary Button

- **Background:** `transparent`
- **Text Color:** `#5E5D59`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 24px`
- **Border Radius:** `7.5px`
- **Border:** `1px solid #5E5D59`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `#F0EEE6`, text `#141413`
- **Active State:** Background `#CBCADB`, border `#141413`

#### Secondary Button (Light)

- **Background:** `transparent`
- **Text Color:** `#FAF9F5`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 24px`
- **Border Radius:** `7.5px`
- **Border:** `1px solid #FAF9F5`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `rgba(250, 249, 245, 0.1)`, text `#FFFFFF`

#### Ghost Button

- **Background:** `transparent`
- **Text Color:** `#5E5D59`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `8px 12px`
- **Border Radius:** `6px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `rgba(0, 0, 0, 0.05)`, text `#141413`

#### CTA / Brand Button

- **Background:** `#C46849`
- **Text Color:** `#FFFFFF`
- **Font Size:** `15px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 24px`
- **Border Radius:** `8px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Hover State:** Background `#B85A3A`, text `#FFFFFF`
- **Active State:** Background `#A84D2E`, text `#FFFFFF`

### Cards & Containers

#### Standard Card

- **Background:** `#FFFFFF`
- **Text Color:** `#141413`
- **Font Size:** `16px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `24px`
- **Border Radius:** `24px`
- **Border:** `1px solid #CBCADB`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 4px 24px 0px`
- **Line Height:** `24px`

#### Elevated Card

- **Background:** `#FAF9F5`
- **Text Color:** `#141413`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Serif
- **Padding:** `20px`
- **Border Radius:** `16px`
- **Border:** `0px solid transparent`
- **Box Shadow:** `rgba(0, 0, 0, 0.08) 0px 6px 32px 0px`
- **Line Height:** `24px`

#### Code Block / Terminal Card

- **Background:** `#1A1A19`
- **Text Color:** `#F0EEE6`
- **Font Size:** `13px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Mono
- **Padding:** `16px 20px`
- **Border Radius:** `8px`
- **Border:** `1px solid #30302E`
- **Box Shadow:** `rgba(0, 0, 0, 0.2) 0px 4px 16px 0px`
- **Line Height:** `20px`

### Inputs & Forms

#### Text Input

- **Background:** `#FFFFFF`
- **Text Color:** `#141413`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `10px 12px`
- **Border Radius:** `6px`
- **Border:** `1px solid #CBCADB`
- **Box Shadow:** `none`
- **Line Height:** `24px`
- **Placeholder Color:** `#5E5D59`
- **Focus State:** Border `1px solid #2C84DB`, box shadow `0px 0px 0px 3px rgba(44, 132, 219, 0.1)`
- **Disabled State:** Background `#F0EEE6`, border `#CBCADB`, text `#5E5D59`, opacity `0.6`

#### Text Input (Dark)

- **Background:** `#1A1A19`
- **Text Color:** `#FAF9F5`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `10px 12px`
- **Border Radius:** `6px`
- **Border:** `1px solid #30302E`
- **Box Shadow:** `none`
- **Placeholder Color:** `rgba(250, 249, 245, 0.5)`
- **Focus State:** Border `1px solid #6A9BCC`, box shadow `0px 0px 0px 3px rgba(106, 155, 204, 0.15)`

#### Textarea

- **Background:** `#FFFFFF`
- **Text Color:** `#141413`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 16px`
- **Border Radius:** `8px`
- **Border:** `1px solid #CBCADB`
- **Box Shadow:** `none`
- **Resize:** Vertical only
- **Min Height:** `120px`
- **Focus State:** Border `1px solid #2C84DB`, box shadow `0px 0px 0px 3px rgba(44, 132, 219, 0.1)`

#### Form Label

- **Color:** `#141413`
- **Font Size:** `13px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Margin Bottom:** `6px`
- **Line Height:** `20px`

#### Checkbox & Radio

- **Size:** `18px × 18px`
- **Border Radius:** `4px` (checkbox), `50%` (radio)
- **Border:** `1px solid #5E5D59`
- **Checked Background:** `#2C84DB`
- **Checked Border:** `1px solid #2C84DB`
- **Focus State:** Box shadow `0px 0px 0px 3px rgba(44, 132, 219, 0.1)`

### Navigation

#### Header Navigation

- **Background:** `#FFFFFF`
- **Text Color:** `#141413`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `16px 0px`
- **Border Bottom:** `1px solid #CBCADB`
- **Line Height:** `24px`

#### Navigation Link

- **Color:** `#141413`
- **Font Size:** `15px`
- **Font Weight:** `400`
- **Hover State:** Color `#2C84DB`, no underline by default
- **Active State:** Color `#2C84DB`, border bottom `2px solid #2C84DB`

#### Dropdown Menu

- **Background:** `#FFFFFF`
- **Text Color:** `#141413`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `8px 0px`
- **Border Radius:** `8px`
- **Border:** `1px solid #CBCADB`
- **Box Shadow:** `rgba(0, 0, 0, 0.05) 0px 4px 24px 0px`
- **Menu Item Padding:** `10px 16px`
- **Menu Item Hover:** Background `#F0EEE6`, text `#141413`

### Badges & Tags

#### Primary Badge

- **Background:** `#C46849`
- **Text Color:** `#FFFFFF`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Padding:** `4px 10px`
- **Border Radius:** `4px`
- **Line Height:** `18px`

#### Secondary Badge

- **Background:** `#F0EEE6`
- **Text Color:** `#141413`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Padding:** `4px 10px`
- **Border Radius:** `4px`
- **Border:** `1px solid #CBCADB`
- **Line Height:** `18px`

#### Status Badge (Error)

- **Background:** `#FFE5E5`
- **Text Color:** `#B53333`
- **Font Size:** `12px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Padding:** `4px 10px`
- **Border Radius:** `4px`
- **Line Height:** `18px`

### Tabs

#### Tab (Default)

- **Background:** `transparent`
- **Text Color:** `#5E5D59`
- **Font Size:** `14px`
- **Font Weight:** `400`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 16px`
- **Border Bottom:** `2px solid transparent`
- **Line Height:** `21px`

#### Tab (Active)

- **Background:** `transparent`
- **Text Color:** `#141413`
- **Font Size:** `14px`
- **Font Weight:** `500`
- **Font Family:** Anthropic Sans
- **Padding:** `12px 16px`
- **Border Bottom:** `2px solid #2C84DB`
- **Line Height:** `21px`

## 5. Layout Principles

### Spacing System

**Base Unit:** `4px`

**Spacing Scale:**
- `4px` — Fine gap, tight micro-spacing
- `8px` — Compact padding, small gaps
- `12px` — Standard gap between elements
- `16px` — Default padding, medium spacing
- `24px` — Large padding, section spacing
- `32px` — Extra-large spacing between major sections
- `48px` — Hero spacing, major separation
- `64px` — Page-level margin, hero section gaps

**Usage Context:**
- Button padding: `12px 24px`
- Card padding: `24px`
- Section gap: `32px` to `64px`
- Navigation padding: `16px 0px`
- Input padding: `10px 12px`
- Micro-spacing (between icon and label): `8px`

### Grid & Container

- **Max Width:** `1440px` (desktop container limit)
- **Padding:** `24px` on sides for screens under `1024px`; `32px` on sides for desktop
- **Column Strategy:** 12-column grid system; content typically spans 8–12 columns
- **Gutter:** `16px` between columns
- **Section Patterns:** Full-width hero sections use max-width container; card grids use 2–4 columns depending on viewport

### Whitespace Philosophy

Whitespace is treated as a design material. Generous negative space around headlines creates hierarchy and guides the eye. Section spacing uses multiples of `16px` to create rhythm. Cards and containers feature internal padding of `24px` to create breathing room. Margins between distinct content blocks are typically `48px` to `64px`, fostering a sense of calm and intentionality. Whitespace hierarchy mirrors visual hierarchy: more important content gets more surrounding space.

### Border Radius Scale

- `4px` — Form inputs, small tags, checkbox elements
- `6px` — Ghost buttons, minor UI elements
- `7.5px` — Standard buttons, small interactive components
- `8px` — Cards, modals, rounded containers
- `8.5px` — Large buttons, elevated interactions
- `16px` — Elevated cards, premium containers
- `24px` — Feature cards, hero showcase containers
- `1440px` — Fully rounded (pill buttons, very large radius)

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (0) | No shadow, `box-shadow: none` | Backgrounds, flat UI zones, print materials |
| Shallow (1) | `rgba(0, 0, 0, 0.04) 0px 2px 8px 0px` | Subtle dividers, light overlays |
| Standard (2) | `rgba(0, 0, 0, 0.05) 0px 4px 24px 0px` | Dropdown menus, popovers, subtle cards |
| Elevated (3) | `rgba(0, 0, 0, 0.08) 0px 6px 32px 0px` | Modal dialogs, elevated cards, floating panels |
| Deep (4) | `rgba(0, 0, 0, 0.12) 0px 12px 48px 0px` | Full-page overlays, deepest interactive modals |

**Shadow Philosophy:**

Shadows are used sparingly and purposefully to suggest layering without visual noise. Each shadow level corresponds to a clear z-index hierarchy. On light backgrounds, shadows are darker and more pronounced; on dark backgrounds, shadows use lower opacity and are often inverted or softened. Shadow color always uses pure black (`#000000`) with opacity scaling, never tinted shadows. Elevation is visual, not excessive—most UI lives at the Standard (2) level, reserving deeper shadows for critical modals and prominent overlays.

## 7. Do's and Don'ts

### Do

- **Use the serif font for display headings and hero moments** to create premium differentiation and visual interest.
- **Pair warm orange (`#C46849`) with cool blue (`#2C84DB`)** for interactive contrast; use one or the other, not both in the same small component.
- **Maintain 24px padding minimum** inside cards and containers for generous internal breathing room.
- **Rely on border radius of `8px` or less** for most UI; reserve `24px` for special feature cards only.
- **Leverage the neutral scale (`#141413`, `#5E5D59`, `#FAF9F5`)** as the foundation; accent colors highlight interactivity.
- **Use `15px` font size as the default body text** in Anthropic Serif for consistent, readable long-form content.
- **Apply `rgba(0, 0, 0, 0.05)` shadow at the dropdown level** as the baseline for most floating elements.
- **Ensure all interactive elements meet 44px × 44px minimum touch target size** on mobile (48px recommended).
- **Group related form fields with `12px` gap** to signal relationship; use `24px` between distinct form sections.
- **Deploy error state (`#B53333`) only for validation failures and destructive actions**; don't overuse.

### Don't

- **Don't apply border radius > `24px`** except for full pill buttons (`1440px`); it reads as overly soft or out of character.
- **Don't use pure black (`#000000`) for body text**; rely on `#141413` for reduced eye strain and a softer, more refined tone.
- **Don't mix serif and sans-serif fonts within a single paragraph**; each section should use one or the other.
- **Don't apply shadows to elements inside dark containers**; dark backgrounds should use flat treatment or inverted subtle depth.
- **Don't create buttons smaller than `8px` padding in any direction**; respect the 44px minimum interactive size.
- **Don't use color alone to convey meaning** (e.g., red for error); always include text or an icon indicator.
- **Don't place interactive elements directly next to each other without `8px` gap minimum** to avoid accidental activation.
- **Don't exceed `1440px` max width** for content; full-width media (hero images) may exceed this, but text containers must not.
- **Don't apply border radius to form inputs > `6px`** except for large text areas (`8px` acceptable).
- **Don't use the accent colors (orange, blue, red) for large areas of UI**; reserve them for CTAs, highlights, and status indicators.

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Width | Key Changes |
|-----------|-------|------------|
| Mobile (XS) | < 480px | Single-column layout, full-width containers, 16px padding, font size reduced by 2px for body text, all CTAs expand to full width |
| Small (SM) | 480px – 640px | Single column, 20px padding, card grid switches to 1 column |
| Medium (MD) | 640px – 1024px | 2-column grid, 24px padding, heading size remains same, navigation becomes hamburger menu below 768px |
| Large (LG) | 1024px – 1440px | 3-column grid, 32px padding, full horizontal navigation visible, max-width container activated |
| XL (Desktop) | ≥ 1440px | 4-column grid possible, 32px padding maintained, max-width container at 1440px, full feature set visible |

### Touch Targets

- **Minimum size:** `44px × 44px` on all interactive elements
- **Recommended size:** `48px × 48px` for mobile buttons and icon buttons
- **Spacing between targets:** `8px` minimum (12px recommended on mobile to prevent accidental activation)
- **Button padding on mobile:** Increase to `14px 20px` from desktop `12px 24px` to reach 48px height minimum
- **Form input height on mobile:** Maintain `44px` minimum; adjust padding from `10px 12px` to `12px 14px`

### Collapsing Strategy

- **Navigation:** At `768px`, collapse horizontal navigation into hamburger menu; keep logo and single CTA button visible
- **Card grids:** At `1024px` use 3 columns; at `640px` switch to 2 columns; below `480px` use 1 column
- **Typography:** Below `640px`, reduce heading sizes by 2–4px; maintain body text at `15px` minimum for readability
- **Spacing:** Reduce section gaps from `64px` to `48px` at `1024px`; reduce to `32px` at `640px`
- **Images & media:** Maintain 16:9 aspect ratio; scale fluidly to container width
- **Sidebar content:** Stack vertically below `1024px`; collapse into accordion or separate section
- **Button layout:** Full-width buttons on mobile; inline buttons (side by side) only above `768px` with `12px` gap
- **Padding adjustments:** 24px page padding on desktop (1024px+); 16px padding on tablet (640px–1024px); 16px on mobile (< 640px)

## 9. Agent Prompt Guide

### Quick Color Reference

- **Primary CTA:** Charcoal 900 (`#141413`) — use for highest-priority "solid" buttons
- **Secondary CTA:** Brand Orange (`#C46849`) — use for marketing and brand-driven CTAs
- **Link/Interactive:** Brand Blue (`#2C84DB`) — use for links, focus states, and secondary interactive elements
- **Background (Light):** Cream (`#FAF9F5`) or Pure White (`#FFFFFF`) — default page and card backgrounds
- **Background (Dark):** Charcoal 900 (`#141413`) — dark mode containers, terminal/code zones
- **Text (Dark):** Charcoal 900 (`#141413`) — primary text on light backgrounds
- **Text (Light):** Cream 100 (`#FAF9F5`) — primary text on dark backgrounds
- **Heading text:** Charcoal 900 (`#141413`) — consistent across display and body headings
- **Label/Caption:** Stone 600 (`#5E5D59`) — muted text for metadata
- **Border:** Lavender 100 (`#CBCADB`) — light borders and dividers
- **Error State:** Error Red (`#B53333`) — validation failures and destructive actions
- **Shadow:** `rgba(0, 0, 0, 0.05)` at minimum (standard dropdowns); scale up to `0.12` for deep modals

### Iteration Guide

1. **Typography first:** Always apply Anthropic Sans for UI labels, buttons, and small text; Anthropic Serif for display headings (24px+) and body copy (15px+). Use Anthropic Mono only for code and terminal output.

2. **Color hierarchy:** Use neutral scale (`#141413`, `#5E5D59`, `#FAF9F5`) as the 90% default. Reserve Brand Orange (`#C46849`) and Brand Blue (`#2C84DB`) for 10% of UI—CTAs, links, focus states, and highlights only.

3. **Spacing consistency:** Every container and section uses multiples of `4px`, with practical defaults being `8px`, `12px`, `16px`, `24px`, `32px`, and `64px`. Apply these to padding, margins, and gaps without deviation.

4. **Elevation discipline:** Use the shadow table (Depth & Elevation section) exactly as specified. Standard dropdown shadow is `rgba(0, 0, 0, 0.05) 0px 4px 24px 0px`. Never invent new shadows.

5. **Button treatment:** All buttons use `8px` border radius minimum, `12px 24px` padding (mobile: `14px 20px`), `400`-weight sans-serif, `15px` size. Primary is solid `#141413` background; secondary is transparent with `1px` border. Ghost buttons are transparent, no border.

6. **Form input consistency:** All text inputs use `6px` border radius, `10px 12px` padding, `1px solid #CBCADB` border, and focus state with blue outline (`0px 0px 0px 3px rgba(44, 132, 219, 0.1)`).

7. **Card structure:** Standard card uses `24px` padding, `8px` border radius, `#FFFFFF` background, `1px solid #CBCADB` border, and `rgba(0, 0, 0, 0.05)` shadow. Premium/elevated cards use `24px` border radius and `rgba(0, 0, 0, 0.08)` shadow.

8. **Mobile breakpoint logic:** Below `768px`, collapse multi-column grids to 1 column, stack buttons vertically, expand CTAs to full width (`100%`), and reduce padding to `16px`. Navigation becomes hamburger menu.

9. **Contrast compliance:** All text must achieve minimum 4.5:1 contrast ratio (body) or 3:1 (large text, 18px+). Use `#141413` or `#000000` text on light backgrounds; `#FAF9F5` or `#FFFFFF` on dark backgrounds.

10. **Touch targets:** Every clickable element must be `44px × 44px` minimum; buttons should target `48px` height. Apply `8px` minimum gap between interactive elements to prevent mis-taps. On mobile, increase all padding by `2px` vertically and `4px` horizontally.