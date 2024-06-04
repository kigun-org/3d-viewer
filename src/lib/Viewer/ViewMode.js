import {ViewTypes} from "@kitware/vtk.js/Widgets/Core/WidgetManager/Constants";
// import {SlicingMode} from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";
import {getColorRGBString} from "../Loader/colors";

export const ViewMode= {
    AXIAL: {
        label: "Axial",
        viewType: ViewTypes.XY_PLANE,
        color: getColorRGBString(2),
        // slicing_mode: SlicingMode.Z, cameraPosition: [0, 0, -10], cameraUp: [0, -1, 0]
    },
    CORONAL: {
        label: "Coronal",
        viewType: ViewTypes.XZ_PLANE,
        color: getColorRGBString(1),
        // slicing_mode: SlicingMode.Y, cameraPosition: [0, -10, 0], cameraUp: [0, 0, 1]
    },
    SAGITTAL: {
        label: "Sagittal",
        viewType: ViewTypes.YZ_PLANE,
        color: getColorRGBString(0),
        // slicing_mode: SlicingMode.X, cameraPosition: [-10, 0, 0], cameraUp: [0, 0, 1]
    },
    THREE_D: {
        label: "3D",
        color: "rgba(224,224,224,1)"
    }
}

export function getViewTypes(i) {
    let viewType

    switch (i) {
        case 0: viewType = ViewMode.AXIAL.viewType; break;
        case 1: viewType = ViewMode.CORONAL.viewType; break;
        case 2: viewType = ViewMode.SAGITTAL.viewType; break;
    }

    return viewType
}