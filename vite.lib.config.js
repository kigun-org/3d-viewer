import {defineConfig} from 'vite'
import {resolve} from 'path'
import {svelte} from '@sveltejs/vite-plugin-svelte'
import {viteStaticCopy} from "vite-plugin-static-copy"

let entries = [
    resolve(__dirname, 'src/lib/Viewer.svelte'),
    resolve(__dirname, 'src/lib/LoaderDICOM.svelte'),
]

const customArgIndex = process.argv.indexOf('--')
if (customArgIndex > 0 && process.argv.length >= customArgIndex) {
    entries = [
        resolve(__dirname, `src/lib/${process.argv.splice(customArgIndex + 1)}.svelte`)
    ]
}

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
                { src: 'node_modules/@itk-wasm/image-io/dist/pipelines/nrrd-*.{js,wasm,wasm.zst}', dest: 'pipelines' },
                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-dicom-tags.{js,wasm,wasm.zst}', dest: 'pipelines' },
                { src: 'node_modules/@itk-wasm/dicom/dist/pipelines/read-image-dicom-*.{js,wasm,wasm.zst}', dest: 'pipelines' },
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
            external: [
                'bootstrap',
                'bootstrap-icons'
            ],
            output: {
                manualChunks:
                    entries.length > 1 ? (id) => {
                        if (id.includes('node_modules')) {
                            return 'common'
                        }
                    } : undefined
            }
        },
        lib: {
            entry: entries,
            formats: ['es'],
            fileName: (_, entryAlias) => `${entryAlias}.js`,
        }
    }
})
