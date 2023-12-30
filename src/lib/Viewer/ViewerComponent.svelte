<script>
    import Window2D from "./Window2D.svelte";
    import Window3D from "./Window3D.svelte";
    import {ViewMode} from "./ViewMode.js";

    import GlobalToolbar from "./GlobalToolbar.svelte";

    /** A unique (per page) id, so that sub-components can have unique IDs */
    export let id

    let window3D
    let windowAxial
    let windowCoronal
    let windowSagittal

    /** A list of resources to load; can be of type VOLUME or MODEL */
    export let models = []
    export let volumes = []
    export let screenshotCallback = null

    /** Should four panels (3D + orthogonal views) be shown on start up? default is true if showing a volume */
    export let startMaximized = (volumes.length > 0)
    let maximized = startMaximized ? ViewMode.THREE_D : null

    /* If no volumes are loaded, only show 3D view */
    let showViewMode = (volumes.length > 0)

    /* Show object list if more than one model/volume is loaded */
    let objectListVisible = (models.length + volumes.length) > 1

    /* If model values change (most likely visibility), update actor properties */
    $: for (const model of models) {
        if (model.actor !== undefined) {
            if (model.visible) {
                model.actor.getProperty().setOpacity(model.params.opacity)
            } else {
                model.actor.getProperty().setOpacity(0.0)
            }
        }
    }

    async function mergeImages(axial, threeD, coronal, sagittal) {
        const imageAxial = Object.assign(new Image(), { src: axial });
        await new Promise(resolve => imageAxial.addEventListener('load', () => resolve()));

        const image3D = Object.assign(new Image(), { src: threeD });
        await new Promise(resolve => image3D.addEventListener('load', () => resolve()));

        const imageCoronal = Object.assign(new Image(), { src: coronal });
        await new Promise(resolve => imageCoronal.addEventListener('load', () => resolve()));

        const imageSagittal = Object.assign(new Image(), { src: sagittal });
        await new Promise(resolve => imageSagittal.addEventListener('load', () => resolve()));

        const canvas = Object.assign(document.createElement('canvas'), {
            width: imageAxial.width * 2,
            height: imageAxial.height * 2
        })
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(imageAxial, 0, 0);
        context.drawImage(image3D, imageAxial.width, 0);
        context.drawImage(imageCoronal, 0, imageAxial.height);
        context.drawImage(imageSagittal, imageAxial.width, imageAxial.height);
        return canvas.toDataURL()
    }

    function saveScreenshot() {
        if (screenshotCallback !== null) {
            switch (maximized) {
                case ViewMode.THREE_D:
                    window3D.saveScreenshot().then((image) => {
                        screenshotCallback(image)
                    })
                    break;
                case ViewMode.AXIAL:
                    windowAxial.saveScreenshot().then((image) => {
                        screenshotCallback(image)
                    })
                    break;
                case ViewMode.CORONAL:
                    windowCoronal.saveScreenshot().then((image) => {
                        screenshotCallback(image)
                    })
                    break;
                case ViewMode.SAGITTAL:
                    windowSagittal.saveScreenshot().then((image) => {
                        screenshotCallback(image)
                    })
                    break;
                default:
                    let image3D, imageAxial, imageCoronal, imageSagittal
                    window3D.saveScreenshot()
                        .then((image) => { image3D = image; return windowAxial.saveScreenshot() })
                        .then((image) => { imageAxial = image; return windowCoronal.saveScreenshot() })
                        .then((image) => { imageCoronal = image; return windowSagittal.saveScreenshot() })
                        .then((image) => { imageSagittal = image;
                            mergeImages(imageAxial, image3D, imageCoronal, imageSagittal)
                                .then((mergedImage) => {
                                    screenshotCallback(mergedImage)
                                })
                        })
            }
        }
    }
</script>

<!--
@component
Here's some documentation for this component.
It will show up on hover.

- You can use markdown here.
- You can also use code blocks here.
- Usage:
  ```tsx
  <main name="Arethra">
  ```
-->
<div style="position: relative; width: 100%; height: 100%">
    <div style="display: grid; grid-template-columns: 1fr 1fr">
        <Window2D bind:this={windowAxial} id="{id}_axial"
                  viewMode={ViewMode.AXIAL} {showViewMode} bind:maximized={maximized}
                  bind:models={models} bind:volumes={volumes}/>
        <Window3D bind:this={window3D} id="{id}_3d"
                  {showViewMode} bind:maximized={maximized}
                  bind:models={models} bind:volumes={volumes}/>
        <Window2D bind:this={windowCoronal} id="{id}_coronal"
                  viewMode={ViewMode.CORONAL} {showViewMode} bind:maximized={maximized}
                  bind:models={models} bind:volumes={volumes}/>
        <Window2D bind:this={windowSagittal} id="{id}_sagittal"
                  viewMode={ViewMode.SAGITTAL} {showViewMode} bind:maximized={maximized}
                  bind:models={models} bind:volumes={volumes}/>
    </div>
    <GlobalToolbar {objectListVisible} bind:models={models} bind:volumes={volumes}
                   showScreenshotButton={screenshotCallback !== null} on:screenshot={saveScreenshot} />
</div>