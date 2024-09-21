<!--<svelte:options customElement={{tag: "eos-viewer", shadow: 'none'}}/>-->
<script>
    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderURL from "./LoaderURL.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";

    export let resources = []
    export let clickToLoad = resources.some((r) => r.type === "VOLUME")
    export let startMaximized = resources.every((r) => r.type !== "VOLUME")
    export let screenshotCallback = null

    export let mediaURL = ''

    let models = []
    let volume // only one volume can currently be visualized

    let clicked = false
    let ready = false
    let errorMessage

    const resourcesLoaded = function (event) {
        models = event.detail.models
        volume = event.detail.volumes[0]
        ready = true
    }

    const handleError = function (event) {
        errorMessage = event.detail.message
    }
</script>

{#if errorMessage !== undefined}
    <div class="viewer_panel error">
        <ErrorMessage {errorMessage}/>
    </div>
{:else if !ready}
    <div class="viewer_panel loading">
    {#if clickToLoad && !clicked}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="flex-grow-1 w-100" role="button" tabindex="0" on:click={() => {clicked = true}}>
            <i class="bi bi-download fs-1"></i>
            <div>Click to load data</div>
        </div>
    {:else}
        <LoaderURL {resources} {mediaURL} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
    {/if}
    </div>
{:else}
    <div class="viewer_panel">
        <ViewerComponent {models} {volume} {startMaximized} {screenshotCallback} />
    </div>
{/if}

<style>
    .viewer_panel {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.25rem;
        min-height: 400px;
        aspect-ratio: 4 / 3;
    }
    .viewer_panel.loading {
        background-color: #cde;
    }
    .viewer_panel.error {
        background-color: #edd;
    }

    .viewer_panel > div {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
</style>