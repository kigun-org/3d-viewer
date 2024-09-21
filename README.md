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

## Using the viewer in your website

```html
<div id="viewer"></div>

<script href="/path/to/bootstrap.min.css"></script>
<script type="module">
    import Viewer from /path/to/Viewer.js;
    const viewerElement = document.getElementById("viewer")
    
    const resourceExample = [
        {
            id: 42, // a unique ID
            caption: "Model", // a description of the model
            params: '{ "color": [ 0.8, 1.0, 0.8 ], "opacity": 1.0 }', // display color and opacity
            type: "MODEL", // MODEL for STL files
            url: 'data/sample.stl' // the URL of the model
        }
    ]
    
    function saveScreenshot(imageBlob) {
        // process the Blob containing a PNG image
        
        // should return a Promise for further processing (e.g., to update the UI once the operation is finished)
    }
    
    new Viewer({
        target: viewerElement,
        props: {
            resources: resourceExample, // A list of resources to load (see the example above)
            screenshotCallback: saveScreenshot // A function that is called with the screenshot image as an argument (optional)
        }
    })
</script>
```

## Using the viewer in your website

```html
<div id="viewer"></div>

<script href="/path/to/bootstrap.min.css"></script>
<script type="module">
    import Viewer from /path/to/Viewer.js;
    const viewerElement = document.getElementById("viewer")
    
    const resourceExample = [
        {
            id: 42, // a unique ID
            caption: "Model", // a description of the model
            params: '{ "color": [ 0.8, 1.0, 0.8 ], "opacity": 1.0 }', // display color and opacity
            type: "MODEL", // MODEL for STL files
            url: 'data/sample.stl' // the URL of the model
        }
    ]
    
    function saveScreenshot(imageBlob) {
        // process the Blob containing a PNG image
        
        // should return a Promise for further processing (e.g., to update the UI once the operation is finished)
    }
    
    new Viewer({
        target: viewerElement,
        props: {
            resources: resourceExample, // A list of resources to load (see the example above)
            screenshotCallback: saveScreenshot // A function that is called with the screenshot image as an argument (optional)
        }
    })
</script>
```

## Using the viewer in your website

```html
<div id="viewer"></div>

<script href="/path/to/bootstrap.min.css"></script>
<script type="module">
    import Viewer from /path/to/Viewer.js;
    const viewerElement = document.getElementById("viewer")
    
    const resourceExample = [
        {
            id: 42, // a unique ID
            caption: "Model", // a description of the model
            params: '{ "color": [ 0.8, 1.0, 0.8 ], "opacity": 1.0 }', // display color and opacity
            type: "MODEL", // MODEL for STL files
            url: 'data/sample.stl' // the URL of the model
        }
    ]
    
    function saveScreenshot(imageBlob) {
        // process the Blob containing a PNG image
        
        // should return a Promise for further processing (e.g., to update the UI once the operation is finished)
    }
    
    new Viewer({
        target: viewerElement,
        props: {
            resources: resourceExample, // A list of resources to load (see the example above)
            screenshotCallback: saveScreenshot // A function that is called with the screenshot image as an argument (optional)
        }
    })
</script>
```

## Using the viewer in your website

```html
<div id="viewer"></div>

<script href="/path/to/bootstrap.min.css"></script>
<script type="module">
    import Viewer from /path/to/Viewer.js;
    const viewerElement = document.getElementById("viewer")
    
    const resourceExample = [
        {
            id: 42, // a unique ID
            caption: "Model", // a description of the model
            params: '{ "color": [ 0.8, 1.0, 0.8 ], "opacity": 1.0 }', // display color and opacity
            type: "MODEL", // MODEL for STL files
            url: 'data/sample.stl' // the URL of the model
        }
    ]
    
    function saveScreenshot(imageBlob) {
        // process the Blob containing a PNG image
        
        // should return a Promise for further processing (e.g., to update the UI once the operation is finished)
    }
    
    new Viewer({
        target: viewerElement,
        props: {
            resources: resourceExample, // A list of resources to load (see the example above)
            screenshotCallback: saveScreenshot // A function that is called with the screenshot image as an argument (optional)
        }
    })
</script>
```