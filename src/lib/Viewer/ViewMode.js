import {SlicingMode} from "@kitware/vtk.js/Rendering/Core/ImageMapper/Constants";
import {getColorRGBString} from "../Loader/colors.js";

export const ViewMode= {
    AXIAL: {
        label: "Axial", value: 1,
        color: getColorRGBString(0),
        slicing_mode: SlicingMode.Z, cameraPosition: [0, 0, -10], cameraUp: [0, -1, 0]
    },
    CORONAL: {
        label: "Coronal", value: 2,
        color: getColorRGBString(1),
        slicing_mode: SlicingMode.Y, cameraPosition: [0, -10, 0], cameraUp: [0, 0, 1]
    },
    SAGITTAL: {
        label: "Sagittal", value: 3,
        color: getColorRGBString(2),
        slicing_mode: SlicingMode.X, cameraPosition: [-10, 0, 0], cameraUp: [0, 0, 1]
    },
    THREE_D: {
        label: "3D",
        color: "rgba(200,200,200,1)"
    }
}
