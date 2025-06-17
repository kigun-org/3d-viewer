<script>
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Geometry';
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Glyph';
    import '@kitware/vtk.js/Rendering/OpenGL/Profiles/Volume';

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

    import {onMount} from 'svelte'

    import {ViewMode} from "./ViewMode";
    import ToolbarLocal from "./ToolbarLocal.svelte";

    let {
        viewMode,
        maximized = $bindable(),
        viewAttributes,
        widget,
        scaleInPixels, // On change: viewAttributes.forEach((obj) => { obj.interactor.render() }),
        pointerEntered,
        pointerLeft
    } = $props();

    const backgroundColor = [0.1, 0.1, 0.1]

    export function saveScreenshot() {
        return componentState.renderWindow.captureImages()[0]
    }

    let componentState

    let element

    const translationEnabled = true

    const rotationEnabled = true
    const keepOrthogonality = true

    // [SlabMode.MIN, SlabMode.MAX, SlabMode.MEAN, SlabMode.SUM]
    const slabMode = SlabMode.MEAN
    const slabNumberOfSlices = 1
    // const maxSlabNumberOfSlices = vec3.length(image.getDimensions()) // set max number of slices to slider.

    // [InterpolationMode.NEAREST, InterpolationMode.LINEAR, InterpolationMode.CUBIC]
    const interpolationMode = InterpolationMode.LINEAR
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
        pointerEntered()
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
        pointerLeft()
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
        componentState = {
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
        };

        componentState.renderer.getActiveCamera().setParallelProjection(true)
        // state.renderer.setBackground(...getColor(index))
        componentState.renderer.setBackground(...backgroundColor)
        componentState.renderWindow.addRenderer(componentState.renderer)
        componentState.renderWindow.addView(componentState.GLWindow)
        componentState.renderWindow.setInteractor(componentState.interactor)
        componentState.interactor.setView(componentState.GLWindow)
        componentState.interactor.initialize()
        componentState.widgetManager.setRenderer(componentState.renderer)
        componentState.interactor.setInteractorStyle(windowLevelEnabled ?
            vtkInteractorStyleImage.newInstance()
            : vtkInteractorStyleTrackballCamera.newInstance()
        )
        componentState.interactor.onPointerEnter(handlePointerEnter)
        componentState.interactor.onPointerLeave(handlePointerLeave)

        componentState.widgetInstance = componentState.widgetManager.addWidget(widget, viewMode.viewType)
        componentState.widgetInstance.setEnableTranslation(translationEnabled)
        componentState.widgetInstance.setEnableRotation(rotationEnabled)
        componentState.widgetInstance.setScaleInPixels(scaleInPixels)
        componentState.widgetInstance.setKeepOrthogonality(keepOrthogonality)
        componentState.widgetInstance.setCursorStyles(appCursorStyles)
        componentState.widgetManager.enablePicking()
        // Use to update all renderers buffer when actors are moved
        componentState.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE)

        componentState.reslice.setSlabMode(slabMode) // On change: updateViews()
        componentState.reslice.setSlabNumberOfSlices(slabNumberOfSlices) // On change: updateViews()
        componentState.reslice.setInterpolationMode(interpolationMode)
        componentState.reslice.setTransformInputSampling(false)
        componentState.reslice.setAutoCropOutput(true)
        componentState.reslice.setOutputDimensionality(2)

        componentState.resliceMapper.setInputConnection(componentState.reslice.getOutputPort())
        componentState.resliceMapper.setPreferSizeOverAccuracy(true)

        componentState.resliceActor.setMapper(componentState.resliceMapper)
        componentState.resliceActor.getProperty().setColorWindow(initialWindow)
        componentState.resliceActor.getProperty().setColorLevel(initialLevel)

        componentState.orientationWidget.setEnabled(true)
        componentState.orientationWidget.setViewportCorner(
            vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
        )
        componentState.orientationWidget.setViewportSize(0.15)
        componentState.orientationWidget.setMinPixelSize(100) // 50
        componentState.orientationWidget.setMaxPixelSize(300) // 200

        viewAttributes.push(componentState)
    })
</script>

<div class="k-relative"
     class:maximized={maximized === viewMode}
     class:k-hidden={maximized !== null && maximized !== viewMode}>

    <div bind:this={element} style="min-height: 200px; aspect-ratio: 4 / 3"></div>

    <ToolbarLocal viewMode={viewMode} bind:maximized={maximized} />

    <div class="k-absolute k-bottom-0 k-left-0 k-right-0 k-px-1 k-pt-1 k-bg-base-200/70">
        <input type="range" min="0" max="100" value="40" class="k-range k-range-sm k-w-full" />
    </div>
</div>

<style>
    .maximized {
        grid-column: span 2;
        grid-row: span 2;
    }
</style>