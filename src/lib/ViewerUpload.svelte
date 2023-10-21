<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderDICOM from "./LoaderDICOM.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import {onMount} from "svelte";

    export let id
    export let screenshotCallback = null

    export let fileList = null

    let models = []
    let volumes = []

    let ready = false
    let errorMessage = null

    const resourcesLoaded = function (event) {
        volumes = [{
            id: 42,
            caption: "CBCT",
            resource__id: 0,
            resource__type: "VOLUME",
            source: event.detail.image,
            visible: true
        }]
        ready = true
    }

    const handleError = function (event) {
        errorMessage = event.detail.message
    }

    onMount(() => {
        document.getElementById('upload').addEventListener('change', (event) => {
            fileList = event.target.files || event.dataTransfer.files
        })
    })
</script>

{#if errorMessage !== null}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
        error
    </div>
{:else}
    <div class="upload">
    {#if fileList === null}
        <input id="upload" type="file" webkitdirectory directory multiple />
        <label for="upload">
            <i class="bi-upload fs-4"></i>
            <span>Click to select folder</span>
        </label>
    {:else}
        <LoaderDICOM {fileList} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
    {/if}
    </div>

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent {id} {models} {volumes} startMaximized={false} {screenshotCallback} />
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

    .upload label {
        height: 100%;
        min-height: 12em;

        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        justify-content: center;

        text-align: center;
    }
</style>
