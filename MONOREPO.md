# Monorepo Structure

This project uses **npm workspaces** to create a monorepo structure, which provides several benefits over traditional multi-package setups.

## 🏗️ Structure Overview

```
image-to-svg/
├── package.json              # Root workspace configuration
├── node_modules/             # Single dependency location
├── frontend/                 # React frontend package
│   └── package.json         # Frontend-specific dependencies
├── backend/                  # Fastify backend package
│   └── package.json         # Backend-specific dependencies
└── [other files...]
```

## ✅ Benefits of Monorepo

### 1. **Single Dependency Management**
- One `node_modules` folder at the root
- No duplicate packages across frontend/backend
- Consistent dependency versions
- Faster `npm install` operations

### 2. **Unified Scripts**
```bash
# Run from root directory
npm run dev              # Start both servers
npm run dev:frontend     # Start only frontend
npm run dev:backend      # Start only backend
npm run build            # Build both packages
```

### 3. **Shared Dependencies**
- Common packages installed once
- Better tree-shaking and optimization
- Reduced disk space usage
- Easier dependency updates

### 4. **Development Workflow**
- Single command to start development
- Consistent development environment
- Easier debugging and testing
- Simplified CI/CD setup

## 🚀 How to Use

### Installation
```bash
# Install all dependencies for all packages
npm install
```

### Development
```bash
# Start both servers
npm run dev

# Start individual servers
npm run dev:frontend
npm run dev:backend
```

### Building
```bash
# Build all packages
npm run build

# Build individual packages
npm run build:frontend
npm run build:backend
```

### Maintenance
```bash
# Clean all node_modules
npm run clean

# Clean and reinstall
npm run clean:install
```

## 🔧 Workspace Configuration

The root `package.json` defines the workspace structure:

```json
{
  "workspaces": [
    "frontend",
    "backend"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:frontend": "npm run dev --workspace=frontend",
    "dev:backend": "npm run dev --workspace=backend"
  }
}
```

## 📦 Package Management

### Adding Dependencies
```bash
# Add to root (shared)
npm install package-name

# Add to specific workspace
npm install package-name --workspace=frontend
npm install package-name --workspace=backend

# Add dev dependency to specific workspace
npm install -D package-name --workspace=frontend
```

### Removing Dependencies
```bash
# Remove from specific workspace
npm uninstall package-name --workspace=frontend
```

## 🎯 Best Practices

1. **Keep shared dependencies at root level**
2. **Use workspace-specific dependencies only when needed**
3. **Run commands from the root directory**
4. **Use the provided npm scripts for consistency**
5. **Leverage workspace commands for package-specific operations**

## 🔍 Troubleshooting

### Common Issues
- **Port conflicts**: Ensure different ports for frontend/backend
- **Dependency conflicts**: Use `npm run clean:install` to reset
- **Workspace not found**: Ensure you're in the root directory

### Reset Everything
```bash
npm run clean:install
```

This monorepo structure makes development much more efficient and maintainable!
