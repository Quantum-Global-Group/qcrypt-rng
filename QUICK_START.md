# QCrypt RNG - Quick Start Guide

## For Non-Technical Users

### Getting Started

1. **Visit the Platform**
   - Go to the QCrypt RNG website
   - You'll see a welcome page with two options

2. **Choose Your Experience**
   - **Simple Mode** ← Choose this for guided wizards
   - Developer Mode - Full features for developers

3. **Complete Onboarding** (First Time Only)
   - A friendly wizard will introduce you to the platform
   - Click "Next" to proceed through steps
   - Select your preferred mode
   - Click "Get Started"

### Common Tasks

#### Generate a Secure Password
1. Click "Generate Random Data" from the Simple Mode home
2. Select "Password" from the purpose options
3. Adjust length and options as needed
4. Click "Generate"
5. Copy or download your password

#### Encrypt a File
1. Click "Encrypt/Decrypt" from the Simple Mode home
2. Select "Encrypt"
3. Upload your file or paste text
4. Set a strong password (remember it!)
5. Click "Process"
6. Download the encrypted file

#### Create Quantum-Safe Keys
1. Click "Create PQC Keys"
2. Follow the guided wizard
3. Export your keys for use

### Tips
- You can switch modes anytime using the toggle in the top right
- Your recent actions are saved (last 5 shown on home)
- All operations happen in your browser - data is never sent to servers
- Use the Settings page to manage preferences

---

## For Developers

### Quick API Access

The platform provides comprehensive REST APIs under `/api/v2`:

```bash
# Generate random bytes
curl -X POST http://localhost:9878/api/v2/generate/bytes \
  -H "Content-Type: application/json" \
  -d '{"num_bytes": 32}'

# Generate a password
curl -X POST http://localhost:9878/api/v2/generate/password \
  -H "Content-Type: application/json" \
  -d '{"length": 16, "include_symbols": true}'

# Generate PQC keys
curl -X POST http://localhost:9878/api/v2/pqc/generate \
  -H "Content-Type: application/json" \
  -d '{"algorithm": "dilithium3"}'
```

### API Documentation
- Interactive Swagger UI: `/docs`
- ReDoc: `/redoc`
- Custom docs: `/docs` (in-app)

### TypeScript Client

The platform includes a TypeScript API client:
```typescript
import { generateBytes, generateKey } from '@/utils/api';

const bytes = await generateBytes(32);
const key = await generateKey(32);
```

### User Mode Integration

Access user mode in your components:
```typescript
import { useUserMode } from '@/contexts/UserModeContext';

function MyComponent() {
  const { mode, isSimple, isDeveloper, setMode } = useUserMode();
  
  if (isSimple) {
    // Show simplified UI
  }
  
  return <button onClick={() => setMode('developer')}>Switch Mode</button>;
}
```

### Adding Custom Wizards

1. Create wizard component
2. Use step-based UI pattern
3. Track actions with `addToHistory()`
4. Add to navigation

Example:
```typescript
import { addToHistory } from '@/utils/userPreferences';

async function handleAction() {
  const result = await doSomething();
  addToHistory('Completed action', { details });
  return result;
}
```

### Guided Tours

Add tours to your pages:
```typescript
import { GuidedTour } from '@/components/tours/GuidedTour';

function MyPage() {
  return (
    <GuidedTour
      tourId="my-feature"
      steps={[
        {
          target: '[data-tour="my-element"]',
          title: 'Feature Name',
          description: 'Description of what this does',
          placement: 'bottom',
        }
      ]}
    >
      <div data-tour="my-element">Your content</div>
    </GuidedTour>
  );
}
```

---

## Troubleshooting

### Mode Not Persisting
- Check browser console for localStorage errors
- Ensure cookies/storage aren't blocked
- Try clearing localStorage and starting fresh

### Wizards Not Working
- Check browser console for errors
- Verify API backend is running
- Check network requests in DevTools

### Tours Not Showing
- Check if tour is already completed (check localStorage)
- Verify `data-tour` attributes match tour definitions
- Reset tour: `resetTour('tourId')` in console

### Need Help?
- Check `/docs` for API documentation
- Review `USER_FLOW.md` for architecture details
- Check browser console for errors
- Contact support with specific error messages

---

## Keyboard Shortcuts (Developer Mode)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Quick command palette (coming soon) |
| `Ctrl+/` | Show keyboard shortcuts |
| `Esc` | Close modals/tours |

---

## Security Notes

- All cryptographic operations happen client-side
- Passwords are never transmitted or stored
- Keys are generated using quantum entropy sources
- Encrypted data can only be decrypted with the correct password
- Post-quantum algorithms protect against future quantum attacks

---

## Next Steps

### Non-Technical Users
1. Try generating a password
2. Encrypt a test file
3. Explore the different tools
4. Check your action history

### Developers
1. Review the API documentation
2. Try the PQC suite
3. Set up blockchain oracle
4. Integrate with your application using the TypeScript client

---

**Enjoy using QCrypt RNG!** 🔐
