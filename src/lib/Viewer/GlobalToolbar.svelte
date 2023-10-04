<script>
    import ObjectList from "./ObjectList.svelte";

    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    export let objectListVisible

    export let showScreenshotButton

    export let models
    export let volumes

    $: objectCount = models.length + volumes.length

    function saveScreenshot() {
        dispatch('screenshot')
    }
</script>

<div class="overlay-global">
    {#if objectCount > 1}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i class="bi-list-check"
           class:active={objectListVisible}
           on:click={() => { objectListVisible = !objectListVisible }}
           aria-label="Show/hide object list" role="button" tabindex="0"
           title="Show/hide object list"></i>
    {/if}

    {#if showScreenshotButton}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i class="bi-save"
           on:click={saveScreenshot}
           aria-label="Save screenshot" role="button" tabindex="0"
           title="Save screenshot"></i>
    {/if}
</div>

{#if objectListVisible}
    <ObjectList bind:models={models} bind:volumes={volumes} />
{/if}

<style>
    .overlay-global {
        position: absolute;
        top: 0em;
        right: 0em;
        padding: 0.1em 0.5em;

        display: flex;
        gap: 1em;
        align-items: center;
    }

    .active {
        color: dodgerblue;
    }
</style>
