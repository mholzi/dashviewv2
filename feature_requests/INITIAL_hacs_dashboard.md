## FEATURE:

- **HACS Dashboard Integration**: A Home Assistant Custom Component (HACS) that displays a simple "Hello World" message post-creation, designed as a foundation for future dashboard enhancements.
- **Hybrid Architecture**: JavaScript frontend for UI rendering and Python backend for Home Assistant integration, following HACS best practices.
- **Progressive Enhancement**: Start with basic message display, structured to easily add monitoring, metrics, and advanced dashboard features later.
- **Full Integration**: Proper HACS structure with manifest.json, custom component registration, and frontend card/panel implementation.
- **Development Ready**: Include all necessary configuration files, documentation, and setup instructions for local development and HACS installation.

## EXAMPLES:

In the `examples/` folder, there is a README for you to read to understand what the example is all about and also how to structure your own README when you create documentation for the above feature.

- `use-cases/mcp-server/src/index.ts` - Study this TypeScript server implementation pattern for understanding service architecture, initialization, and cleanup procedures.
- `use-cases/mcp-server/src/auth/` - Reference for authentication patterns and OAuth implementation that could be adapted for Home Assistant authentication.
- `use-cases/mcp-server/package.json` - Use this as a template for understanding dependency management and script configuration.
- `use-cases/mcp-server/tests/` - Follow this testing structure for unit tests and mocking patterns.

The MCP server example shows excellent patterns for:
- Service initialization and cleanup
- TypeScript/JavaScript module structure
- Authentication handling
- Database integration patterns
- Testing infrastructure

Don't copy any of these examples directly, as they are for a different technology stack (Cloudflare Workers + MCP), but use them as inspiration for:
- Clean separation of concerns
- Proper error handling
- Service lifecycle management
- Testing approaches

## DOCUMENTATION:

**Home Assistant Development:**
- Home Assistant Developer Documentation: https://developers.home-assistant.io/
- HACS Documentation: https://hacs.xyz/docs/developer/
- Custom Component Structure: https://developers.home-assistant.io/docs/creating_component_index
- Frontend Development: https://developers.home-assistant.io/docs/frontend/

**HACS Specific:**
- HACS Integration Requirements: https://hacs.xyz/docs/developer/integration
- Custom Cards Development: https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card
- Component Manifest: https://developers.home-assistant.io/docs/config_entries_index

**JavaScript/Python Integration:**
- Home Assistant WebSocket API: https://developers.home-assistant.io/docs/api/websocket
- Home Assistant REST API: https://developers.home-assistant.io/docs/api/rest
- Frontend Data Binding: https://developers.home-assistant.io/docs/frontend/data

## OTHER CONSIDERATIONS:

- **Component Name**: The HACS component will be named "dashview_v2" with domain "dashview_v2".
- **Target Version**: Develop for the latest Home Assistant version (2024.12+) with appropriate compatibility checks.
- **Frontend Type**: Implement as a custom panel accessible from the sidebar, not as a dashboard card.
- **Simple Scope**: Focus solely on displaying "Hello World" message - no additional features in this initial version.
- **HACS Structure**: Create proper `custom_components/dashview_v2/` directory structure with `__init__.py`, `manifest.json`, and required metadata files.
- **Version Management**: Use semantic versioning and ensure `manifest.json` includes proper version field for Home Assistant compatibility.
- **Frontend Integration**: Implement custom panel (full-page view) that registers in the sidebar for easy access.
- **Panel Registration**: Use `frontend.async_register_built_in_panel` to add the panel to Home Assistant's sidebar.
- **State Management**: Use Home Assistant's state management system for Python-JavaScript communication rather than direct API calls.
- **Error Handling**: Implement proper error handling for both component initialization failures and frontend rendering issues.
- **Testing Strategy**: Include unit tests for Python component logic and integration tests for frontend-backend communication.
- **Documentation**: Create comprehensive README with installation instructions, Home Assistant version compatibility, and configuration examples.
- **Development Environment**: Provide clear instructions for local development setup, including Home Assistant test instance configuration.
- **Minimal Implementation**: Keep the initial implementation as simple as possible - just display "Hello World" in the custom panel.
- **Security**: Follow Home Assistant security best practices for component permissions and data handling.
- **Performance**: Ensure minimal impact on Home Assistant startup time and resource usage.
- **Branding**: Consider Home Assistant UI/UX guidelines for consistent user experience.

**Development Setup Requirements:**
- Home Assistant development environment or test instance (latest version)
- Python 3.11+ (matching Home Assistant requirements)
- Node.js/npm for frontend development
- Git for version control and HACS integration
- Proper directory structure matching HACS expectations