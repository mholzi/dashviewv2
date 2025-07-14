name: "HACS Dashboard v2 - Hello World Custom Panel"
description: |

## Purpose
Build a Home Assistant Custom Component (HACS) that creates a custom panel accessible from the sidebar, displaying a "Hello World" message. This serves as a foundation for future dashboard enhancements.

## Core Principles
1. **HACS Compliance**: Follow all HACS requirements for distribution
2. **Modern HA Standards**: Use Lit Element and modern JavaScript patterns
3. **Minimal Implementation**: Start with Hello World, structure for future expansion
4. **Full Integration**: Proper panel registration, not just a card
5. **Global rules**: Follow all rules in CLAUDE.md

---

## Goal
Create a fully functional HACS-compatible custom panel for Home Assistant that displays "Hello World" in the sidebar, using JavaScript frontend and Python backend integration following Home Assistant best practices.

## Why
- **Foundation for Future**: Establishes the structure for advanced dashboard features
- **HACS Distribution**: Enables easy installation for Home Assistant users
- **Custom Panel Access**: Provides dedicated sidebar entry for the dashboard
- **Learning Platform**: Demonstrates proper HA integration patterns

## What
A Home Assistant custom component that:
- Registers a new panel in the Home Assistant sidebar
- Displays a "Hello World" message using Lit Element
- Follows HACS structure requirements
- Includes proper documentation and setup instructions

### Success Criteria
- [ ] Panel appears in Home Assistant sidebar
- [ ] "Hello World" message displays when panel is clicked
- [ ] Component loads without errors in HA logs
- [ ] HACS structure validation passes
- [ ] Installation via HACS works correctly
- [ ] Documentation clearly explains setup process

## All Needed Context

### Documentation & References
```yaml
# MUST READ - Include these in your context window
- url: https://developers.home-assistant.io/docs/frontend/custom-ui/custom-panel
  why: Official guide for creating custom panels, panel registration patterns
  
- url: https://developers.home-assistant.io/docs/creating_component_index
  why: Component structure, manifest.json requirements, initialization patterns
  
- url: https://hacs.xyz/docs/developer/integration
  why: HACS requirements, validation criteria, repository structure
  
- url: https://developers.home-assistant.io/docs/api/websocket
  why: WebSocket API for future enhancements, state management patterns

- url: https://lit.dev/docs/
  why: Lit Element framework used by Home Assistant frontend
  section: Components basics, styling, properties

- file: use-cases/mcp-server/src/index.ts
  why: Service initialization patterns, lifecycle management approach
  
- file: use-cases/mcp-server/package.json
  why: Dependency management patterns, script configuration
```

### Current Codebase tree
```bash
dashviewv2/
├── CLAUDE.md
├── INITIAL.md
├── INITIAL_EXAMPLE.md
├── LICENSE
├── PRPs/
│   ├── EXAMPLE_multi_agent_prp.md
│   └── templates/
│       └── prp_base.md
├── README.md
├── examples/
├── feature_requests/
│   └── INITIAL_hacs_dashboard.md
└── use-cases/
    └── mcp-server/
```

### Desired Codebase tree with files to be added
```bash
dashviewv2/
├── custom_components/
│   └── dashview_v2/
│       ├── __init__.py              # Component initialization, panel registration
│       ├── manifest.json            # HA component metadata
│       ├── const.py                 # Constants (DOMAIN, etc.)
│       └── panel/
│           └── dashview-v2-panel.js # Lit Element panel implementation
├── hacs.json                        # HACS metadata
├── README.md                        # Updated with installation instructions
├── info.md                          # HACS display information
├── tests/
│   └── test_init.py                 # Basic component tests
└── .github/
    └── workflows/
        └── validate.yml             # HACS validation workflow

# Total new files: 9
# Modified files: 1 (README.md)
```

### Known Gotchas & Library Quirks
```python
# CRITICAL: Home Assistant 2024.12+ requires "version" in manifest.json
# CRITICAL: Panel registration must happen in async_setup, not async_setup_entry
# CRITICAL: JavaScript modules must be served from static path
# CRITICAL: Lit Element must be imported from CDN or bundled
# CRITICAL: HACS requires single integration per repository
# CRITICAL: Use frontend.async_register_built_in_panel, not deprecated methods
# CRITICAL: Panel name in JS must match module_url name exactly
# CRITICAL: All paths in __init__.py must be relative to custom_components
```

## Implementation Blueprint

### Data models and structure

Since this is a simple Hello World panel, we don't need complex data models. However, we'll structure for future expansion:

```python
# const.py - Constants for the component
DOMAIN = "dashview_v2"
PANEL_URL = "/dashview_v2-panel"
PANEL_TITLE = "Dashview V2"
PANEL_ICON = "mdi:view-dashboard"
PANEL_NAME = "dashview-v2-panel"

# No Pydantic models needed for Hello World
# Future: Add models for dashboard data, metrics, etc.
```

### List of tasks to be completed

```yaml
Task 1: Create component directory structure
CREATE custom_components/dashview_v2/:
  - Create directory structure
  - Ensure proper Python package initialization

Task 2: Create manifest.json
CREATE custom_components/dashview_v2/manifest.json:
  - Include all required fields for HA 2024.12+
  - Set version to "0.1.0"
  - Include "frontend" in dependencies
  - Set config_flow to false (no UI configuration needed)

Task 3: Create constants file
CREATE custom_components/dashview_v2/const.py:
  - Define DOMAIN and other constants
  - Keep all magic strings in one place

Task 4: Create panel JavaScript
CREATE custom_components/dashview_v2/panel/dashview-v2-panel.js:
  - Use Lit Element with CDN import
  - Create basic Hello World display
  - Include proper HA theming variables
  - Handle hass, narrow, route, panel properties

Task 5: Create component initialization
CREATE custom_components/dashview_v2/__init__.py:
  - Register static path for panel JS
  - Use frontend.async_register_built_in_panel
  - Set up logging
  - Return True for successful setup

Task 6: Create HACS metadata
CREATE hacs.json:
  - Set minimum HA version to 2024.4.1
  - Enable README rendering
  - Set proper display name

Task 7: Create info.md for HACS
CREATE info.md:
  - Brief description for HACS display
  - Installation instructions summary
  - Link to full documentation

Task 8: Update README.md
MODIFY README.md:
  - Add HACS installation instructions
  - Add manual installation instructions
  - Add development setup guide
  - Include troubleshooting section

Task 9: Create basic tests
CREATE tests/test_init.py:
  - Test component initialization
  - Test panel registration
  - Use Home Assistant test fixtures

Task 10: Create GitHub workflow
CREATE .github/workflows/validate.yml:
  - Add HACS validation action
  - Ensure CI/CD for future updates
```

### Per task pseudocode

```python
# Task 2: manifest.json structure
{
  "domain": "dashview_v2",
  "name": "Dashview V2",
  "codeowners": ["@markusholzhaeuser"],
  "config_flow": false,
  "dependencies": ["frontend"],
  "documentation": "https://github.com/markusholzhaeuser/dashviewv2",
  "issue_tracker": "https://github.com/markusholzhaeuser/dashviewv2/issues",
  "requirements": [],
  "version": "0.1.0"
}

# Task 4: Panel JavaScript pattern
import { LitElement, html, css } from "CDN_URL";

class DashviewV2Panel extends LitElement {
  static properties = {
    hass: { type: Object },
    narrow: { type: Boolean },
    route: { type: Object },
    panel: { type: Object }
  };
  
  render() {
    return html`<div class="content"><h1>Hello World</h1></div>`;
  }
  
  static styles = css`
    :host { /* HA theming variables */ }
  `;
}

customElements.define("dashview-v2-panel", DashviewV2Panel);

# Task 5: __init__.py pattern
async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    # PATTERN: Register static path first
    hass.http.register_static_path(
        PANEL_URL,
        hass.config.path("custom_components/dashview_v2/panel"),
        True
    )
    
    # PATTERN: Use frontend.async_register_built_in_panel
    hass.components.frontend.async_register_built_in_panel(
        component_name="custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path="dashview-v2",
        config={
            "_panel_custom": {
                "name": PANEL_NAME,
                "module_url": f"{PANEL_URL}/dashview-v2-panel.js",
                "embed_iframe": False,
                "trust_external": False,
            }
        },
        require_admin=False,
    )
    
    return True
```

### Integration Points
```yaml
HOME ASSISTANT:
  - location: custom_components/dashview_v2/
  - sidebar: "Dashview V2" panel with icon
  - url path: /dashview-v2
  
HACS:
  - repository: GitHub public repository
  - category: Integration
  - validation: hacs.json and structure
  
FRONTEND:
  - framework: Lit Element 3.0+
  - module: ES6 JavaScript module
  - styling: Home Assistant CSS variables
```

## Validation Loop

### Level 1: Component Structure
```bash
# Verify directory structure
ls -la custom_components/dashview_v2/
# Expected: __init__.py, manifest.json, const.py, panel/

# Check manifest.json is valid JSON
python -m json.tool custom_components/dashview_v2/manifest.json
# Expected: Properly formatted JSON output

# Verify Python syntax
python -m py_compile custom_components/dashview_v2/__init__.py
python -m py_compile custom_components/dashview_v2/const.py
# Expected: No output (success)
```

### Level 2: HACS Validation
```bash
# Install HACS validation tool
pip install hacs-integration-validation

# Run validation
python -m hacs_integration_validation dashviewv2
# Expected: All checks pass

# Manual checks:
# - Repository has description
# - hacs.json exists in root
# - Single integration in repo
# - manifest.json has version field
```

### Level 3: Home Assistant Testing
```python
# tests/test_init.py
import pytest
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component

async def test_setup(hass: HomeAssistant):
    """Test component setup."""
    result = await async_setup_component(hass, "dashview_v2", {})
    assert result is True
    
    # Verify panel is registered
    assert "dashview-v2" in hass.data["frontend_panels"]

async def test_panel_config(hass: HomeAssistant):
    """Test panel configuration."""
    await async_setup_component(hass, "dashview_v2", {})
    panel = hass.data["frontend_panels"]["dashview-v2"]
    
    assert panel["title"] == "Dashview V2"
    assert panel["icon"] == "mdi:view-dashboard"
    assert not panel["require_admin"]
```

```bash
# Run tests
pytest tests/test_init.py -v
# Expected: All tests pass
```

### Level 4: Manual Integration Test
```bash
# Copy to Home Assistant config
cp -r custom_components ~/.homeassistant/

# Check configuration
hass --script check_config
# Expected: No errors

# Start Home Assistant
hass

# Manual verification:
# 1. Open Home Assistant UI
# 2. Check sidebar for "Dashview V2" entry
# 3. Click panel - should show "Hello World"
# 4. Check browser console - no errors
# 5. Check HA logs - no errors
```

## Final Validation Checklist
- [ ] Component loads without errors
- [ ] Panel appears in sidebar with correct icon
- [ ] "Hello World" displays when panel clicked
- [ ] No JavaScript errors in browser console
- [ ] HACS validation passes
- [ ] Tests pass: `pytest tests/ -v`
- [ ] Manual test successful in real HA instance
- [ ] Documentation is complete and accurate
- [ ] GitHub repository ready for HACS submission

---

## Anti-Patterns to Avoid
- ❌ Don't use deprecated frontend registration methods
- ❌ Don't forget version field in manifest.json
- ❌ Don't use relative imports in Python files
- ❌ Don't hardcode paths - use hass.config.path()
- ❌ Don't skip HACS validation before release
- ❌ Don't bundle large JavaScript libraries
- ❌ Don't access hass.components directly
- ❌ Don't create config flow for simple panels

## Next Steps After Hello World
Once this foundation is working:
1. Add WebSocket subscriptions for real-time data
2. Implement service calls from the panel
3. Add configuration options via config flow
4. Create custom cards for the dashboard
5. Integrate with external APIs
6. Add data persistence and history

---

**Confidence Score: 9/10**

This PRP provides comprehensive context for implementing a HACS-compatible Hello World panel. The high confidence comes from:
- Clear, tested patterns from HA documentation
- Specific file structures and code examples
- Multiple validation checkpoints
- Known gotchas explicitly documented
- Simple scope reducing complexity

The only uncertainty is around specific GitHub repository setup which may require minor adjustments during implementation.