<script>
    import {onMount} from 'svelte'

    import '@kitware/vtk.js/Rendering/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/Profiles/Volume';

    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';

    import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
    import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";

    import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
    import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";

    import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
    import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
    import {SlabMode} from "@kitware/vtk.js/Imaging/Core/ImageReslice/Constants";
    import {SlicingMode} from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";

    import LocalToolbar from "./LocalToolbar.svelte";
    import vtkCutter from "@kitware/vtk.js/Filters/Core/Cutter";
    import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
    import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
    import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";
    import {createImageNoHotkeysStyle} from "./interactorStyles.js";

    export let id

    export let maximized
    export let viewMode
    export let showViewMode

    export let models
    export let volumes

    let renderer
    let renderWindow

    function createVolumeSlice(volume_resource) {
        // const reslice = vtkImageReslice.newInstance();
        // reslice.setSlabMode(SlabMode.MEAN);
        // reslice.setSlabNumberOfSlices(1);
        // reslice.setTransformInputSampling(false);
        // reslice.setAutoCropOutput(true);
        // reslice.setOutputDimensionality(2);

        const resliceMapper = vtkImageMapper.newInstance();
        // resliceMapper.setInputConnection(volume_resource.source.getOutputPort())
        resliceMapper.setInputData(volume_resource.source)
        resliceMapper.setSliceAtFocalPoint(true);
        resliceMapper.setSlicingMode(viewMode.slicing_mode);

        const resliceActor = vtkImageSlice.newInstance();
        resliceActor.setMapper(resliceMapper);

        resliceActor.getProperty().setColorWindow(4000);
        resliceActor.getProperty().setColorLevel(1000);

        return resliceActor
    }

    function resetCamera() {
        renderer.resetCamera();
        renderer.getActiveCamera().zoom(1.25);
        renderWindow.render();
    }

    function resetWL() {
        // resliceActor.getProperty().setColorWindow(4000);
        // resliceActor.getProperty().setColorLevel(1000);
    }

    export function saveScreenshot() {
        return renderWindow.captureImages()[0]
    }

    onMount(() => {
        // ----------------------------------------------------------------------------
        // Standard rendering code setup
        // ----------------------------------------------------------------------------

        const container = document.getElementById(id);
        const openGLRenderWindow = vtkGenericRenderWindow.newInstance();
        openGLRenderWindow.setContainer(container)
        openGLRenderWindow.resize()

        renderer = openGLRenderWindow.getRenderer();
        renderWindow = openGLRenderWindow.getRenderWindow();

        const iStyle = createImageNoHotkeysStyle()
        renderWindow.getInteractor().setInteractorStyle(iStyle)

        renderer.setBackground([0.2, 0.2, 0.25]);
        // renderer camera to parallel projection
        const camera = renderer.getActiveCamera()
        camera.setParallelProjection(true)

        camera.setPosition(...viewMode.cameraPosition)
        camera.setViewUp(...viewMode.cameraUp)

        const resizeObserver = new ResizeObserver((_) => {
            openGLRenderWindow.resize()
        });
        resizeObserver.observe(container)

        if (volume !== undefined) {
            const actor = createVolumeSlice(volume)
            renderer.addActor(actor)
        }

        resetCamera()
    })
</script>

<div style="position: relative"
     class:maximized={maximized === viewMode}
     class:hidden={maximized !== null && maximized !== viewMode}>
    <div {id} style="min-height: 200px; aspect-ratio: 3 / 2; background-color: #cde"></div>

    <LocalToolbar viewMode={viewMode} {showViewMode} bind:maximized={maximized}
                  on:resetCamera={resetCamera} on:resetWL={resetWL}  />
</div>

<style>
    .maximized {
        grid-column: span 2;
        grid-row: span 2;
    }

    .hidden {
        display: none;
    }
</style>