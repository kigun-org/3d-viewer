<script>
    import 'bootstrap-icons/font/bootstrap-icons.css'
    import 'bootstrap/dist/css/bootstrap.css'

    import ViewerUpload from "./lib/ViewerUpload.svelte";
    import Viewer from "./lib/Viewer.svelte";
    import ViewerReslice from "./lib/ViewerReslice.svelte";
    // import ThumbList from "./lib/ThumbList.svelte";

    const model = [
        {
            id: 20,
            caption: "Upper arch",
            params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
            resource__id: 55,
            resource__type: "MODEL",
            resource__processed: "/testdata/UpperJawScan-gz.vtp"
            // resource__processed: "resources/2023/09/UpperJawScan.vtp"
        },
    ]

    const models = [
        {
            id: 20,
            caption: "Upper arch",
            params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
            resource__id: 55,
            resource__type: "MODEL",
            resource__processed: "/testdata/UpperJawScan-gz.vtp"
            // resource__processed: "resources/2023/09/UpperJawScan.vtp"
        },
        {
            id: 22,
            caption: "Lower arch",
            params: '{ "color": [ 1.0, 1.0, 0.8 ], "opacity": 1.0 }',
            resource__id: 43,
            resource__type: "MODEL",
            resource__processed: "/testdata/LowerJawScan-gz.vtp"
            // resource__processed: "resources/2023/09/LowerJawScan_3s19SPX.vtp"
        }
    ]

    const resources = [
    //     {
    //         id: 20,
    //         caption: "Upper arch",
    //         params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
    //         resource__id: 55,
    //         resource__type: "MODEL",
    //         resource__processed: "/testdata/1upper.vtp"
    //         // resource__processed: "/testdata/UpperJawScan-gz.vtp"
    //         // resource__processed: "resources/2023/09/UpperJawScan.vtp"
    //     },
    //     {
    //         id: 22,
    //         caption: "Lower arch",
    //         // params: '{ "color": [ 1.0, 1.0, 0.8 ], "opacity": 1.0 }',
    //         params: '',
    //         resource__id: 43,
    //         resource__type: "MODEL",
    //         resource__processed: "/testdata/1lower.vtp"
    //         // resource__processed: "/testdata/LowerJawScan-gz.vtp"
    //         // resource__processed: "resources/2023/09/LowerJawScan_3s19SPX.vtp"
    //     },
        {
            id: 31,
            caption: "CBCT",
            resource__id: 84,
            resource__type: "VOLUME",
            // resource__processed: "/testdata/head-binary-gz.vti"
            // resource__processed: "/testdata/cbct-gz.vti"
            // resource__processed: "/testdata/1volume.vti"
            // resource__processed: "/testdata/axial.vti"
            // resource__processed: "/testdata/20231021.nrrd"
            resource__processed: "/testdata/20231022.nrrd"
        }
    ]


    const errorFileNotFound = [
        {
            id: 20,
            caption: "Upper arch",
            params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
            resource__id: 55,
            resource__type: "MODEL",
            resource__processed: "/testdata/non_existant.vtp"
        },
    ]

    const errorUnsupportedModelFormat = [
        {
            id: 20,
            caption: "Upper arch",
            params: '{ "color": [ 0.8, 0.8, 1.0 ], "opacity": 1.0 }',
            resource__id: 55,
            resource__type: "MODEL",
            resource__processed: "/testdata/LowerJawScan.stl"
        },
    ]

    let showScreenshots = false

    const addScreenshot = (image) => {
        const images = document.getElementById('images')

        const img = document.createElement('img')
        img.src = image
        img.style = 'height: 100px'
        images.appendChild(img)

        showScreenshots = true
    }
</script>

<!--<ViewerReslice {resources} />-->

<ViewerUpload id="upload" screenshotCallback={addScreenshot} />

<!--    <div>-->
<!--        <Viewer id="model" resources={model} />-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="modelWithScreenshot" resources={model} screenshotCallback={addScreenshot}/>-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="models" resources={models}/>-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="all" {resources} screenshotCallback={addScreenshot}/>-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="all" {resources} startMaximized={true} screenshotCallback={addScreenshot}/>-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="error1" resources={errorFileNotFound}/>-->
<!--    </div>-->

<!--    <div>-->
<!--        <Viewer id="error2" resources={errorUnsupportedModelFormat}/>-->
<!--    </div>-->

<div class:d-none={!showScreenshots}>
    <div class="my-3">Screenshots</div>
    <div id="images" class="d-flex flex-wrap gap-2"></div>
</div>

<!--    <div>-->
<!--        <ThumbList/>-->
<!--    </div>-->
