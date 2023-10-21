<script>
    // Load the rendering pieces we want to use (for both WebGL and WebGPU)
    import '@kitware/vtk.js/Rendering/Profiles/All';

    import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
    import vtkAnnotatedCubeActor from '@kitware/vtk.js/Rendering/Core/AnnotatedCubeActor';
    import vtkGenericRenderWindow from '@kitware/vtk.js/Rendering/Misc/GenericRenderWindow';
    import vtkImageMapper from '@kitware/vtk.js/Rendering/Core/ImageMapper';
    import vtkImageReslice from '@kitware/vtk.js/Imaging/Core/ImageReslice';
    import vtkImageSlice from '@kitware/vtk.js/Rendering/Core/ImageSlice';
    import vtkInteractorStyleImage from '@kitware/vtk.js/Interaction/Style/InteractorStyleImage';
    import vtkInteractorStyleTrackballCamera from '@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera';
    import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
    import vtkOutlineFilter from '@kitware/vtk.js/Filters/General/OutlineFilter';
    import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';
    import vtkResliceCursorWidget from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget';
    import vtkWidgetManager from '@kitware/vtk.js/Widgets/Core/WidgetManager';
    import {InterpolationMode} from '@kitware/vtk.js/Imaging/Core/AbstractImageInterpolator/Constants';

    import {CaptureOn} from '@kitware/vtk.js/Widgets/Core/WidgetManager/Constants';

    import {SlabMode} from '@kitware/vtk.js/Imaging/Core/ImageReslice/Constants';

    import {xyzToViewType} from '@kitware/vtk.js/Widgets/Widgets3D/ResliceCursorWidget/Constants';

    // Force the loading of HttpDataAccessHelper to support gzip decompression
    import HttpDataAccessHelper from "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";

    import {onMount} from "svelte";

    export let image

    onMount(() => {
        // ----------------------------------------------------------------------------
        // Define main attributes
        // ----------------------------------------------------------------------------

        const viewColors = [
            [1, 0.3, 0], // sagittal
            [0.3, 0.7, 0.3], // coronal
            [0, 0.5, 1], // axial
            [0.5, 0.5, 0.5], // 3D
        ];

        const viewAttributes = [];
        const widget = vtkResliceCursorWidget.newInstance();
        const widgetState = widget.getWidgetState();
        // Set size in CSS pixel space because scaleInPixels defaults to true
        widgetState
            .getStatesWithLabel('sphere')
            .forEach((handle) => {
                handle.setScale1(15)
                handle.setVisible(false)
            });
        widgetState
            .getStatesWithLabel('line')
            .forEach((handle) => {
                handle.setScale3(3, 3, 3)
                handle.setVisible(false)
            });

        // set handle colors
        // [1, 0.3, 0], sagittal
        widgetState.getRotationHandleXinY0().setColor3(255, 85, 0)
        widgetState.getRotationHandleXinY1().setColor3(255, 85, 0)
        widgetState.getRotationHandleXinZ0().setColor3(255, 85, 0)
        widgetState.getRotationHandleXinZ1().setColor3(255, 85, 0)
        widgetState.getAxisXinY().setColor3(255, 85, 0)
        widgetState.getAxisXinZ().setColor3(255, 85, 0)

        // [0.3, 0.7, 0.3], // coronal
        widgetState.getRotationHandleYinX0().setColor3(85, 171, 85)
        widgetState.getRotationHandleYinX1().setColor3(85, 171, 85)
        widgetState.getRotationHandleYinZ0().setColor3(85, 171, 85)
        widgetState.getRotationHandleYinZ1().setColor3(85, 171, 85)
        widgetState.getAxisYinX().setColor3(85, 171, 85)
        widgetState.getAxisYinZ().setColor3(85, 171, 85)

        // [0, 0.5, 1], // axial
        widgetState.getRotationHandleZinX0().setColor3(0, 127, 255)
        widgetState.getRotationHandleZinX1().setColor3(0, 127, 255)
        widgetState.getRotationHandleZinY0().setColor3(0, 127, 255)
        widgetState.getRotationHandleZinY1().setColor3(0, 127, 255)
        widgetState.getAxisZinX().setColor3(0, 127, 255)
        widgetState.getAxisZinY().setColor3(0, 127, 255)

        widgetState.getCenterHandle().setOpacity(1)

        const appCursorStyles = {
            translateCenter: 'move',
            rotateLine: 'alias',
            translateAxis: 'pointer',
            default: 'default',
        };

        // ----------------------------------------------------------------------------
        // Setup rendering code
        // ----------------------------------------------------------------------------

        function createRGBStringFromRGBValues(rgb) {
            if (rgb.length !== 3) {
                return 'rgb(0, 0, 0)';
            }
            return `rgb(${(rgb[0] * 255).toString()}, ${(rgb[1] * 255).toString()}, ${(
                rgb[2] * 255
            ).toString()})`;
        }

        const initialPlanesState = {...widgetState.getPlanes()};

        let view3D = null;

        for (let i = 0; i < 4; i++) {
            const element = document.querySelector(`#div${i}`);

            const grw = vtkGenericRenderWindow.newInstance();
            grw.setContainer(element);
            grw.resize();
            const obj = {
                renderWindow: grw.getRenderWindow(),
                renderer: grw.getRenderer(),
                GLWindow: grw.getOpenGLRenderWindow(),
                interactor: grw.getInteractor(),
                widgetManager: vtkWidgetManager.newInstance(),
                orientationWidget: null,
            };

            obj.interactor.onPointerEnter(() => {
                // console.log("pointer enter event", event)
                if (i === 0) {
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

                if (i === 1) {
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

                if (i === 2) {
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

                if (i < 3) {
                    viewAttributes.forEach((obj) => {
                        obj.reslice.setInterpolationMode(InterpolationMode.NEAREST);
                        obj.interactor.render()
                    })
                }
            })
            obj.interactor.onPointerLeave(() => {
                // console.log("pointer leave event", event)
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

                if (i < 3) {
                    viewAttributes.forEach((obj) => {
                        obj.reslice.setInterpolationMode(InterpolationMode.LINEAR);
                        obj.interactor.render()
                    })
                }
            })

            obj.renderer.getActiveCamera().setParallelProjection(true);
            obj.renderWindow.addRenderer(obj.renderer);
            obj.renderWindow.addView(obj.GLWindow);
            obj.renderWindow.setInteractor(obj.interactor);
            obj.interactor.setView(obj.GLWindow);
            obj.interactor.initialize();
            obj.interactor.bindEvents(element);
            obj.widgetManager.setRenderer(obj.renderer);
            if (i < 3) {
                obj.interactor.setInteractorStyle(vtkInteractorStyleImage.newInstance());
                obj.widgetInstance = obj.widgetManager.addWidget(widget, xyzToViewType[i]);
                obj.widgetInstance.setScaleInPixels(true);
                obj.widgetInstance.setKeepOrthogonality(true);
                obj.widgetInstance.setCursorStyles(appCursorStyles);
                obj.widgetManager.enablePicking();
                // Use to update all renderers buffer when actors are moved
                obj.widgetManager.setCaptureOn(CaptureOn.MOUSE_MOVE);
            } else {
                obj.interactor.setInteractorStyle(
                    vtkInteractorStyleTrackballCamera.newInstance()
                );
            }

            obj.reslice = vtkImageReslice.newInstance();
            obj.reslice.setSlabMode(SlabMode.MEAN);
            obj.reslice.setSlabNumberOfSlices(1);
            obj.reslice.setTransformInputSampling(false);
            obj.reslice.setAutoCropOutput(true);
            obj.reslice.setOutputDimensionality(2);
            obj.reslice.setInterpolationMode(InterpolationMode.NEAREST);
            obj.resliceMapper = vtkImageMapper.newInstance();
            obj.resliceMapper.setInputConnection(obj.reslice.getOutputPort());
            obj.resliceActor = vtkImageSlice.newInstance();
            obj.resliceActor.getProperty().setColorWindow(4000);
            obj.resliceActor.getProperty().setColorLevel(2000);
            obj.resliceActor.setMapper(obj.resliceMapper);

            if (i < 3) {
                viewAttributes.push(obj);
            } else {
                view3D = obj;
            }

            // create axes
            const axes = vtkAnnotatedCubeActor.newInstance();
            axes.setDefaultStyle({
                text: 'L',
                fontStyle: 'bold',
                fontFamily: 'Arial',
                fontColor: 'black',
                fontSizeScale: (res) => res / 2,
                faceColor: createRGBStringFromRGBValues(viewColors[0]),
                faceRotation: 90,
                edgeThickness: 0.1,
                edgeColor: 'black',
                resolution: 400,
            });
            axes.setXMinusFaceProperty({
                text: 'R',
                faceColor: createRGBStringFromRGBValues(viewColors[0]),
                faceRotation: -90,
            });
            axes.setYPlusFaceProperty({
                text: 'P',
                faceColor: createRGBStringFromRGBValues(viewColors[1]),
                faceRotation: 180
            });
            axes.setYMinusFaceProperty({
                text: 'A',
                faceColor: createRGBStringFromRGBValues(viewColors[1]),
                faceRotation: 0
            });
            axes.setZPlusFaceProperty({
                text: 'S',
                faceColor: createRGBStringFromRGBValues(viewColors[2]),
                faceRotation: 0
            });
            axes.setZMinusFaceProperty({
                text: 'I',
                faceColor: createRGBStringFromRGBValues(viewColors[2]),
                faceRotation: 180,
            });

            // create orientation widget
            obj.orientationWidget = vtkOrientationMarkerWidget.newInstance({
                actor: axes,
                interactor: obj.renderWindow.getInteractor(),
            });
            obj.orientationWidget.setEnabled(true);
            obj.orientationWidget.setViewportCorner(
                vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
            );
            obj.orientationWidget.setViewportSize(0.15);
            obj.orientationWidget.setMinPixelSize(50);
            obj.orientationWidget.setMaxPixelSize(200);
        }

        // ----------------------------------------------------------------------------
        // Load image
        // ----------------------------------------------------------------------------

        function updateReslice(
            interactionContext = {
                viewType: '',
                reslice: null,
                actor: null,
                renderer: null,
                resetFocalPoint: false, // Reset the focal point to the center of the display image
                keepFocalPointPosition: false, // Defines if the focal point position is kepts (same display distance from reslice cursor center)
                computeFocalPointOffset: false, // Defines if the display offset between reslice center and focal point has to be
                // computed. If so, then this offset will be used to keep the focal point position during rotation.
            }
        ) {
            const modified = widget.updateReslicePlane(
                interactionContext.reslice,
                interactionContext.viewType
            );
            if (modified) {
                const resliceAxes = interactionContext.reslice.getResliceAxes();
                // Get returned modified from setter to know if we have to render
                interactionContext.actor.setUserMatrix(resliceAxes);
            }
            widget.updateCameraPoints(
                interactionContext.renderer,
                interactionContext.viewType,
                interactionContext.resetFocalPoint,
                interactionContext.keepFocalPointPosition,
                interactionContext.computeFocalPointOffset
            );
            view3D.renderWindow.render();
            return modified;
        }


        widget.setImage(image);

        // Create image outline in 3D view
        const outline = vtkOutlineFilter.newInstance();
        outline.setInputData(image);
        const outlineMapper = vtkMapper.newInstance();
        outlineMapper.setInputData(outline.getOutputData());
        const outlineActor = vtkActor.newInstance();
        outlineActor.setMapper(outlineMapper);
        view3D.renderer.addActor(outlineActor);

        // calculate image range, to set initial window/level
        // console.log(image.getPointData().getScalars().getRange())

        viewAttributes.forEach((obj, i) => {
            obj.reslice.setInputData(image);

            obj.resliceActor.getProperty().setColorWindow(3000);
            obj.resliceActor.getProperty().setColorLevel(1000);

            obj.renderer.addActor(obj.resliceActor);
            view3D.renderer.addActor(obj.resliceActor);
            const reslice = obj.reslice;
            const viewType = xyzToViewType[i];

            viewAttributes
                // No need to update plane nor refresh when interaction
                // is on current view. Plane can't be changed with interaction on current
                // view. Refreshs happen automatically with `animation`.
                // Note: Need to refresh also the current view because of adding the mouse wheel
                // to change slicer
                .forEach((v) => {
                    // Interactions in other views may change current plane
                    v.widgetInstance.onInteractionEvent(
                        // computeFocalPointOffset: Boolean which defines if the offset between focal point and
                        // reslice cursor display center has to be recomputed (while translation is applied)
                        // canUpdateFocalPoint: Boolean which defines if the focal point can be updated because
                        // the current interaction is a rotation
                        ({computeFocalPointOffset, canUpdateFocalPoint}) => {
                            const activeViewType = widget
                                .getWidgetState()
                                .getActiveViewType();
                            const keepFocalPointPosition =
                                activeViewType !== viewType && canUpdateFocalPoint;
                            updateReslice({
                                viewType,
                                reslice,
                                actor: obj.resliceActor,
                                renderer: obj.renderer,
                                resetFocalPoint: false,
                                keepFocalPointPosition,
                                computeFocalPointOffset,
                            });
                        }
                    );
                });

            updateReslice({
                viewType,
                reslice,
                actor: obj.resliceActor,
                renderer: obj.renderer,
                resetFocalPoint: true, // At first initilization, center the focal point to the image center
                keepFocalPointPosition: false, // Don't update the focal point as we already set it to the center of the image
                computeFocalPointOffset: true, // Allow to compute the current offset between display reslice center and display focal point
            });
            obj.renderer.getActiveCamera().zoom(1.75);
            obj.interactor.render();
        });

        view3D.renderer.resetCamera();
        view3D.renderer.resetCameraClippingRange();

        // set max number of slices to slider.
        // const maxNumberOfSlices = vec3.length(image.getDimensions());

        // ----------------------------------------------------------------------------
        // Define panel interactions
        // ----------------------------------------------------------------------------
        function updateViews() {
            viewAttributes.forEach((obj, i) => {
                updateReslice({
                    viewType: xyzToViewType[i],
                    reslice: obj.reslice,
                    actor: obj.resliceActor,
                    renderer: obj.renderer,
                    resetFocalPoint: true,
                    keepFocalPointPosition: false,
                    computeFocalPointOffset: true,
                    resetViewUp: true,
                });
                obj.renderer.getActiveCamera().zoom(1.75);
                obj.renderWindow.render();
            });
            view3D.renderer.resetCamera();
            view3D.renderer.resetCameraClippingRange();
        }

        // checkboxTranslation:
        //     viewAttributes.forEach((obj) =>
        //         obj.widgetInstance.setEnableTranslation(checkboxTranslation.checked)
        //     );

        // checkboxShowRotation:
        //     widgetState
        //         .getStatesWithLabel('rotation')
        //         .forEach((handle) => handle.setVisible(checkboxShowRotation.checked));
        //     viewAttributes.forEach((obj) => {
        //         obj.interactor.render();
        //     });
        // });

        // checkboxRotation:
        //     viewAttributes.forEach((obj) =>
        //         obj.widgetInstance.setEnableRotation(checkboxRotation.checked)
        //     );
        // });

        // checkboxOrthogonality:
        //     viewAttributes.forEach((obj) =>
        //         obj.widgetInstance.setKeepOrthogonality(checkboxOrthogonality.checked)
        //     );
        // });

        // checkboxScaleInPixels:
        //     widget.setScaleInPixels(checkboxScaleInPixels.checked);
        //     viewAttributes.forEach((obj) => {
        //         obj.interactor.render();
        //     });
        // });

        // opacity:
        //     widget
        //         .getWidgetState()
        //         .getStatesWithLabel('handles')
        //         .forEach((handle) => handle.setOpacity(ev.target.value));
        //     viewAttributes.forEach((obj) => {
        //         obj.interactor.render();
        //     });

        // SlabMode.MIN / MAX / MEAN / SUM;
        // selectSlabMode:
        //     viewAttributes.forEach((obj) => {
        //         obj.reslice.setSlabMode(Number(ev.target.value));
        //     });
        //     updateViews();

        // sliderSlabNumberofSlices:
        //     viewAttributes.forEach((obj) => {
        //         obj.reslice.setSlabNumberOfSlices(ev.target.value);
        //     });
        //     updateViews();

        const buttonReset = document.getElementById('buttonReset');
        buttonReset.addEventListener('click', () => {
            widgetState.setPlanes({...initialPlanesState});
            widget.setCenter(widget.getWidgetState().getImage().getCenter());
            updateViews();
        })

        // selectInterpolationMode:
        //     viewAttributes.forEach((obj) => {
        //         obj.reslice.setInterpolationMode(Number(ev.target.selectedIndex));
        //     });
        //     updateViews();
    })
</script>

<div class="viewer_panel">
    <div style="display: grid; grid-template-columns: 5fr 1fr">
        <div id="reslice" style="display: grid; grid-template-columns: 1fr 1fr;">
            <div style="border: 3px solid rgb(255, 85, 0);">
                <div id="div0" class="view" style="aspect-ratio: 3 / 2; min-height: 300px;"></div>
            </div>
            <div style="border: 3px solid rgb(85, 171, 85);">
                <div id="div1" class="view" style="aspect-ratio: 3 / 2; min-height: 300px;"></div>
            </div>
            <div style="border: 3px solid rgb(0, 127, 255);">
                <div id="div2" class="view" style="aspect-ratio: 3 / 2; min-height: 300px;"></div>
            </div>
            <div>
                <div id="div3" class="view" style="aspect-ratio: 3 / 2; min-height: 300px;"></div>
            </div>
        </div>

        <div>
            <button id="buttonReset">Reset views</button>
        </div>
    </div>
</div>
