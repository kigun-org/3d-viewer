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

    function createModelSlice(model_resource) {
        const slicePlane = vtkPlane.newInstance()
        slicePlane.setNormal(viewMode.cameraPosition)
        slicePlane.setOrigin(0, 0, 0)

        const cutter = vtkCutter.newInstance();
        cutter.setInputData(model_resource.source)
        cutter.setCutFunction(slicePlane)

        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(cutter.getOutputPort());

        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        actor.getProperty().setColor(model_resource.params.color);
        actor.getProperty().setOpacity(model_resource.params.opacity);

        return actor
    }

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

        // // create axes
        // const axes = vtkAnnotatedCubeActor.newInstance();
        // axes.setDefaultStyle({
        //     text: '+X',
        //     fontStyle: 'bold',
        //     fontFamily: 'Arial',
        //     fontColor: 'black',
        //     fontSizeScale: (res) => res / 2,
        //     faceColor: 'rgb(255, 0, 0)',
        //     faceRotation: 0,
        //     edgeThickness: 0.1,
        //     edgeColor: 'black',
        //     resolution: 400,
        // });
        // // axes.setXPlusFaceProperty({ text: '+X' });
        // axes.setXMinusFaceProperty({
        //     text: '-X',
        //     faceColor: 'rgb(255, 0, 0)',
        //     faceRotation: 90,
        //     fontStyle: 'italic',
        // });
        // axes.setYPlusFaceProperty({
        //     text: '+Y',
        //     faceColor: 'rgb(0, 255, 0)',
        //     fontSizeScale: (res) => res / 4,
        // });
        // axes.setYMinusFaceProperty({
        //     text: '-Y',
        //     faceColor: 'rgb(0, 255, 0)',
        //     fontColor: 'white',
        // });
        // axes.setZPlusFaceProperty({
        //     text: '+Z',
        //     faceColor: 'rgb(0, 0, 255)',
        // });
        // axes.setZMinusFaceProperty({
        //     text: '-Z',
        //     faceColor: 'rgb(0, 0, 255)',
        //     faceRotation: 45,
        // });
        //
        // // create orientation widget
        // const orientationWidget = vtkOrientationMarkerWidget.newInstance({
        //     actor: axes,
        //     interactor: renderWindow.getInteractor(),
        // });
        // orientationWidget.setEnabled(true);
        // orientationWidget.setViewportCorner(
        //     vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        // );
        // orientationWidget.setViewportSize(0.15);
        // orientationWidget.setMinPixelSize(100);
        // orientationWidget.setMaxPixelSize(300);

        const resizeObserver = new ResizeObserver((_) => {
            openGLRenderWindow.resize()
        });
        resizeObserver.observe(container)

        for (const model of models) {
            const actor = createModelSlice(model)
            renderer.addActor(actor)
        }

        for (const volume of volumes) {
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