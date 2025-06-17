<script>
    let {
        models = $bindable(),
        volume = $bindable(),
        updateShift
    } = $props();

    let shift = $state(0)

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }

    $effect(() => {
        updateShift(shift)
    })
</script>

<div class="overlay-menu p-2">
    {#if volume}
        <div role="menuitem">
            <label>
                <input type="checkbox" bind:checked={volume.visible}>
                Volume
            </label>
            <br>
            <input type="range" min="-2000" max="2000"
                   bind:value={shift} disabled={!volume.visible} />
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
        top: 3rem;
        right: 0;
        margin: 0.5rem;

        display: flex;
        flex-direction: column;
        gap: 0.5em;

        text-align: left;

        background-color: rgba(255, 255, 255, 0.9);
    }

    .overlay-menu div, .overlay-menu label {
        user-select: none;
    }

    input[type=range] {
        width: 7rem;
    }
</style>