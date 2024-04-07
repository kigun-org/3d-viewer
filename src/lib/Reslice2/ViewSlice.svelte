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


    function handleSliderChange(obj, i, widget, viewAttributes) {
        return (ev) => {
            const newDistanceToP1 = ev.target.value;
            const dirProj = widget.getWidgetState().getPlanes()[
                xyzToViewType[i]
                ].normal;
            const planeExtremities = widget.getPlaneExtremities(xyzToViewType[i]);
            const newCenter = vtkMath.multiplyAccumulate(
                planeExtremities[0],
                dirProj,
                Number(newDistanceToP1),
                []
            );
            widget.setCenter(newCenter);
            obj.widgetInstance.invokeInteractionEvent(
                obj.widgetInstance.getActiveInteraction()
            );
            viewAttributes.forEach((obj2) => {
                obj2.interactor.render();
            });
        }
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
        const obj = {
            renderWindow: grw.getRenderWindow(),
            renderer: grw.getRenderer(),
            GLWindow: grw.getApiSpecificRenderWindow(),
            interactor: grw.getInteractor(),
            widgetManager: vtkWidgetManager.newInstance(),
            reslice: vtkImageReslice.newInstance(),
            orientationWidget: vtkOrientationMarkerWidget.newInstance({
                actor: createAxes(),
                interactor: grw.getInteractor(),
            }),
            slider: slider
        };

        obj.renderer.getActiveCamera().setParallelProjection(true);
        obj.renderer.setBackground(...viewColors[index]);
        obj.renderWindow.addRenderer(obj.renderer);
        obj.renderWindow.addView(obj.GLWindow);
        obj.renderWindow.setInteractor(obj.interactor);
        obj.interactor.setView(obj.GLWindow);
        obj.interactor.initialize();
        obj.interactor.bindEvents(element);
        obj.widgetManager.setRenderer(obj.renderer);

        obj.interactor.setInteractorStyle(windowLevelEnabled ?
            vtkInteractorStyleImage.newInstance()
            : vtkInteractorStyleTrackballCamera.newInstance()
        );
        obj.widgetInstance = obj.widgetManager.addWidget(widget, xyzToViewType[index]);
        obj.widgetInstance.setEnableTranslation(translationEnabled)
        obj.widgetInstance.setEnableRotation(rotationEnabled)
        obj.widgetInstance.setScaleInPixels(scaleInPixels)
        obj.widgetInstance.setKeepOrthogonality(keepOrthogonality)
        obj.widgetInstance.setCursorStyles(appCursorStyles)
        obj.widgetManager.enablePicking();
        // Use to update all renderers buffer when actors are moved
        obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);

        obj.reslice.setSlabMode(slabMode); // On change: updateViews()
        obj.reslice.setSlabNumberOfSlices(slabNumberOfSlices); // On change: updateViews()
        obj.reslice.setInterpolationMode(interpolationMode);
        obj.reslice.setTransformInputSampling(false);
        obj.reslice.setAutoCropOutput(true);
        obj.reslice.setOutputDimensionality(2);
        obj.resliceMapper = vtkImageMapper.newInstance();
        obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
        obj.resliceActor = vtkImageSlice.newInstance();
        obj.resliceActor.setMapper(obj.resliceMapper);
        obj.resliceActor.getProperty().setColorWindow(initialWindow);
        obj.resliceActor.getProperty().setColorLevel(initialLevel);

        obj.orientationWidget.setEnabled(true);
        obj.orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        );
        obj.orientationWidget.setViewportSize(0.15);
        obj.orientationWidget.setMinPixelSize(100);
        obj.orientationWidget.setMaxPixelSize(300);

        slider.addEventListener('change', handleSliderChange(obj, index, widget, viewAttributes))

        viewAttributes.push(obj);
    })
</script>

<div>
    <div bind:this={element}></div>
    <input bind:this={slider} max="200" min="0" style="width: 100%" type="range">
</div>
