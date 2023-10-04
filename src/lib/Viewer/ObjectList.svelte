<script>
    export let models

    export let volumes

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }
</script>

<div class="overlay-menu">
    {#each volumes as volume, index}
        <div role="menuitem">
            Volume {index+1}
        </div>
    {/each}

    {#each models as model, index}
        <label>
            <input type="checkbox" bind:checked={model.visible}>
            <i class="bi-circle-fill" style="color: {generateRGBColor(model.params)}"></i>
            Model {index+1}
        </label>
    {/each}
</div>

<style>
    .overlay-menu {
        position: absolute;
        top: 2.6em;
        right: 0.5em;
        font-size: small;
        text-align: left;
        padding: 0.5em;
        display: flex;
        flex-direction: column;
        gap: 0.5em;

        background-color: rgba(255, 255, 255, 0.7);
    }

    .overlay-menu div, .overlay-menu label {
        user-select: none;
    }
</style>