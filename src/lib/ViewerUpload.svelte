<script>
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderDICOM from "./LoaderDICOM.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import LoaderURL from "./LoaderURL.svelte";

    export let screenshotCallback = null

    export let sampleModel = undefined
    export let sampleVolume = undefined

    export let modelFileList = []
    export let dicomFileList = []

    let models = []
    let volume

    let sampleModelSelected = false
    let sampleVolumeSelected = false

    let ready = false
    let errorMessage = undefined

    function volumeLoaded(event) {
        volume = {
            id: 42,
            caption: "CBCT",
            r_id: 0,
            type: "VOLUME",
            source: event.detail.image,
            visible: true
        }
        ready = true
    }

    function sampleResourceLoaded(event) {
        models = event.detail.models
        volume = event.detail.volumes[0]
        ready = true
    }

    function handleError(event) {
        errorMessage = event.detail.message
    }
</script>

{#if errorMessage !== undefined}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
    </div>
{:else}
    {#if dicomFileList.length === 0 && modelFileList.length === 0 && !sampleModelSelected && !sampleVolumeSelected}
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
                               on:change={(ev) => dicomFileList = ev.target.files || ev.dataTransfer.files}/>
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
                        <div on:click={() => sampleModelSelected = true} role="button" tabindex="0">
                            <i class="bi bi-download fs-1"></i>
                            <div>Load sample model</div>
                        </div>
                    </div>
                </div>
                <div class="col-4 col-md-2">
                    <div class="upload text-secondary">
                        <div on:click={() => sampleVolumeSelected = true} role="button" tabindex="0">
                            <i class="bi bi-download fs-1"></i>
                            <div>Load sample volume</div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div class="upload">
            {#if modelFileList.length > 0}
                <LoaderURL resources={[sampleModel]} on:loadComplete={sampleResourceLoaded}
                           on:loadError={handleError}/>
            {:else if dicomFileList.length > 0}
                <LoaderDICOM fileList={dicomFileList} on:loadComplete={volumeLoaded} on:loadError={handleError}/>
            {:else if sampleModelSelected}
                <LoaderURL resources={[sampleModel]} on:loadComplete={sampleResourceLoaded}
                           on:loadError={handleError}/>
            {:else if sampleVolumeSelected}
                <LoaderURL resources={[sampleVolume]} on:loadComplete={sampleResourceLoaded}
                           on:loadError={handleError}/>
            {/if}
        </div>
    {/if}

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent {models} {volume} {screenshotCallback}/>
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
