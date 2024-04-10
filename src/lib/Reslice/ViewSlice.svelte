<script>
    import {onMount} from "svelte";
    import vtkGenericRenderWindow from "@kitware/vtk.js/Rendering/Misc/GenericRenderWindow";
    import vtkWidgetManager from "@kitware/vtk.js/Widgets/Core/WidgetManager";
    import vtkImageReslice from "@kitware/vtk.js/Imaging/Core/ImageReslice";
    import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
    import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";
    import vtkInteractorStyleTrackballCamera from "@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera";
    import {xyzToViewType} from "@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants";
    import {CaptureOn} from "@kitware/vtk.js/Widgets/Core/WidgetManager/Constants";
    import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
    import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";
    import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
    import {SlabMode} from "@kitware/vtk.js/Imaging/Core/ImageReslice/Constants";
    import {InterpolationMode} from "@kitware/vtk.js/Imaging/Core/AbstractImageInterpolator/Constants";
    import vtkMath from '@kitware/vtk.js/Common/Core/Math';
    import {getColorRGBString, getColor} from './colors';

    export let viewAttributes

    export let index

    export let widget

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    export let scaleInPixels

    let state

    let element
    let sliderElement

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
            faceColor: getColorRGBString(0),
        });
        result.setXMinusFaceProperty({
            text: '-X',
            faceColor: getColorRGBString(0),
        });
        result.setYPlusFaceProperty({
            text: '+Y',
            faceColor: getColorRGBString(1),
        });
        result.setYMinusFaceProperty({
            text: '-Y',
            faceColor: getColorRGBString(1),
        });
        result.setZPlusFaceProperty({
            text: '+Z',
            faceColor: getColorRGBString(2),
        });
        result.setZMinusFaceProperty({
            text: '-Z',
            faceColor: getColorRGBString(2),
        });

        return result
    }

    function sliderChanged(ev) {
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
        const widgetState = widget.getWidgetState()

        if (index === 0) {
            widgetState.getRotationHandleYinX0().setVisible(true)
            widgetState.getRotationHandleYinX1().setVisible(true)
            widgetState.getRotationHandleZinX0().setVisible(true)
            widgetState.getRotationHandleZinX1().setVisible(true)
            widgetState.getCenterHandle().setVisible(true)
            widgetState.getAxisYinX().setScale3(3, 3, 3)
            widgetState.getAxisZinX().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisYinX().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisZinX().setScale3(0.75, 0.75, 0.75)
        }
        widgetState.getAxisYinX().setVisible(true)
        widgetState.getAxisZinX().setVisible(true)

        if (index === 1) {
            widgetState.getRotationHandleXinY0().setVisible(true)
            widgetState.getRotationHandleXinY1().setVisible(true)
            widgetState.getRotationHandleZinY0().setVisible(true)
            widgetState.getRotationHandleZinY1().setVisible(true)
            widgetState.getCenterHandle().setVisible(true)
            widgetState.getAxisXinY().setScale3(3, 3, 3)
            widgetState.getAxisZinY().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisXinY().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisZinY().setScale3(0.75, 0.75, 0.75)

        }
        widgetState.getAxisXinY().setVisible(true)
        widgetState.getAxisZinY().setVisible(true)

        if (index === 2) {
            widgetState.getRotationHandleXinZ0().setVisible(true)
            widgetState.getRotationHandleXinZ1().setVisible(true)
            widgetState.getRotationHandleYinZ0().setVisible(true)
            widgetState.getRotationHandleYinZ1().setVisible(true)
            widgetState.getCenterHandle().setVisible(true)
            widgetState.getAxisXinZ().setScale3(3, 3, 3)
            widgetState.getAxisYinZ().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisXinZ().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisYinZ().setScale3(0.75, 0.75, 0.75)
        }
        widgetState.getAxisXinZ().setVisible(true)
        widgetState.getAxisYinZ().setVisible(true)

        // low quality while scrolling
        viewAttributes.forEach((obj) => {
            obj.reslice.setInterpolationMode(InterpolationMode.NEAREST)
            obj.interactor.render()
        })
    }

    function handlePointerLeave() {
        const widgetState = widget.getWidgetState()

        // i === 0
        widgetState.getAxisYinX().setVisible(false)
        widgetState.getAxisZinX().setVisible(false)
        widgetState.getRotationHandleYinX0().setVisible(false)
        widgetState.getRotationHandleYinX1().setVisible(false)
        widgetState.getRotationHandleZinX0().setVisible(false)
        widgetState.getRotationHandleZinX1().setVisible(false)
        widgetState.getCenterHandle().setVisible(false)

        // i === 1
        widgetState.getAxisXinY().setVisible(false)
        widgetState.getAxisZinY().setVisible(false)
        widgetState.getRotationHandleXinY0().setVisible(false)
        widgetState.getRotationHandleXinY1().setVisible(false)
        widgetState.getRotationHandleZinY0().setVisible(false)
        widgetState.getRotationHandleZinY1().setVisible(false)
        widgetState.getCenterHandle().setVisible(false)

        // i === 2
        widgetState.getAxisXinZ().setVisible(false)
        widgetState.getAxisYinZ().setVisible(false)
        widgetState.getRotationHandleXinZ0().setVisible(false)
        widgetState.getRotationHandleXinZ1().setVisible(false)
        widgetState.getRotationHandleYinZ0().setVisible(false)
        widgetState.getRotationHandleYinZ1().setVisible(false)
        widgetState.getCenterHandle().setVisible(false)

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
            slider: sliderElement
        };

        state.renderer.getActiveCamera().setParallelProjection(true)
        state.renderer.setBackground(...getColor(index))
        state.renderWindow.addRenderer(state.renderer)
        state.renderWindow.addView(state.GLWindow)
        state.renderWindow.setInteractor(state.interactor)
        state.interactor.setView(state.GLWindow)
        state.interactor.initialize()
        state.widgetManager.setRenderer(state.renderer)
        state.interactor.setInteractorStyle(windowLevelEnabled ?
            vtkInteractorStyleImage.newInstance()
            : vtkInteractorStyleTrackballCamera.newInstance()
        )
        state.interactor.onPointerEnter(handlePointerEnter)
        state.interactor.onPointerLeave(handlePointerLeave)

        state.widgetInstance = state.widgetManager.addWidget(widget, xyzToViewType[index])
        state.widgetInstance.setEnableTranslation(translationEnabled)
        state.widgetInstance.setEnableRotation(rotationEnabled)
        state.widgetInstance.setScaleInPixels(scaleInPixels)
        state.widgetInstance.setKeepOrthogonality(keepOrthogonality)
        state.widgetInstance.setCursorStyles(appCursorStyles)
        state.widgetManager.enablePicking()
        // Use to update all renderers buffer when actors are moved
        state.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE)

        state.reslice.setSlabMode(slabMode) // On change: updateViews()
        state.reslice.setSlabNumberOfSlices(slabNumberOfSlices) // On change: updateViews()
        state.reslice.setInterpolationMode(interpolationMode)
        state.reslice.setTransformInputSampling(false)
        state.reslice.setAutoCropOutput(true)
        state.reslice.setOutputDimensionality(2)

        state.resliceMapper.setInputConnection(state.reslice.getOutputPort())

        state.resliceActor.setMapper(state.resliceMapper)
        state.resliceActor.getProperty().setColorWindow(initialWindow)
        state.resliceActor.getProperty().setColorLevel(initialLevel)

        state.orientationWidget.setEnabled(true)
        state.orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        )
        state.orientationWidget.setViewportSize(0.15)
        state.orientationWidget.setMinPixelSize(100) // 50
        state.orientationWidget.setMaxPixelSize(300) // 200

        viewAttributes.push(state)
    })
</script>

<div>
    <div bind:this={element}></div>
    <input bind:this={sliderElement} max="200" min="0" on:change={sliderChanged} type="range">
</div>

<style>
    input {
        width: 100%
    }
</style>