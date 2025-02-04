import {setPipelinesBaseUrl, readImage, writeImage} from "@itk-wasm/image-io";

setPipelinesBaseUrl(import.meta.env.BASE_URL + "pipelines")

function convertItkToNRRD(itkImage, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return writeImage(itkImage, "out.nrrd", {useCompression: true, componentType: "int16"})
        .then(function ({webWorker, serializedImage}) {
            webWorker.terminate()

            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: 100,
                total: 100
            }))

            return serializedImage.data.buffer
        })
}

function convertNRRDtoItk(arrayBuffer, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    const inputFile = new File([arrayBuffer], "in.nrrd")
    return readImage(inputFile)
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