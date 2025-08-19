# Image to SVG Converter

A modern, minimal MVP application that converts raster images to SVG format using VTracer technology.

## 🚀 Features

- **Drag & Drop Upload**: Simple image upload with drag-and-drop support
- **Real-time Preview**: See both original image and converted SVG side-by-side
- **SVG Download**: Download converted SVG files directly
- **Code View**: Copy SVG code to clipboard
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## 🏗️ Architecture

### Frontend (React + TypeScript + Tailwind CSS)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **File Handling**: react-dropzone for drag-and-drop uploads
- **State Management**: React hooks for local state
- **UI Components**: Enhanced with modern design patterns

### Backend (Fastify + Node.js)
- **Runtime**: Node.js with TypeScript
- **Framework**: Fastify for high-performance API
- **Image Processing**: @neplex/vectorizer (VTracer wrapper)
- **SVG Optimization**: SVGO for optimized output
- **File Upload**: Multipart form handling with 4MB limit

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start (Recommended)
```bash
# Install all dependencies (uses npm workspaces)
npm install

# Start both servers with one command
npm run dev
```

### Development Commands

```bash
# Start both servers concurrently
npm run dev

# Start individual servers
npm run dev:frontend
npm run dev:backend

# Build both projects
npm run build

# Clean and reinstall dependencies
npm run clean:install
```

## 📁 Project Structure

```
image-to-svg/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   └── ImageUploader.tsx
│   │   ├── App.tsx         # Main application component
│   │   └── index.css       # Tailwind CSS imports
│   ├── tailwind.config.js  # Tailwind configuration
│   └── package.json        # Frontend dependencies
├── backend/                  # Fastify backend server
│   ├── src/
│   │   ├── server.ts       # Main server file
│   │   ├── vtracer.service.ts  # Image conversion service
│   │   └── svgo.service.ts     # SVG optimization service
│   └── package.json        # Backend dependencies
├── package.json             # Root package.json with workspaces
├── .gitignore               # Git ignore rules
├── MONOREPO.md              # Monorepo documentation
└── main_sprint.json         # Project roadmap and progress
```

### 🏗️ Monorepo Benefits

- **Single `node_modules`**: All dependencies managed at root level
- **Shared dependencies**: No duplicate packages
- **Unified scripts**: Run commands from root directory
- **Better dependency management**: Consistent versions across packages
- **Faster installs**: npm workspaces optimize package resolution

## 🔧 API Endpoints

### POST /api/convert
Converts uploaded image to SVG format.

**Query Parameters:**
- `colormode`: 'color' | 'binary' (default: 'color')
- `scale`: number (default: 1)
- `ltres`: number (default: 1)

**Request:** Multipart form with 'image' field
**Response:** JSON with SVG content and metadata

### GET /health
Health check endpoint for monitoring.

## 🎯 KISS/SOLID Principles Applied

### KISS (Keep It Simple, Stupid)
- Single responsibility per component
- Minimal configuration
- Straightforward API design
- Simple file upload workflow
- **Monorepo structure for easy management**
- **Clean, intuitive user interface**

### SOLID Principles
- **Single Responsibility**: Each service handles one concern
- **Open/Closed**: Easy to extend with new conversion options
- **Liskov Substitution**: Consistent interfaces across services
- **Interface Segregation**: Clean, focused API contracts
- **Dependency Inversion**: Services depend on abstractions

## 🧪 Testing the Application

1. **Start both servers** using `npm run dev`
2. **Open frontend** at http://localhost:5173 (or 5174 if 5173 is busy)
3. **Upload an image** by dragging and dropping or clicking
4. **Click "Convert to SVG"** to process the image
5. **Preview the SVG** in the right panel
6. **Download or copy** the SVG code

## 📊 Current Status

✅ **All MVP tasks completed!**
- Frontend scaffolded and styled
- Backend API implemented
- Image conversion working
- SVG download enabled
- Code view functional
- **Modern UI with enhanced design**
- **Monorepo structure implemented with npm workspaces**

## 🚧 Future Enhancements

- Advanced conversion parameters
- Batch processing
- User authentication
- File history
- Performance optimizations
- Additional output formats
- Toast notifications
- Progress indicators

## 🤝 Contributing

This is a minimal MVP demonstrating clean architecture principles. Feel free to extend and improve!

## 📄 License

ISC License
