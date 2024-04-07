<script>
    import {onMount} from "svelte";
    import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow.js";
    import vtkWidgetManager from "@kitware/vtk.js/Widgets/Core/WidgetManager.js";
    import vtkImageReslice from "@kitware/vtk.js/Imaging/Core/ImageReslice.js";
    import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget.js";
    import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage.js";
    import vtkInteractorStyleTrackballCamera from "@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera.js";
    import {xyzToViewType} from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants.js";
    import {CaptureOn} from "@kitware/vtk.js/Widgets/Core/WidgetManager/Constants.js";
    import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper.js";
    import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice.js";
    import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor.js";
    import {SlabMode} from "@kitware/vtk.js/Imaging/Core/ImageReslice/Constants.js";
    import {InterpolationMode} from "@kitware/vtk.js/Imaging/Core/AbstractImageInterpolator/Constants.js";
    import vtkMath from '@kitware/vtk.js/Common/Core/Math';

    export let viewAttributes

    export let index

    export let widget

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    export let scaleInPixels

    let state

    let element
    let slider

    const translationEnabled = true

    const rotationEnabled = true
    const keepOrthogonality = true


    // [SlabMode.MIN, SlabMode.MAX, SlabMode.MEAN, SlabMode.SUM]
    const slabMode = SlabMode.MEAN
    const slabNumberOfSlices = 1
    // [InterpolationMode.NEAREST, InterpolationMode.LINEAR, InterpolationMode.CUBIC]
    const interpolationMode = InterpolationMode.NEAREST
    const windowLevelEnabled = true

    const initialWindow = 4000
    const initialLevel = 1000

    const appCursorStyles = {
        translateCenter: 'move',
        rotateLine: 'alias',
        translateAxis: 'pointer',
        default: 'default',
    }

    const viewColors = [
        [0.5, 0.25, 0.25], // sagittal
        [0.25, 0.5, 0.25], // coronal
        [0.25, 0.25, 0.5], // axial
        [0.25, 0.25, 0.25], // 3D
    ]


    function createAxes() {
        const result = vtkAnnotatedCubeActor.newInstance();
        result.setDefaultStyle({
            text: '+X',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            fontColor: 'black',
            fontSizeScale: (res) => res / 2,
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            faceRotation: 0,
            edgeThickness: 0.1,
            edgeColor: 'black',
            resolution: 400,
        });
        // result.setXPlusFaceProperty({ text: '+X' });
        result.setXMinusFaceProperty({
            text: '-X',
            faceColor: createRGBStringFromRGBValues(viewColors[0]),
            faceRotation: 90,
            fontStyle: 'italic',
        });
        result.setYPlusFaceProperty({
            text: '+Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            fontSizeScale: (res) => res / 4,
        });
        result.setYMinusFaceProperty({
            text: '-Y',
            faceColor: createRGBStringFromRGBValues(viewColors[1]),
            fontColor: 'white',
        });
        result.setZPlusFaceProperty({
            text: '+Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
        });
        result.setZMinusFaceProperty({
            text: '-Z',
            faceColor: createRGBStringFromRGBValues(viewColors[2]),
            faceRotation: 45,
        });

        return result
    }

    function slicerChanged(ev) {
        const newDistanceToP1 = ev.target.value;
        const dirProj = widget.getWidgetState().getPlanes()[
            xyzToViewType[index]
            ].normal;
        const planeExtremities = widget.getPlaneExtremities(xyzToViewType[index]);
        const newCenter = vtkMath.multiplyAccumulate(
            planeExtremities[0],
            dirProj,
            Number(newDistanceToP1),
            []
        );
        widget.setCenter(newCenter);
        state.widgetInstance.invokeInteractionEvent(
            state.widgetInstance.getActiveInteraction()
        );
        viewAttributes.forEach((obj2) => {
            obj2.interactor.render();
        });
    }


    function createRGBStringFromRGBValues(rgb) {
        if (rgb.length !== 3) {
            return 'rgb(0, 0, 0)';
        }
        return `rgb(${(rgb[0] * 192).toString()}, ${(rgb[1] * 192).toString()}, ${(
            rgb[2] * 192
        ).toString()})`;
    }

    onMount(() => {
        const grw = vtkGenericRenderWindow.newInstance();
        grw.setContainer(element);
        grw.resize();
        state = {
            renderWindow: grw.getRenderWindow(),
            renderer: grw.getRenderer(),
            GLWindow: grw.getApiSpecificRenderWindow(),
            interactor: grw.getInteractor(),
            widgetManager: vtkWidgetManager.newInstance(),
            reslice: vtkImageReslice.newInstance(),
            resliceMapper: vtkImageMapper.newInstance(),
            resliceActor: vtkImageSlice.newInstance(),
            orientationWidget: vtkOrientationMarkerWidget.newInstance({
                actor: createAxes(),
                interactor: grw.getInteractor(),
            }),
            slider: slider
        };

        state.renderer.getActiveCamera().setParallelProjection(true);
        state.renderer.setBackground(...viewColors[index]);
        state.renderWindow.addRenderer(state.renderer);
        state.renderWindow.addView(state.GLWindow);
        state.renderWindow.setInteractor(state.interactor);
        state.interactor.setView(state.GLWindow);
        state.interactor.initialize();
        state.interactor.bindEvents(element);
        state.widgetManager.setRenderer(state.renderer);
        state.interactor.setInteractorStyle(windowLevelEnabled ?
            vtkInteractorStyleImage.newInstance()
            : vtkInteractorStyleTrackballCamera.newInstance()
        );

        state.widgetInstance = state.widgetManager.addWidget(widget, xyzToViewType[index]);
        state.widgetInstance.setEnableTranslation(translationEnabled)
        state.widgetInstance.setEnableRotation(rotationEnabled)
        state.widgetInstance.setScaleInPixels(scaleInPixels)
        state.widgetInstance.setKeepOrthogonality(keepOrthogonality)
        state.widgetInstance.setCursorStyles(appCursorStyles)
        state.widgetManager.enablePicking();
        // Use to update all renderers buffer when actors are moved
        state.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);

        state.reslice.setSlabMode(slabMode); // On change: updateViews()
        state.reslice.setSlabNumberOfSlices(slabNumberOfSlices); // On change: updateViews()
        state.reslice.setInterpolationMode(interpolationMode);
        state.reslice.setTransformInputSampling(false);
        state.reslice.setAutoCropOutput(true);
        state.reslice.setOutputDimensionality(2);

        state.resliceMapper.setInputConnection(state.reslice.getOutputPort());

        state.resliceActor.setMapper(state.resliceMapper);
        state.resliceActor.getProperty().setColorWindow(initialWindow);
        state.resliceActor.getProperty().setColorLevel(initialLevel);

        state.orientationWidget.setEnabled(true);
        state.orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        );
        state.orientationWidget.setViewportSize(0.15);
        state.orientationWidget.setMinPixelSize(100);
        state.orientationWidget.setMaxPixelSize(300);

        viewAttributes.push(state);
    })
</script>

<div>
    <div bind:this={element}></div>
    <input bind:this={slider} on:change={slicerChanged} type="range" min="0" max="200">
</div>

<style>
    input {
        width: 100%
    }
</style>