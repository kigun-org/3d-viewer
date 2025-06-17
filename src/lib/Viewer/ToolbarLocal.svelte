<script>
    import { ViewMode } from "./ViewMode.js";

    let { viewMode, maximized = $bindable() } = $props();

    function maximize() {
        maximized = (maximized === null) ? viewMode : null
    }
</script>

<div class="k-absolute k-top-0 k-left-0 k-right-0 k-border-b-4 k-border-b-transparent k-bg-base-200/90
            d-flex align-items-center gap-1 px-2 py-1"
     style="border-color: {viewMode.color}">
    <div class="k-w-28 k-me-4">
        {#if !maximized || viewMode === ViewMode.THREE_D}
            <div class="k-w-full k-text-start k-pl-3">{viewMode.label}</div>
        {:else}
            <select class="k-select k-select-sm k-w-full" bind:value={maximized} tabindex="0" aria-label="View">
                {#each Object.values(ViewMode) as view_mode}}
                    {#if view_mode !== ViewMode.THREE_D}
                        <option value="{view_mode}">{view_mode.label}</option>
                    {/if}
                {/each}
            </select>
        {/if}
    </div>

    <div>
        <button class="k-btn k-btn-sm k-btn-square" onclick={maximize} aria-label="Toggle layout" title="Toggle layout">
            {#if maximized}
                <!-- icon-tabler-arrows-minimize -->
                <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 9l4 0l0 -4" /><path d="M3 3l6 6" /><path d="M5 15l4 0l0 4" /><path d="M3 21l6 -6" /><path d="M19 9l-4 0l0 -4" /><path d="M15 9l6 -6" /><path d="M19 15l-4 0l0 4" /><path d="M15 15l6 6" /></svg>
            {:else}
                <!-- icon-tabler-arrows-maximize -->
                <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /><path d="M16 20l4 0l0 -4" /><path d="M14 14l6 6" /><path d="M8 4l-4 0l0 4" /><path d="M4 4l6 6" /></svg>
            {/if}
        </button>
    </div>
</div>

<style>
</style>