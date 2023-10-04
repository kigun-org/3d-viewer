<script>
    import {onMount} from "svelte";
    import {createVolume, parseDICOMFiles, convertToNRRD, uploadVolume} from "./dicomUtils.js";
    import {Status} from "./Status.js";
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper.js";

    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    let loaded = 0
    let total = 100
    let progressBarIndeterminate = false
    export let imageLoadedCallback = null

    let state = []

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

    const updateState = function (message, status = Status.RUNNING) {
        state.forEach((s) => {
            if (s.status === Status.RUNNING) {
                s.status = Status.INFO
            }
        })
        state.push({status: status, message: message})

        return state
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

                    console.log("DICOM files: ", fileInfoList)

                    const groupedFileInfoList = new Map()
                    fileInfoList.forEach((fileInfo) => {
                        if (groupedFileInfoList.has(fileInfo.patientID)) {
                            const studies = groupedFileInfoList.get(fileInfo.patientID)

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
                            groupedFileInfoList.set(fileInfo.patientID,
                                new Map([[fileInfo.studyInstanceID, new Map([[fileInfo.seriesInstanceID, [fileInfo]]])]]))
                        }
                    })

                    console.log("DICOM files grouped by patient/study/series: ", groupedFileInfoList)

                    if (groupedFileInfoList.size > 1) {
                        state = updateState("Multiple patients found.", Status.WARNING)
                    } else {
                        const studies = groupedFileInfoList.values().next().value
                        if (studies.size > 1) {
                            state = updateState("Multiple studies found.", Status.WARNING)
                        } else {
                            const series = studies.values().next().value
                            if (series.size > 1) {
                                state = updateState("Multiple series found.", Status.WARNING)
                            } else {
                                const image = series.values().next().value[0]
                                state = updateState(
                                    `Single DICOM image series: ${image.patientID} ${image.patientName}`,
                                    Status.INFO)
                            }
                        }
                    }

                    state = updateState("Creating volume")

                    return createVolume(fileInfoList.map((result) => result.file), progressCallback)
                }).then((outputImage) => {
                const vtkImage = convertItkToVtkImage(outputImage)
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
                state = updateState("Done", Status.INFO)
            })
        })

        function uploadImage(outputImage) {
            state = updateState("Converting to NRRD format")

            let timeAfterDICOMTags = performance.now()
            const timeAfterLoadingImageSeries = performance.now()
            console.log(`loading image: ${(timeAfterLoadingImageSeries - timeAfterDICOMTags).toFixed(1)} ms`)

            convertToNRRD(outputImage, progressCallback)
                .then((arrayBuffer) => {
                    state = updateState("Uploading volume")
                    loaded = 0
                    progressBarIndeterminate = false

                    return uploadVolume(arrayBuffer, progressCallback, () => {
                        state = updateState("Done.", Status.INFO)
                    })
                })
        }
    })
</script>

<div class="upload">
    <input id="upload" type="file" webkitdirectory directory multiple
           style="display: none"/>
    <label for="upload">
        {#each state as s}
            {#if s.status === Status.INFO || s.status === Status.RUNNING}
                <span>
                    {s.message}
                </span>
            {:else if s.status === Status.WARNING}
                <span class="text-warning fw-semibold">WARNING: {s.message}</span>
            {/if}
        {:else}
            <span class="initial">
                <i class="bi-upload"></i>
                Select folder to upload
            </span>
        {/each}
        {#if state.length > 0 && state[state.length - 1].status === Status.RUNNING}
            {#if progressBarIndeterminate}
                <progress></progress>
            {:else}
                <progress value={progress}></progress>
            {/if}
        {/if}
    </label>
</div>

<style>
    .upload {
        margin-bottom: 1em;
        min-width: 10em;
    }

    .upload label {
        min-height: 10em;
        background-color: #fafafa;
        border: 3px dashed #eee;
        padding: 1em;
        display: flex;
        flex-direction: column;
        align-items: start
    }

    .upload label .initial {
        align-self: center;
        margin: auto 0;
    }

    .upload label .initial i {
        display: block;
        padding-bottom: 0.35em;
        font-size: 2em
    }

    .upload progress {
        max-width: 10em;
    }
</style>