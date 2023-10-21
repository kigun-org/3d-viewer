import {writeImageArrayBuffer} from "itk-wasm";

import {
    readDicomTags,
    readImageDicomFileSeries,
    setPipelinesBaseUrl,
    setPipelineWorkerUrl
} from "@itk-wasm/dicom";

setPipelinesBaseUrl(import.meta.env.BASE_URL + "itk/dicom/pipelines")
setPipelineWorkerUrl(import.meta.env.BASE_URL + "itk/dicom/web-workers/pipeline.worker.js")

const parseDICOMFiles = async function (fileList, progressCallback) {
    let loaded = 0

    progressCallback(new ProgressEvent('progress', {
        lengthComputable: true,
        loaded: loaded,
        total: fileList.length
    }))

    const fetchInfo = function (initialWorker) {
        return function (file) {
            let currentWorker = initialWorker
            return readDicomTags(currentWorker, file, {
                tagsToRead: {
                    tags: [
                        "0010|0020", "0010|0010", "0010|0030", "0010|0040", // patient ID, name, DoB, sex
                        "0008|0021", "0008|0031", // study date and time
                        "0008|103e", // series description
                        "0020|000d", "0020|000e", // study instance ID, series instance ID
                    ]
                }
            }).then(({webWorker, tags}) => {
                currentWorker = webWorker
                progressCallback(new ProgressEvent('progress', {
                    lengthComputable: true,
                    loaded: ++loaded,
                    total: fileList.length
                }))

                const tagMap = new Map(tags)
                return {
                    file: file,
                    isDICOM: true,
                    patientID: tagMap.get("0010|0020"),
                    patientName: tagMap.get("0010|0010"),
                    patientDateOfBirth: tagMap.get("0010|0030"),
                    patientSex: tagMap.get("0010|0040"),
                    studyDate: tagMap.get("0008|0021"),
                    studyTime: tagMap.get("0008|0031"),
                    seriesDescription: tagMap.get("0008|103e"),
                    studyInstanceID: tagMap.get("0020|000d"),
                    seriesInstanceID: tagMap.get("0020|000e"),
                }
            }).catch((e) => {
                // currentWorker = null
                console.log("ERROR: ", e)

                progressCallback(new ProgressEvent('progress', {
                    lengthComputable: true,
                    loaded: ++loaded,
                    total: fileList.length
                }))

                return {
                    file: file,
                    isDICOM: false
                }
            })
        }
    }

    // split up the DICOM images and assign different workers per chunk; 200 seems to be a safe value
    let results = []
    const chunkSize = 200;
    for (let i = 0; i < fileList.length; i += chunkSize) {
        const chunk = [...fileList].slice(i, i + chunkSize);

        let {webWorker: worker} = await readDicomTags(null, chunk[0], {
            tagsToRead: {
                tags: [
                    "0010|0020", "0010|0010", "0010|0030", "0010|0040", // patient ID, name, DoB, sex
                    "0008|0021", "0008|0031", // series date and time
                    "0020|000d", "0020|000e", // study instance ID, series instance ID
                ]
            }
        })

        const fetchFileInfoChunk = Array.from(chunk, fetchInfo(worker))
        results = [...results, ...await Promise.all(fetchFileInfoChunk)]
        worker.terminate()
    }

    return results
}

const loadImages = function (fileList, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return readImageDicomFileSeries(null, {inputImages: fileList})
        .then(function ({outputImage, webWorkerPool}) {
            webWorkerPool.terminateWorkers()

            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: 100,
                total: 100
            }))

            return outputImage
        })
}

const convertToNRRD = function (itkImage, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return writeImageArrayBuffer(null, itkImage, "output.nrrd")
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

export {parseDICOMFiles, loadImages, convertToNRRD}