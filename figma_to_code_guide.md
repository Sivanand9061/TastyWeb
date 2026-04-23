# Figma → Real App: The Implementation Guide
### *For the Tasty Hot Redesign*

---

> **The rule:** Before you write a single line of code from the new design, you need to finish 3 things in Figma first. If you skip these, implementation becomes a mess of hardcoded values and inconsistency.

---

## Phase 1 — Set Up Figma the Right Way (While Designing)

You need to do these things IN Figma BEFORE you finish designing. They make implementation 10x faster.

### 1. Use Figma Variables for Design Tokens

In Figma: `Local Variables → Create Variable → Color`

Create these variable groups:

```
Colors/
  Brand/
    primary         #f51c27   ← your red
    primary-hover   #d90429
    dark            #1c1c1a
    shell-bg        #eaeaec

  Text/
    heading         #1c2938
    body            #4b5563
    muted           #9ca3af
    on-dark         #ffffff

  Surface/
    white           #ffffff
    card            #f9f9f9
    input-border    #e5e7eb

Typography/
  heading-font      "Your chosen font"
  body-font         "Your chosen font"

Radius/
  card              16px
  button            999px   ← pill
  input             12px
  modal             24px

Spacing/
  xs   4px
  sm   8px
  md   16px
  lg   24px
  xl   40px
```

**Why:** When you finish designing, these variable names become your CSS variable names. 1-to-1 mapping. No guessing.

### 2. Build Real Components in Figma

Every repeating UI element must be a **Figma Component** (`Ctrl+Alt+K`). For Tasty Hot, these are:

- Primary Button (with variants: default, disabled, loading)
- Food Card (crowd favorite style)
- Menu Item Row (with variants: in-stock, out-of-stock)
- Category Tab Pill (active, inactive)
- Bottom Sheet Modal (empty container)
- Toggle Switch (on/off)
- Admin Card Row (same as menu item row, different context)
- Nav Bar
- Bottom Tab Bar

**Name them exactly how you'll name your React components.** If the component in Figma is called `MenuItemCard`, your React file will be `MenuItemCard.tsx`.

### 3. Annotate Interactions in Figma Prototype

Use Figma's Prototype tab to define:
- What happens when you tap a crowd favorite card → navigates to menu + opens modal
- What happens when you tap a menu item row → bottom sheet slides up
- What happens when you add to cart → toast notification + cart count increments

This isn't just for the case study. When you come back to code it, you'll know exactly what state changes are needed.

---

## Phase 2 — The Handoff Checklist (Before You Touch Code)

Run through this when design is done:

```
□ Every screen is designed at 390px width (iPhone 14 standard)
□ All colours use Variables (no hardcoded hex values in components)
□ All text uses a Text Style (no freeform font sizes)
□ All components have proper naming
□ You have designed: Home, Menu, Product Detail, Cart, 
  Admin Panel, Admin Card Editor, Kitchen Dashboard
□ You have a Prototype flow showing the full user journey
□ Edge cases are designed: Empty cart, Out of stock item, 
  No menu items, Admin with no cards
```

---

## Phase 3 — Extracting Tokens from Figma into Code

This is the first thing you do when you open VS Code after finishing Figma.

### Step 1: Update `themes.ts`

Your existing `themes.ts` has the colour system. Open it alongside Figma and update every value to match your new design:

```typescript
// src/themes.ts
export const themes = [
  {
    id: 'tasty-hot',
    name: 'Tasty Hot',
    colors: {
      '--accent':           '#f51c27',   // match your Figma variable
      '--accent-hover':     '#d90429',
      '--bg-primary':       '#eaeaec',
      '--bg-card':          '#ffffff',
      '--text-primary':     '#1c2938',
      '--text-secondary':   '#6b7280',
      // ... etc
    }
  }
]
```

### Step 2: Create a `tokens.css` file

Create `src/styles/tokens.css` — this is your single source of truth:

```css
:root {
  /* Colors */
  --color-brand:         #f51c27;
  --color-brand-hover:   #d90429;
  --color-dark:          #1c1c1a;
  --color-shell:         #eaeaec;

  /* Typography */
  --font-heading:        'YourHeadingFont', sans-serif;
  --font-body:           'YourBodyFont', sans-serif;

  /* Radius */
  --radius-card:         16px;
  --radius-button:       999px;
  --radius-input:        12px;
  --radius-modal:        24px;

  /* Spacing */
  --space-xs:   4px;
  --space-sm:   8px;
  --space-md:   16px;
  --space-lg:   24px;
  --space-xl:   40px;
}
```

Import this at the top of `main.tsx` before everything else.

### Step 3: Update Google Fonts import

In `index.html`, update the font import to whatever you chose in Figma:

```html
<link href="https://fonts.googleapis.com/css2?family=YourFont:wght@400;600;700;900&display=swap" rel="stylesheet">
```

---

## Phase 4 — The Implementation Workflow (Screen by Screen)

Do this in order. Don't jump around.

### The Order to Implement Screens

```
1. tokens.css + themes.ts     ← foundation, do this first
2. App shell (nav + bottom tab bar)
3. HomePage
4. CategoriesFixed (menu page)
5. ProductDetail (the slide-up modal)
6. CartPage
7. AdminAddItems
8. KitchenDashboard
```

### For Each Screen, Follow This Pattern:

**Step A — Read the Figma screen**
Open the screen in Figma. Use the inspect panel on the right side (click any element). Figma shows you:
- Exact px values for padding/margin
- The colour variable name (which maps to your CSS variable)
- Font size, weight, line-height
- Border radius

**Step B — Identify what already exists in the codebase**

Before writing new code, check what the current component looks like. Ask yourself:
- Is this the same component with different styling? → Just update the CSS classes
- Is this a completely new layout? → Rewrite the JSX structure
- Is this a new component that doesn't exist? → Create a new file

**Step C — Update in this order within each file:**
1. The JSX structure (the HTML skeleton)
2. The Tailwind/CSS classes (the visual layer)
3. The interactions/animations (motion, transitions)

---

## Phase 5 — How to Actually Map Figma to Code

### Reading Figma Measurements

| What you see in Figma | What to write in code |
|---|---|
| Fill: `Colors/Brand/primary` | `bg-[var(--accent)]` or `className="text-[#f51c27]"` |
| Corner radius: `16` | `rounded-[16px]` |
| Padding: `16` top/bottom, `24` left/right | `py-4 px-6` |
| Text: Inter Bold 28px | `font-bold text-[28px]` |
| Gap between items: `12` | `gap-3` |
| Auto layout: horizontal, center | `flex items-center` |
| Auto layout: vertical, stretch | `flex flex-col` |

### The Spacing Cheat Sheet (Figma px → Tailwind)

```
4px   → gap-1 / p-1  / m-1
8px   → gap-2 / p-2  / m-2
12px  → gap-3 / p-3  / m-3
16px  → gap-4 / p-4  / m-4
20px  → gap-5 / p-5  / m-5
24px  → gap-6 / p-6  / m-6
32px  → gap-8 / p-8  / m-8
40px  → gap-10 / p-10 / m-10
```

### Typography Cheat Sheet

```
12px → text-[12px]
14px → text-[14px] or text-sm
16px → text-[16px] or text-base
20px → text-[20px]
24px → text-[24px]
28px → text-[28px]
32px → text-[32px]
```

---

## Phase 6 — The Component-by-Component Process

Here's exactly what to do for each Tasty Hot screen:

---

### HomePage.tsx

**What to look for in Figma:**
- Hero height (you have `65vh` now — does the new design change this?)
- The white sheet border radius and overlap amount (currently `borderRadius: 28, marginTop: -40`)
- The crowd favorite card aspect ratio (currently `aspect-[4/5]`)
- Font sizes for "CROWD FAVORITES" label, section heading, card title

**What NOT to touch (keep the logic):**
- `useHomepageSettings()` hook — leave it, it reads from Firebase
- `isItemCurrentlyAvailable()` function — leave it
- The IntersectionObserver — leave it
- `onExploreClick` — leave it

**What you WILL change:**
Only the JSX layout and className values. The logic is already correct.

---

### CategoriesFixed.tsx

**What to look for in Figma:**
- The sticky header height and what's inside it (search + category tabs)
- The menu item row layout (image size, text layout, price placement)
- The category tab pill style (active vs inactive)
- The product detail bottom sheet height and contents

**What NOT to touch:**
- Firebase data loading logic
- `isItemCurrentlyAvailable()` function
- Cart logic
- The `targetItemName` → modal open logic (we just fixed this)

**What you WILL change:**
Layout of `MenuItemCard`, `CategoryTabs`, `ProductDetail` JSX and styles.

---

### AdminAddItems.tsx

This is the most complex file. **Do NOT rewrite this.** Instead:

1. Update styles section by section (Categories first, then Homepage Settings)
2. The card editor modal — update its visual style but keep all the Firebase save logic
3. Don't touch any `async` functions

---

## Phase 7 — Handling Animations from Figma

Figma prototypes show transitions but don't tell you the exact spring values. Here's how to code the transitions you'll typically design:

**Slide up (product detail, card editor modal):**
```tsx
// Already in your codebase — keep this
initial={{ y: "100%" }}
animate={{ y: 0 }}
exit={{ y: "100%" }}
transition={{ type: "spring", damping: 30, stiffness: 300 }}
```

**Fade in:**
```tsx
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ duration: 0.2 }}
```

**Scale on tap (buttons):**
```tsx
whileTap={{ scale: 0.95 }}
// Already used in your Explore button — copy this pattern
```

**Staggered list reveal (like crowd favorite cards):**
```tsx
style={{ transitionDelay: `${i * 70}ms` }}
// Already in your codebase
```

---

## Phase 8 — Testing the Implementation Against Figma

Once you've implemented a screen, do this:

1. **Open your browser at 390px width** (DevTools → Responsive → 390)
2. **Put Figma next to it** (same screen, split view)
3. **Check these in order:**
   - Colours match
   - Spacing feels right (exact px matching is less important than visual harmony)
   - Typography weights and sizes are correct
   - Corner radii are consistent
   - Touch targets are at least 44px tall
   - Nothing overflows horizontally

**The "Close Enough" Rule:** Pixel-perfect matching matters less than:
- Consistent spacing rhythm
- Correct typographic hierarchy
- Correct colour application

---

## Phase 9 — What to Do if the New Design Breaks Existing Features

This WILL happen. Here's how to handle it:

**Scenario A: You redesigned the menu item card layout**
→ Only update the JSX and classes in `MenuItemCard` component. All the `onClick`, `onAddToCart`, `isAvailable` props stay the same.

**Scenario B: You redesigned the admin card editor with a completely different modal structure**
→ Keep all the state variables (`cardEditorForm`, `cardEditorOpen`, `savingCard`, etc.) and all the Firebase functions (`saveCard`, `openCardEditor`, `deleteCard`). Only replace what's inside the JSX `return`.

**Scenario C: You want a navigation change (e.g. new bottom tab)**
→ Update `App.tsx`. Add the new page state, add the tab button, create or update the page component.

**The rule:** Functions that touch Firebase or manage state = don't touch. JSX that the user sees = safe to rewrite.

---

## Quick Reference: Which Files to Update for Which Design Changes

| Design change | File(s) to update |
|---|---|
| Nav bar redesign | `src/app/App.tsx` |
| Home screen layout | `src/imports/HomePage/HomePage.tsx` |
| Menu page layout | `src/imports/Categories/CategoriesFixed.tsx` |
| Product detail modal | `CategoriesFixed.tsx` → `ProductDetail` component |
| Cart page | `src/imports/CartPage/CartPage.tsx` |
| Admin panel layout | `src/imports/Admin/AdminAddItems.tsx` |
| Card editor modal styling | `AdminAddItems.tsx` → card editor modal section |
| Global colours | `src/themes.ts` + `src/styles/tokens.css` |
| Global fonts | `index.html` (Google Fonts link) + `tokens.css` |
| Bottom tab bar | `src/app/App.tsx` |
| Login modal | `src/imports/Auth/LoginSignupModal.tsx` |

---

## The Single Most Important Thing

When you finish a Figma screen and come here to implement it, **only change what you need to change**. The codebase has working Firebase integrations, real-time listeners, cart logic, and admin saves.

If you break those while restyling, you'll spend hours debugging logic when the only problem was a misplaced closing tag.

**The mantra: Change the look, preserve the logic.**

---

## When You're Ready to Implement

Come back here and tell me:
- Which screen you're starting with
- What the key design changes are (layout, colours, new components)

I'll look at the current code for that screen and tell you exactly which lines to change and which to leave alone.
