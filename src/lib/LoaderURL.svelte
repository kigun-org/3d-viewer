<script>
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

    async function fetchData(url, progressCallback) {
        return fetch(url)
            .then((response) => {
                let total_length = 0
                let current_length = 0

                if (response.headers.has('content-length')) {
                    total_length = parseInt(response.headers.get('content-length'))
                    }

                progressCallback(new ProgressEvent('loadstart', {
                    lengthComputable: total_length > 0,
                    loaded: 0,
                    total: total_length
                }))

                const reader = response.body.getReader();
                return new ReadableStream({
                    start(controller) {
                        return pump()

                        function pump() {
                            return reader.read().then(({done, value}) => {
                                if (done) {
                                    controller.close()

                                    progressCallback(new ProgressEvent('loadend', {
                                        lengthComputable: total_length > 0,
                                        loaded: current_length,
                                        total: total_length
                                    }))

                                    return
                                } else {
                                    current_length += value.length

                                    progressCallback(new ProgressEvent('progress', {
                                        lengthComputable: total_length > 0,
                                        loaded: current_length,
                                        total: total_length
                                    }))
                                }
                                controller.enqueue(value)
                                return pump()
                            })
                        }
                    },
                });
            })
            .then((stream) => new Response(stream))
            .then((response) => response.arrayBuffer())
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

        fetchData(mediaURL + model_resource.url, progressCallback)
            .then((arrayBuffer) => {
                let reader = vtkXMLPolyDataReader.newInstance()
                try {
                    reader.parseAsArrayBuffer(arrayBuffer)
                } catch (e) {
                    // error reading the XMLPolyData, try using the STL reader
                    try {
                        reader = vtkSTLReader.newInstance()
                        reader.parseAsArrayBuffer(arrayBuffer)
                    } catch (err) {
                        dispatch('loadError', {message: `could not open resource (${err.name}).`})
                        return
                    }
                }

                model_resource.source = reader.getOutputData()
                model_resource.visible = true

                models = [...models, model_resource]
                pending--
            })
            .catch((err) => {
                dispatch('loadError', {message: `could not open resource (${err}).`})
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

        fetchData(mediaURL + volume_resource.url, progressCallback)
            .then((arrayBuffer) => {
                try {
                    return convertNRRDtoItk(arrayBuffer, progressCallback)
                } catch (err) {
                    dispatch('loadError', {message: `could not open resource (${err.name}).`})
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
            .catch((err) => {
                dispatch('loadError', {message: `could not open resource (${err}).`})
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

<div>Loading data</div>
{#each progressBars as progressBar}
    {#if progressBar.percent === null}
        <progress></progress>
    {:else}
        <progress value={progressBar.progress}>{progressBar.percent}%</progress>
    {/if}
{/each}
