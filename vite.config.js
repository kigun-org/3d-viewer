/// <reference types="vitest" />
import {defineConfig} from 'vite'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from 'vite-plugin-static-copy'

export default defineConfig({
    optimizeDeps: {
        exclude: ['itk-wasm', '@itk-wasm/mesh-io', '@itk-wasm/image-io', '@itk-wasm/dicom']
    },
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
                { src: 'node_modules/@itk-wasm/image-io/dist/pipelines/nrrd-read-*.{js,wasm,wasm.zst}', dest: 'pipelines' },

                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-dicom-tags.{js,wasm,wasm.zst}', dest: 'pipelines' },
                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-image-dicom-*.{js,wasm,wasm.zst}', dest: 'pipelines' },
            ],
        })
    ]
})
