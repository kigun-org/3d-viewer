<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderURL from "./LoaderURL.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";

    export let id
    export let resources = []
    export let startMaximized = true
    export let screenshotCallback = null
    export let clickToLoad = false

    export let mediaURL = ''

    let models = []
    let volumes = []

    let clicked = false
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
    {#if clickToLoad && !clicked}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="viewer_panel loading" role="button" tabindex="0" on:click={() => {clicked = true}}>
            Click to load data
        </div>
    {:else}
        <div class="viewer_panel loading">
            <LoaderURL {resources} {mediaURL} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
        </div>
    {/if}
{:else}
    <div class="viewer_panel">
        <ViewerComponent {id} {models} {volumes} {startMaximized} {screenshotCallback} />
    </div>
{/if}
