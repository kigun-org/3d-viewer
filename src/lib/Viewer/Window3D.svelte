<script>
    import { onMount } from 'svelte'

    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Volume';

    import vtkActor           from '@kitware/vtk.js/Rendering/Core/Actor';
    import vtkMapper          from '@kitware/vtk.js/Rendering/Core/Mapper';
    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';

    import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
    import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
    import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
    import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";

    import {ViewMode} from "./ViewMode";
    import {createTrackballNoHotkeysStyle} from "./interactorStyles.js";
    import ToolbarLocal from "./ToolbarLocal.svelte";

    let containerElement

    export let maximized
    export let showToolbar

    export let models
    export let volume

    let vtk_volume

    let renderer
    let renderWindow

    $: models, renderWindow && renderWindow.render()
    $: volume, renderWindow && renderWindow.render()

    function createModel(model_resource) {
        const mapper = vtkMapper.newInstance({ scalarVisibility: false });
        const actor = vtkActor.newInstance();

        // define default (backup) colors

        actor.getProperty().setColor(model_resource.params.color);
        actor.getProperty().setOpacity(model_resource.params.opacity);

        actor.setMapper(mapper);
        mapper.setInputData(model_resource.source);

        return actor
    }

    function createVolume(volume_resource) {
        const mapper = vtkVolumeMapper.newInstance()
        vtk_volume = vtkVolume.newInstance()

        // const sourceData = volume_resource.getOutputData(0)
        // const dataArray =
        //     sourceData.getPointData().getScalars() || sourceData.getPointData().getArrays()[0];
        // const dataRange = dataArray.getRange()

        const lookupTable = vtkColorTransferFunction.newInstance()
        Array.from(volume_resource.params.color_transfer).forEach((e) => {
            lookupTable.addRGBPoint(e[0], e[1], e[2], e[3])
        })

        const piecewiseFunction = vtkPiecewiseFunction.newInstance()
        Array.from(volume_resource.params.piecewise).forEach((e) => {
            piecewiseFunction.addPoint(e[0], e[1])
        })

        vtk_volume.setMapper(mapper)
        // mapper.setInputConnection(volume_resource.source.getOutputPort(0))
        mapper.setInputData(volume_resource.source)
        mapper.setSampleDistance(0.4)

        vtk_volume.getProperty().setRGBTransferFunction(0, lookupTable)
        vtk_volume.getProperty().setScalarOpacity(0, piecewiseFunction)
        vtk_volume.getProperty().setInterpolationTypeToLinear()

        // - Use shading based on gradient
        // vtk_volume.getProperty().setUseGradientOpacity(0, true)
        // - generic good default
        // vtk_volume.getProperty().setGradientOpacityMinimumValue(0, 2)
        // vtk_volume.getProperty().setGradientOpacityMinimumOpacity(0, 0.0)
        // vtk_volume.getProperty().setGradientOpacityMaximumValue(0, (4000 - 500) * 0.05)
        // vtk_volume.getProperty().setGradientOpacityMaximumValue(0, 200)
        // vtk_volume.getProperty().setGradientOpacityMaximumOpacity(0, 1.0)

        vtk_volume.getProperty().setShade(volume_resource.params.shading)
        vtk_volume.getProperty().setAmbient(volume_resource.params.ambient)
        vtk_volume.getProperty().setDiffuse(volume_resource.params.diffuse)
        vtk_volume.getProperty().setSpecular(volume_resource.params.specular)
        vtk_volume.getProperty().setSpecularPower(volume_resource.params.specular_power)

        return vtk_volume
    }

    export function resetCamera() {
        if (renderer && renderWindow) {
            if (volume !== undefined) {
                const camera = renderer.getActiveCamera()
                camera.setPosition(0,-1,0)
                camera.setViewUp([0,0,1])
                renderer.updateLightsGeometryToFollowCamera()
            }

            renderer.resetCamera()
            renderer.getActiveCamera().zoom(1.5)

            renderWindow.render()
        }
    }

    export function updateShift(newValue) {
        const piecewiseFunction = vtkPiecewiseFunction.newInstance()
        Array.from(volume.params.piecewise).forEach((e) => {
            piecewiseFunction.addPoint(e[0] + newValue, e[1])
        })

        vtk_volume.getProperty().setScalarOpacity(0, piecewiseFunction);

        renderWindow.render()
    }

    export function saveScreenshot() {
        return renderWindow.captureImages()[0]
    }

    onMount(() => {
        const genericRenderWindow = vtkGenericRenderWindow.newInstance();
        genericRenderWindow.setContainer(containerElement)
        genericRenderWindow.resize()

        renderer = genericRenderWindow.getRenderer();
        renderWindow = genericRenderWindow.getRenderWindow();

        const iStyle = createTrackballNoHotkeysStyle()
        renderWindow.getInteractor().setInteractorStyle(iStyle)

        renderer.setBackground([0.9, 0.9, 0.9]);
        const camera = renderer.getActiveCamera()
        camera.setParallelProjection(true)

        for (const model of models) {
            model.actor = createModel(model)
            renderer.addActor(model.actor)
        }

        if (volume !== undefined) {
            volume.actor = createVolume(volume)
            renderer.addVolume(volume.actor)
        }

        resetCamera()
    })
</script>

<div style="position: relative"
     class:maximized={maximized === ViewMode.THREE_D}
     class:hidden={maximized !== null && maximized !== ViewMode.THREE_D}>

    <div bind:this={containerElement} style="min-height: 200px; aspect-ratio: 4 / 3"></div>

    {#if showToolbar}
    <ToolbarLocal viewMode={ViewMode.THREE_D} bind:maximized={maximized} />
    {/if}
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