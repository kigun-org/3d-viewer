<script>
    // Load the rendering pieces we want to use (for both WebGL and WebGPU)
    import '@kitware/vtk.js/Rendering/Profiles/All';

    import {
        InteractionMethodsName,
        xyzToViewType
    } from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants";
    import vtkMath from '@kitware/vtk.js/Common/Core/Math';
    import vtkResliceCursorWidget from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget";

    import {onMount} from "svelte";

    import {ViewMode} from "./ViewMode.js";
    import {getColor256} from "../Loader/colors.js";
    import ToolbarGlobal from "./ToolbarGlobal.svelte";
    import Window2D from "./Window2D.svelte";
    import Window3D from "./Window3D.svelte";

    let window3D
    let windowAxial
    let windowCoronal
    let windowSagittal

    /** A list of resources to load; can be of type VOLUME or MODEL */
    export let models = []
    export let volume
    export let screenshotCallback = null

    /** Should four panels (3D + orthogonal views) be shown on start up? default is true if showing a volume */
    export let startMaximized = (volume !== undefined)
    let maximized = startMaximized ? ViewMode.THREE_D : null

    /* If no volumes are loaded, only show 3D view */
    let showLocalToolbar = (volume !== undefined)

    /* Show object list if more than one model/volume is loaded */
    let objectListVisible = (models.length > 1) || (models.length > 0 && volume !== undefined)

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
        const imageAxial = Object.assign(new Image(), {src: axial});
        await new Promise(resolve => imageAxial.addEventListener('load', () => resolve()));

        const image3D = Object.assign(new Image(), {src: threeD});
        await new Promise(resolve => image3D.addEventListener('load', () => resolve()));

        const imageCoronal = Object.assign(new Image(), {src: coronal});
        await new Promise(resolve => imageCoronal.addEventListener('load', () => resolve()));

        const imageSagittal = Object.assign(new Image(), {src: sagittal});
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
                        .then((image) => {
                            image3D = image;
                            return windowAxial.saveScreenshot()
                        })
                        .then((image) => {
                            imageAxial = image;
                            return windowCoronal.saveScreenshot()
                        })
                        .then((image) => {
                            imageCoronal = image;
                            return windowSagittal.saveScreenshot()
                        })
                        .then((image) => {
                            imageSagittal = image;
                            return mergeImages(imageAxial, image3D, imageCoronal, imageSagittal)
                        })
                        .then((mergedImage) => {
                            screenshotCallback(mergedImage)
                        })
            }
        }
    }


    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const rotationVisible = false

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const scaleInPixels = true
    // Set size in CSS pixel space because scaleInPixels defaults to true
    const handleScale = 15
    const handleOpacity = 255

    const initialWindow = 4000
    const initialLevel = 1000

    const widget = vtkResliceCursorWidget.newInstance();
    const initialPlanesState = {...widget.getWidgetState().getPlanes()};
    const viewAttributes = [];

    function initWidgetState(widget) {
        const widgetState = widget.getWidgetState()

        // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
        widgetState
            .getStatesWithLabel('sphere')
            .forEach((handle) => {
                handle.setScale1(handleScale)
                handle.setVisible(false)
            })

        // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
        widgetState
            .getStatesWithLabel('handles')
            .forEach((handle) => handle.setOpacity(handleOpacity))

        widgetState
            .getStatesWithLabel('line')
            .forEach((handle) => {
                handle.setScale3(3, 3, 3)
                handle.setVisible(false)
            })

        // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
        widgetState
            .getStatesWithLabel('rotation')
            .forEach((handle) => handle.setVisible(rotationVisible))

        // set handle colors
        // [1, 0.3, 0], sagittal
        widgetState.getRotationHandleXinY0().setColor3(...getColor256(0))
        widgetState.getRotationHandleXinY1().setColor3(...getColor256(0))
        widgetState.getRotationHandleXinZ0().setColor3(...getColor256(0))
        widgetState.getRotationHandleXinZ1().setColor3(...getColor256(0))
        widgetState.getAxisXinY().setColor3(...getColor256(0))
        widgetState.getAxisXinZ().setColor3(...getColor256(0))

        // [0.3, 0.7, 0.3], // coronal
        widgetState.getRotationHandleYinX0().setColor3(...getColor256(1))
        widgetState.getRotationHandleYinX1().setColor3(...getColor256(1))
        widgetState.getRotationHandleYinZ0().setColor3(...getColor256(1))
        widgetState.getRotationHandleYinZ1().setColor3(...getColor256(1))
        widgetState.getAxisYinX().setColor3(...getColor256(1))
        widgetState.getAxisYinZ().setColor3(...getColor256(1))

        // [0, 0.5, 1], // axial
        widgetState.getRotationHandleZinX0().setColor3(...getColor256(2))
        widgetState.getRotationHandleZinX1().setColor3(...getColor256(2))
        widgetState.getRotationHandleZinY0().setColor3(...getColor256(2))
        widgetState.getRotationHandleZinY1().setColor3(...getColor256(2))
        widgetState.getAxisZinX().setColor3(...getColor256(2))
        widgetState.getAxisZinY().setColor3(...getColor256(2))

        widgetState.getCenterHandle().setOpacity(1)
    }

    function updateReslice(
        interactionContext = {
            viewType: '',
            reslice: null,
            actor: null,
            renderer: null,
            resetFocalPoint: false, // Reset the focal point to the center of the display image
            computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
            // computed. If so, then this offset will be used to keep the focal point position during rotation.
            spheres: null,
            slider: null,
        }
    ) {
        const modified = widget.updateReslicePlane(
            interactionContext.reslice,
            interactionContext.viewType
        );
        if (modified) {
            const resliceAxes = interactionContext.reslice.getResliceAxes();
            // Get returned modified from setter to know if we have to render
            interactionContext.actor.setUserMatrix(resliceAxes);

            if (interactionContext.slider) {
                const planeExtremities = widget.getPlaneExtremities(
                    interactionContext.viewType
                );
                const length = Math.sqrt(
                    vtkMath.distance2BetweenPoints(planeExtremities[0], planeExtremities[1])
                );
                const dist = Math.sqrt(
                    vtkMath.distance2BetweenPoints(
                        planeExtremities[0],
                        widget.getWidgetState().getCenter()
                    )
                );
                interactionContext.slider.min = 0;
                interactionContext.slider.max = length;
                interactionContext.slider.value = dist;
            }
        }
        widget.updateCameraPoints(
            interactionContext.renderer,
            interactionContext.viewType,
            interactionContext.resetFocalPoint,
            interactionContext.computeFocalPointOffset
        )
        return modified
    }

    function updateViews() {
        viewAttributes.forEach((obj, i) => {
            updateReslice({
                viewType: xyzToViewType[i],
                reslice: obj.reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: true,
                computeFocalPointOffset: true,
                resetViewUp: true,
            })
            obj.renderWindow.render()
        })
    }

    function resetCamera() {
        widget.getWidgetState().setPlanes({...initialPlanesState})
        widget.setCenter(widget.getWidgetState().getImage().getCenter())
        updateViews()

        window3D.resetCamera()
    }

    function resetWindowLevel() {
        viewAttributes.forEach((v) => {
            setWindowLevel(v, initialWindow, initialLevel)
        })
    }

    function setWindowLevel(v, window, level) {
        v.resliceActor.getProperty().setColorLevel(level)
        v.resliceActor.getProperty().setColorWindow(window)
        v.renderWindow.getInteractor().render()
    }

    onMount(() => {
        // for DICOM volumes only
        if (volume !== undefined) {
            const image = volume.source

            initWidgetState(widget)
            widget.setImage(image)
            widget.setScaleInPixels(scaleInPixels) // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })

            viewAttributes.forEach((obj, i) => {
                obj.reslice.setInputData(image)
                obj.renderer.addActor(obj.resliceActor)
                const reslice = obj.reslice
                const viewType = xyzToViewType[i]

                obj.interactor.getInteractorStyle().onInteractionEvent(() => {
                    const level = obj.resliceActor.getProperty().getColorLevel()
                    const window = obj.resliceActor.getProperty().getColorWindow()

                    viewAttributes.forEach((v) => {
                        if (v !== obj) {
                            setWindowLevel(v, window, level)
                        }
                    })
                })

                // No need to update plane nor refresh when interaction
                // is on current view. Plane can't be changed with interaction on current
                // view. Refreshes happen automatically with `animation`.
                // Note: Need to refresh also the current view because of adding the mouse wheel
                // to change slicer
                viewAttributes.forEach((v) => {
                    // Store the FocalPoint offset before "interacting".
                    // The offset may have been changed externally when manipulating the camera
                    // or interactorStyle.
                    v.widgetInstance.onStartInteractionEvent(() => {
                        updateReslice({
                            viewType,
                            reslice,
                            actor: obj.resliceActor,
                            renderer: obj.renderer,
                            resetFocalPoint: false,
                            computeFocalPointOffset: true,
                            slider: obj.slider,
                        })
                    })

                    // Interactions in other views may change current plane
                    v.widgetInstance.onInteractionEvent(
                        // canUpdateFocalPoint: Boolean which defines if the focal point can be updated because
                        // the current interaction is a rotation
                        (interactionMethodName) => {
                            const canUpdateFocalPoint =
                                interactionMethodName === InteractionMethodsName.RotateLine;
                            const activeViewType = widget
                                .getWidgetState()
                                .getActiveViewType();
                            const computeFocalPointOffset =
                                activeViewType === viewType || !canUpdateFocalPoint;
                            updateReslice({
                                viewType,
                                reslice,
                                actor: obj.resliceActor,
                                renderer: obj.renderer,
                                resetFocalPoint: false,
                                computeFocalPointOffset,
                                slider: obj.slider,
                            })
                        }
                    )
                })

                updateReslice({
                    viewType,
                    reslice,
                    actor: obj.resliceActor,
                    renderer: obj.renderer,
                    resetFocalPoint: true, // At first initialization, center the focal point to the image center
                    computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
                    slider: obj.slider,
                });

                obj.renderer.resetCamera()
                obj.renderer.getActiveCamera().zoom(1.25)

                obj.interactor.render();
            });
        }
    })
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
        <Window2D bind:maximized={maximized} bind:this={windowAxial} index={0} {scaleInPixels}
                  showToolbar={showLocalToolbar}
                  {viewAttributes} viewMode={ViewMode.AXIAL} {widget}/>
        <Window3D bind:maximized={maximized} bind:models={models} bind:this={window3D}
                  bind:volume={volume} showToolbar={showLocalToolbar}/>
        <Window2D bind:maximized={maximized} bind:this={windowCoronal} index={1} {scaleInPixels}
                  showToolbar={showLocalToolbar}
                  {viewAttributes} viewMode={ViewMode.CORONAL} {widget}/>
        <Window2D bind:maximized={maximized} bind:this={windowSagittal} index={2} {scaleInPixels}
                  showToolbar={showLocalToolbar}
                  {viewAttributes} viewMode={ViewMode.SAGITTAL} {widget}/>
    </div>
    <ToolbarGlobal bind:models={models} bind:volume={volume} {objectListVisible}
                   on:resetCamera={resetCamera} on:resetWindowLevel={resetWindowLevel}
                   on:screenshot={saveScreenshot} showScreenshotButton={screenshotCallback !== null}/>
</div>