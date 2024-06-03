<script>
    import HttpDataAccessHelper from "@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper";
    import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
    import vtkSTLReader from "@kitware/vtk.js/IO/Geometry/STLReader";

    import {createEventDispatcher} from 'svelte';
    import {convertNRRDtoItk} from "./Loader/nrrdUtils.js";
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper";

    const dispatch = createEventDispatcher();

    export let resources

    /** A base URL to prepend to all resource URLs */
    export let mediaURL = ''

    let models = []
    let volumes = []
    let pending = 0

    let progressBars = []

    $: if (pending === 0) {
        dispatch('loadComplete', {
            models: models,
            volumes: volumes
        })
    }

    function createProgressCallback(progressBar) {
        return (progressEvent) => {
            progressBar.loaded = progressEvent.loaded

            if (progressEvent.lengthComputable) {
                progressBar.total = progressEvent.total
                progressBar.progress = progressEvent.loaded / progressEvent.total
                progressBar.percent = Math.floor(progressBar.progress * 100)
            } else {
                progressBar.progress = null
                progressBar.percent = null
            }
            progressBars = progressBars
        }
    }

    function processModel(model_resource) {
        pending++

        let progressBar = {
            loaded: 0,
            total: null,
            percent: null
        }
        progressBars = [...progressBars, progressBar]

        const progressCallback = createProgressCallback(progressBar)

        HttpDataAccessHelper
            .fetchBinary(mediaURL + model_resource.url, {progressCallback})
            .then((arrayBuffer) => {
                let reader = vtkXMLPolyDataReader.newInstance()
                try {
                    reader.parseAsArrayBuffer(arrayBuffer)
                } catch (e) {
                    // error reading the XMLPolyData, try using the STL reader
                    try {
                        reader = vtkSTLReader.newInstance()
                        reader.parseAsArrayBuffer(arrayBuffer)
                    } catch (e) {
                        dispatch('loadError', {message: `could not open resource (${e.name}).`})
                        return
                    }
                }

                model_resource.source = reader.getOutputData()
                model_resource.visible = true

                models = [...models, model_resource]
                pending--
            })
            .catch((e) => {
                if (e.xhr === undefined) {
                    dispatch('loadError', {message: `could not open resource (${e.message}).`})
                } else {
                    dispatch('loadError', {message: `could not download resource (${e.xhr.statusText}).`})
                }
            })
    }

    function processVolume(volume_resource) {
        pending++

        let progressBar = {
            loaded: 0,
            total: null,
            percent: null
        }
        progressBars = [...progressBars, progressBar]

        const progressCallback = createProgressCallback(progressBar)

        HttpDataAccessHelper
            .fetchBinary(mediaURL + volume_resource.url, {progressCallback})
            .then((arrayBuffer) => {
                try {
                    return convertNRRDtoItk(arrayBuffer, progressCallback)
                } catch (e) {
                    dispatch('loadError', {message: `could not open resource (${e.name}).`})
                }
            })
            .then((itkImage) => {
                const convert = async (itkImage) => convertItkToVtkImage(itkImage)
                convert(itkImage)
                    .then((vtkImage) => {
                        volume_resource.source = vtkImage
                        volume_resource.visible = true

                        volumes = [...volumes, volume_resource]
                        pending--
                    })
            })
            .catch((e) => {
                if (e.xhr === undefined) {
                    dispatch('loadError', {message: `could not open resource (${e.message}).`})
                } else {
                    dispatch('loadError', {message: `could not download resource (${e.xhr.statusText}).`})
                }
            })
    }

    for (const resource of resources) {
        if (resource.type === "VOLUME") {
            processVolume(resource)
        } else if (resource.type === "MODEL") {
            // parse JSON string to extract parameters
            if (resource.params === undefined || resource.params === null || resource.params === "") {
                resource.params = {
                    color: [0.8, 0.8, 1.0],
                    opacity: 1.0
                }
            } else {
                resource.params = JSON.parse(resource.params)
            }

            processModel(resource)
        }
    }
</script>

<div>Loading data...</div>
<div style="display: flex; flex-direction: column">
    {#each progressBars as progressBar}
        {#if progressBar.percent === null}
            <progress></progress>
        {:else}
            <progress value={progressBar.progress}>{progressBar.percent}%</progress>
        {/if}
    {/each}
</div>