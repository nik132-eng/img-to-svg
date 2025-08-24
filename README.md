# 🎨 Image to SVG Converter

A powerful, modern web application that converts raster images to high-quality SVG vector graphics using advanced vectorization algorithms.

## ✨ Features

- **🖼️ Image Upload**: Drag & drop or click to upload images (PNG, JPG, JPEG, GIF, BMP, WebP)
- **🔧 Advanced Settings**: Customize conversion parameters for optimal results
- **🎯 Real-time Preview**: See your SVG conversion results instantly
- **✏️ SVG Editor**: Inline editor to modify, delete, and optimize SVG elements
- **📥 Download**: Download optimized SVG files
- **📋 Copy Code**: Copy SVG code to clipboard
- **🔗 Share SVG**: Create shareable links for your converted SVGs
- **📱 Responsive Design**: Works perfectly on all devices
- **🎭 Beautiful UI**: Modern glassmorphism design with Three.js background
- **⚡ Fast Processing**: Optimized conversion pipeline

## 🚀 How It Works

### Image Processing Pipeline

1. **Image Upload & Validation**
   - Accepts multiple image formats (PNG, JPG, JPEG, GIF, BMP, WebP)
   - File size limit: 4MB
   - Client-side validation and preview

2. **Vectorization Process**
   - Uses **VTracer** (via @neplex/vectorizer) for image-to-vector conversion
   - Advanced algorithms for edge detection and path generation
   - Configurable parameters for optimal results

3. **SVG Optimization**
   - **SVGO** integration for automatic SVG optimization
   - Removes unnecessary metadata and attributes
   - Optimizes paths and reduces file size
   - Maintains visual quality while improving performance

4. **Conversion Settings**

   **Basic Settings:**
   - **Color Mode**: Color or Binary (black & white)
   - **Color Precision**: 1-8 levels (higher = more colors, larger file)
   - **Filter Speckle**: 1-10px (removes noise, higher = more aggressive)

   **Advanced Settings:**
   - **Shape Organization**: Stacked or Cutout modes
   - **Curve Fitting**: Spline (smooth curves) or Polygon (angular)
   - **Splice Threshold**: 10-90° (angle for path splitting)
   - **Corner Threshold**: 30-90° (corner detection sensitivity)

5. **SVG Editor Features**

   **Professional Code Editor Interface:**
   - **Left Panel**: Dark-themed code editor with syntax highlighting
   - **Right Panel**: Real-time SVG preview with live updates
   - **Toolbar**: Optimize, Prettify, and Clear buttons for quick actions
   - **Path Precision Control**: Adjustable slider (0-3) for optimization level
   - **Error Handling**: Real-time validation with clear error messages
   - **File Size Tracking**: Monitor SVG size changes during editing
   - **Code Formatting**: Auto-indent and structure SVG code
   - **Optimization Tools**: SVGO integration with configurable plugins

   **Dual-Pane Interface**: Professional code editor with real-time preview
   - **Code Editor**: Edit SVG code directly with syntax highlighting
   - **Live Preview**: See changes instantly as you type
   - **SVG Optimization**: Professional SVGO integration with configurable precision
   - **Code Formatting**: Auto-prettify SVG code for better readability
   -    **Real-time Validation**: Instant feedback on SVG syntax errors

6. **SVG Sharing Features**

   **Instant Share Links:**
   - **Share Button**: One-click sharing after conversion
   - **Unique URLs**: Generate short, shareable links (e.g., `/r/abc123`)
   - **Direct Streaming**: View shared SVGs without downloading
   - **24-Hour Expiry**: Temporary links for privacy and security
   - **Native Sharing**: Use device's native share functionality when available
   - **Fallback Support**: Works even when API routes are unavailable

   **Share Link Benefits:**
   - **Viral Potential**: Every shared link is free marketing
   - **Professional Delivery**: Share results with clients and colleagues
   - **No Storage Costs**: SVG content streams directly without server storage
   - **Mobile Optimized**: Perfect for sharing on social media and messaging apps

## 🛠️ Technology Stack

- **Frontend**: Next.js 15 with App Router
- **UI Framework**: React 19 + TypeScript
- **Styling**: Tailwind CSS with custom animations
- **3D Background**: Three.js with React Three Fiber
- **Image Processing**: VTracer vectorization engine
- **SVG Optimization**: SVGO
- **Build Tool**: Next.js build system
- **Development**: Hot reload with TypeScript support

## 📁 Project Structure

```
image-to-svg-converter/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── convert/       # Image conversion endpoint
│   │   │   └── share/         # SVG sharing endpoint
│   │   ├── r/                 # Shared SVG routes
│   │   │   └── [shareId]/     # Dynamic share ID pages
│   │   ├── share/             # Fallback share page
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   └── components/            # React components
│       ├── ImageUploader.tsx  # Drag & drop image upload
│       ├── ThreeBackground.tsx # 3D animated background
│       ├── VisitorCounter.tsx # Visitor tracking
│       ├── ConversionSettings.tsx # Advanced settings modal
│       ├── SvgEditor.tsx      # Inline SVG editor
│       ├── ShareButton.tsx    # SVG sharing functionality
│       ├── BulkImageUploader.tsx # Multiple image upload
│       ├── ConversionQueue.tsx # Conversion progress tracking
│       └── ZipDownloader.tsx  # Bulk download as ZIP
├── public/                    # Static assets
├── next.config.js            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.js         # PostCSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd image-to-svg-converter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 **New SVG Editor Workflow**

1. **Convert Image**: Upload and convert your image to SVG
2. **Click Edit**: Use the "Edit SVG" button to open the professional editor
3. **Code Editing**: Modify SVG code directly in the left panel
4. **Live Preview**: See changes instantly in the right panel
5. **Optimize**: Use the precision slider and optimization tools
6. **Apply Changes**: Save your modifications back to the main interface

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

No environment variables required for basic functionality.

### Customization

- **Tailwind CSS**: Modify `tailwind.config.ts` for custom design system
- **Three.js Background**: Adjust `src/components/ThreeBackground.tsx` for 3D effects
- **Conversion Settings**: Modify default values in `src/components/ConversionSettings.tsx`

## 📊 Performance

- **Build Time**: ~5-10 seconds
- **Bundle Size**: ~350KB (gzipped)
- **Image Processing**: 1-3 seconds for typical images
   - **SVG Optimization**: Reduces file size by 20-60%
   - **SVG Editor**: Professional dual-pane interface for code editing

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔒 Security

- File type validation
- File size limits
- Client-side image processing
- No server-side file storage

## 📈 Usage Statistics

- **Visitor Counter**: Tracks unique visits (stored locally)
- **Conversion Analytics**: Built-in performance monitoring
- **Error Tracking**: Comprehensive error logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Nikunj Rohit** - Full-stack developer passionate about creating beautiful, functional web applications.

## 🙏 Acknowledgments

- **VTracer**: Advanced vectorization algorithms
- **SVGO**: SVG optimization tools
- **Three.js**: 3D graphics library
- **Next.js**: React framework
- **Tailwind CSS**: Utility-first CSS framework

---

**Made with ❤️ and ☕ by Nikunj Rohit**

*Transform your images into scalable vector graphics with professional quality and ease.*
