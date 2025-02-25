<script>
    import { ViewMode } from "./ViewMode.js";

    export let viewMode
    export let maximized

    function maximize() {
        maximized = (maximized === null) ? viewMode : null
    }
</script>

<div class="overlay-local d-flex align-items-center gap-1 px-2 py-1" style="border-color: {viewMode.color}">
    <div style="width: 8em">
        {#if !maximized || viewMode === ViewMode.THREE_D}
            <span style="margin-left: 0.9rem">{viewMode.label}</span>
        {:else}
            <select class="form-select" bind:value={maximized} tabindex="0" aria-label="View">
                {#each Object.values(ViewMode) as view_mode}}
                    {#if view_mode !== ViewMode.THREE_D}
                        <option value="{view_mode}">{view_mode.label}</option>
                    {/if}
                {/each}
            </select>
        {/if}
    </div>

    <div>
        <button class="btn btn-icon" on:click={maximize} aria-label="Toggle layout" title="Toggle layout">
            {#if maximized}
                <!-- icon-tabler-arrows-minimize -->
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 9l4 0l0 -4" /><path d="M3 3l6 6" /><path d="M5 15l4 0l0 4" /><path d="M3 21l6 -6" /><path d="M19 9l-4 0l0 -4" /><path d="M15 9l6 -6" /><path d="M19 15l-4 0l0 4" /><path d="M15 15l6 6" /></svg>
            {:else}
                <!-- icon-tabler-arrows-maximize -->
                <svg  xmlns="http://www.w3.org/2000/svg"  width="24"  height="24"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M16 4l4 0l0 4" /><path d="M14 10l6 -6" /><path d="M8 20l-4 0l0 -4" /><path d="M4 20l6 -6" /><path d="M16 20l4 0l0 -4" /><path d="M14 14l6 6" /><path d="M8 4l-4 0l0 4" /><path d="M4 4l6 6" /></svg>
            {/if}
        </button>
    </div>
</div>

<style>
    .overlay-local {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;

        background-color: rgba(255, 255, 255, 0.9);
        border-bottom: transparent solid 0.35rem;

        text-align: left;
    }
</style>