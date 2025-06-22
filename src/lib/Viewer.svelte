<!--<svelte:options customElement={{tag: "eos-viewer", shadow: 'none'}}/>-->
<script>
    import "./tailwind.css";

    import ViewerComponent from "./Viewer/ViewerComponent.svelte";
    import LoaderURL from "./LoaderURL.svelte";
    import ErrorMessage from "./Viewer/ErrorMessage.svelte";


    /**
     * @typedef {Object} Props
     * @property {any} [resources]
     * @property {any} [clickToLoad]
     * @property {any} [startMaximized]
     * @property {any} [screenshotCallback]
     * @property {string} [mediaURL]
     */

    /** @type {Props} */
    let {
        resources = [],
        clickToLoad = resources.some((r) => r.type === "VOLUME"),
        startMaximized = resources.every((r) => r.type !== "VOLUME"),
        screenshotCallback = null,
        mediaURL = ''
    } = $props();

    let models = $state([])
    let volume = $state() // only one volume can currently be visualized

    let clicked = $state(false)
    let ready = $state(false)
    let errorMessage = $state()

    const resourcesLoaded = function (_models, _volume) {
        models = _models
        volume = _volume
        ready = true
    }

    const handleError = function (message) {
        errorMessage = message
    }
</script>

<div class="viewers" style="aspect-ratio: 4 / 3">
    {#if errorMessage !== undefined}
        <div class="k-flex k-h-full k-flex-col k-items-center k-justify-center k-gap-2 k-p-8 k-bg-red-100">
            <ErrorMessage {errorMessage}/>
        </div>
    {:else if !ready}
        <div class="k-flex k-h-full k-flex-col k-items-center k-justify-center k-gap-2 k-bg-blue-100">
            {#if clickToLoad && !clicked}
                <button class="k-flex k-btn k-btn-lg k-btn-outline" onclick={() => {clicked = true}}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         class="icon icon-tabler icons-tabler-outline icon-tabler-download">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2 -2v-2"/>
                        <path d="M7 11l5 5l5 -5"/>
                        <path d="M12 4l0 12"/>
                    </svg>
                    <span>Click to load data</span>
                </button>
<!--                <div class="lg:k-hidden k-text-xl k-p-8">-->
<!--                    Display too small for 3D viewer.<br>-->
<!--                    Please view this page on a larger screen.-->
<!--                </div>-->
            {:else}
                <LoaderURL {resources} {mediaURL} complete={resourcesLoaded} error={handleError}/>
            {/if}
        </div>
    {:else}
        <div class="k-relative k-h-full k-bg-base-200">
            <ViewerComponent bind:models={models} bind:volume={volume} {startMaximized} {screenshotCallback}/>
        </div>
    {/if}
</div>

<style></style>