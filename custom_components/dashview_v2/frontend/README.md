# Dashview V2 Frontend

Modern TypeScript-based dashboard framework for Home Assistant.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Home Assistant development environment

### Installation

```bash
cd custom_components/dashview_v2/frontend
npm install
```

### Development

Start the development server with hot module replacement:

```bash
npm run dev
```

The dev server runs on http://localhost:4001 and proxies API requests to your Home Assistant instance.

### Building

Development build:
```bash
npm run build:dev
```

Production build for HACS release:
```bash
npm run build:prod
```

The production build creates an optimized `dist/dashview-v2.js` file.

## Architecture Overview

### Directory Structure

```
frontend/
├── src/
│   ├── index.ts              # Entry point
│   ├── types/                # TypeScript type definitions
│   ├── core/                 # Core framework classes
│   ├── dashboard/            # Main dashboard component
│   ├── components/           # Reusable UI components
│   ├── layouts/              # Layout templates
│   ├── widgets/              # Dashboard widgets
│   ├── utils/                # Utility functions
│   └── styles/               # Global styles and themes
├── __tests__/                # Jest test files
├── build/                    # Webpack configurations
└── dist/                     # Build output
```

### Key Components

- **DashviewBaseElement**: Base class for all Lit components
- **WebSocketConnection**: Handles real-time communication with backend
- **DashviewDashboard**: Main dashboard component

### WebSocket API

The frontend communicates with the backend via WebSocket commands:

```typescript
const homeInfo = await this.callWebSocket('get_home_info');
```

## Testing

Run all tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

Watch mode for development:
```bash
npm run test:watch
```

## Code Quality

Lint code:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

Type checking:
```bash
npm run type-check
```

Format code:
```bash
npm run format
```

## Build Workflow

1. Make changes to TypeScript files
2. Run `npm run build:dev` to test locally
3. Run `npm test` to ensure tests pass
4. Run `npm run lint` to check code style
5. For releases, run `npm run build:prod`
6. Commit the production build in `dist/`

## TypeScript Configuration

We use Home Assistant's pragmatic TypeScript settings:
- Target: ES2017
- Strict mode with some exceptions
- Entity states are typed as `any` (HA convention)
- Decorators enabled for Lit Element

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all checks pass before submitting