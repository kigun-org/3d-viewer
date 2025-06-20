<script>
    let {
        models = $bindable(),
        volume = $bindable(),
        updateShift,
        updateClip,
        updateClipPlane,
        visible = true
    } = $props();

    let shift = $state(0)

    let clipEnabled = $state(false)
    let clipPosition = $state(50)

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }

    $effect(() => {
        updateShift(shift)
    })

    $effect(() => {
        updateClip(clipEnabled, clipPosition)
    })
</script>

<div class="k-absolute k-top-14 k-right-2 k-bg-base-200/90 k-p-2 k-b" class:k-hidden={!visible}>
    {#if volume}
        <div role="menuitem" class="k-max-w-64">
            <label class="k-label k-justify-start k-gap-3">
                <input class="k-checkbox" type="checkbox" bind:checked={volume.visible}>
                <span>Volume</span>
            </label>

            <div class="k-ms-10">
                <input type="range" min="-2000" max="2000" class="k-range k-range-sm"
                       bind:value={shift} disabled={!volume.visible} />

                <label class="k-label k-justify-start k-gap-3">
                    <input class="k-checkbox k-checkbox-sm" type="checkbox" disabled={!volume.visible}
                           bind:checked={clipEnabled}>
                    <span>Cross-section</span>
                </label>

                <input type="range" min="0" max="100" class="k-range k-range-sm"
                       disabled={!volume.visible || !clipEnabled}
                       bind:value={clipPosition} />

                <button class="k-btn k-btn-sm k-w-full k-mt-1" disabled={!volume.visible || !clipEnabled}
                        onclick={updateClipPlane}>Normal to camera</button>
            </div>
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