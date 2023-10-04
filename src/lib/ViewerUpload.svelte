<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderDICOM from "./Loaders/LoaderDICOM.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";

    export let id
    export let screenshotCallback = null

    let loader

    let models = []
    let volumes = []

    let ready = false
    let errorMessage = null

    const resourcesLoaded = function (event) {
        volumes = event.detail.volumes
        ready = true
    }

    const handleError = function (event) {
        errorMessage = event.detail.message
    }

    const uploadImage = function () {
        loader.uploadImage()
    }
</script>

{#if errorMessage !== null}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
        error
    </div>
{:else}
    <LoaderDICOM bind:this={loader} on:loadComplete={resourcesLoaded} on:loadError={handleError} />

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent {id} {models} {volumes} startMaximized={false} {screenshotCallback} />
        </div>

        <div>
            <button on:click={uploadImage}>Upload image</button>
        </div>
    {/if}
{/if}
