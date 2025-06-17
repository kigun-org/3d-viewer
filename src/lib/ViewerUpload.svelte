<script>
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderDICOM from "./LoaderDICOM.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import LoaderURL from "./LoaderURL.svelte";


    /**
     * @typedef {Object} Props
     * @property {any} [screenshotCallback]
     * @property {any} [sampleModel]
     * @property {any} [sampleVolume]
     * @property {any} [resources]
     * @property {any} [dicomFileList]
     */

    /** @type {Props} */
    let {
        screenshotCallback = null,
        sampleModel = undefined,
        sampleVolume = undefined,
        resources = [],
        dicomFileList = $bindable([])
    } = $props();

    let models = $state([])
    let volume = $state(undefined)

    let sampleModelSelected = $state(false)
    let sampleVolumeSelected = $state(false)

    let ready = $state(false)
    let errorMessage = $state(undefined)

    function volumeLoaded(event) {
        volume = {
            id: 42,
            caption: "CBCT",
            type: "VOLUME",
            source: event.detail.image,
            visible: true,
            params: {
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
        }
        ready = true
    }

    function resourcesLoaded(_models, _volume) {
        models = _models
        volume = _volume
        ready = true
    }

    function handleError(message) {
        errorMessage = message
    }
</script>

{#if errorMessage !== undefined}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
    </div>
{:else}
    {#if dicomFileList.length === 0 && resources.length === 0 && !sampleModelSelected && !sampleVolumeSelected}
        <div class="row">
<!--            <div class="col">-->
<!--                <div class="upload text-secondary">-->
<!--                    <label>-->
<!--                        <input type="file" multiple accept=".stl"-->
<!--                               on:change={(ev) => modelFileList = ev.target.files || ev.dataTransfer.files}/>-->
<!--                        <div>-->
<!--                            <i class="bi-box fs-1"></i>-->
<!--                        </div>-->
<!--                        <span>Click to select STL file</span>-->
<!--                    </label>-->
<!--                </div>-->
<!--            </div>-->
            <div class="col-8">
                <div class="upload text-secondary">
                    <label>
                        <input type="file" webkitdirectory directory multiple
                               onchange={(ev) => dicomFileList = ev.target.files || ev.dataTransfer.files}/>
                        <div>
                            <i class="bi-radioactive fs-1"></i>
                        </div>
                        <span>Click to select DICOM folder</span>
                    </label>
                </div>
            </div>
            {#if sampleModel !== undefined || sampleVolume !== undefined}
                <div class="w-100 d-block d-md-none"></div>
                <div class="col-4 col-md-2">
                    <div class="upload text-secondary">
                        <div onclick={() => sampleModelSelected = true} role="button" tabindex="0">
                            <i class="bi bi-download fs-1"></i>
                            <div>Load sample model</div>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-2">
                    <div class="upload text-secondary">
                        <div onclick={() => sampleVolumeSelected = true} role="button" tabindex="0">
                            <i class="bi bi-download fs-1"></i>
                            <div>Load sample volume</div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div class="upload">
            {#if resources.length > 0}
                <LoaderURL {resources} complete={resourcesLoaded} error={handleError}/>
            {:else if dicomFileList.length > 0}
                <LoaderDICOM fileList={dicomFileList} on:loadComplete={volumeLoaded} on:loadError={handleError}/>
            {:else if sampleModelSelected}
                <LoaderURL resources={[sampleModel]} complete={resourcesLoaded} error={handleError}/>
            {:else if sampleVolumeSelected}
                <LoaderURL resources={[sampleVolume]} complete={resourcesLoaded} error={handleError}/>
            {/if}
        </div>
    {/if}

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent bind:models={models} bind:volume={volume} {screenshotCallback}/>
        </div>
    {/if}
{/if}

<style>
    .upload {
        min-height: 12em;

        padding: 0.5em 1em;
        margin-bottom: 1em;

        text-align: left;

        background-color: #fafafa;
        border: 3px dotted #eee;
    }

    .upload input {
        display: none;
    }

    .upload > label, .upload > div {
        height: 100%;
        min-height: 12em;

        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        justify-content: center;

        text-align: center;
    }

    .viewer_panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        min-height: 400px;
        aspect-ratio: 4 / 3;
    }

    .viewer_panel.error {
        background-color: #edd;
    }
</style>
