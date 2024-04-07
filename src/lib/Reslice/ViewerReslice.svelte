<script>
    import '../Viewer/viewer.css'
    import LoaderURL from "../LoaderURL.svelte";
    import ErrorMessage from "../Viewer/ErrorMessage.svelte";
    import ResliceComponent from "./ResliceComponent.svelte";
    import ResliceComponent2 from "./ResliceComponent2.svelte";

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
        <LoaderURL {resources} on:loadComplete={resourcesLoaded} on:loadError={handleError} />
    </div>
{:else}
    <div class="viewer_panel">
<!--        <ResliceComponent {image} />-->
        <ResliceComponent2 {image} />
    </div>
{/if}
