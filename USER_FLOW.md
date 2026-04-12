# QCrypt RNG - User Flow Documentation

## Overview

This document describes the user flow architecture for the QCrypt RNG platform, designed to serve both technical and non-technical users through a dual-mode experience.

## Architecture

### Dual-Mode System

The platform operates in two modes:

1. **Simple Mode** - For non-technical users
   - Guided wizards with step-by-step instructions
   - Plain language explanations (no jargon)
   - One-click operations
   - Simplified navigation

2. **Developer Mode** - For technical users
   - Full access to all features
   - API endpoints and documentation
   - Advanced configuration options
   - Complete PQC suite and blockchain oracles

### User Journey

```
First Visit
    ↓
Landing Page (mode selection)
    ↓
Onboarding Wizard (optional)
    ↓
Mode Selection (Simple/Developer)
    ↓
Feature-Specific Wizards (Simple) OR Full Dashboard (Developer)
    ↓
Action History & Persistence
```

## Key Components

### 1. Landing Page (`/`)
**Location**: `quantum-oracle-ui/src/app/(landing)/page.tsx`

**Features**:
- Welcome message and platform overview
- Two mode selection cards (Simple/Developer)
- Quick action links to common tools
- GitHub and documentation links

**User Experience**:
- Clean, non-intimidating interface
- Clear value propositions for each mode
- Option to skip directly to dashboard

### 2. Onboarding Wizard
**Location**: `quantum-oracle-ui/src/components/onboarding/OnboardingWizard.tsx`

**Features**:
- 3-step introduction to the platform
- Explains core capabilities
- Helps users choose their mode
- Shows only on first visit (stored in localStorage)

**Steps**:
1. Welcome & platform overview
2. Core features explanation
3. Mode selection with feature comparison

### 3. User Mode Context
**Location**: `quantum-oracle-ui/src/contexts/UserModeContext.tsx`

**Features**:
- React context for managing user mode
- Persists mode selection in localStorage
- Provides `isSimple` and `isDeveloper` flags
- Available throughout the app via `useUserMode()` hook

### 4. Mode Toggle
**Location**: `quantum-oracle-ui/src/components/settings/UserModeToggle.tsx`

**Features**:
- Visible in top navbar (developer mode)
- Also available in Settings page
- Instant mode switching
- Visual indicator of current mode

### 5. Dynamic App Shell
**Location**: `quantum-oracle-ui/src/components/layout/DynamicAppShell.tsx`

**Features**:
- Switches between Simple and Developer layouts
- Simple mode: Simplified sidebar with wizard links
- Developer mode: Full navigation with all features

### 6. Wizard Components

#### Random Generation Wizard
**Location**: `quantum-oracle-ui/src/components/wizards/RandomGenerationWizard.tsx`

**Steps**:
1. Choose Purpose (password, key, UUID, token, bytes)
2. Configure Options (length, character sets, etc.)
3. Generate (with loading state)
4. Results (copy, download, generate another)

**Features**:
- Step-by-step progression
- Visual progress indicator
- Copy and download functionality
- Action history tracking

#### Encryption Wizard
**Location**: `quantum-oracle-ui/src/components/wizards/EncryptionWizard.tsx`

**Steps**:
1. Choose Operation (encrypt/decrypt)
2. Enter Data (text input or file upload)
3. Set Password (with strength indicator)
4. Process (encrypt/decrypt)
5. Results (copy, download, start over)

**Features**:
- Password strength meter
- File upload support
- Clear visual feedback
- Security warnings

### 7. Guided Tour System
**Location**: `quantum-oracle-ui/src/components/tours/`

**Components**:
- `GuidedTour.tsx` - Core tour component
- `TourDefinitions.ts` - Predefined tour steps

**Available Tours**:
- Dashboard tour (entropy panel, quick links, PQC suite)
- Random generation tour
- Encryption tour
- PQC suite tour

**Features**:
- Step-by-step explanations
- Highlights target elements
- Progress tracking
- Skip option
- Completion stored in localStorage

### 8. User Preferences & History
**Location**: `quantum-oracle-ui/src/utils/userPreferences.ts`

**Features**:
- localStorage-based persistence
- User preferences (mode, theme, language)
- Action history (last 50 actions)
- Recent actions (last 5 for quick display)
- Onboarding status tracking

**Functions**:
```typescript
getPreferences()
savePreferences(prefs)
addToHistory(action, details)
getHistory()
clearHistory()
getUserMode()
setUserMode(mode)
hasCompletedOnboarding()
completeOnboarding()
hasVisited()
markVisited()
```

## Navigation Structure

### Simple Mode Navigation
```
Home (/simple)
├─ Generate Random Data (/wizard/random)
├─ Encrypt/Decrypt (/wizard/encrypt)
├─ Create PQC Keys (/pqc/keys)
└─ Settings (/settings)
```

### Developer Mode Navigation
```
Dashboard (/dashboard)
├─ Generate
│  ├─ Overview
│  └─ Request Randomness
├─ Protect
│  ├─ PQC Suite
│  ├─ Key Generation
│  └─ Kyber KEM
├─ Deliver
│  └─ Fulfillment
├─ Lab
│  ├─ RNG & VRF
│  └─ Lab Data
├─ Learn
│  └─ Documentation
└─ Settings
```

## Data Flow

### First-Time User Flow

1. **User visits platform**
   - Check `localStorage` for `qcrypt_has_visited`
   - If false → show onboarding wizard
   - Mark as visited

2. **Onboarding wizard**
   - 3-step introduction
   - User selects mode (simple/developer)
   - Store in `qcrypt_user_mode`
   - Mark `qcrypt_onboarding_complete`

3. **Redirect based on mode**
   - Simple → `/simple`
   - Developer → `/dashboard`

### Returning User Flow

1. **User visits platform**
   - Check `qcrypt_user_mode`
   - If exists → redirect to appropriate page
   - If not → show landing page

2. **Mode switching**
   - User can switch anytime via top navbar toggle
   - Switching updates `qcrypt_user_mode`
   - Layout updates immediately

### Action Tracking

Every wizard action is tracked:
```typescript
addToHistory('Generated password (16 chars)', { type: 'password' });
```

Stored in:
- `qcrypt_history` - Full history (50 entries)
- `qcrypt_recent_actions` - Last 5 actions (for display)

## localStorage Keys

| Key | Type | Description |
|-----|------|-------------|
| `qcrypt_preferences` | Object | User preferences (mode, theme, language) |
| `qcrypt_user_mode` | String | Current mode: 'simple' or 'developer' |
| `qcrypt_history` | Array | Full action history (50 entries) |
| `qcrypt_recent_actions` | Array | Recent actions (5 entries) |
| `qcrypt_onboarding_complete` | Boolean | Onboarding status |
| `qcrypt_has_visited` | Boolean | First visit tracking |
| `qcrypt_tour_complete_{id}` | Boolean | Tour completion status per tour |
| `qcrypt_tour_skipped_{id}` | Boolean | Tour skip status per tour |

## Customization

### Adding New Wizards

1. Create wizard component in `quantum-oracle-ui/src/components/wizards/`
2. Implement step-based UI
3. Add tracking with `addToHistory()`
4. Create page in `quantum-oracle-ui/src/app/(simple)/wizard/`
5. Add to SimpleModeSideNav

### Adding New Tours

1. Define tour steps in `TourDefinitions.ts`
2. Each step needs: `target`, `title`, `description`, `placement`
3. Add `<GuidedTour>` component to page
4. Add `data-tour` attributes to target elements

### Extending User Preferences

1. Update `UserPreferences` type in `userPreferences.ts`
2. Add getter/setter functions
3. Update components that use preferences

## Best Practices

### For Non-Technical Users
- Always use wizards for common tasks
- Show clear progress indicators
- Provide copy/download options
- Use plain language (avoid jargon)
- Include helpful tooltips and explanations

### For Technical Users
- Provide direct API access
- Show code examples
- Allow advanced configuration
- Link to documentation
- Maintain backward compatibility

### General
- Always track user actions in history
- Respect user mode preferences
- Make mode switching easy and visible
- Use tours to introduce new features
- Test both modes thoroughly

## Future Enhancements

- [ ] User accounts with cloud sync
- [ ] API key management UI
- [ ] Export/import history
- [ ] More wizard types (signing, verification, etc.)
- [ ] Mobile-responsive improvements for wizards
- [ ] Multi-language support
- [ ] Theme customization (light/dark)
- [ ] Collaborative features (share encrypted files)
- [ ] Integration guides for popular frameworks
- [ ] Video tutorials

## Testing Checklist

- [ ] First visit shows onboarding
- [ ] Mode selection works and persists
- [ ] Wizards track history correctly
- [ ] Mode toggle visible in navbar
- [ ] Simple mode shows simplified nav
- [ ] Developer mode shows full nav
- [ ] Tours can be skipped and resumed
- [ ] Copy/download functions work
- [ ] File upload works in encryption wizard
- [ ] Password strength indicator accurate
- [ ] localStorage doesn't exceed limits
- [ ] Mode switching is instant
- [ ] Landing page redirects correctly

## Support

For questions or issues with the user flow implementation:
- Check the code comments in each component
- Review the localStorage keys for debugging
- Test both modes thoroughly
- Verify tour targeting with data-tour attributes
