# VS Code ESLint Setup Complete ✅

## What Was Configured

### ✅ ESLint Extension Installed
- **Extension**: `dbaeumer.vscode-eslint`
- **Status**: Installed and enabled

### ✅ Workspace Settings (`.vscode/settings.json`)

**Auto-fix on save enabled:**
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  }
}
```

This means:
- ✅ ESLint errors will be **automatically fixed** when you save a file
- ✅ Red squiggly lines appear under errors in real-time
- ✅ Quick fixes available with `Cmd+.` (Mac) or `Ctrl+.` (Windows)

### ✅ Recommended Extensions (`.vscode/extensions.json`)

Essential:
- ✅ `dbaeumer.vscode-eslint` - ESLint integration
- ✅ `ms-azuretools.vscode-bicep` - Bicep language support
- ✅ `ms-azuretools.vscode-azurefunctions` - Azure Functions tools

Optional but recommended:
- `esbenp.prettier-vscode` - Code formatter
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense
- `ms-python.python` - Python language support

## How It Works Now

### Before (Without ESLint Extension):
```
1. Write code with error
2. Save file
3. Commit to Git
4. Push to GitHub
5. ❌ GitHub Action fails with ESLint error
6. Fix the error
7. Commit again
```

### After (With ESLint Extension):
```
1. Write code
2. 🔴 See error immediately (red squiggly line)
3. Save file
4. ✅ Error auto-fixed!
5. Commit to Git
6. ✅ GitHub Action passes
```

## Example: The Apostrophe Error

**What you'll see now:**

When you type:
```tsx
<h1>Vincent's Blog</h1>
```

ESLint will show:
- 🔴 Red underline under the apostrophe
- 💡 Hover to see: "`'` can be escaped with `&apos;`"
- 💾 Save → Auto-fixed to: `Vincent&apos;s Blog`

## Quick Fixes Available

### Manual Fix:
1. Hover over the error
2. Click the lightbulb 💡 or press `Cmd+.`
3. Select "Fix this react/no-unescaped-entities problem"

### Auto Fix:
1. Just save the file (`Cmd+S`)
2. ESLint fixes it automatically ✨

## Testing the Setup

### Test 1: Intentional Error
1. Open `src/web/src/app/page.tsx`
2. Change `Vincent&apos;s Blog` to `Vincent's Blog`
3. You should see: 🔴 Red underline immediately
4. Save the file
5. It should auto-fix back to `&apos;s`

### Test 2: Check ESLint Output
1. Open VS Code Output panel: `View` → `Output`
2. Select "ESLint" from the dropdown
3. You should see: `ESLint server is running`

## Common ESLint Rules You'll See

### 1. `react/no-unescaped-entities`
**Error:** Unescaped apostrophe or quote in JSX
**Fix:** Use `&apos;` `&quot;` etc.

### 2. `@typescript-eslint/no-unused-vars`
**Error:** Variable declared but never used
**Fix:** Remove the variable or prefix with `_`

### 3. `@next/next/no-img-element`
**Error:** Using `<img>` instead of Next.js `<Image>`
**Fix:** Import and use `next/image`

### 4. `react-hooks/exhaustive-deps`
**Warning:** Missing dependency in useEffect
**Fix:** Add the dependency or disable the rule

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Quick Fix | `Cmd+.` | `Ctrl+.` |
| Save (Auto-fix) | `Cmd+S` | `Ctrl+S` |
| Show Problems | `Cmd+Shift+M` | `Ctrl+Shift+M` |
| Format Document | `Shift+Option+F` | `Shift+Alt+F` |

## Troubleshooting

### ESLint Not Working?

1. **Check ESLint Server:**
   - Open Output panel: `View` → `Output`
   - Select "ESLint" from dropdown
   - Should say: `ESLint server is running`

2. **Restart ESLint Server:**
   - Open Command Palette: `Cmd+Shift+P`
   - Type: `ESLint: Restart ESLint Server`

3. **Check File Type:**
   - ESLint only works on `.js`, `.jsx`, `.ts`, `.tsx` files
   - Check bottom-right of VS Code shows correct language

### Still Not Seeing Errors?

```bash
# Verify ESLint works from command line
cd src/web
npm run lint
```

If this shows errors but VS Code doesn't:
1. Reload VS Code: `Cmd+Shift+P` → `Developer: Reload Window`
2. Check ESLint extension is enabled: Extensions panel → ESLint → Should not say "Disabled"

## Configuration Files

### Project ESLint Config
- **File**: `src/web/eslint.config.mjs`
- **Extends**: Next.js default config
- **Rules**: See the file for all active rules

### VS Code Settings
- **File**: `.vscode/settings.json`
- **Shared**: Committed to Git (team uses same settings)
- **Personal**: Add to `.vscode/settings.local.json` (ignored by Git)

## Benefits

✅ **Catch errors before commit**  
✅ **Auto-fix on save**  
✅ **Consistent code style**  
✅ **Faster development**  
✅ **No more failed CI/CD builds due to linting**  

## What's Tracked in Git

```
.vscode/
├── settings.json     ✅ Tracked (team settings)
├── extensions.json   ✅ Tracked (recommended extensions)
└── settings.local.json  ❌ Not tracked (personal overrides)
```

This way:
- ✅ Team shares same ESLint configuration
- ✅ Everyone gets auto-fix on save
- ✅ Consistent development experience
- ✅ Personal preferences can still be customized

---

**Setup Complete!** 🎉

ESLint will now help you catch errors as you type and auto-fix them when you save.

Try it now: Open `src/web/src/app/page.tsx` and see if you spot any errors!
