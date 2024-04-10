<!--<svelte:options customElement={{tag: "eos-viewer", shadow: 'none'}}/>-->
<script>
    import './Viewer/viewer.css'
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderURL from "./LoaderURL.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";

    export let id
    export let resources = []
    export let clickToLoad = resources.some((element) => element.resource__type === "VOLUME")
    export let startMaximized = resources.every((element) => element.resource__type !== "VOLUME")
    export let screenshotCallback = null

    export let mediaURL = ''

    let models = []
    let volume // only one volume can be visualized, even if more are loaded

    let clicked = false
    let ready = false
    let errorMessage = null

    const resourcesLoaded = function (event) {
        models = event.detail.models
        volume = event.detail.volumes[0]
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
    {#if clickToLoad && !clicked}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="load" role="button" tabindex="0" on:click={() => {clicked = true}}>
            <i class="bi-download fs-4"></i>
            <span>Click to load data</span>
        </div>
    {:else}
        <LoaderURL {resources} {mediaURL} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
    {/if}
    </div>
{:else}
    <div class="viewer_panel">
        <ViewerComponent {id} {models} {volume} {startMaximized} {screenshotCallback} />
    </div>
{/if}

<style>
    .load {
        flex-grow: 1;
        width: 100%;

        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        justify-content: center;

        text-align: center;
    }
</style>