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

    export let source

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const rotationVisible = true

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    const scaleInPixels = true
    const handleScale = 15
    const handleOpacity = 255

    const viewAttributes = [];
    const widget = vtkResliceCursorWidget.newInstance();
    const widgetState = widget.getWidgetState();

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    widgetState
        .getStatesWithLabel('sphere')
        .forEach((handle) => handle.setScale1(handleScale))

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    widgetState
        .getStatesWithLabel('handles')
        .forEach((handle) => handle.setOpacity(handleOpacity))

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    widgetState
        .getStatesWithLabel('rotation')
        .forEach((handle) => handle.setVisible(rotationVisible))


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

    const initialPlanesState = {...widgetState.getPlanes()}

    function resetViews() {
        widgetState.setPlanes({...initialPlanesState});
        widget.setCenter(widget.getWidgetState().getImage().getCenter());
        updateViews();
    }

    onMount(() => {
        const image = source
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