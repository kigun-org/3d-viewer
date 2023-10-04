<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import LoaderDICOM from "./Loaders/LoaderDICOM.svelte";

    export let id
    export let screenshotCallback = null

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
</script>

{#if errorMessage !== null}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
    </div>
{:else}
    <LoaderDICOM on:loadComplete={resourcesLoaded} on:loadError={handleError} />

    {#if ready}
        <div class="viewer_panel">
            <ViewerComponent {id} {models} {volumes} startMaximized={false} {screenshotCallback} />
        </div>
    {/if}
{/if}
