# 3D viewer

A web-based 3D viewer with specialized functionality for medical imaging data.
DICOM volumes and STL files are supported.

Based on VTK (vtk.js and itk-wasm), will eventually support all formats itk-wasm supports.

## Installation

```
git clone https://github.com/kigun-org/3d-viewer/
cd 3d-viewer
npm install
```

## Local development version

```
npm run dev
```

## Building the components library

```
vite -c vite.lib.config.js build 
```

Copy the contents of the `dist` directory to your project.
