# Release Notes - Dashview V2 v0.2.8

## 🔍 Debug Release

This is a special debug release to help diagnose the empty panel issue. It includes a minimal debug panel that should display if the JavaScript is loading correctly.

## 🐛 Debug Features

### Debug Panel Implementation
- **Visual Feedback**: Shows "Dashview V2 Debug Panel" with timestamp
- **Console Logging**: Extensive logging at every lifecycle stage
- **Property Display**: Shows real-time panel properties and custom element registration
- **Simplified Build**: Removed UMD wrapper that may have been causing issues

### Technical Changes
- Removed webpack UMD library configuration
- Disabled code splitting for single-file output
- Preserved console logs in production build
- Created minimal panel without dependencies

## 🧪 Testing Instructions

1. **Update/Install** the integration in Home Assistant
2. **Restart** Home Assistant
3. **Open Browser Console** (F12) before navigating to panel
4. **Navigate** to Dashview V2 panel
5. **Check Console** for `[Dashview Debug]` messages

### Expected Output

#### In Browser Console:
```
[Dashview Debug] Script starting
[Dashview Debug] Panel registered
[Dashview Debug] Script completed
[Dashview Debug] Panel constructor called
[Dashview Debug] Panel connected to DOM
[Dashview Debug] hass set true
[Dashview Debug] narrow set false
[Dashview Debug] route set [object]
[Dashview Debug] panel set [object]
```

#### In Panel Area:
- "Dashview V2 Debug Panel" heading
- "If you see this, the panel is loading!" message
- Debug information showing custom elements and properties

## 🔧 Browser Console Test

A test script is included. Copy and run this in your browser console:
```javascript
// Check if panel loaded
console.log('DashviewDebugPanel exists?', !!window.DashviewDebugPanel);
console.log('Panel element registered?', !!customElements.get('dashview-v2-panel'));
console.log('Panel in DOM?', !!document.querySelector('dashview-v2-panel'));
```

## 📋 What This Tells Us

- **If you see the debug panel**: The issue was with the UMD module wrapper
- **If you see console logs but no panel**: The custom element registration is working but rendering fails
- **If you see nothing**: The script isn't executing at all

## 🚀 Next Steps

Based on the results of this debug release, we'll implement the full panel fix in v0.2.9.

---

*This is a diagnostic release. Please report your findings in the GitHub issues.*