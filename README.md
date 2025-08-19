# 🎨 Image to SVG Converter

A powerful, modern web application that converts raster images to high-quality SVG vector graphics using advanced vectorization algorithms.

## ✨ Features

- **🖼️ Image Upload**: Drag & drop or click to upload images (PNG, JPG, JPEG, GIF, BMP, WebP)
- **🔧 Advanced Settings**: Customize conversion parameters for optimal results
- **🎯 Real-time Preview**: See your SVG conversion results instantly
- **📥 Download**: Download optimized SVG files
- **📋 Copy Code**: Copy SVG code to clipboard
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
│   │   │   └── convert/       # Image conversion endpoint
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   └── components/            # React components
│       ├── ImageUploader.tsx  # Drag & drop image upload
│       ├── ThreeBackground.tsx # 3D animated background
│       ├── VisitorCounter.tsx # Visitor tracking
│       └── ConversionSettings.tsx # Advanced settings modal
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
