<script>
    import {onMount, tick} from 'svelte'

    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Volume';

    import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
    import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';

    import vtkColorTransferFunction from "@kitware/vtk.js/Rendering/Core/ColorTransferFunction";
    import vtkPiecewiseFunction from "@kitware/vtk.js/Common/DataModel/PiecewiseFunction";
    import vtkVolumeMapper from "@kitware/vtk.js/Rendering/Core/VolumeMapper";
    import vtkVolume from "@kitware/vtk.js/Rendering/Core/Volume";
    import vtkPlane from "@kitware/vtk.js/Common/DataModel/Plane";

    import {ViewMode} from "./ViewMode";
    import {createTrackballNoHotkeysStyle} from "./interactorStyles.js";
    import ToolbarLocal from "./ToolbarLocal.svelte";

    let {
        maximized = $bindable(),
        showToolbar,
        models = $bindable(),
        volume = $bindable()
    } = $props();

    let containerElement = $state()

    let clipPlane = undefined
    let clipPlaneNormal = undefined

    let renderer
    let renderWindow

    $effect(() => {
        if (!models) return
        models.map(m => m.visible) // change when model visibility changes

        tick().then(() => {
            if (!renderWindow) return
            renderWindow.render()
        })
    })

    $effect(() => {
        if (!volume) return
        volume.visible // change when volume visibility changes

        tick().then(() => {
            if (!renderWindow) return
            renderWindow.render()
        })
    })

    function createModel(model_resource) {
        const mapper = vtkMapper.newInstance({scalarVisibility: false})
        const actor = vtkActor.newInstance()

        actor.getProperty().setColor(model_resource.params.color)
        actor.getProperty().setOpacity(model_resource.params.opacity)

        actor.setMapper(mapper)
        mapper.setInputData(model_resource.source)

        return actor
    }

    function createVolume(volume_resource) {
        const mapper = vtkVolumeMapper.newInstance()
        const actor = vtkVolume.newInstance()

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

        actor.setMapper(mapper)
        // mapper.setInputConnection(volume_resource.source.getOutputPort(0))
        mapper.setInputData(volume_resource.source)
        mapper.setSampleDistance(0.4)

        actor.getProperty().setRGBTransferFunction(0, lookupTable)
        actor.getProperty().setScalarOpacity(0, piecewiseFunction)
        actor.getProperty().setInterpolationTypeToLinear()

        // - Use shading based on gradient
        // actor.getProperty().setUseGradientOpacity(0, true)
        // - generic good default
        // actor.getProperty().setGradientOpacityMinimumValue(0, 2)
        // actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0)
        // actor.getProperty().setGradientOpacityMaximumValue(0, (4000 - 500) * 0.05)
        // actor.getProperty().setGradientOpacityMaximumValue(0, 200)
        // actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0)

        actor.getProperty().setShade(volume_resource.params.shading)
        actor.getProperty().setAmbient(volume_resource.params.ambient)
        actor.getProperty().setDiffuse(volume_resource.params.diffuse)
        actor.getProperty().setSpecular(volume_resource.params.specular)
        actor.getProperty().setSpecularPower(volume_resource.params.specular_power)

        return actor
    }

    export function resetCamera() {
        if (renderer && renderWindow) {
            const camera = renderer.getActiveCamera()
            camera.setPosition(0, -1, 0)
            camera.setViewUp([0, 0, 1])
            renderer.updateLightsGeometryToFollowCamera()

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

        volume.actor.getProperty().setScalarOpacity(0, piecewiseFunction)

        renderWindow.render()
    }

    export function updateClip(enabled, position) {
        if (enabled) {
            if (!clipPlane) {
                clipPlane = vtkPlane.newInstance()
                clipPlaneNormal = [0, 0, -1]
            }

            const data = volume.source
            const extent = data.getExtent()
            const spacing = data.getSpacing()

            const sizeZ = extent[5] * spacing[2]
            let clipPlanePosition = sizeZ * position / 100

            const clipPlaneOrigin = [
                clipPlanePosition * clipPlaneNormal[0],
                clipPlanePosition * clipPlaneNormal[1],
                clipPlanePosition * clipPlaneNormal[2],
            ]

            clipPlane.setNormal(clipPlaneNormal)
            clipPlane.setOrigin(clipPlaneOrigin)

            if (volume.actor.getMapper().getNumberOfClippingPlanes() === 0) {
                volume.actor.getMapper().addClippingPlane(clipPlane)
            }
        } else {
            volume.actor.getMapper().removeAllClippingPlanes()
        }

        renderWindow.render()
    }

    export function updateClipPlane() {
        const cameraNormal = renderer.getActiveCamera().getViewPlaneNormal()
        clipPlaneNormal = [
            cameraNormal[0] * -1,
            cameraNormal[1] * -1,
            cameraNormal[2] * -1,
        ]

        clipPlane.setNormal(clipPlaneNormal)
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

<div class="k-relative"
     class:k-hidden={maximized !== null && maximized !== ViewMode.THREE_D}
     class:maximized={maximized === ViewMode.THREE_D}>

    <div bind:this={containerElement} style="min-height: 200px; aspect-ratio: 4 / 3"></div>

    {#if showToolbar}
        <ToolbarLocal viewMode={ViewMode.THREE_D} bind:maximized={maximized}/>
    {/if}
</div>

<style>
    .maximized {
        grid-column: span 2;
        grid-row: span 2;
    }
</style>