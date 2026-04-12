# QCrypt RNG - Consolidated Routing Architecture

## Overview

The QCrypt RNG platform uses a **unified layout architecture** where all routes are wrapped by `DynamicAppShell`, which automatically displays the appropriate sidebar based on the user's selected mode (Simple or Developer).

## Architecture Principles

### ✅ Single Layout System
- **All routes** use `DynamicAppShell`
- **Mode determines UI**, not route group
- **Consistent navigation** across all pages
- **No route duplication**

### ✅ Mode-Aware Navigation
- **Simple Mode**: Shows `SimpleModeSideNav` (5 items)
- **Developer Mode**: Shows `SideNav` (full navigation)
- **Mode toggle** always available in top navbar
- **Visual indicators** show current mode

### ✅ Cross-Mode Compatibility
- Users can access any route regardless of mode
- Layout adapts to user's mode preference
- No broken links or 404s between modes

---

## Route Map

### Route Groups

| Group | URL Prefix | Purpose |
|-------|------------|---------|
| `(landing)` | `/` | Landing page with mode selection |
| `(app)` | All routes | Developer mode pages (also serves simple mode) |
| `(simple)` | `/simple`, `/wizard/*` | Simple mode specific pages |

### All Routes

#### Landing
| URL | Purpose | Layout |
|-----|---------|--------|
| `/` | Mode selection & onboarding | Standalone (no shell) |

#### Simple Mode Pages
| URL | Purpose | Sidebar Item |
|-----|---------|--------------|
| `/simple` | Simple mode home | Home |
| `/wizard/random` | Random generation wizard | Generate Random Data |
| `/wizard/encrypt` | Encryption wizard | Encrypt/Decrypt |

#### Developer Mode Pages
| URL | Purpose | Section |
|-----|---------|---------|
| `/dashboard` | Main dashboard | Generate → Home |
| `/oracle/request` | Request randomness | Generate → Request |
| `/pqc` | PQC Suite workspace | Protect → Workspace |
| `/pqc/keys` | Key generation | Protect → Keys |
| `/pqc/kem` | Kyber KEM | Protect → KEM |
| `/fulfillment` | On-chain fulfillment | Deliver |
| `/settings` | Settings (all modes) | Settings |
| `/docs` | Documentation | Learn |
| `/docs/api` | API reference | Footer |

#### Research/Lab Pages
| URL | Purpose | Section |
|-----|---------|---------|
| `/research/qrng` | QRNG Engine | Lab → RNG |
| `/research/entropy` | Entropy analysis | Lab → Entropy |
| `/research/vrf` | VRF & commitment | Lab → VRF |
| `/research/notebook` | Experiment log | Lab → Notebook |
| `/research/datasets` | Datasets export | Lab → Datasets |
| `/research/refs` | References | Lab → Refs |
| `/research/oracle` | Oracle lab | Deliver → Oracle |
| `/research/pqc/kem` | ML-KEM research | Protect → Research |
| `/research/pqc/signatures` | Signature schemes | Protect → Research |
| `/research/pqc/hybrid` | Hybrid PQC | Protect → Research |
| `/research/pqc/benchmarks` | PQC benchmarks | Protect → Research |

#### Redirect Routes
| URL | Redirects To | Purpose |
|-----|--------------|---------|
| `/oracle` | `/oracle/request` | Shell route |
| `/research` | `/research/qrng` | Shell route |
| `/research/oracle/request` | `/research/oracle?tab=request` | Tab redirect |
| `/research/oracle/proofs` | `/research/oracle?tab=proofs` | Tab redirect |

---

## Layout Hierarchy

```
Root Layout (app/layout.tsx)
  └── <Providers> (UserModeProvider)
        │
        ├── (landing)/layout.tsx → {children} (standalone)
        │     └── / → LandingPage (custom full-page layout)
        │
        ├── (app)/layout.tsx → <DynamicAppShell>
        │     └── All developer pages
        │
        └── (simple)/layout.tsx → <DynamicAppShell>
              └── /simple, /wizard/* (content only, no custom layout)
```

### DynamicAppShell Logic

```typescript
if (isSimple) {
  return TopNavbar + SimpleModeSideNav + children
} else {
  return TopNavbar + SideNav + children
}
```

---

## Navigation Structure

### Simple Mode Sidebar (5 items)

```
┌─ QCrypt (Simple Mode badge)
├─ Home
├─ Generate Random Data
├─ Encrypt/Decrypt
├─ Create PQC Keys
├─ Settings
└─ [Switch to Developer Mode] (button)
```

### Developer Mode Sidebar (full navigation)

```
┌─ QCrypt
├─ Generate
│  ├─ Overview
│  └─ Request Randomness
├─ Protect
│  ├─ Workspace
│  ├─ Key Generation
│  ├─ Kyber KEM
│  └─ Research (ML-KEM, Signatures, Hybrid, Benchmarks)
├─ Deliver
│  ├─ Fulfillment
│  └─ Oracle Lab
├─ Lab
│  ├─ RNG & VRF (QRNG, Entropy, VRF)
│  └─ Lab Data (Notebook, Datasets, Refs)
└─ Learn
   └─ Documentation
   
Footer: Settings | API Reference
```

---

## Mode Switching

### How Users Switch Modes

1. **Top Navbar Toggle** (all pages)
   - Click Simple/Developer toggle in navbar
   - Instant switch, stays on current page

2. **Simple Sidebar Footer**
   - Click "Switch to Developer Mode" button
   - Calls `setMode('developer')` + navigates to `/dashboard`

3. **Settings Page**
   - User Preferences tab
   - Large mode selector with feature comparison
   - Instant apply

### Mode Persistence

- Stored in `localStorage` as `qcrypt_user_mode`
- Defaults to `'developer'` if not set
- Survives page reloads and sessions

---

## Visual Indicators

### Top Navbar (all pages)

```
[Logo] QCrypt | Dashboard    [⚡ Simple] [Simple/Dev toggle] [NODE_01] [API Connected]
                               ↑
                          Mode badge
                          (emerald for Simple, blue for Developer)
```

### Simple Mode Sidebar

```
┌─────────────────────┐
│ ● QCrypt            │
│ [Simple Mode]       │ ← Green badge
├─────────────────────┤
│ 🏠 Home             │
│ ⚡ Generate Data     │
│ 🔒 Encrypt/Decrypt  │
│ 🔑 Create PQC Keys  │
│ ⚙️ Settings         │
├─────────────────────┤
│ 💡 Quick Tip        │
│ (help text)         │
├─────────────────────┤
│ [Switch to Dev Mode]│ ← Button
└─────────────────────┘
```

---

## Key Files

### Layout Files
- `src/app/layout.tsx` - Root layout with Providers
- `src/app/(landing)/layout.tsx` - Pass-through for landing
- `src/app/(app)/layout.tsx` - DynamicAppShell wrapper
- `src/app/(simple)/layout.tsx` - DynamicAppShell wrapper

### Navigation Components
- `src/components/layout/DynamicAppShell.tsx` - Mode-aware layout router
- `src/components/layout/SimpleModeSideNav.tsx` - Simple mode sidebar
- `src/components/layout/SideNav.tsx` - Developer mode sidebar
- `src/components/layout/TopNavbar.tsx` - Top navbar with mode badge + toggle

### Mode Management
- `src/contexts/UserModeContext.tsx` - Mode state management
- `src/components/settings/UserModeToggle.tsx` - Toggle component

### Page Files
- `src/app/(landing)/page.tsx` - Landing page
- `src/app/(simple)/simple/page.tsx` - Simple home (content only)
- `src/app/(simple)/wizard/random/page.tsx` - Random wizard (content only)
- `src/app/(simple)/wizard/encrypt/page.tsx` - Encryption wizard (content only)

---

## Navigation Links Audit

### ✅ All Links Verified

| From | Links To | Status |
|------|----------|--------|
| Landing page | `/simple`, `/dashboard` | ✅ Works |
| Simple sidebar | `/simple`, `/wizard/random`, `/wizard/encrypt`, `/pqc/keys`, `/settings` | ✅ Works |
| Developer sidebar | All developer routes | ✅ Works |
| Top navbar logo | `/dashboard` | ✅ Works |
| Settings link | `/settings` | ✅ Works |
| Breadcrumbs | Section homepages | ✅ Works |

### ❌ Fixed Issues

- ~~`/protect`~~ - **REMOVED** (was broken, now gone)
- ~~Standalone wizard layouts~~ - **FIXED** (now use DynamicAppShell)
- ~~Confusing "Switch Mode" link~~ - **FIXED** (now uses context + direct navigation)

---

## User Flows

### First-Time Simple User

```
1. Visit /
2. See landing page with mode cards
3. Select "Simple Mode"
4. Redirected to /simple
5. See SimpleModeSideNav + tool cards
6. Click "Generate Random Data"
7. Wizard loads in same layout
8. Complete wizard
9. Mode badge shows "Simple" in navbar
```

### First-Time Developer User

```
1. Visit /
2. See landing page
3. Select "Developer Mode"
4. Redirected to /dashboard
5. See full SideNav + dashboard
6. Access all features
7. Mode badge shows "Developer" in navbar
```

### Switching Modes

```
Any page → Click mode toggle in navbar → Instant switch
  - Simple → Developer: Shows full sidebar
  - Developer → Simple: Shows simple sidebar
  - Stays on current page if it exists in both modes
  - Or navigates to appropriate page
```

---

## Best Practices

### Adding New Routes

1. **Determine if route is simple, developer, or both**
2. **Add to appropriate route group** (`(simple)` or `(app)`)
3. **Page should ONLY render content** (no custom layout)
4. **DynamicAppShell handles the rest**

### Adding New Navigation Items

1. **Simple mode**: Add to `SIMPLE_NAV` array in `SimpleModeSideNav.tsx`
2. **Developer mode**: Add to appropriate section in `SideNav.tsx`
3. **Update `PAGE_TITLES` in `TopNavbar.tsx`** for breadcrumb
4. **Update `getBreadcrumb` function** if new section

### Mode-Specific Features

```typescript
import { useUserMode } from '@/contexts/UserModeContext';

function MyComponent() {
  const { isSimple, isDeveloper } = useUserMode();
  
  if (isSimple) {
    return <SimpleFeature />;
  }
  
  return <DeveloperFeature />;
}
```

---

## Testing Checklist

- [x] Build succeeds (31 routes)
- [x] All routes accessible
- [x] No broken links
- [x] Simple mode shows correct sidebar
- [x] Developer mode shows correct sidebar
- [x] Mode toggle works
- [x] Mode persists across reloads
- [x] Mode badge visible in navbar
- [x] Simple sidebar "Switch Mode" button works
- [ ] Manual testing of all user flows
- [ ] Mobile responsiveness testing

---

## Future Enhancements

- [ ] Add middleware for mode-based redirects (optional)
- [ ] Add welcome tour for new routes
- [ ] Improve mobile navigation for both modes
- [ ] Add keyboard shortcuts for mode switching
- [ ] Consider adding `/protect` page if needed
- [ ] Add analytics to track mode usage

---

## Troubleshooting

### Issue: User sees wrong sidebar
**Solution**: Check `localStorage.qcrypt_user_mode` and refresh

### Issue: Mode toggle not working
**Solution**: Verify `UserModeProvider` is in root layout

### Issue: Page has double layout
**Solution**: Remove custom layout from page, let DynamicAppShell handle it

### Issue: Broken link to non-existent route
**Solution**: Either create the route or update the link target

---

**Last Updated**: 2026-04-12
**Architecture**: Unified Layout (Option A)
**Total Routes**: 31
**Build Status**: ✅ Successful
