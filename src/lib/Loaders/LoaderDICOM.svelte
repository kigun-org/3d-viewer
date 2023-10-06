<script>
    import {onMount, createEventDispatcher} from "svelte";
    import {createVolume, parseDICOMFiles, convertToNRRD, uploadVolume} from "./dicomUtils.js";
    import {Status} from "./Status.js";
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper";

    const dispatch = createEventDispatcher();

    let loaded = 0
    let total = 100
    let progressBarIndeterminate = false

    let state = []

    let fileInfoMap = null

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

    const describeImageSeries = function (image) {
        return `${image.patientName}; DOB ${image.patientDateOfBirth}; ${image.patientID} | ${image.studyDate} | ${image.seriesDescription}`
    }

    const selectImageSeries = function (fileInfoList, appendState=false) {
        fileInfoMap = null

        state = updateState(
            `DICOM image series selected: ${describeImageSeries(fileInfoList[0])}`,
            Status.INFO, appendState)

        state = updateState("Creating volume")
        createVolume(fileInfoList.map((result) => result.file), progressCallback)
            .then(createImage)
    }

    const createImage = (itkImage) => {
        const vtkImage = convertItkToVtkImage(itkImage)
        dispatch('loadComplete', {
            volumes: [{
                id: 42,
                caption: "CBCT",
                resource__id: 0,
                resource__type: "VOLUME",
                source: vtkImage,
                visible: true
            }]
        })
        state = updateState("Done.", Status.INFO)
    }

    export const uploadImage = function () {
        state = updateState("Converting to NRRD format")

        // convertToNRRD(image, progressCallback)
        //     .then((arrayBuffer) => {
        //         state = updateState("Uploading volume")
        //         loaded = 0
        //         progressBarIndeterminate = false
        //
        //         return uploadVolume(arrayBuffer, progressCallback, () => {
        //             state = updateState("Done.", Status.INFO)
        //         })
        //     })
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
        const fileInput = document.querySelector('.upload input')
        fileInput.addEventListener('change', (event) => {
            const dataTransfer = event.dataTransfer
            const fileList = event.target.files || dataTransfer.files

            // disable file upload by removing label's for
            event.target.labels[0].removeAttribute('for')

            state = [{status: Status.RUNNING, message: "Loading DICOM files"}]

            parseDICOMFiles(fileList, progressCallback)
                .then((fileList) => {
                    const fileInfoList = fileList.filter((result) => result.isDICOM)

                    state = updateState(
                        `Read ${fileInfoList.length} DICOM files.`,
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

                    // console.log("DICOM files (grouped): ", groupedFileInfoMap)

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
                        fileInfoMap = new Map([...groupedFileInfoMap.entries()].sort((a, b) => {
                            return getFirstImage(a[1]).patientName.localeCompare(getFirstImage(b[1]).patientName)
                        }))
                        state = updateState('Select image series to load:', Status.INFO)
                    } else {
                        selectImageSeries(fileInfoList, true)
                    }
                })
                .catch((_) => {
                    state = updateState('No DICOM files found.', Status.ERROR, false)
                })
        })
    })
</script>

<div class="upload">
    {#if state.length > 0}
        <div>
            {#each state as s}
                {#if s.status === Status.INFO || s.status === Status.RUNNING}
                    <span>
                        {s.message}
                    </span>
                {:else if s.status === Status.WARNING}
                    <span class="text-warning fw-semibold">WARNING: {s.message}</span>
                {:else if s.status === Status.ERROR}
                    <span class="text-danger fw-semibold">ERROR: {s.message}</span>
                {/if}
            {/each}

            {#if state[state.length - 1].status === Status.RUNNING}
                {#if progressBarIndeterminate}
                    <progress></progress>
                {:else}
                    <progress value={progress}></progress>
                {/if}
            {/if}

            {#if fileInfoMap}
                <div class="dicom_info">
                    <div>
                        <ul>
                            {#each fileInfoMap as [patient, studiesMap]}
                                <li>
                                    <strong>
                                        Patient
                                        [{getFirstImage(studiesMap).patientName};
                                        DOB {getFirstImage(studiesMap).patientDateOfBirth};
                                        {patient}]
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
                                                        <a on:click={() => { selectImageSeries(images) }}>
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
    {:else}
        <input id="upload" type="file" webkitdirectory directory multiple
               style="display: none"/>
        <label for="upload">
            <i class="bi-upload"></i>
            <span>Select folder to upload</span>
        </label>
    {/if}
</div>

<style>
    .upload {
        margin-bottom: 1em;
        min-width: 10em;
        background-color: #fafafa;
        border: 3px dashed #eee;
    }

    .upload label, .upload > div {
        display: flex;
        flex-direction: column;
        padding: 1em;
        min-height: 10em;
    }

    .upload label {
        align-items: center;
        justify-content: center;
    }

    .upload label i {
        display: block;
        padding-bottom: 0.35em;
        font-size: 2em
    }

    .upload div {
        align-items: start;
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