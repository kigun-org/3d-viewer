<script>
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import 'bootstrap/dist/css/bootstrap.css'

    // import Viewer from "./lib/Viewer.svelte";
    import ViewerUpload from "./lib/ViewerUpload.svelte"

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
    // const resources = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         r_id: 55,
    //         type: "MODEL",
    //         url: "/testdata/1upper.vtp"
    //         // url: "/testdata/UpperJawScan-gz.vtp"
    //         // url: "resources/2023/09/UpperJawScan.vtp"
    //     },
    //     {
    //         id: 22,
    //         caption: "Lower arch",
    //         // params: '{ "color": [ 1.0, 1.0, 0.8 ], "opacity": 1.0 }',
    //         params: '',
    //         r_id: 43,
    //         type: "MODEL",
    //         url: "/testdata/1lower.vtp"
    //         // url: "/testdata/LowerJawScan-gz.vtp"
    //         // url: "resources/2023/09/LowerJawScan_3s19SPX.vtp"
    //     },
    //     {
    //         id: 31,
    //         caption: "CBCT",
    //         r_id: 84,
    //         type: "VOLUME",
            // url: "/testdata/head-binary-gz.vti"
            // url: "/testdata/cbct-gz.vti"
            // url: "/testdata/1volume.vti"
            // url: "/testdata/axial.vti"
            // url: "/testdata/20240405.nrrd",
            // url: "/testdata/20231125.nrrd"
        // }
    // ]
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
        url: 'data/sample.nrrd'
    }

    const sampleModelResource = {
        id: 45,
        caption: "Model",
        params: '{ "color": [ 0.8, 1.0, 0.8 ], "opacity": 1.0 }',
        type: "MODEL",
        url: 'data/sample.stl'
    }

    let imageSources = []
    let showScreenshots = false

    const addScreenshot = (image) => {
        imageSources = [...imageSources, URL.createObjectURL(image)]
        showScreenshots = true
    }
</script>

<!--<ViewerUpload id="upload" screenshotCallback={addScreenshot} />-->
<ViewerUpload id="upload" screenshotCallback={addScreenshot}
              sampleModel={sampleModelResource} sampleVolume={sampleVolumeResource} />

<!--<div>-->
<!--    <Viewer id="model" resources={model}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="modelWithScreenshot" resources={model} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="models" resources={models}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="all" {resources} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="all" {resources} startMaximized={true} screenshotCallback={addScreenshot}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="error1" resources={errorFileNotFound}/>-->
<!--</div>-->

<!--<div>-->
<!--    <Viewer id="error2" resources={errorUnsupportedModelFormat}/>-->
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