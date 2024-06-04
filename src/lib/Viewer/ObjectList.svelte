<script>
    export let models

    export let volume

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }
</script>

<div class="overlay-menu p-2">
    {#if volume}
        <div role="menuitem">
            Volume
        </div>
    {/if}

    {#each models as model, index}
        <label class="d-flex align-items-baseline gap-2">
            <input type="checkbox" bind:checked={model.visible}>
            <i class="bi-circle-fill" style="color: {generateRGBColor(model.params)}"></i>
            Model {index+1}
        </label>
    {/each}
</div>

<style>
    .overlay-menu {
        position: absolute;
        top: 3.6em;
        right: 0.7em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        text-align: left;

        background-color: rgba(var(--bs-light-rgb), 0.9);
    }

    .overlay-menu div, .overlay-menu label {
        user-select: none;
    }
</style>