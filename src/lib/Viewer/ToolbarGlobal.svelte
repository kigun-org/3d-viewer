<script>
    import ObjectList from "./ObjectList.svelte";

    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    export let objectListVisible

    export let showWindowLevelButton = true

    export let showScreenshotButton

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
</script>

<div class="overlay-global">
    <div style="display: flex; gap: 0.75rem">
        {#if showWindowLevelButton}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
            <i class="bi bi-brightness-high-fill"
               on:click={resetWindowLevel}
               aria-label="Reset W/L" role="button" tabindex="0"
               title="Reset window/level"></i>
        {/if}

        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i class="bi bi-camera-reels"
           on:click={resetCamera}
           aria-label="Reset camera" role="button" tabindex="0"
           title="Reset camera"></i>
    </div>

    <div style="display: flex; gap: 0.75rem">
        {#if objectCount > 1}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <i class="bi bi-list-check"
               class:active={objectListVisible}
               on:click={() => { objectListVisible = !objectListVisible }}
               aria-label="Show/hide object list" role="button" tabindex="0"
               title="Show/hide object list"></i>
        {/if}

        {#if showScreenshotButton}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <i class="bi bi-camera"
               on:click={saveScreenshot}
               aria-label="Save screenshot" role="button" tabindex="0"
               title="Save screenshot"></i>
        {/if}
    </div>
</div>

{#if objectListVisible}
    <ObjectList bind:models={models} bind:volume={volume} />
{/if}

<style>
    .overlay-global {
        position: absolute;
        top: 0;
        right: 0;
        padding: 0.1em 0.5em;

        display: flex;
        gap: 2.5em;
        align-items: center;
    }

    .active {
        color: dodgerblue;
    }
</style>
