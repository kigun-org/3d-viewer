import {writeImageArrayBuffer} from "itk-wasm";

import {
    readDicomTags,
    readImageDicomFileSeries,
    setPipelinesBaseUrl,
    setPipelineWorkerUrl
} from "@itk-wasm/dicom";
setPipelinesBaseUrl("/itk/dicom/pipelines")
setPipelineWorkerUrl("/itk/dicom/web-workers/pipeline.worker.js")

const parseDICOMFiles = async function (fileList, progressCallback) {
    const timeStart = performance.now()

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
                        "0008|0021", "0008|0031", // series date and time
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
                    seriesDate: tagMap.get("0008|0021"),
                    seriesTime: tagMap.get("0008|0031"),
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

    // split up the DICOM images and assign different workers per chunk
    let results = []
    const chunkSize = 200;
    for (let i = 0; i < fileList.length; i += chunkSize) {
        const chunk = [...fileList].slice(i, i + chunkSize);

        let {webWorker: worker, tags: _} = await readDicomTags(null, chunk[0], {
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

    const timeAfterDICOMTags = performance.now()
    console.log(`reading DICOM tags: ${(timeAfterDICOMTags - timeStart).toFixed(1)} ms`)

    return results
}

const createVolume = function (fileList, progressCallback) {
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

const convertToNRRD = function (image, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return writeImageArrayBuffer(null, image, "test.nrrd")
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

const uploadVolume = function (arrayBuffer, progressCallback, uploadFinishedCallback) {
    // const a = document.createElement('a')
    // a.href = URL.createObjectURL(new Blob(
    //     [ arrayBuffer ],
    //     { type: 'application/octet-stream' }
    // ))
    // a.download = "download.nrrd"
    // a.click()

    const timeAfterSavingImageToNRRD = performance.now()

    const formData = new FormData()
    // formData.append('csrftoken', '7y5oxybOKclGGBBdwHUR4KfooSYaNsT2')
    formData.append('cbct', new Blob([arrayBuffer]), '20230924test.nrrd')

    console.log(`Sending ${arrayBuffer.byteLength} bytes by POST request...`)
    const req = new XMLHttpRequest()
    req.addEventListener("load", (event) => {
        console.log("loaded", event)

        const timeAfterUploaded = performance.now()
        console.log(`Image upload: ${(timeAfterUploaded - timeAfterSavingImageToNRRD).toFixed(1)} ms`)

        uploadFinishedCallback()
    })
    req.upload.addEventListener("progress", progressCallback)
    req.addEventListener("error", (event) => {
        console.log("error", event)
    });
    req.addEventListener("abort", (event) => {
        console.log("aborted", event)
    })

    req.open("POST", "http://localhost:8000/upload_cbct")
    req.send(formData)

    return true
}

export {parseDICOMFiles, createVolume, convertToNRRD, uploadVolume}