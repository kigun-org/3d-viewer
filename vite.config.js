/// <reference types="vitest" />
import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from 'vite-plugin-static-copy'

const itkConfig = resolve(__dirname, 'src', 'itkConfig.js')

// https://vitejs.dev/config/
export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
    },
    plugins: [
        svelte({
            hot: !process.env.VITEST
        }),
        // put lazy loaded JavaScript and Wasm bundles in dist directory
        viteStaticCopy({
            targets: [
                {src: 'node_modules/itk-wasm/dist/web-workers/min-bundles/*', dest: 'itk/web-workers'},
                {src: 'node_modules/itk-image-io/Nrrd*', dest: 'itk/image-io'},
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
    resolve: {
        // where itk-wasm code has 'import ../itkConfig.js` point to the path of itkConfig
        alias: {
            '../itkConfig.js': itkConfig,
            '../../itkConfig.js': itkConfig
        }
    }
})
