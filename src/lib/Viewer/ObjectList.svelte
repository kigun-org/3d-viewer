<script>
    let {
        models = $bindable(),
        volume = $bindable(),
        updateShift,
        updateClipPlane,
        visible = true
    } = $props();

    let shift = $state(0)

    function generateRGBColor(params) {
        return `rgba(${params.color[0] * 255}, ${params.color[1] * 255}, ${params.color[2] * 255}, ${params.opacity})`
    }

    function _updateShift(newValue) {
        shift = newValue
        updateShift(shift)
    }
</script>

<div class="k-absolute k-top-14 k-right-2 k-bg-base-200/90 k-p-2 k-b" class:k-hidden={!visible}>
    {#if volume && volume.clip}
        <div role="menuitem" class="k-max-w-64">
            <label class="k-label k-justify-start k-gap-3">
                <input class="k-checkbox" type="checkbox" bind:checked={volume.visible}>
                <span>Volume</span>
            </label>

            <div class="k-ms-10">
                <input type="range" min="-2000" max="2000" class="k-range k-range-sm"
                       bind:value={() => shift, _updateShift} disabled={!volume.visible} />

                <label class="k-label k-justify-start k-gap-3">
                    <input class="k-checkbox k-checkbox-sm" type="checkbox" disabled={!volume.visible}
                           bind:checked={volume.clip.enabled}>
                    <span>Cross-section</span>
                </label>

                <input type="range" min={volume.clip.min} max={volume.clip.max} class="k-range k-range-sm"
                       disabled={!volume.visible || !volume.clip.enabled}
                       bind:value={volume.clip.position} />

                <button class="k-btn k-btn-sm k-w-full k-mt-1" disabled={!volume.visible || !volume.clip.enabled}
                        onclick={updateClipPlane}>Normal to camera</button>
            </div>
        </div>
    {/if}

    {#each models as model, index}
        <label class="k-label k-justify-start k-gap-3">
            <input type="checkbox" class="k-checkbox" bind:checked={model.visible}>
            <svg  xmlns="http://www.w3.org/2000/svg"  width="20"  height="20"  viewBox="0 0 24 24"  fill={generateRGBColor(model.params)}  stroke="none"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
            </svg>
            Model {index+1}
        </label>
    {/each}
</div>

<style>
    .k-absolute div, .k-absolute label {
        user-select: none;
    }
</style>