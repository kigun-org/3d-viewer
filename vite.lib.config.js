import {defineConfig} from 'vite'
import path from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy";

const itkConfig = path.resolve(__dirname, 'src', 'itkConfig.js')

// https://vitejs.dev/config/
export default defineConfig({
    base: '/static/eos/',
    plugins: [
        svelte(),
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
                // }
                {
                    src: 'node_modules/@itk-wasm/dicom/dist/*',
                    dest: 'itk/dicom'
                }
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
        rollupOptions: {
            external: [
                'bootstrap/dist/css/bootstrap.css',
                'bootstrap-icons/font/bootstrap-icons.css'
            ]
        },
        lib: {
            entry: [
                path.resolve(__dirname, 'src/lib/ViewerComponent.svelte'),
                path.resolve(__dirname, 'src/lib/LoaderDICOM.svelte'),
            ],
            formats: ['esm'],
            fileName: (_, entryAlias) => `${entryAlias}.js`,
        }
    }
})
