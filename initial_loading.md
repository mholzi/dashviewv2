# Initial Loading Investigation - Dashview V2 Empty Panel Issue

## Problem Statement
The Dashview V2 panel displays an empty screen in Home Assistant despite successful installation and the dashview-v2-panel.js file being loaded. Multiple attempts to fix the panel loading mechanism have not resolved the issue.

## Current State
- **Version**: 0.2.7
- **Installation Method**: HACS
- **Symptom**: Empty panel with no content displayed
- **JS File**: dashview-v2-panel.js loads but doesn't render content
- **Browser Console**: No specific errors related to Dashview V2 panel loading

## Research Areas

### 1. HACS Integration Documentation
- **URL**: https://developers.home-assistant.io/docs/creating_integration_manifest/
- **Focus Areas**:
  - Frontend integration requirements
  - Proper panel registration in HACS
  - Frontend static file serving
  - Integration manifest configuration for frontend components

### 2. Home Assistant Frontend Development
- **URL**: https://developers.home-assistant.io/docs/frontend/
- **Key Topics**:
  - Custom panel development
  - Panel registration and lifecycle
  - Module loading patterns
  - Web component registration
  - Static resource handling

### 3. Home Assistant Community Forum
- **URL**: https://community.home-assistant.io/
- **Search Topics**:
  - "custom panel empty"
  - "HACS frontend integration"
  - "panel not loading"
  - "custom component panel blank"
  - Similar integration issues and solutions

### 4. HACS Developer Documentation
- **URL**: https://hacs.xyz/docs/developer/
- **Investigation Points**:
  - Frontend repository structure
  - JavaScript/TypeScript integration requirements
  - Panel registration best practices
  - Common pitfalls and solutions

## Technical Investigation Checklist

### Browser Debugging
- [ ] Check browser developer console for errors
- [ ] Verify dashview-v2-panel.js is loaded in Network tab
- [ ] Check if custom element 'dashview-dashboard' is registered
- [ ] Inspect DOM to see if panel container exists
- [ ] Check for JavaScript execution errors

### File Structure Verification
- [ ] Confirm panel file is in correct location (`custom_components/dashview_v2/panel/`)
- [ ] Verify file permissions are correct
- [ ] Check if webpack bundle includes all dependencies
- [ ] Validate UMD module format

### Home Assistant Integration
- [ ] Check Home Assistant logs for panel registration
- [ ] Verify `async_register_static_paths` is working
- [ ] Confirm panel configuration in `__init__.py`
- [ ] Check if panel URL is accessible directly

### Panel Implementation Comparison
- [ ] Compare with working HACS integrations that have panels
- [ ] Review Home Assistant core panel implementations
- [ ] Check module export patterns used by other integrations
- [ ] Analyze successful custom panel examples

## Previous Attempts Summary

### Version 0.2.6
- Created `panel.ts` with `DashviewV2Panel` class
- Issue: Class was tree-shaken out of webpack bundle

### Version 0.2.7
- Switched to function-based approach with `panel-entry.ts`
- Exported `createDashviewPanel` function as default
- Added `libraryExport: 'default'` to webpack config
- Result: Still showing empty panel

## Hypothesis for Root Cause

1. **Module Loading Issue**: Home Assistant might not be correctly importing the default export
2. **Panel Registration**: The panel might not be registered with the correct configuration
3. **Custom Element Timing**: The 'dashview-dashboard' element might not be defined when panel loads
4. **HACS-specific Requirements**: Missing HACS-specific configuration or structure

## Next Steps

1. **Deep Dive into HACS Examples**:
   - Find successful HACS integrations with custom panels
   - Analyze their webpack configurations
   - Compare panel registration methods

2. **Home Assistant Panel Loading Analysis**:
   - Trace how Home Assistant loads custom panels
   - Understand the expected module format
   - Verify our export matches expectations

3. **Community Research**:
   - Search for similar issues in forums
   - Look for HACS frontend integration guides
   - Find examples of Lit Element panels in HACS

4. **Alternative Approaches**:
   - Consider using Home Assistant's native panel types
   - Explore different module bundling strategies
   - Test with minimal panel implementation

## Success Criteria
- Panel displays welcome screen with home statistics
- No console errors related to panel loading
- Panel updates when Home Assistant data changes
- Compatible with HACS installation method

## Resources to Consult
1. HACS Integration Examples:
   - mini-media-player
   - button-card
   - custom header
   
2. Home Assistant Core Panels:
   - Developer Tools panel
   - Energy panel
   - History panel

3. Documentation Priority:
   - HACS frontend integration guide
   - Home Assistant custom panel development
   - Webpack configuration for HA integrations
   - Community solutions for similar issues

---

*This investigation aims to identify why the Dashview V2 panel remains empty despite multiple implementation attempts and to find a working solution based on community best practices and official documentation.*