```markdown

# Design System Specification: The Premium Marketplace Framework



## 1. Overview & Creative North Star: "The Architectural Curator"



This design system is built to move beyond the "commodity" look of standard freelance platforms. Our Creative North Star is **The Architectural Curator**. This concept treats the digital interface as a high-end physical gallery—a space where light, depth, and intentional whitespace elevate the "work" (the freelancers and projects) above the "tool."



We reject the rigid, boxed-in layouts of the past decade. Instead, we embrace **intentional asymmetry**, **tonal layering**, and **cinematic scale**. By utilizing "The Architectural Curator" philosophy, we ensure the marketplace feels like a prestigious institution rather than a chaotic bidding site. We don't just facilitate transactions; we curate professional excellence through a premium, "Glass-and-Grit" aesthetic.



---



## 2. Colors: Tonal Depth & The "No-Line" Rule



The palette is anchored by deep, authoritative navies and electrified by high-precision blues.



### The "No-Line" Rule

**Explicit Instruction:** Designers are prohibited from using 1px solid borders to define sections. Boundaries must be established through background color shifts or subtle tonal transitions.

* *Example:* A `surface-container-low` hero section should transition into a `surface` main body without a dividing line.



### Surface Hierarchy & Nesting

Treat the UI as a series of physical layers. Use the `surface-container` tiers to create "nested" depth:

* **Surface (Base):** The canvas.

* **Surface-Container-Low:** Subtle recession for secondary utility areas.

* **Surface-Container-Highest:** For primary interactive cards that need to "pop" toward the user.



### The "Glass & Gradient" Rule

To achieve a signature look, utilize **Glassmorphism** for floating headers, navigation bars, and modal overlays.

* **Recipe:** `surface` color at 70% opacity + `backdrop-blur: 24px`.

* **Signature Textures:** For high-impact CTAs, use a subtle linear gradient from `secondary` (#0040e0) to `secondary_container` (#2e5bff) at a 135-degree angle. This adds a "lithic" soul to the button that flat color cannot replicate.



---



## 3. Typography: Editorial Authority



We use a high-contrast pairing of **Manrope** for impact and **Inter** for utility.



* **Display & Headlines (Manrope):** These are our "Voice." Large, bold, and authoritative. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for hero headlines to create an editorial, high-fashion feel.

* **Titles & Body (Inter):** These are our "Function." Inter provides unparalleled readability at small scales. Use `body-lg` for project descriptions to ensure long-form content feels effortless to consume.

* **Labels (Inter):** Use `label-md` in all-caps with increased letter-spacing (+0.05em) for category tags to denote professional categorization.



---



## 4. Elevation & Depth: The Layering Principle



We convey hierarchy through **Tonal Layering** rather than traditional structural shadows.



* **Tonal Stacking:** Place a `surface-container-lowest` (#ffffff) card on a `surface-container-low` (#f2f4f6) section. This creates a soft, natural "lift" that feels modern and clean.

* **Ambient Shadows:** For floating elements (like 'slide cards'), use an **Ambient Shadow**:

* *Blur:* 40px to 60px.

* *Opacity:* 4%–6%.

* *Color:* Use a tinted version of `on_surface` (#191c1e). Never use pure black shadows; they feel "dirty" on a premium UI.

* **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline_variant` token at **15% opacity**. High-contrast, 100% opaque borders are strictly forbidden.



---



## 5. Components: Fluid Primitives



### Buttons

* **Primary:** High-gloss `secondary` (#0040e0) with `lg` (2rem) rounded corners.

* **Secondary:** Glass-style. `surface_container_low` background with a subtle "Ghost Border."

* **Interaction:** On hover, primary buttons should scale 2% (1.02) to simulate physical responsiveness.



### Slide Cards (Signature Component)

The core of the freelance marketplace.

* **Geometry:** Use `xl` (3rem) corner radius.

* **Layout:** High-quality imagery should bleed to the edges. Content overlays should use a glassmorphism footer (70% opacity `surface_container_highest`).

* **Separation:** Forbid the use of divider lines. Separate "Price," "Rating," and "Name" using `spacing-4` (1.4rem) of horizontal whitespace.



### Input Fields

* **Base:** `surface_container_low`.

* **Focus State:** Shift background to `surface_container_lowest` and apply a 2px `secondary` (#0040e0) soft outer glow.

* **Radius:** `md` (1.5rem).



### Chips & Tags

* **Visual:** Pill-shaped (`full` radius).

* **Color:** Use `secondary_fixed` (#dde1ff) for the background with `on_secondary_fixed_variant` (#0035be) for the text to create a vibrant, innovative contrast.



---



## 6. Do’s and Don’ts



### Do:

* **Do** use asymmetrical spacing. Allow more "air" at the top of a card than the bottom to create a sense of upward momentum.

* **Do** lean into `xl` (3rem) corner radiuses for large containers; it communicates safety and modernity.

* **Do** use `surface_bright` for interactive hover states to create a "lighting up" effect.



### Don’t:

* **Don’t** use 100% black text. Always use `on_surface` (#191c1e) to maintain a soft, premium tonal range.

* **Don’t** use sharp corners. Nothing in this system should have a radius smaller than `sm` (0.5rem).

* **Don’t** use standard grid-gutters. Use the `spacing-8` (2.75rem) or `spacing-10` (3.5rem) to ensure elements have room to breathe, preventing a "cluttered marketplace" feel.

* **Don't** ever use a divider line to separate list items. Use a background toggle between `surface` and `surface_container_low`.```