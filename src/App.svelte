<script>
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import 'bootstrap/dist/css/bootstrap.css'

    import ViewerUpload from "./lib/ViewerUpload.svelte"
    import Viewer from "./lib/Viewer.svelte";

    // const model = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         r_id: 55,
    //         type: "MODEL",
    //         url: "/testdata/UpperJawScan-gz.vtp"
    //         // url: "resources/2023/09/UpperJawScan.vtp"
    //     },
    // ]
    //
    // const models = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         r_id: 55,
    //         type: "MODEL",
    //         url: "/testdata/UpperJawScan-gz.vtp"
    //         // url: "resources/2023/09/UpperJawScan.vtp"
    //     },
    //     {
    //         id: 22,
    //         caption: "Lower arch",
    //         params: '{ "color": [ 1.0, 1.0, 0.8 ], "opacity": 1.0 }',
    //         r_id: 43,
    //         type: "MODEL",
    //         url: "/testdata/LowerJawScan-gz.vtp"
    //         // url: "resources/2023/09/LowerJawScan_3s19SPX.vtp"
    //     }
    // ]
    //
    const resources = [
        {
            id: 20,
            caption: "Upper arch",
            params: { color: [ 1.0, 0.8, 0.6 ], opacity: 1.0 },
            r_id: 55,
            type: "MODEL",
            url: "/testdata/355166_UpperJawScan.stl"
            // url: "/testdata/355166_UpperJawScan.vtp"
        },
        {
            id: 31,
            caption: "CBCT",
            r_id: 84,
            type: "VOLUME",
            url: "/testdata/20231125.nrrd"
            // url: "/testdata/20240405.nrrd",
        }
    ]
    //
    //
    // const errorFileNotFound = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         r_id: 55,
    //         type: "MODEL",
    //         url: "/testdata/non_existant.vtp"
    //     },
    // ]
    //
    // const errorUnsupportedModelFormat = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         r_id: 55,
    //         type: "MODEL",
    //         url: "/testdata/LowerJawScan.stl"
    //     },
    // ]

    const sampleVolumeResource = {
        id: 42,
        caption: "CBCT",
        type: "VOLUME",
        url: 'data/sample.nrrd',
        params: {
            level: 1000,
            window: 800,
            color_transfer: [
                [200.0, 0.4, 0.6, 0.8],
                [8000.0, 1.0, 1.0, 0]
            ],
            piecewise: [
                [300.0, 0],
                [500.0, 0.1],
                [2000.0, 0.2]
            ]
        }
    }

    const sampleModelResource = {
        id: 45,
        caption: "Model",
        type: "MODEL",
        url: 'data/sample.stl',
        params: {
            color: [ 0.8, 1.0, 0.8 ],
            opacity: 0.5
        },
    }

    let imageSources = $state([])
    let showScreenshots = $state(false)

    const addScreenshot = (image) => {
        imageSources = [...imageSources, URL.createObjectURL(image)]
        showScreenshots = true
    }
</script>

<!--<ViewerUpload screenshotCallback={addScreenshot} />-->

<ViewerUpload screenshotCallback={addScreenshot}
              sampleModel={sampleModelResource} sampleVolume={sampleVolumeResource} />

<!--<div>-->
<!--    <Viewer resources={model}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={model} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={models}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer {resources} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={[sampleModelResource]} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={[sampleVolumeResource]} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer {resources} startMaximized={true} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={errorFileNotFound}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer resources={errorUnsupportedModelFormat}/>-->
<!--</div>-->

<div class:d-none={!showScreenshots}>
    <div class="my-3">Screenshots</div>
    <div class="screenshots d-flex flex-wrap gap-2">
        {#each imageSources as src}
            <img src={src} alt="Screenshot" />
        {/each}
    </div>
</div>

<style>
    .screenshots img {
        height: 100px;
    }
</style>