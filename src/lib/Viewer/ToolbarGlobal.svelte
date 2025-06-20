<script>
    import ObjectList from "./ObjectList.svelte";

    /**
     * @typedef {Object} Props
     * @property {any} objectListVisible
     * @property {boolean} [showWindowLevelButton]
     * @property {any} showScreenshotButton
     * @property {boolean} [toolbarBackground]
     * @property {any} models
     * @property {any} volume
     */

    /** @type {Props} */
    let {
        objectListVisible = $bindable(),
        showWindowLevelButton = true,
        showScreenshotButton,
        toolbarBackground = false,
        models = $bindable(),
        volume = $bindable(),
        resetCamera,
        resetWindowLevel,
        screenshot,
        updateShift
    } = $props();

    let objectCount = $derived(models.length + (volume !== undefined ? 1 : 0))
</script>

<div class="k-absolute k-top-0 k-right-0 k-bg-opacity-90
            d-flex align-items-center justify-content-end gap-4 px-2 py-1"
     class:k-bg-base-200={toolbarBackground} class:k-w-full={toolbarBackground}>
    <div class="d-flex gap-1">
        {#if showWindowLevelButton}
            <button class="k-btn k-btn-square k-btn-sm" onclick={resetWindowLevel} aria-label="Reset W/L" title="Reset window/level">
                <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-contrast"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3.34a10 10 0 1 1 -15 8.66l.005 -.324a10 10 0 0 1 14.995 -8.336m-9 1.732a8 8 0 0 0 4.001 14.928l-.001 -16a8 8 0 0 0 -4 1.072" /></svg>
            </button>
        {/if}

        <button class="k-btn k-btn-square k-btn-sm" onclick={resetCamera} aria-label="Reset camera" title="Reset camera">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-maximize"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 8v-2a2 2 0 0 1 2 -2h2" /><path d="M4 16v2a2 2 0 0 0 2 2h2" /><path d="M16 4h2a2 2 0 0 1 2 2v2" /><path d="M16 20h2a2 2 0 0 0 2 -2v-2" /></svg>
        </button>
    </div>

    {#if objectCount > 1 || volume !== undefined}
        <button class="k-btn k-btn-square k-btn-sm" class:k-btn-active={objectListVisible}
                onclick={() => { objectListVisible = !objectListVisible }}
                aria-label="Show/hide object list" title="Show/hide object list">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-list-details"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13 5h8" /><path d="M13 9h5" /><path d="M13 15h8" /><path d="M13 19h5" /><path d="M3 4m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /><path d="M3 14m0 1a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v4a1 1 0 0 1 -1 1h-4a1 1 0 0 1 -1 -1z" /></svg>
        </button>
    {/if}

    {#if showScreenshotButton}
        <button class="k-btn k-btn-square k-btn-sm k-btn-primary" onclick={screenshot} aria-label="Save screenshot" title="Save screenshot">
            <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-camera"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 7h1a2 2 0 0 0 2 -2a1 1 0 0 1 1 -1h6a1 1 0 0 1 1 1a2 2 0 0 0 2 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2v-9a2 2 0 0 1 2 -2" /><path d="M9 13a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>
        </button>
    {/if}
</div>

<ObjectList bind:models={models} bind:volume={volume} {updateShift} visible={objectListVisible} />

<style></style>