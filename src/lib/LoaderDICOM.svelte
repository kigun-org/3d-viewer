<script>
    import {onMount, createEventDispatcher} from "svelte";
    import {convertToNRRD, loadImages, parseDICOMFiles} from "./Loader/dicomUtils.js";
    import {Status} from "./Loader/Status.js";
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper";


    const dispatch = createEventDispatcher();

    export let fileList
    export let outputNRRD = false

    let loaded = 0
    let total = 100
    let progressBarIndeterminate = false

    let state = []

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
        state.forEach((s) => {
            if (s.status === Status.RUNNING) {
                s.status = Status.INFO
            }
        })

        if (append) {
            state.push({status: status, message: message})
        } else {
            state[state.length - 1] = {status: status, message: message}
        }

        return state
    }

    const processImageSeries = function (fileInfoList, appendState = false) {
        multipleSeriesMap = null

        state = updateState(
            {image: fileInfoList[0], length: fileInfoList.length},
            Status.INFO_DICOM,
            appendState)

        const totalSize = fileInfoList.reduce((acc, curr) => acc + curr.file.size, 0)
        state = updateState(`Loading images (${(totalSize / (1024 * 1024)).toFixed(1)} MB)`)

        loadImages(fileInfoList.map((result) => result.file), progressCallback)
            .then(convertItkImage)
    }

    const convertItkImage = (itkImage) => {
        state = updateState("Converting image")
        if (outputNRRD) {
            convertToNRRD(itkImage, progressCallback)
                .then((arrayBuffer) => {
                    loaded = 0
                    progressBarIndeterminate = false
                    dispatch('loadComplete', {image: arrayBuffer})
                    state = updateState('Done.', Status.INFO)
                })
        } else {
            const convert = async (itkImage) => convertItkToVtkImage(itkImage)
            convert(itkImage).then((vtkImage) => {
                dispatch('loadComplete', {image: vtkImage})
                state = updateState('Done.', Status.INFO)
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

    onMount(() => {
        state = [{status: Status.RUNNING, message: "Loading DICOM files"}]

        parseDICOMFiles(fileList, progressCallback)
            .then((fileList) => {
                const fileInfoList = fileList.filter((result) => result.isDICOM)

                state = updateState(
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
                    state = updateState("Multiple patients found.", Status.WARNING)
                    multipleSeries = true
                } else {
                    const studies = groupedFileInfoMap.values().next().value
                    if (studies.size > 1) {
                        state = updateState("Multiple studies found.", Status.WARNING)
                        multipleSeries = true
                    } else {
                        const series = studies.values().next().value
                        if (series.size > 1) {
                            state = updateState("Multiple image series found.", Status.WARNING)
                            multipleSeries = true
                        }
                    }
                }

                if (multipleSeries) {
                    multipleSeriesMap = new Map([...groupedFileInfoMap.entries()].sort((a, b) => {
                        return getFirstImage(a[1]).patientName.localeCompare(getFirstImage(b[1]).patientName)
                    }))
                    state = updateState('Select image series to load:', Status.INFO)
                } else {
                    processImageSeries(fileInfoList, true)
                }
            })
            .catch((_) => {
                state = updateState('No DICOM files found.', Status.ERROR, false)
            })
    })
</script>

<div class="upload">
    <div>
        {#each state as s}
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

        {#if state.length > 0 && state[state.length - 1].status === Status.RUNNING}
            {#if progressBarIndeterminate}
                <progress></progress>
            {:else}
                <progress value={progress}></progress>
            {/if}
        {/if}

        {#if multipleSeriesMap}
            <div class="dicom_info font-monospace small">
                <div>
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
                                                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                                                    <a class="link-primary"
                                                       href={'#'}
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
            </div>
        {/if}
    </div>
</div>

<style>
    .upload {
        min-height: 12em;

        padding: 0.5em 1em;
        margin-bottom: 1em;

        text-align: left;

        background-color: #fafafa;
        border: 3px dashed #eee;
    }

    .upload progress {
        max-width: 10em;
    }

    .dicom_info {
        width: 100%;
        text-align: start;
    }

    .dicom_info > div {
        padding: 0.2em 0.5em;
        border: 1px solid black;
    }

    .dicom_info > div > ul {
        margin-bottom: 0;
        padding-left: 0;
    }

    .dicom_info ul {
        list-style: none;
        padding-left: 1.5em;
    }

    .dicom_info li.series:hover {
        background-color: #eee;
    }

    .dicom_info li.series.suggested {
        font-style: italic;
    }
</style>