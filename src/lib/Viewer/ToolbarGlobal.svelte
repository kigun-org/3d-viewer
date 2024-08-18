<script>
    import ObjectList from "./ObjectList.svelte";

    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    export let objectListVisible

    export let showWindowLevelButton = true

    export let showScreenshotButton

    export let toolbarBackground = false

    export let models
    export let volume

    $: objectCount = models.length + (volume !== undefined ? 1 : 0)

    function resetWindowLevel() {
        dispatch("resetWindowLevel")
    }

    function resetCamera() {
        dispatch("resetCamera")
    }

    function saveScreenshot() {
        dispatch('screenshot')
    }

    function updateShift(e) {
        dispatch('updateShift', e.detail)
    }
</script>

<div class="overlay-global d-flex align-items-center justify-content-end gap-4 px-2 py-1" class:background={toolbarBackground}>
    <div class="d-flex gap-1">
        {#if showWindowLevelButton}
            <button class="btn btn-sm" on:click={resetWindowLevel} aria-label="Reset W/L" title="Reset window/level">
                <i class="bi bi-circle-half"></i>
            </button>
        {/if}

        <button class="btn btn-sm" on:click={resetCamera} aria-label="Reset camera" title="Reset camera">
            <i class="bi bi-fullscreen"></i>
        </button>
    </div>

    {#if objectCount > 1 || volume !== undefined}
        <button class="btn btn-sm" class:active={objectListVisible}
                on:click={() => { objectListVisible = !objectListVisible }}
                aria-label="Show/hide object list" title="Show/hide object list">
            <i class="bi bi-list-check"></i>
        </button>
    {/if}

    {#if showScreenshotButton}
        <button class="btn btn-sm" on:click={saveScreenshot} aria-label="Save screenshot" title="Save screenshot">
            <i class="bi bi-camera"></i>
        </button>
    {/if}
</div>

{#if objectListVisible}
    <ObjectList bind:models={models} bind:volume={volume} on:updateShift={updateShift} />
{/if}

<style>
    .overlay-global {
        position: absolute;
        top: 0;
        right: 0;
    }

    .active {
        color: dodgerblue;
    }

    .background {
        left: 0;
        background-color: rgba(var(--bs-light-rgb), 0.9);
    }
</style>
