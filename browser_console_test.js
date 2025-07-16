// Dashview V2 Panel Debug Test Script
// Run this in your browser console after navigating to the Dashview V2 panel

console.log('=== Dashview V2 Panel Debug Test ===');

// 1. Check if script loaded
console.log('[TEST] Window has DashviewDebugPanel?', !!window.DashviewDebugPanel);

// 2. Check custom elements
console.log('[TEST] Custom elements registered:');
console.log('  dashview-v2-panel:', customElements.get('dashview-v2-panel'));
console.log('  dashview-dashboard:', customElements.get('dashview-dashboard'));

// 3. Find panel in DOM
const panel = document.querySelector('dashview-v2-panel');
console.log('[TEST] Panel in DOM:', !!panel);

// 4. Check panel properties
if (panel) {
    console.log('[TEST] Panel properties:');
    console.log('  has hass:', !!panel.hass);
    console.log('  narrow:', panel.narrow);
    console.log('  route:', panel.route);
    console.log('  panel:', panel.panel);
    console.log('  children:', panel.children.length);
    console.log('  innerHTML preview:', panel.innerHTML.substring(0, 100) + '...');
}

// 5. Check for HA panel container
const haPanel = document.querySelector('ha-panel-custom');
console.log('[TEST] HA Panel Custom element:', !!haPanel);

// 6. Look for any errors in console
console.log('[TEST] Check console above for any [Dashview Debug] messages');

// 7. Try to manually create panel
console.log('[TEST] Attempting to create panel manually...');
try {
    const testPanel = document.createElement('dashview-v2-panel');
    testPanel.style.display = 'block';
    testPanel.style.border = '2px solid red';
    testPanel.style.minHeight = '100px';
    document.body.appendChild(testPanel);
    console.log('[TEST] Manual panel created and added to body');
    
    // Clean up after 5 seconds
    setTimeout(() => {
        testPanel.remove();
        console.log('[TEST] Manual panel removed');
    }, 5000);
} catch (e) {
    console.error('[TEST] Error creating panel:', e);
}

console.log('=== Test Complete ===');