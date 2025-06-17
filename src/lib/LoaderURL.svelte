<script>
    import vtkXMLPolyDataReader from "@kitware/vtk.js/IO/XML/XMLPolyDataReader";
    import vtkSTLReader from "@kitware/vtk.js/IO/Geometry/STLReader";

    import {convertNRRDtoItk} from "./Loader/nrrdUtils.js";
    import {convertItkToVtkImage} from "@kitware/vtk.js/Common/DataModel/ITKHelper";


    /**
     * @typedef {Object} Props
     * @property {any} resources
     * @property {string} [mediaURL] - A base URL to prepend to all resource URLs
     * @property {any} complete
     * @property {any} error
     */

    /** @type {Props} */
    let {
        resources = $bindable(),
        mediaURL = '',
        complete,
        error
    } = $props();

    let models = $state([])
    let volume = $state(undefined)

    let loading = $state(false)
    let pending = $state(0)

    let progressBars = $state({})

    $effect(() => {
        if (loading && pending === 0) {
            complete(models, volume)
            loading = false
        }
    });

    function createProgressCallback(url) {
        progressBars[url] = {
            loaded: 0,
            total: null,
            percent: null
        }

        return (progressEvent) => {
            progressBars[url].loaded = progressEvent.loaded

            if (progressEvent.lengthComputable) {
                progressBars[url].total = progressEvent.total
                progressBars[url].progress = progressEvent.loaded / progressEvent.total
                progressBars[url].percent = Math.floor(progressBars[url].progress * 100)
            } else {
                progressBars[url].progress = null
                progressBars[url].percent = null
            }
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

        const progressCallback = createProgressCallback(model_resource.url)

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
                        error(`could not open resource (${err.name}).`)
                        return
                    }
                }

                model_resource.source = reader.getOutputData()
                model_resource.visible = true

                models = [...models, model_resource]
                pending--
            })
            .catch((err) => {
                error(`could not open resource (${err}).`)
            })
    }

    function processVolume(volume_resource) {
        if (volume !== undefined)
            throw Error("Multiple volumes are not supported.")

        pending++

        const progressCallback = createProgressCallback(volume_resource.url)

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

                volume = volume_resource
                pending--
            })
            .catch((err) => {
                error(`could not open resource (${err}).`)
            })
    }

    loading = true

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
{#each Object.values(progressBars) as progressBar}
    {#if progressBar.percent === null}
        <progress></progress>
    {:else}
        <progress value={progressBar.progress}>{progressBar.percent}%</progress>
    {/if}
{/each}
