<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderRemote from "./Loaders/LoaderRemote.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";

    export let id
    export let resources = []
    export let startMaximized = true
    export let screenshotCallback = null

    let models = []
    let volumes = []

    let ready = false
    let errorMessage = null

    const resourcesLoaded = function (event) {
        models = event.detail.models
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
{:else if !ready}
    <div class="viewer_panel loading">
        <LoaderRemote {resources} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
    </div>
{:else}
    <div class="viewer_panel">
        <ViewerComponent {id} {models} {volumes} {startMaximized} {screenshotCallback} />
    </div>
{/if}
