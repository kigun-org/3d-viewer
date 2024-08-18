<script>
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderDICOM from "./LoaderDICOM.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import LoaderURL from "./LoaderURL.svelte";

    export let id
    export let screenshotCallback = null

    export let sampleResource = undefined

    export let fileList = []

    let models = []
    let volume

    let sampleData = false
    let ready = false
    let errorMessage = undefined

    function resourcesLoaded(event) {
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
    {#if fileList.length === 0 && !sampleData}
        <div class="row">
            <div class="col">
                <div class="upload text-secondary">
                    <input id={`upload_${id}`} type="file" webkitdirectory directory multiple
                           on:change={(ev) => fileList = ev.target.files || ev.dataTransfer.files} />
                    <label for={`upload_${id}`}>
                        <div>
                            <i class="bi-folder fs-1"></i>
                        </div>
                        <span>Click to select folder<br>or drag and drop DICOM files</span>
                    </label>
                </div>
            </div>
            {#if sampleResource !== undefined}
                <div class="col-4">
                    <div class="upload text-secondary">
                        <div on:click={() => sampleData = true} role="button" tabindex="0">
                            <i class="bi bi-download fs-1"></i>
                            <div>Load sample data</div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>
    {:else}
        <div class="upload">
            {#if fileList.length > 0}
                <LoaderDICOM {fileList} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
            {:else}
                <LoaderURL resources={[sampleResource]} on:loadComplete={sampleResourceLoaded} on:loadError={handleError} />
            {/if}
        </div>
    {/if}

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent {models} {volume} startMaximized={false} {screenshotCallback} />
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
