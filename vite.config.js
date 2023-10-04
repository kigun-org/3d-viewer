/// <reference types="vitest" />
import {defineConfig} from 'vite'
import path from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from 'vite-plugin-static-copy'

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
                // {
                //     src: 'node_modules/itk-wasm/dist/web-workers/*',
                //     dest: 'itk/web-workers'
                // },
                // {
                //     src: 'node_modules/itk-image-io/*',
                //     dest: 'itk/image-io',
                // },
                // {
                //     src: 'node_modules/itk-mesh-io/*',
                //     dest: 'itk/mesh-io',
                //     rename: 'mesh-io'
                // },
                {
                    src: 'node_modules/@itk-wasm/dicom/dist/*',
                    dest: 'itk/dicom'
                }
            ],
        })
    ]
})
