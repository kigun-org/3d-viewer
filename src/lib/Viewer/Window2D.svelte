<script>
    // Load the rendering pieces we want to use (for both WebGL and WebGPU)
    import '@kitware/vtk.js/Rendering/Profiles/All';

    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';

    import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
    import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";

    import vtkImageMapper from "@kitware/vtk.js/Rendering/Core/ImageMapper";
    import vtkImageSlice from "@kitware/vtk.js/Rendering/Core/ImageSlice";

    import vtkOrientationMarkerWidget from "@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget";
    import vtkAnnotatedCubeActor from "@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor";
    import {SlabMode} from "@kitware/vtk.js/Imaging/Core/ImageReslice/Constants";

    import {InterpolationMode} from "@kitware/vtk.js/Imaging/Core/AbstractImageInterpolator/Constants";
    import vtkWidgetManager from "@kitware/vtk.js/Widgets/Core/WidgetManager";
    import vtkInteractorStyleTrackballCamera from "@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera";
    import {CaptureOn} from "@kitware/vtk.js/Widgets/Core/WidgetManager/Constants";
    import {getColorRGBString} from "../Loader/colors";

    import {createEventDispatcher, onMount} from 'svelte'

    import {ViewMode} from "./ViewMode";
    import ToolbarLocal from "./ToolbarLocal.svelte";

    const dispatch = createEventDispatcher()

    export let maximized
    export let viewMode

    const backgroundColor = [0.1, 0.1, 0.1]

    export let viewAttributes

    export let widget

    // On change: viewAttributes.forEach((obj) => { obj.interactor.render() })
    export let scaleInPixels

    export function saveScreenshot() {
        return state.renderWindow.captureImages()[0]
    }

    let state

    let element
    let sliderElement

    const translationEnabled = true

    const rotationEnabled = true
    const keepOrthogonality = true

    // [SlabMode.MIN, SlabMode.MAX, SlabMode.MEAN, SlabMode.SUM]
    const slabMode = SlabMode.MEAN
    const slabNumberOfSlices = 1
    // const maxSlabNumberOfSlices = vec3.length(image.getDimensions()) // set max number of slices to slider.

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
            text: 'L',
            faceRotation: 90,
            faceColor: getColorRGBString(0),
        });
        result.setXMinusFaceProperty({
            text: 'R',
            faceRotation: -90,
            faceColor: getColorRGBString(0),
        });
        result.setYPlusFaceProperty({
            text: 'P',
            faceRotation: 180,
            faceColor: getColorRGBString(1),
        });
        result.setYMinusFaceProperty({
            text: 'A',
            faceColor: getColorRGBString(1),
        });
        result.setZPlusFaceProperty({
            text: 'S',
            faceColor: getColorRGBString(2),
        });
        result.setZMinusFaceProperty({
            text: 'I',
            faceColor: getColorRGBString(2),
        });

        return result
    }

    function handlePointerEnter() {
        dispatch('pointerEntered')
        const widgetState = widget.getWidgetState()

        if (viewMode === ViewMode.AXIAL) {
            widgetState.getAxisXinZ().setScale3(3, 3, 3)
            widgetState.getAxisYinZ().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisXinZ().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisYinZ().setScale3(0.75, 0.75, 0.75)
        }

        if (viewMode === ViewMode.CORONAL) {
            widgetState.getAxisXinY().setScale3(3, 3, 3)
            widgetState.getAxisZinY().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisXinY().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisZinY().setScale3(0.75, 0.75, 0.75)
        }

        if (viewMode === ViewMode.SAGITTAL) {
            widgetState.getAxisYinX().setScale3(3, 3, 3)
            widgetState.getAxisZinX().setScale3(3, 3, 3)
        } else {
            widgetState.getAxisYinX().setScale3(0.75, 0.75, 0.75)
            widgetState.getAxisZinX().setScale3(0.75, 0.75, 0.75)
        }

        viewAttributes.forEach((obj) => {
            obj.interactor.render()
        })
    }

    function handlePointerLeave() {
        dispatch('pointerLeft')
        const widgetState = widget.getWidgetState()

        widgetState.getAxisXinZ().setScale3(0.75, 0.75, 0.75)
        widgetState.getAxisYinZ().setScale3(0.75, 0.75, 0.75)

        widgetState.getAxisXinY().setScale3(0.75, 0.75, 0.75)
        widgetState.getAxisZinY().setScale3(0.75, 0.75, 0.75)

        widgetState.getAxisYinX().setScale3(0.75, 0.75, 0.75)
        widgetState.getAxisZinX().setScale3(0.75, 0.75, 0.75)

        viewAttributes.forEach((obj) => {
            obj.interactor.render()
        })
    }

    export function showAxisWidget() {
        const widgetState = widget.getWidgetState()

        widgetState.getAxisYinX().setVisible(true)
        widgetState.getAxisZinX().setVisible(true)
        widgetState.getRotationHandleYinX0().setVisible(true)
        widgetState.getRotationHandleYinX1().setVisible(true)
        widgetState.getRotationHandleZinX0().setVisible(true)
        widgetState.getRotationHandleZinX1().setVisible(true)

        widgetState.getAxisXinY().setVisible(true)
        widgetState.getAxisZinY().setVisible(true)
        widgetState.getRotationHandleXinY0().setVisible(true)
        widgetState.getRotationHandleXinY1().setVisible(true)
        widgetState.getRotationHandleZinY0().setVisible(true)
        widgetState.getRotationHandleZinY1().setVisible(true)

        widgetState.getAxisXinZ().setVisible(true)
        widgetState.getAxisYinZ().setVisible(true)
        widgetState.getRotationHandleXinZ0().setVisible(true)
        widgetState.getRotationHandleXinZ1().setVisible(true)
        widgetState.getRotationHandleYinZ0().setVisible(true)
        widgetState.getRotationHandleYinZ1().setVisible(true)

        widgetState.getCenterHandle().setVisible(true)

        viewAttributes.forEach((obj) => {
            obj.reslice.setInterpolationMode(InterpolationMode.NEAREST)
            obj.interactor.render()
        })
    }

    export function hideAxisWidget() {
        const widgetState = widget.getWidgetState()

        widgetState.getAxisYinX().setVisible(false)
        widgetState.getAxisZinX().setVisible(false)
        widgetState.getRotationHandleYinX0().setVisible(false)
        widgetState.getRotationHandleYinX1().setVisible(false)
        widgetState.getRotationHandleZinX0().setVisible(false)
        widgetState.getRotationHandleZinX1().setVisible(false)

        widgetState.getAxisXinY().setVisible(false)
        widgetState.getAxisZinY().setVisible(false)
        widgetState.getRotationHandleXinY0().setVisible(false)
        widgetState.getRotationHandleXinY1().setVisible(false)
        widgetState.getRotationHandleZinY0().setVisible(false)
        widgetState.getRotationHandleZinY1().setVisible(false)

        widgetState.getAxisXinZ().setVisible(false)
        widgetState.getAxisYinZ().setVisible(false)
        widgetState.getRotationHandleXinZ0().setVisible(false)
        widgetState.getRotationHandleXinZ1().setVisible(false)
        widgetState.getRotationHandleYinZ0().setVisible(false)
        widgetState.getRotationHandleYinZ1().setVisible(false)

        widgetState.getCenterHandle().setVisible(false)

        viewAttributes.forEach((obj) => {
            obj.reslice.setInterpolationMode(InterpolationMode.LINEAR)
            obj.interactor.render()
        })
    }

    onMount(() => {
        // const camera = renderer.getActiveCamera()
        // camera.setPosition(...viewMode.cameraPosition)
        // camera.setViewUp(...viewMode.cameraUp)

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
        // state.renderer.setBackground(...getColor(index))
        state.renderer.setBackground(...backgroundColor)
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

        state.widgetInstance = state.widgetManager.addWidget(widget, viewMode.viewType)
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

<div style="position: relative"
     class:maximized={maximized === viewMode}
     class:hidden={maximized !== null && maximized !== viewMode}>

    <div bind:this={element} style="min-height: 200px; aspect-ratio: 4 / 3"></div>

    <ToolbarLocal viewMode={viewMode} bind:maximized={maximized} />
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