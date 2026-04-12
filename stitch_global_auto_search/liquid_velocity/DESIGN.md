# Design System Specification: Liquid Glass Editorial

## 1. Overview & Creative North Star
**Creative North Star: "The Kinetic Gallery"**

This design system is engineered to transform the utilitarian car search process into a high-end, editorial experience. We are moving away from the "database" aesthetic of traditional automotive platforms. Instead, we treat each vehicle as a centerpiece in a digital gallery.

By leveraging **intentional asymmetry**, we break the rigid, predictable grid. Expect overlapping elements where typography might bleed over the edge of a vehicle image, and high-contrast scales that prioritize bold, technical data. This system utilizes a "Liquid Glass" aesthetic—a sophisticated take on glassmorphism that uses depth, motion, and light refraction to create a sense of premium precision.

---

## 2. Colors & Surface Philosophy

Our palette is a deep, technical charcoal—avoiding pure black to maintain a sense of environmental light and depth.

### The Palette (Material Design Tokens)
*   **Surface/Background:** `#0E0E0E` (A rich, matte charcoal)
*   **Primary (Action):** `#FF9159` (Vibrant Electric Orange)
*   **Secondary (Highlight):** `#669DFF` (Crystalline Blue)
*   **Tertiary (Accent):** `#FAB0FF` (Soft Orchid)
*   **Surface Containers:** Range from `#131313` (Low) to `#262626` (Highest)

### The "No-Line" Rule
To achieve a bespoke feel, **1px solid borders are strictly prohibited for sectioning.** We define boundaries through tonal shifts. For example, a search filter sidebar (using `surface-container-low`) should sit directly against the main background (`surface`) without a stroke. The change in hex code provides the edge.

### Surface Hierarchy & Nesting
Think of the UI as physical layers of smoked glass. 
1.  **Base:** `surface` (#0E0E0E)
2.  **Sectioning:** `surface-container-low` (#131313)
3.  **Cards/Floating Elements:** `surface-container-high` (#1F2020)

### The "Glass & Gradient" Rule
For hero sections or primary interactive cards, use **Glassmorphism**. Apply a `backdrop-blur` (12px–20px) to a semi-transparent `surface-variant` (#262626 at 60% opacity). To add "soul," use subtle linear gradients on CTAs: `primary` (#FF9159) transitioning to `primary-container` (#FF7A2F) at a 45-degree angle.

---

## 3. Typography
The typography system pairs technical precision with editorial impact.

*   **Display & Headlines (Space Grotesk):** This is our "signature" font. Its geometric, slightly brutalist terminals feel like automotive engineering. Use `display-lg` (3.5rem) for hero price points or car names to dominate the layout.
*   **Body & Labels (Inter):** Chosen for its unparalleled legibility at small sizes. Used for technical specs (mileage, engine type) and form labels.
*   **Hierarchy Tip:** Use `label-md` in all-caps with 5% letter spacing for category headers (e.g., "MANUFACTURER") to create an authoritative, architectural feel.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not shadows.

*   **The Layering Principle:** A vehicle detail card (`surface-container-highest`) should feel "lifted" simply because it is lighter than the background it sits on.
*   **Ambient Shadows:** If an element must float (like a sticky "Book Test Drive" bar), use a shadow color tinted with our secondary blue: `rgba(102, 157, 255, 0.08)` with a 40px blur. This mimics real-world light refraction through glass.
*   **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#484848) at **15% opacity**. It should be felt, not seen.
*   **Glassmorphism Depth:** When using glass sections, the "on-surface" text must maintain a 7:1 contrast ratio against the blurred background to ensure readability.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-fixed`. `xl` (1.5rem) corner radius. No border.
*   **Secondary (Glass):** `surface-container-highest` with 40% opacity and 10px backdrop blur. A `ghost-border` is allowed here to define the clickable area.

### Input Fields
*   **The "Liquid" Input:** Use `surface-container-highest` backgrounds. The active state should not use a thick border; instead, change the background to `surface-bright` (#2C2C2C) and add a subtle `primary` underline (2px).

### Cards & Lists
*   **No Dividers:** Forbid the use of line dividers between car listings. Use `surface-container-low` for every second item or simply use 32px of vertical white space (from our spacing scale) to allow the eye to rest.
*   **The Feature Chip:** Use `secondary-container` (#005BC0) with `on-secondary-container` (#F7F7FF) text for high-contrast highlights like "New Arrival" or "Electric."

### Tooltips & Overlays
*   Must use the "Liquid Glass" effect. 24px backdrop blur, `surface-container-highest` at 80% opacity, and an `xl` corner radius for a soft, premium feel.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical layouts—let car images bleed off the edge of their containers.
*   **Do** use "Space Grotesk" for numbers. Prices and technical data are the "stars" of this platform.
*   **Do** stack `surface-container` tiers to create hierarchy.

### Don't:
*   **Don't** use 100% opaque black. It kills the "Liquid Glass" effect and reduces the perceived quality.
*   **Don't** use standard 1px borders to separate content. It makes the UI look like a spreadsheet.
*   **Don't** use "Drop Shadows" with 20%+ opacity. Keep them ambient and tinted.
*   **Don't** crowd the interface. If a layout feels tight, increase the spacing by one tier in the roundedness/spacing scale.