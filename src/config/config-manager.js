/**
 * Enhanced Configuration Management System
 * Solves Git persistence issue with layered configuration approach
 */

const fs = require('fs');
const path = require('path');

// Configuration file paths
const BASE_CONFIG_PATH = path.join(__dirname, '../config/config.base.json');
const OVERRIDE_CONFIG_PATH = path.join(__dirname, '../config/config.override.json');
const LEGACY_CONFIG_PATH = path.join(__dirname, '../config/config.json');

/**
 * Load configuration with layering support
 * Priority: override.json > base.json > legacy config.json
 */
function loadConfig() {
    let baseConfig = {};
    let overrideConfig = {};
    
    try {
        // 1. Try to load base configuration (committed to Git)
        if (fs.existsSync(BASE_CONFIG_PATH)) {
            const baseFile = fs.readFileSync(BASE_CONFIG_PATH, 'utf8');
            baseConfig = JSON.parse(baseFile);
            console.log('✅ Base configuration loaded');
        }
        // 2. Fallback to legacy config.json
        else if (fs.existsSync(LEGACY_CONFIG_PATH)) {
            const legacyFile = fs.readFileSync(LEGACY_CONFIG_PATH, 'utf8');
            baseConfig = JSON.parse(legacyFile);
            console.log('✅ Legacy configuration loaded (consider migrating to layered system)');
        }
        
        // 3. Load admin overrides (not committed to Git, persistent on server)
        if (fs.existsSync(OVERRIDE_CONFIG_PATH)) {
            const overrideFile = fs.readFileSync(OVERRIDE_CONFIG_PATH, 'utf8');
            overrideConfig = JSON.parse(overrideFile);
            console.log('✅ Admin configuration overrides loaded');
        }
        
        // 4. Merge configurations (override takes precedence)
        const finalConfig = deepMerge(baseConfig, overrideConfig);
        
        console.log('🔧 Configuration system:', {
            hasBase: fs.existsSync(BASE_CONFIG_PATH),
            hasOverrides: fs.existsSync(OVERRIDE_CONFIG_PATH),
            hasLegacy: fs.existsSync(LEGACY_CONFIG_PATH)
        });
        
        return finalConfig;
        
    } catch (error) {
        console.error('❌ Error loading configuration:', error.message);
        throw error;
    }
}

/**
 * Save admin configuration changes to override file
 * This preserves changes during Git deployments
 */
function saveAdminConfig(newConfig) {
    try {
        // Remove sensitive fields before saving
        const configToSave = { ...newConfig };
        delete configToSave.adminPassword;
        delete configToSave.superAdminPassword;
        
        // Save to override file (not tracked by Git)
        fs.writeFileSync(OVERRIDE_CONFIG_PATH, JSON.stringify(configToSave, null, 2));
        
        console.log('✅ Admin configuration saved to override file');
        console.log('📌 Changes will persist through Git deployments');
        
        return true;
    } catch (error) {
        console.error('❌ Error saving admin config:', error);
        throw error;
    }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const output = { ...target };
    
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }
    
    return output;
}

function isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Initialize configuration system
 * Creates .gitignore entry for override file
 */
function initConfigSystem() {
    // Ensure config.override.json is ignored by Git
    const gitignorePath = path.join(__dirname, '../../.gitignore');
    const overrideEntry = 'src/config/config.override.json';
    
    try {
        let gitignoreContent = '';
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
        }
        
        if (!gitignoreContent.includes(overrideEntry)) {
            gitignoreContent += `\n# Admin configuration overrides (persistent on server)\n${overrideEntry}\n`;
            fs.writeFileSync(gitignorePath, gitignoreContent);
            console.log('✅ Added config.override.json to .gitignore');
        }
    } catch (error) {
        console.warn('⚠️ Could not update .gitignore:', error.message);
    }
}

module.exports = {
    loadConfig,
    saveAdminConfig,
    initConfigSystem
};
