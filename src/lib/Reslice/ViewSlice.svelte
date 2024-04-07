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
    import {getColors1, createRGBStringFromRGBValues} from './colors';

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

    function createAxes() {
        const result = vtkAnnotatedCubeActor.newInstance();
        result.setDefaultStyle({
            fontStyle: 'bold',
            fontFamily: 'Arial',
            fontColor: 'black',
            fontSizeScale: (res) => res / 2,
            faceRotation: 0,
            edgeThickness: 0.1,
            edgeColor: 'black',
            resolution: 400,
        });
        result.setXPlusFaceProperty({
            text: '+X',
            faceColor: createRGBStringFromRGBValues(0),
        });
        result.setXMinusFaceProperty({
            text: '-X',
            faceColor: createRGBStringFromRGBValues(0),
        });
        result.setYPlusFaceProperty({
            text: '+Y',
            faceColor: createRGBStringFromRGBValues(1),
        });
        result.setYMinusFaceProperty({
            text: '-Y',
            faceColor: createRGBStringFromRGBValues(1),
        });
        result.setZPlusFaceProperty({
            text: '+Z',
            faceColor: createRGBStringFromRGBValues(2),
        });
        result.setZMinusFaceProperty({
            text: '-Z',
            faceColor: createRGBStringFromRGBValues(2),
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

    function handlePointerEnter() {
        if (index === 0) {
            widget.getWidgetState().getRotationHandleYinX0().setVisible(true)
            widget.getWidgetState().getRotationHandleYinX1().setVisible(true)
            widget.getWidgetState().getRotationHandleZinX0().setVisible(true)
            widget.getWidgetState().getRotationHandleZinX1().setVisible(true)
            widget.getWidgetState().getCenterHandle().setVisible(true)
            widget.getWidgetState().getAxisYinX().setScale3(3, 3, 3)
            widget.getWidgetState().getAxisZinX().setScale3(3, 3, 3)
        } else {
            widget.getWidgetState().getAxisYinX().setScale3(0.75, 0.75, 0.75)
            widget.getWidgetState().getAxisZinX().setScale3(0.75, 0.75, 0.75)
        }
        widget.getWidgetState().getAxisYinX().setVisible(true)
        widget.getWidgetState().getAxisZinX().setVisible(true)

        if (index === 1) {
            widget.getWidgetState().getRotationHandleXinY0().setVisible(true)
            widget.getWidgetState().getRotationHandleXinY1().setVisible(true)
            widget.getWidgetState().getRotationHandleZinY0().setVisible(true)
            widget.getWidgetState().getRotationHandleZinY1().setVisible(true)
            widget.getWidgetState().getCenterHandle().setVisible(true)
            widget.getWidgetState().getAxisXinY().setScale3(3, 3, 3)
            widget.getWidgetState().getAxisZinY().setScale3(3, 3, 3)
        } else {
            widget.getWidgetState().getAxisXinY().setScale3(0.75, 0.75, 0.75)
            widget.getWidgetState().getAxisZinY().setScale3(0.75, 0.75, 0.75)

        }
        widget.getWidgetState().getAxisXinY().setVisible(true)
        widget.getWidgetState().getAxisZinY().setVisible(true)

        if (index === 2) {
            widget.getWidgetState().getRotationHandleXinZ0().setVisible(true)
            widget.getWidgetState().getRotationHandleXinZ1().setVisible(true)
            widget.getWidgetState().getRotationHandleYinZ0().setVisible(true)
            widget.getWidgetState().getRotationHandleYinZ1().setVisible(true)
            widget.getWidgetState().getCenterHandle().setVisible(true)
            widget.getWidgetState().getAxisXinZ().setScale3(3, 3, 3)
            widget.getWidgetState().getAxisYinZ().setScale3(3, 3, 3)
        } else {
            widget.getWidgetState().getAxisXinZ().setScale3(0.75, 0.75, 0.75)
            widget.getWidgetState().getAxisYinZ().setScale3(0.75, 0.75, 0.75)
        }
        widget.getWidgetState().getAxisXinZ().setVisible(true)
        widget.getWidgetState().getAxisYinZ().setVisible(true)

        // low quality while scrolling
        viewAttributes.forEach((obj) => {
            obj.reslice.setInterpolationMode(InterpolationMode.NEAREST)
            obj.interactor.render()
        })
    }

    function handlePointerLeave() {
        // i === 0
        widget.getWidgetState().getAxisYinX().setVisible(false)
        widget.getWidgetState().getAxisZinX().setVisible(false)
        widget.getWidgetState().getRotationHandleYinX0().setVisible(false)
        widget.getWidgetState().getRotationHandleYinX1().setVisible(false)
        widget.getWidgetState().getRotationHandleZinX0().setVisible(false)
        widget.getWidgetState().getRotationHandleZinX1().setVisible(false)
        widget.getWidgetState().getCenterHandle().setVisible(false)

        // i === 1
        widget.getWidgetState().getAxisXinY().setVisible(false)
        widget.getWidgetState().getAxisZinY().setVisible(false)
        widget.getWidgetState().getRotationHandleXinY0().setVisible(false)
        widget.getWidgetState().getRotationHandleXinY1().setVisible(false)
        widget.getWidgetState().getRotationHandleZinY0().setVisible(false)
        widget.getWidgetState().getRotationHandleZinY1().setVisible(false)
        widget.getWidgetState().getCenterHandle().setVisible(false)

        // i === 2
        widget.getWidgetState().getAxisXinZ().setVisible(false)
        widget.getWidgetState().getAxisYinZ().setVisible(false)
        widget.getWidgetState().getRotationHandleXinZ0().setVisible(false)
        widget.getWidgetState().getRotationHandleXinZ1().setVisible(false)
        widget.getWidgetState().getRotationHandleYinZ0().setVisible(false)
        widget.getWidgetState().getRotationHandleYinZ1().setVisible(false)
        widget.getWidgetState().getCenterHandle().setVisible(false)

        // re-enable high quality interpolation when finished scrolling
        viewAttributes.forEach((obj) => {
            obj.reslice.setInterpolationMode(InterpolationMode.LINEAR)
            obj.interactor.render()
        })
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
        state.renderer.setBackground(...getColors1(index));
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
        state.interactor.onPointerEnter(handlePointerEnter)
        state.interactor.onPointerLeave(handlePointerLeave)

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
        state.orientationWidget.setMinPixelSize(100); // 50
        state.orientationWidget.setMaxPixelSize(300); // 200

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