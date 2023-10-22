import {readArrayBuffer, writeImageArrayBuffer} from "itk-wasm";
import {setPipelinesBaseUrl, setPipelineWorkerUrl} from "@itk-wasm/dicom";

setPipelinesBaseUrl(import.meta.env.BASE_URL + "itk/dicom/pipelines")
setPipelineWorkerUrl(import.meta.env.BASE_URL + "itk/dicom/web-workers/pipeline.worker.js")

function convertItkToNRRD(itkImage, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return writeImageArrayBuffer(null, itkImage, "output.nrrd", {useCompression: true})
        .then(function ({arrayBuffer, webWorker}) {
            webWorker.terminate()

            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: 100,
                total: 100
            }))

            return arrayBuffer
        })
}

function convertNRRDtoItk(nrrdArrayBuffer, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return readArrayBuffer(null, nrrdArrayBuffer, "input.nrrd")
        .then(function ({webWorker: webWorker, image: itkImage}) {
            webWorker.terminate()

            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: 100,
                total: 100
            }))

            return itkImage
        })
}

export {convertItkToNRRD, convertNRRDtoItk}