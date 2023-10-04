import vtkInteractorStyleTrackballCamera from "@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera";
import vtkInteractorStyleImage from "@kitware/vtk.js/Interaction/Style/InteractorStyleImage";
import * as macro from "@kitware/vtk.js/macros";

function InteractorStyleTrackballNoHotkeys(publicAPI, model) {
    model.classHierarchy.push('InteractorStyleTrackballNoHotkeys');
    publicAPI.handleKeyPress = (_) => {
    }
}

function extendTrackball(publicAPI, model, initialValues = {}) {
    vtkInteractorStyleTrackballCamera.extend(publicAPI, model, initialValues);
    InteractorStyleTrackballNoHotkeys(publicAPI, model);
}

export const createTrackballNoHotkeysStyle = macro.newInstance(extendTrackball, 'InteractorStyleTrackballNoHotkeys');



function InteractorStyleImageNoHotkeys(publicAPI, model) {
    model.classHierarchy.push('InteractorStyleImageNoHotkeys');
    publicAPI.handleKeyPress = (_) => {
    }
    // publicAPI.handleMouseWheel = (callData) => {
    //     console.log(callData)
    // }
    // publicAPI.handleStartMouseWheel = (_) => {
    //     console.log("1")
    // }
    // publicAPI.handleEndMouseWheel = (_) => {
    //     console.log("2")
    // }
}

function extendImage(publicAPI, model, initialValues = {}) {
    vtkInteractorStyleImage.extend(publicAPI, model, initialValues);
    InteractorStyleImageNoHotkeys(publicAPI, model);
}

export const createImageNoHotkeysStyle = macro.newInstance(extendImage, 'InteractorStyleImageNoHotkeys');
