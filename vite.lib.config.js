import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy"
import { visualizer } from "rollup-plugin-visualizer";

const itkConfig = resolve(__dirname, 'src', 'itkConfig.js')

// https://vitejs.dev/config/
export default defineConfig({
    base: '/static/eos/',
    publicDir: false,
    plugins: [
        svelte(),
        viteStaticCopy({
            targets: [
                {src: 'node_modules/itk-wasm/dist/web-workers/min-bundles/*', dest: 'itk/web-workers'},

                {src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-dicom-tags*', dest: 'itk/dicom/pipelines'},
                {src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-image-dicom*', dest: 'itk/dicom/pipelines'},
                {src: 'node_modules/@itk-wasm/dicom/dist/web-workers/*', dest: 'itk/dicom/web-workers'},

                {src: 'node_modules/@itk-wasm/image-io/dist/pipelines/nrrd*', dest: 'itk/image-io/pipelines'},
            ],
        }),
        visualizer({
            emitFile: true,
            filename: "stats.html"
        })
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
            ]
        },
        lib: {
            entry: [
                resolve(__dirname, 'src/lib/Viewer.svelte'),
                resolve(__dirname, 'src/lib/LoaderDICOM.svelte'),
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
