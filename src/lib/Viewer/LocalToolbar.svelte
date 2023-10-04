<script>
    import { ViewMode } from "./ViewMode.js";

    import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

    export let viewMode
    export let showViewMode
    export let maximized

    function resetCamera() {
        dispatch("resetCamera")
    }

    function resetWindowLevel () {
        dispatch("resetWL")
    }

    function maximize() {
        maximized = (maximized === null) ? viewMode : null
    }
</script>

<div class="overlay-local" style="border-color: {viewMode.color}">
    {#if showViewMode}
        <div style="width: 5em">
            {#if !maximized || viewMode === ViewMode.THREE_D}
                <span style="width: 4em; font-size: small;">{viewMode.label}</span>
            {:else}
                <select bind:value={maximized} tabindex="0">
                    {#each Object.values(ViewMode) as view_mode}}
                        {#if view_mode !== ViewMode.THREE_D}
                            <option value="{view_mode}">{view_mode.label}</option>
                        {/if}
                    {/each}
                </select>
            {/if}
        </div>

        <div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <i class={maximized ? "bi-grid" : "bi-square"} on:click={maximize}
               aria-label="Toggle layout" role="button" tabindex="0"
               title="Toggle layout"></i>
            <!--            <i class="bi-grid-3x2" style="margin-right: 1em"></i>-->

            <!--            <i class="bi-arrows-fullscreen"></i>-->
            <!--            <i class="bi-arrows-angle-contract"></i>-->
            <!--            <i class="bi-arrows-angle-expand"></i>-->
            <!--            <i class="bi-layout-split"></i>-->
            <!--            <i class="bi-box"></i>-->
        </div>
    {/if}

    <div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <i class="bi-search"
           on:click={resetCamera}
           aria-label="Reset camera" role="button" tabindex="0"
           title="Reset camera"></i>

        {#if viewMode !== ViewMode.THREE_D}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <i class="bi-brightness-high"
               on:click={resetWindowLevel}
               aria-label="Reset W/L" role="button" tabindex="0"
               title="Reset W/L"></i>
        {/if}
    </div>
</div>

<style>
    .overlay-local {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background-color: rgba(255, 255, 255, 0.9);
        text-align: left;
        padding: 0.1em 0.5em;
        border-left: transparent solid 0.5em;

        display: flex;
        gap: 1.5em;
        align-items: center;
    }
</style>