import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy"

let entries = [
    resolve(__dirname, 'src/lib/Viewer.svelte'),
]
let cssFileName = "Viewer"

export default defineConfig({
    base: '/static/viewer/',
    publicDir: false,
    plugins: [
        svelte({
            emitCss: false,
            // compilerOptions: {
            //     customElement: true
            // }
        }),
        viteStaticCopy({
            targets: [
                { src: 'node_modules/@itk-wasm/image-io/dist/pipelines/nrrd-read-*.{js,wasm,wasm.zst}', dest: 'pipelines' },
            ],
        })
    ],
    build: {
        // keep function names
        // minify: "terser",
        // terserOptions: {
        //     keep_fnames: true,
        // },
        emptyOutDir: entries.length > 1,
        rollupOptions: {
            output: {
                manualChunks: (_) => "common"
            }
        },
        lib: {
            entry: entries,
            formats: ['es'],
            fileName: (_, entryAlias) => `${entryAlias}.js`,
            cssFileName: cssFileName
        }
    }
})
