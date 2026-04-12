# Navbar Visibility Troubleshooting Guide

## Issue: Navbar not showing on dashboard

### What Was Fixed

1. **Changed navbar background** from `bg-surface-container-low/95` to `bg-[#16161a]`
   - The opacity modifier `/95` might not work with Tailwind v4 custom colors
   - Now uses explicit hex value to ensure visibility

### How to Test

1. **Start the dev server:**
   ```bash
   cd quantum-oracle-ui
   npm run dev
   ```

2. **Visit:** `http://localhost:3000/dashboard`

3. **What you should see at the top:**
   ```
   ┌─────────────────────────────────────────────────────────┐
   │ ● QCrypt | Dashboard    [🔵 Developer] [Simple/Dev] ... │  ← This is the navbar
   ├─────────────────────────────────────────────────────────┤
   │                                                         │
   │ [Sidebar]  |  Main Content                             │
   │              Quantum Randomness Oracle                  │
   └─────────────────────────────────────────────────────────┘
   ```

### If Still Not Visible

#### Check 1: Browser DevTools
1. Open DevTools (F12)
2. Select the `<header>` element
3. Check computed styles:
   - Is `height: 48px` (or `3rem`)?
   - Is `background-color: rgb(22, 22, 26)` showing?
   - Is `position: sticky` and `top: 0px`?
   - Is `z-index: 50`?
   - Is `display: flex`?

#### Check 2: Console Errors
Open browser console and check for:
- `useUserMode must be used within UserModeProvider` → Provider issue
- Any React rendering errors
- Any CSS compilation errors

#### Check 3: Elements Panel Structure
Should see:
```
<body>
  └── <div id="__next">
        └── <Providers>
              └── <DynamicAppShell>
                    ├── <header> ← TopNavbar (THIS IS WHAT WE'RE LOOKING FOR)
                    └── <div class="grid...">
                          ├── <aside> ← Sidebar
                          └── <main> ← Content
```

#### Check 4: Is it hidden behind something?
In DevTools, try temporarily adding:
```css
header {
  outline: 3px solid red !important;
}
```
If you see a red outline but no content → z-index or overflow issue

### Common Issues & Solutions

#### Issue 1: Navbar blends with background
**Symptom**: Navbar is there but same color as background
**Solution**: The background is now `#16161a` (dark gray). If still not visible, try:
```tsx
className="... bg-red-500 ..."  // Temporary test
```

#### Issue 2: Content overlaps navbar
**Symptom**: First few lines of content are hidden behind navbar
**Solution**: Add top padding to main content:
```tsx
// In DynamicAppShell.tsx
<main className="... pt-12 ...">
```

#### Issue 3: Viewport too narrow
**Symptom**: Navbar appears empty on mobile
**Reason**: Many elements have `hidden sm:` classes
**Solution**: This is intentional responsive behavior. Widen browser to >640px

#### Issue 4: Mode context error
**Symptom**: White screen or error in console
**Check**: `localStorage.getItem('qcrypt_user_mode')` in console
**Solution**: Should return `'simple'` or `'developer'`

### Quick Diagnostic Test

Add this temporary debug line to `TopNavbar.tsx` right before the return:

```tsx
console.log('TopNavbar rendering, pathname:', pathname, 'isSimple:', isSimple);
```

Then check browser console. If you see the log → component is rendering.
If you don't see the log → component is not being rendered at all.

### Expected Visual Elements (at >640px width)

From left to right:
1. **Green dot** (logo mark)
2. **"QCrypt"** text
3. **Vertical separator** line
4. **Breadcrumb**: e.g., "Generate / Dashboard"
5. **Mode badge**: Either "🔵 Developer" or "🟢 Simple"
6. **Mode toggle**: [Simple | Dev] buttons
7. **Status chips**: NODE_01, API Connected
8. **Icons**: Activity, Settings

### Files Modified

- `quantum-oracle-ui/src/components/layout/TopNavbar.tsx`
  - Line 82: Changed `bg-surface-container-low/95` to `bg-[#16161a]`
  - Removed `backdrop-blur-sm` (not needed without opacity)

### Next Steps

If navbar still not visible after these fixes:
1. Check browser console for errors
2. Verify DynamicAppShell is wrapping pages correctly
3. Test with a simple hardcoded header to isolate the issue
4. Check if there's a global CSS rule hiding it
