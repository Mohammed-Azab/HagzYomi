# Configuration Management and Git Persistence

## Current Behavior

When the super admin updates configuration through the admin panel:

1. **Local Changes**: Configuration is saved to `src/config/config.json` on the server
2. **Git Status**: These changes are NOT automatically committed to Git
3. **Deployment Risk**: If you push new code from your local machine, it will overwrite the live configuration

## The Problem

```
Local Machine (your development) ----push----> Live Server (Render/Production)
     config.json                                   config.json (gets overwritten!)
     (your version)                                (admin's changes lost)
```

## Solutions

### Option 1: Environment-Based Configuration (Recommended)
Store sensitive settings as environment variables and only use config.json for non-critical settings.

### Option 2: Database Configuration
Store configuration in the database instead of a file.

### Option 3: Git Auto-Commit (Simple but risky)
Automatically commit config changes on the server.

### Option 4: Configuration Separation
Split config into:
- `config.base.json` (committed to Git, read-only)
- `config.override.json` (local overrides, not in Git)

## Recommended Implementation

Let's implement **Option 4** - Configuration Separation:

1. **config.base.json** - Default configuration (committed to Git)
2. **config.override.json** - Admin overrides (ignored by Git, persistent on server)
3. **Final config** = merge(base, override)

This way:
- Your development changes go to `config.base.json`
- Admin changes go to `config.override.json`
- Both are preserved during deployments

## Current Status

- ✅ Super admin can edit pricing configuration
- ✅ Configuration saves to correct file location
- ⚠️ Config changes will be lost on Git push (needs solution above)

## Next Steps

Choose which solution you prefer and I'll implement it!
