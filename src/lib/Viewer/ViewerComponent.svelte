<script>
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Volume';

    import {InteractionMethodsName} from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants";
    import vtkMath from '@kitware/vtk.js/Common/Core/Math';
    import vtkResliceCursorWidget from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget";

    import {onMount} from "svelte";

    import {getViewTypes, ViewMode} from "./ViewMode.js";
    import {getColor256} from "../Loader/colors.js";
    import ToolbarGlobal from "./ToolbarGlobal.svelte";
    import Window2D from "./Window2D.svelte";
    import Window3D from "./Window3D.svelte";

    let window3D = $state()
    let windowAxial = $state()
    let windowCoronal = $state()
    let windowSagittal = $state()

    
    /**
     * @typedef {Object} Props
     * @property {any} [models] - A list of resources to load; can be of type VOLUME or MODEL
     * @property {any} volume
     * @property {any} [screenshotCallback]
     * @property {any} [startMaximized] - Should four panels (3D + orthogonal views) be shown on start up? default is true if showing a volume
     */

    /** @type {Props} */
    let {
        models = $bindable([]),
        volume = $bindable(undefined),
        screenshotCallback = null,
        startMaximized = false
    } = $props();

    let maximized = $state.raw((startMaximized || volume === undefined) ? ViewMode.THREE_D : null)

    /* If no volumes are loaded, only show 3D view */
    let showLocalToolbar = (volume !== undefined)

    /* Show object list if more than one model/volume is loaded */
    let objectListVisible = (models.length > 1) || (volume !== undefined)

    /* Toggle model visibility (update actor properties) */
    $effect(() => {
        for (const model of models) {
            if (model.actor !== undefined) {
                model.actor.setVisibility(model.visible)
            }
        }
    });

    /* Toggle volume visibility (update actor properties) */
    $effect(() => {
        if (volume !== undefined && volume.actor !== undefined) {
            volume.actor.setVisibility(volume.visible)
        }
    })

    async function createBlob(imageData) {
        const image = Object.assign(new Image(), {src: imageData});
        await new Promise(resolve => image.addEventListener('load', () => resolve()));

        const canvas = Object.assign(document.createElement('canvas'), {
            width: image.width,
            height: image.height
        })
        const context = canvas.getContext('2d');
        context.imageSmoothingEnabled = false;
        context.drawImage(image, 0, 0);

        return await new Promise(resolve => canvas.toBlob((blob) => resolve(blob)))
    }

    async function createMontage(axial, threeD, coronal, sagittal) {
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

        return await new Promise(resolve => canvas.toBlob((blob) => resolve(blob)))
    }

    function saveScreenshot() {
        if (screenshotCallback !== null) {
            switch (maximized) {
                case ViewMode.THREE_D:
                    window3D.saveScreenshot().then((image) => {
                        return createBlob(image)
                    }).then((blob) => {
                        screenshotCallback(blob)
                    })
                    break;
                case ViewMode.AXIAL:
                    windowAxial.saveScreenshot().then((image) => {
                        return createBlob(image)
                    }).then((blob) => {
                        screenshotCallback(blob)
                    })
                    break;
                case ViewMode.CORONAL:
                    windowCoronal.saveScreenshot().then((image) => {
                        return createBlob(image)
                    }).then((blob) => {
                        screenshotCallback(blob)
                    })
                    break;
                case ViewMode.SAGITTAL:
                    windowSagittal.saveScreenshot().then((image) => {
                        return createBlob(image)
                    }).then((blob) => {
                        screenshotCallback(blob)
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
                            return createMontage(imageAxial, image3D, imageCoronal, imageSagittal)
                        })
                        .then((blob) => {
                            screenshotCallback(blob)
                        })
            }
        }
    }


    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const rotationVisible = false
    let hideAxisTimeout

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const scaleInPixels = true
    // Set size in CSS pixel space because scaleInPixels defaults to true
    const handleScale = 15
    const handleOpacity = 255

    let initialWindow = 4000
    let initialLevel = 1000

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
                viewType: getViewTypes(i),
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
        if (volume !== undefined) {
            widget.getWidgetState().setPlanes({...initialPlanesState})
            widget.setCenter(widget.getWidgetState().getImage().getCenter())
            updateViews()
        }

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

    function updateShift(value) {
        window3D.updateShift(value)
    }

    function updateClipPlane() {
        window3D.updateClipPlane()
    }

    function pointerEntered() {
        clearTimeout(hideAxisTimeout)

        windowAxial.showAxisWidget()
        windowCoronal.showAxisWidget()
        windowSagittal.showAxisWidget()
    }

    function pointerLeft() {
        hideAxisTimeout = setTimeout(() => {
            windowAxial.hideAxisWidget()
            windowCoronal.hideAxisWidget()
            windowSagittal.hideAxisWidget()
        }, 1000)
    }

    onMount(() => {
        if (volume !== undefined) {
            // add visible property (will be toggleable in object list)
            volume.visible = true
            volume.clip = {
                enabled: false,
                min: 0,
                // max: ...,
                // position: ...,
                planeNormal: [0, 0, -1] // default to Z-axis
            }

            initialWindow = volume.params.window
            initialLevel = volume.params.level

            initWidgetState(widget)
            widget.setImage(volume.source)
            widget.setScaleInPixels(scaleInPixels) // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })

            viewAttributes.forEach((obj, i) => {
                obj.reslice.setInputData(volume.source)
                obj.renderer.addActor(obj.resliceActor)
                const reslice = obj.reslice
                const viewType = getViewTypes(i)

                setWindowLevel(obj, initialWindow, initialLevel)

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

<div class="k-relative k-w-full k-h-full">
    <div class="k-grid k-grid-cols-2">
        {#if volume}
            <Window2D bind:this={windowAxial} bind:maximized={maximized} {scaleInPixels}
                      {pointerEntered} {pointerLeft}
                      {viewAttributes} viewMode={ViewMode.AXIAL} {widget}/>
        {/if}
        <Window3D bind:models={models} bind:maximized={maximized} bind:this={window3D}
                  bind:volume={volume} showToolbar={showLocalToolbar}/>
        {#if volume}
            <Window2D bind:this={windowCoronal} bind:maximized={maximized} {scaleInPixels}
                      {pointerEntered} {pointerLeft}
                      {viewAttributes} viewMode={ViewMode.CORONAL} {widget}/>
            <Window2D bind:this={windowSagittal} bind:maximized={maximized} {scaleInPixels}
                      {pointerEntered} {pointerLeft}
                      {viewAttributes} viewMode={ViewMode.SAGITTAL} {widget}/>
        {/if}
    </div>
    <ToolbarGlobal bind:models={models} bind:volume={volume} {objectListVisible}
                   {resetCamera} {resetWindowLevel} screenshot={saveScreenshot}
                   {updateShift} {updateClipPlane}
                   showWindowLevelButton={volume !== undefined}
                   showScreenshotButton={screenshotCallback !== null}
                   toolbarBackground={volume === undefined}/>
</div>