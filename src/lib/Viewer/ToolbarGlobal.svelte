<script>
    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    import ObjectList from "./ObjectList.svelte";

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
            <button class="btn btn-icon" on:click={resetWindowLevel} aria-label="Reset W/L" title="Reset window/level">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-contrast"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-9 1.732a8 8 0 0 0 4.001 14.928l-.001 -16a8 8 0 0 0 -4 1.072" /></svg>
            </button>
        {/if}

        <button class="btn btn-icon" on:click={resetCamera} aria-label="Reset camera" title="Reset camera">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-maximize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>
        </button>
    </div>

    {#if objectCount > 1 || volume !== undefined}
        <button class="btn btn-icon" class:active={objectListVisible}
                on:click={() => { objectListVisible = !objectListVisible }}
                aria-label="Show/hide object list" title="Show/hide object list">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-list-details"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 5h8" /><path d="M13 9h5" /><path d="M13 15h8" /><path d="M13 19h5" /><path d="M3 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M3 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /></svg>
        </button>
    {/if}

    {#if showScreenshotButton}
        <button class="btn btn-primary btn-icon" on:click={saveScreenshot} aria-label="Save screenshot" title="Save screenshot">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-camera"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
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
        background-color: rgba(255, 255, 255, 0.9);
    }
</style>
