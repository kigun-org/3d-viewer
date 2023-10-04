import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy";

const itkConfig = resolve(__dirname, 'src', 'itkConfig.js')

// https://vitejs.dev/config/
export default defineConfig({
    base: '/static/eos/',
    plugins: [
        svelte(),
        viteStaticCopy({
            targets: [
                {src: 'node_modules/itk-wasm/dist/web-workers/min-bundles/*', dest: 'itk/web-workers'},
                {src: 'node_modules/itk-image-io/Nrrd*', dest: 'itk/image-io',},
                // {
                //     src: 'node_modules/itk-mesh-io/*',
                //     dest: 'itk/mesh-io',
                //     rename: 'mesh-io'
                // }
                {src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-dicom-tags*', dest: 'itk/dicom/pipelines'},
                {src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-image-dicom*', dest: 'itk/dicom/pipelines'},
                {src: 'node_modules/@itk-wasm/dicom/dist/web-workers/*', dest: 'itk/dicom/web-workers'},
            ],
        })
    ],
    build: {
        // keep function names
        // minify: "terser",
        // terserOptions: {
        //     keep_fnames: true,
        // },
        //
        // copyPublicDir: false,
        rollupOptions: {
            external: [
                'bootstrap/dist/css/bootstrap.css',
                'bootstrap-icons/font/bootstrap-icons.css'
            ],
            output: {
                manualChunks: (id) => {
                    if (id.includes("/src/lib/Viewer.svelte")) {
                        return "Viewer"
                    } else if (id.includes("/src/lib/ViewerUpload.svelte")) {
                        return "ViewerUpload"
                    // } else if (id.includes("/src/lib/ThumbList.svelte")) {
                    //     return "ThumbList"
                    // } else if (id.includes("node_modules")) {
                    //     if (id.includes("@kitware/vtk.js") || id.includes("itk-wasm")) {
                    //         return "assets/kitware"
                    //     }
                    //
                    //     return "assets/vendor"
                    }

                    return "common"
                }
            }
        },
        lib: {
            entry: [
                resolve(__dirname, 'src/lib/Viewer.svelte'),
                resolve(__dirname, 'src/lib/ViewerUpload.svelte'),
                // resolve(__dirname, 'src/lib/ThumbList.svelte'),
            ],
            formats: ['es'],
            fileName: (_, entryAlias) => `${entryAlias}.js`,
        }
    },
    resolve: {
        // where itk-wasm code has 'import ../itkConfig.js` point to the path of itkConfig
        alias: {
            '../itkConfig.js': itkConfig,
            '../../itkConfig.js': itkConfig
        }
    }
})
