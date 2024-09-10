import { defineConfig } from "vite";
import { resolve } from "path";
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import copy from "rollup-plugin-copy";
import del from 'rollup-plugin-delete';

export default defineConfig({
    css: {
        postcss: {
            plugins: [
                {
                    postcssPlugin: 'internal:charset-removal',
                    AtRule: {
                        charset: (atRule) => {
                            if (atRule.name === 'charset') {
                                atRule.remove();
                            }
                        },
                    },
                },
            ],
        },
    },
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    plugins: [
        vue(),
        vuetify(),
        AutoImport({
            imports: ['vue',],
            dts: resolve(resolve('src/@types'), 'auto-imports.d.ts'),
        }),
        Components({
            dts: resolve(resolve('src/@types'), 'components.d.ts'),
        }),
        copy({
            targets: [
                { src: "src/manifest.json", dest: "dist", },
                { src: "src/assets", dest: "dist", },
            ],
            hook: "writeBundle",
        }),
        del({
            targets: 'dist/favicon.ico',
            hook: "writeBundle",
        }),
    ],
    build: {
        rollupOptions: {
            input: [
                "popup.html",
                './src/service.ts',
            ],
            output: {
                chunkFileNames: "[name].[hash].js",
                assetFileNames: "[name].[hash].[ext]",
                entryFileNames: "[name].js",
                dir: "dist",
            },
        },
    },
});
