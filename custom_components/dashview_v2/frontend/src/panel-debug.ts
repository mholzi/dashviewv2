console.log('[Dashview Debug] Script starting');

class DashviewDebugPanel extends HTMLElement {
    private _hass: any;
    private _narrow: boolean = false;
    private _route: any;
    private _panel: any;

    constructor() {
        super();
        console.log('[Dashview Debug] Panel constructor called');
    }

    connectedCallback() {
        console.log('[Dashview Debug] Panel connected to DOM');
        this.innerHTML = `
            <div style="padding: 20px; font-family: sans-serif;">
                <h1>Dashview V2 Debug Panel</h1>
                <p>If you see this, the panel is loading!</p>
                <p>Timestamp: ${new Date().toISOString()}</p>
                <pre id="debug-info"></pre>
            </div>
        `;
        
        this.updateDebugInfo();
    }

    disconnectedCallback() {
        console.log('[Dashview Debug] Panel disconnected from DOM');
    }

    updateDebugInfo() {
        const info = {
            customElements: {
                'dashview-v2-panel': !!customElements.get('dashview-v2-panel'),
                'dashview-dashboard': !!customElements.get('dashview-dashboard'),
            },
            properties: {
                hass: !!this._hass,
                narrow: this._narrow,
                route: !!this._route,
                panel: !!this._panel,
            },
            timestamp: new Date().toISOString(),
        };
        
        const debugEl = this.querySelector('#debug-info');
        if (debugEl) {
            debugEl.textContent = JSON.stringify(info, null, 2);
        }
    }
    
    set hass(value: any) {
        console.log('[Dashview Debug] hass set', !!value);
        this._hass = value;
        this.updateDebugInfo();
    }

    get hass() {
        return this._hass;
    }
    
    set narrow(value: boolean) {
        console.log('[Dashview Debug] narrow set', value);
        this._narrow = value;
        this.updateDebugInfo();
    }

    get narrow() {
        return this._narrow;
    }
    
    set route(value: any) {
        console.log('[Dashview Debug] route set', value);
        this._route = value;
        this.updateDebugInfo();
    }

    get route() {
        return this._route;
    }
    
    set panel(value: any) {
        console.log('[Dashview Debug] panel set', value);
        this._panel = value;
        this.updateDebugInfo();
    }

    get panel() {
        return this._panel;
    }
}

// Register immediately
if (!customElements.get('dashview-v2-panel')) {
    customElements.define('dashview-v2-panel', DashviewDebugPanel);
    console.log('[Dashview Debug] Panel registered');
} else {
    console.log('[Dashview Debug] Panel already registered');
}

// Also put on window for debugging
(window as any).DashviewDebugPanel = DashviewDebugPanel;
console.log('[Dashview Debug] Script completed');