import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy"
import { visualizer } from "rollup-plugin-visualizer";


export default defineConfig({
    base: '/static/eos/',
    publicDir: false,
    plugins: [
        svelte(),
        viteStaticCopy({
            targets: [
                { src: 'node_modules/@itk-wasm/image-io/dist/pipelines/nrrd-*.{js,wasm,wasm.zst}', dest: 'pipelines' },

                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-dicom-tags.{js,wasm,wasm.zst}', dest: 'pipelines' },
                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-image-dicom-*.{js,wasm,wasm.zst}', dest: 'pipelines' },
            ],
        }),
        // visualizer({
        //     emitFile: true,
        //     filename: "stats.html"
        // })
    ],
    build: {
        // keep function names
        // minify: "terser",
        // terserOptions: {
        //     keep_fnames: true,
        // },
        rollupOptions: {
            external: [
                'bootstrap/dist/css/bootstrap.css',
                'bootstrap-icons/font/bootstrap-icons.css'
            ],
            output: {
                manualChunks: function (id) {
                    if (id.includes('node_modules')) {
                        return 'common'
                    }
                }
            }
        },
        lib: {
            entry: [
                resolve(__dirname, 'src/lib/Viewer.svelte'),
                resolve(__dirname, 'src/lib/LoaderDICOM.svelte'),
            ],
            formats: ['es'],
            fileName: (_, entryAlias) => `${entryAlias}.js`,
        }
    }
})
