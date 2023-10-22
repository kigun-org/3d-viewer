import {setPipelinesBaseUrl, readImage, writeImage} from "@itk-wasm/image-io";

setPipelinesBaseUrl(import.meta.env.BASE_URL + "itk/image-io/pipelines")

function convertItkToNRRD(itkImage, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return writeImage(null, itkImage, "out.nrrd", {useCompression: true})
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

    const inputFile = new File([arrayBuffer], "input.nrrd")
    return readImage(null, inputFile)
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