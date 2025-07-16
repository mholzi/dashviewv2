# Release Notes - Dashview V2 v0.2.7

## 🔧 Bug Fixes

### Panel Loading Fix
- **Fixed empty panel display issue**: Implemented function-based panel entry for Home Assistant compatibility
- **Resolved webpack tree-shaking problems**: Created `panel-entry.ts` with proper default export
- **Improved panel instantiation**: Panel now correctly creates and displays the dashboard element
- **Enhanced error handling**: Added comprehensive logging and error reporting for debugging

## 🚀 Technical Improvements

### Frontend Architecture
- **New panel entry approach**: Function-based panel creation instead of class-based
- **Webpack configuration update**: Added `libraryExport: 'default'` for proper module export
- **Enhanced container styling**: Improved panel layout and element management
- **Better element registration**: Verification of custom element registration

### Developer Experience
- **Improved logging**: Added detailed logging for panel creation and initialization
- **Error handlers**: Global error and unhandled rejection handlers for debugging
- **Version tracking**: Updated version to 0.2.7 across all components

## 🎯 What's Fixed

This release addresses the primary issue where the Dashview V2 panel appeared empty in Home Assistant. The root cause was that the panel class was being tree-shaken out of the webpack bundle, leaving only the export declaration without the actual implementation.

## 📋 Installation Notes

- This release is fully compatible with Home Assistant 2025.7+
- The panel should now display the welcome screen with home statistics
- Users experiencing empty panels should see content after this update

## 🔍 For Developers

The key changes involve:
- Function-based panel creation: `createDashviewPanel(hass, narrow, route, panel)`
- Proper webpack UMD export with default library export
- Enhanced container and element management
- Comprehensive error handling and logging

---

*This release focuses on fixing the core panel display issue that prevented users from seeing dashboard content.*