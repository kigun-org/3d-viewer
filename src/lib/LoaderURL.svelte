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
                return convertNRRDtoItk(arrayBuffer, progressCallback)
            })
            .then((itkImage) => {
                const convert = async (itkImage) => convertItkToVtkImage(itkImage)
                return convert(itkImage)
            })
            .then((vtkImage) => {
                volume_resource.source = vtkImage
                volume_resource.visible = true

                volumes = [...volumes, volume_resource]
                pending--
            })
            .catch((err) => {
                dispatch('loadError', {message: `could not open resource (${err}).`})
            })
    }

    for (const resource of resources) {
        if (resource.type === "VOLUME") {
            // Set default paramaters for VOLUME if none are specified
            const defaultParams = {
                window: 4000,
                level: 1000,
                color_transfer: [ // intensity, R (0-1), G, B
                    [200.0, 0.8, 0.6, 0.4],
                    [2000.0, 1.0, 1.0, 1.0]
                ],
                piecewise: [ // intensity, opacity (0-1)
                    [300.0, 0],
                    [500.0, 0.7],
                    [2000.0, 1.0]
                ],
                shading: true,
                ambient: 0.2,
                diffuse: 0.7,
                specular: 0.3,
                specular_power: 8.0
            }
            if (resource.params !== undefined && resource.params !== null) {
                resource.params = {...defaultParams, ...resource.params}
            } else {
                resource.params = defaultParams
            }

            processVolume(resource)
        } else if (resource.type === "MODEL") {
            // Set default paramaters for MODEL if none are specified
            const defaultParams = {
                color: [0.8, 0.8, 1.0],
                opacity: 1.0
            }
            if (resource.params !== undefined && resource.params !== null) {
                resource.params = {...defaultParams, ...resource.params}
            } else {
                resource.params = defaultParams
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
