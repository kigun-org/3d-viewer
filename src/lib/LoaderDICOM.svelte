<script>
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper";
    import {onMount, createEventDispatcher} from "svelte";
    import {loadImages, parseDICOMFiles} from "./Loader/dicomUtils.js";
    import {convertItkToNRRD} from "./Loader/nrrdUtils.js";
    import {Status} from "./Loader/Status.js";


    const dispatch = createEventDispatcher();

    export let fileList
    export let outputNRRD = false

    // Upload variables
    export let upload = null
    let uploading = false
    let uploadComplete = false
    let uploadError = false
    let image = null
    let uploadMessage = ''
    let uploadProgress = 0

    let loaded = 0
    let total = 100
    let progressBarIndeterminate = false

    let statusMessages = []

    let multipleSeriesMap = null

    $: progress = loaded / total

    const progressCallback = function (event) {
        if (event.lengthComputable) {
            progressBarIndeterminate = false
            loaded = event.loaded
            total = event.total
        } else {
            progressBarIndeterminate = true
        }
    }

    const updateState = function (message, status = Status.RUNNING, append = true) {
        statusMessages.forEach((s) => {
            if (s.status === Status.RUNNING) {
                s.status = Status.INFO
            }
        })

        if (append) {
            statusMessages.push({status: status, message: message})
        } else {
            statusMessages[statusMessages.length - 1] = {status: status, message: message}
        }

        return statusMessages
    }

    const processImageSeries = function (fileInfoList, appendState = false) {
        multipleSeriesMap = null

        statusMessages = updateState(
            {image: fileInfoList[0], length: fileInfoList.length},
            Status.INFO_DICOM,
            appendState)

        const totalSize = fileInfoList.reduce((acc, curr) => acc + curr.file.size, 0)
        statusMessages = updateState(`Loading images (${(totalSize / (1024 * 1024)).toFixed(1)} MB)`)

        loadImages(fileInfoList.map((result) => result.file), progressCallback)
            .then(convertItkImage)
    }

    const convertItkImage = (itkImage) => {
        statusMessages = updateState("Converting image")
        if (outputNRRD) {
            convertItkToNRRD(itkImage, progressCallback)
                .then((arrayBuffer) => {
                    loaded = 0
                    progressBarIndeterminate = false
                    if (upload !== null) {
                        image = arrayBuffer
                    }
                    dispatch('loadComplete', {image: arrayBuffer})
                    statusMessages = updateState('Done.', Status.INFO)
                })
        } else {
            const convert = async (itkImage) => convertItkToVtkImage(itkImage)
            convert(itkImage).then((vtkImage) => {
                dispatch('loadComplete', {image: vtkImage})
                statusMessages = updateState('Done.', Status.INFO)
            })
        }
    }

    const getFirstImage = (map) => {
        const firstItem = map.values().next().value
        if (firstItem instanceof Array) {
            return firstItem[0]
        } else {
            return getFirstImage(firstItem)
        }
    }



    function uploadProgressCallback(event) {
        if (event.lengthComputable) {
            const loaded = event.loaded
            const total = event.total

            uploadMessage = (loaded / (1024 * 1024)).toFixed(1) + '/'
                + (total / (1024 * 1024)).toFixed(1) + 'MB ('
                + ((loaded / total) * 100).toFixed(0) + '%) uploaded.'
            uploadProgress = loaded / total
        }
    }

    function uploadFinishedCallback() {
        uploading = false
        uploadComplete = true
        uploadMessage = 'Upload complete.'
        dispatch('uploadComplete', null)
    }

    function uploadErrorCallback(event) {
        console.log("Upload error.", event)
        uploading = false
        uploadError = true
        if (event.target.statusText === '') {
            uploadMessage = `Error uploading file.`
        } else {
            uploadMessage = `ERROR: ${event.target.statusText}`
        }
    }

    function uploadAbortedCallback(event) {
        console.log("Upload aborted.", event)
        uploading = false
        uploadError = true
        uploadMessage = "Upload aborted."
    }

    function uploadImage(image) {
        const formData = new FormData()

        if (upload.params !== undefined) {
            for (const param in upload.params) {
                formData.append(param, upload.params[param])
            }
        }

        const today = new Date().toISOString().slice(0, 10).replaceAll('-', '')
        formData.append('nrrd', new Blob([image]), `${today}.nrrd`)

        const req = new XMLHttpRequest()
        req.upload.addEventListener("progress", uploadProgressCallback)
        req.addEventListener("load", uploadFinishedCallback)
        req.addEventListener("error", uploadErrorCallback)
        req.addEventListener("abort", uploadAbortedCallback)

        req.open("POST", upload.url)
        req.send(formData)

        uploading = true
        uploadMessage = 'Starting upload...'
        uploadProgress = 0 / image.byteLength
    }


    onMount(() => {
        statusMessages = [{status: Status.RUNNING, message: "Loading DICOM files"}]

        parseDICOMFiles(fileList, progressCallback)
            .then((fileList) => {
                const fileInfoList = fileList.filter((result) => result.isDICOM)

                statusMessages = updateState(
                    `Found ${fileInfoList.length} DICOM files.`,
                    Status.INFO, false)

                const groupedFileInfoMap = new Map()
                fileInfoList.forEach((fileInfo) => {
                    if (groupedFileInfoMap.has(fileInfo.patientID)) {
                        const studies = groupedFileInfoMap.get(fileInfo.patientID)

                        if (!studies.has(fileInfo.studyInstanceID)) {
                            studies.set(fileInfo.studyInstanceID, new Map([[fileInfo.seriesInstanceID, [fileInfo]]]))
                        } else {
                            const series = studies.get(fileInfo.studyInstanceID)

                            if (!series.has(fileInfo.seriesInstanceID)) {
                                series.set(fileInfo.seriesInstanceID, [fileInfo])
                            } else {
                                series.get(fileInfo.seriesInstanceID).push(fileInfo)
                            }
                        }
                    } else {
                        groupedFileInfoMap.set(fileInfo.patientID,
                            new Map([[fileInfo.studyInstanceID, new Map([[fileInfo.seriesInstanceID, [fileInfo]]])]]))
                    }
                })

                let multipleSeries = false
                if (groupedFileInfoMap.size > 1) {
                    statusMessages = updateState("Multiple patients found.", Status.WARNING)
                    multipleSeries = true
                } else {
                    const studies = groupedFileInfoMap.values().next().value
                    if (studies.size > 1) {
                        statusMessages = updateState("Multiple studies found.", Status.WARNING)
                        multipleSeries = true
                    } else {
                        const series = studies.values().next().value
                        if (series.size > 1) {
                            statusMessages = updateState("Multiple image series found.", Status.WARNING)
                            multipleSeries = true
                        }
                    }
                }

                if (multipleSeries) {
                    multipleSeriesMap = new Map([...groupedFileInfoMap.entries()].sort((a, b) => {
                        return getFirstImage(a[1]).patientName.localeCompare(getFirstImage(b[1]).patientName)
                    }))
                    statusMessages = updateState('Select image series to load:', Status.INFO)
                } else {
                    processImageSeries(fileInfoList, true)
                }
            })
            .catch((_) => {
                statusMessages = updateState('No DICOM files found.', Status.ERROR, false)
            })
    })
</script>

<div class="loader_status">
    {#each statusMessages as s}
        {#if s.status === Status.INFO || s.status === Status.RUNNING}
            <div>
                {s.message}
            </div>
        {:else if s.status === Status.INFO_DICOM}
            <div class="text-start mb-1">
                <div>DICOM series information</div>
                <div class="d-flex gap-4 ms-3 font-monospace small">
                    <strong>Patient</strong>
                    <span>Name: {s.message.image.patientName}</span>
                    <span><abbr title="Patient Identifier">ID</abbr>: {s.message.image.patientID}</span>
                    <span><abbr title="Date of Birth">DOB</abbr>: {s.message.image.patientDateOfBirth}</span>
                </div>
                <div class="d-flex gap-4 ms-3 font-monospace small">
                    <strong>Series&nbsp;</strong>
                    <span>Date: {s.message.image.studyDate}</span>
                    <span>Description: {s.message.image.seriesDescription}</span>
                    <span>Images: {s.message.length}</span>
                </div>
            </div>
        {:else if s.status === Status.WARNING}
            <div class="text-warning fw-semibold">WARNING: {s.message}</div>
        {:else if s.status === Status.ERROR}
            <div class="text-danger fw-semibold">ERROR: {s.message}</div>
        {/if}
    {/each}

    {#if statusMessages.length > 0 && statusMessages[statusMessages.length - 1].status === Status.RUNNING}
        {#if progressBarIndeterminate}
            <progress></progress>
        {:else}
            <progress value={progress}></progress>
        {/if}
    {/if}

    {#if multipleSeriesMap}
        <div class="dicom_info font-monospace small">
            <ul>
                {#each multipleSeriesMap as [patient, studiesMap]}
                    <li>
                        <strong>
                            Patient
                            [{getFirstImage(studiesMap).patientName} |
                            <abbr title="Patient Identifier">ID</abbr> {patient} |
                            <abbr title="Date of Birth">DOB</abbr> {getFirstImage(studiesMap).patientDateOfBirth}]
                        </strong>
                        <ul>
                            {#each studiesMap as [study, seriesMap]}
                                Study
                                [{getFirstImage(seriesMap).studyDate};
                                {study}]
                                <ul>
                                    {#each seriesMap as [series, images]}
                                        <li class="series"
                                            class:suggested={images[0].seriesDescription.toLowerCase().includes('axial')}>
                                            <!-- svelte-ignore a11y-missing-attribute -->
                                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                                            <a class="link-primary" role="button" tabindex="0"
                                               on:click={() => { processImageSeries(images) }}>
                                                Series
                                                [{images[0].seriesDescription};
                                                {series}]
                                            </a>
                                            <small>({images.length})</small>
                                        </li>
                                    {/each}
                                </ul>
                            {/each}
                        </ul>
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>

{#if image !== null}
    <div class="d-flex align-items-center gap-3 mt-2">
        <button class="btn" class:btn-primary={!uploadError} class:btn-danger={uploadError}
                disabled={uploading || uploadComplete || uploadError}
                on:click={() => uploadImage(image)}>
            Upload image
        </button>
        {#if uploading || uploadComplete || uploadError}
            <div class="d-flex flex-column flex-grow-1 justify-content-center">
                <span>{uploadMessage}</span>
                <progress value={uploadProgress}></progress>
            </div>
        {/if}
    </div>
{/if}

<style>
    .loader_status progress {
        max-width: 10em;
    }

    .dicom_info {
        width: 100%;
        text-align: start;
    }

    .dicom_info {
        padding: 0.2em 0.5em;
        border: 1px solid black;
    }

    .dicom_info ul {
        margin-bottom: 0;
        list-style: none;
        padding-left: 1.25em;
    }

    .dicom_info > ul {
        padding-left: 0;
    }

    .dicom_info > ul > li:not(:last-child) {
        margin-bottom: 0.5em;
    }

    .dicom_info li.series:hover {
        background-color: #eee;
    }

    .dicom_info li.series.suggested {
        font-style: italic;
    }
</style>