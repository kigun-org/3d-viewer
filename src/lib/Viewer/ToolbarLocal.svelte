<script>
    import { ViewMode } from "./ViewMode.js";

    export let viewMode
    export let maximized

    function maximize() {
        maximized = (maximized === null) ? viewMode : null
    }
</script>

<div class="overlay-local px-2 py-1" style="border-color: {viewMode.color}">
    <div style="width: 7em">
        {#if !maximized || viewMode === ViewMode.THREE_D}
            <span class="small">{viewMode.label}</span>
        {:else}
            <select class="form-select form-select-sm" bind:value={maximized} tabindex="0" aria-label="View">
                {#each Object.values(ViewMode) as view_mode}}
                    {#if view_mode !== ViewMode.THREE_D}
                        <option value="{view_mode}">{view_mode.label}</option>
                    {/if}
                {/each}
            </select>
        {/if}
    </div>

    <div>
        <button class="btn btn-sm" on:click={maximize} aria-label="Toggle layout" title="Toggle layout">
            <i class={maximized ? "bi bi-arrows-angle-contract" : "bi bi-arrows-angle-expand"}></i>
        </button>
    </div>
</div>

<style>
    .overlay-local {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;

        background-color: rgba(var(--bs-light-rgb), 0.9);
        border-bottom: transparent solid 0.35rem;

        display: flex;
        gap: 1.5em;
        align-items: center;

        text-align: left;
    }
</style>