import {setPipelinesBaseUrl, readDicomTags, readImageDicomFileSeries} from "@itk-wasm/dicom";

setPipelinesBaseUrl(import.meta.env.BASE_URL + "pipelines")

const parseDICOMFiles = async function (fileList, progressCallback) {
    let loaded = 0

    progressCallback(new ProgressEvent('progress', {
        lengthComputable: true,
        loaded: loaded,
        total: fileList.length
    }))

    const fetchInfo = function (file, worker) {
        return readDicomTags(file, {
            tagsToRead: {
                tags: [
                    "0010|0020", "0010|0010", "0010|0030", "0010|0040", // patient ID, name, DoB, sex
                    "0008|0021", "0008|0031", // study date and time
                    "0008|103e", // series description
                    "0020|000d", "0020|000e", // study instance ID, series instance ID
                ]
            },
            webWorker: worker
        }).then(({webWorker, tags}) => {
            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: ++loaded,
                total: fileList.length
            }))

            const tagMap = new Map(tags)
            return [ {
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
            }, webWorker ]
        }).catch((e) => {
            console.log("ERROR: ", e)

            progressCallback(new ProgressEvent('progress', {
                lengthComputable: true,
                loaded: ++loaded,
                total: fileList.length
            }))

            return [{
                file: file,
                isDICOM: false
            }, null]
        })
    }

    // split up the DICOM images and assign different workers per chunk; 200 seems to be a safe value
    let results = []
    const chunkSize = 200
    for (let i = 0; i < fileList.length; i += chunkSize) {
        const fileListChunk = [...fileList].slice(i, i + chunkSize)
        let worker = null

        for (const file of fileListChunk) {
            let fileInfo
            [ fileInfo, worker ] = await fetchInfo(file, worker)
            results.push(fileInfo)
        }

        if (worker !== null) {
            worker.terminate()
        }
    }

    return results
}

const loadImages = function (fileList, progressCallback) {
    progressCallback(new ProgressEvent('progress', {
        lengthComputable: false,
        loaded: 0,
        total: 0
    }))

    return readImageDicomFileSeries({inputImages: fileList})
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

export {parseDICOMFiles, loadImages}