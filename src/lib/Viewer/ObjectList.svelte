<script>
    let {
        models = $bindable(),
        volume = $bindable(),
        updateShift,
        visible = true
    } = $props();

    let shift = $state(0)

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }

    $effect(() => {
        updateShift(shift)
    })
</script>

<div class="k-absolute k-top-14 k-right-2 k-bg-base-200/90 k-p-2 k-b" class:k-hidden={!visible}>
    {#if volume}
        <div role="menuitem">
            <label class="k-label">
                Volume
                <input class="k-checkbox" type="checkbox" bind:checked={volume.visible}>
            </label>
            <input type="range" min="-2000" max="2000"
                   class="k-range k-range-sm"
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
    .k-absolute div, .k-absolute label {
        user-select: none;
    }
</style>