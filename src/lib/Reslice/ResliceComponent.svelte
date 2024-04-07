<script>
    import '@kitware/vtk.js/favicon';

    // Load the rendering pieces we want to use (for both WebGL and WebGPU)
    import '@kitware/vtk.js/Rendering/Profiles/All';

    import vtkMath from '@kitware/vtk.js/Common/Core/Math';
    import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';

    import {vec3} from 'gl-matrix';

    import {
        xyzToViewType,
        InteractionMethodsName,
    } from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants';

    // Force the loading of HttpDataAccessHelper to support gzip decompression
    import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
    import {onMount} from "svelte";
    import ViewSlice from "./ViewSlice.svelte";
    import {getColors256} from "./colors.js";

    export let image

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const rotationVisible = false

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const scaleInPixels = true
    // Set size in CSS pixel space because scaleInPixels defaults to true
    const handleScale = 15
    const handleOpacity = 255

    const viewAttributes = [];
    const widget = vtkResliceCursorWidget.newInstance();
    const widgetState = widget.getWidgetState();
    const initialPlanesState = {...widgetState.getPlanes()}

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
    widgetState.getRotationHandleXinY0().setColor3(...getColors256(0))
    widgetState.getRotationHandleXinY1().setColor3(...getColors256(0))
    widgetState.getRotationHandleXinZ0().setColor3(...getColors256(0))
    widgetState.getRotationHandleXinZ1().setColor3(...getColors256(0))
    widgetState.getAxisXinY().setColor3(...getColors256(0))
    widgetState.getAxisXinZ().setColor3(...getColors256(0))

    // [0.3, 0.7, 0.3], // coronal
    widgetState.getRotationHandleYinX0().setColor3(...getColors256(1))
    widgetState.getRotationHandleYinX1().setColor3(...getColors256(1))
    widgetState.getRotationHandleYinZ0().setColor3(...getColors256(1))
    widgetState.getRotationHandleYinZ1().setColor3(...getColors256(1))
    widgetState.getAxisYinX().setColor3(...getColors256(1))
    widgetState.getAxisYinZ().setColor3(...getColors256(1))

    // [0, 0.5, 1], // axial
    widgetState.getRotationHandleZinX0().setColor3(...getColors256(2))
    widgetState.getRotationHandleZinX1().setColor3(...getColors256(2))
    widgetState.getRotationHandleZinY0().setColor3(...getColors256(2))
    widgetState.getRotationHandleZinY1().setColor3(...getColors256(2))
    widgetState.getAxisZinX().setColor3(...getColors256(2))
    widgetState.getAxisZinY().setColor3(...getColors256(2))

    widgetState.getCenterHandle().setOpacity(1)


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
                        widgetState.getCenter()
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
        );
        return modified;
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
            });
            obj.renderWindow.render()
        });
    }

    function resetViews() {
        widgetState.setPlanes({...initialPlanesState});
        widget.setCenter(widget.getWidgetState().getImage().getCenter());
        updateViews();
    }

    onMount(() => {
        widget.setImage(image)
        widget.setScaleInPixels(scaleInPixels) // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })

        const maxSlabNumberOfSlices = vec3.length(image.getDimensions()) // set max number of slices to slider.

        viewAttributes.forEach((obj, i) => {
            obj.reslice.setInputData(image);
            obj.renderer.addActor(obj.resliceActor);
            const reslice = obj.reslice;
            const viewType = xyzToViewType[i];

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
                    });
                });

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
                        });
                    }
                );
            });

            updateReslice({
                viewType,
                reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: true, // At first initialization, center the focal point to the image center
                computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
                slider: obj.slider,
            });

            obj.renderer.resetCamera();
            obj.renderer.getActiveCamera().zoom(1.25);

            obj.interactor.render();
        });
    })
</script>

<button on:click={resetViews}>Reset</button>

<div style="display: flex">
    <main id="reslice" style="display: grid; grid-template-columns: repeat(3, 1fr)">
        <ViewSlice index={0} {viewAttributes} {widget} {scaleInPixels} />
        <ViewSlice index={1} {viewAttributes} {widget} {scaleInPixels} />
        <ViewSlice index={2} {viewAttributes} {widget} {scaleInPixels} />
    </main>
</div>