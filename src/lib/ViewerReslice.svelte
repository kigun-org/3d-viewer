<script>
    import './Viewer/viewer.css'
    import LoaderRemote from "./Loaders/LoaderRemote.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";
    import ResliceComponent from "./ResliceComponent.svelte";

    export let resources = []

    let image = null

    let ready = false
    let errorMessage = null

    const resourcesLoaded = function (event) {
        image = event.detail.volumes[0].source
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
        <ResliceComponent {image} />
    </div>
{/if}
