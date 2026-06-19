import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import vue from '@vitejs/plugin-vue';
import { defineConfig, type Plugin } from 'vite-plus';
import vuetify from 'vite-plugin-vuetify';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

const extensionAssets = (): Plugin => ({
    name: 'extension-assets',
    async writeBundle() {
        const dist = path.resolve(projectRoot, 'dist');

        await fs.mkdir(dist, { recursive: true });
        await Promise.all([
            fs.copyFile(
                path.resolve(projectRoot, 'src/manifest.json'),
                path.resolve(dist, 'manifest.json'),
            ),
            fs.cp(path.resolve(projectRoot, 'src/assets'), path.resolve(dist, 'assets'), {
                recursive: true,
                force: true,
            }),
            fs.rm(path.resolve(dist, 'favicon.ico'), { force: true }),
        ]);
    },
});

// https://vite.dev/config/
export default defineConfig({
    staged: {
        '*': 'vp check --fix',
        'popup.html': 'eslint --fix',
        '**/*.vue': 'eslint --fix',
    },
    fmt: {
        ignorePatterns: [
            '**/*.vue',
            'popup.html',
            'node_modules/**',
            'dist/**',
            'dist-ssr/**',
            '.vite/**',
            '.vscode/**',
        ],
        semi: true,
        singleQuote: true,
        indentStyle: 'space',
        indentWidth: 4,
    },
    lint: {
        plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'vue'],
        categories: {
            correctness: 'error',
        },
        env: {
            browser: true,
            builtin: true,
        },
        ignorePatterns: ['**/dist/**', '**/dist-ssr/**'],
        rules: {
            'no-array-constructor': 'error',
            'typescript/ban-ts-comment': 'error',
            'typescript/no-empty-object-type': 'error',
            'typescript/no-explicit-any': 'error',
            'typescript/no-namespace': 'error',
            'typescript/no-require-imports': 'error',
            'typescript/no-unnecessary-type-constraint': 'error',
            'typescript/no-unsafe-function-type': 'error',
            'vite-plus/prefer-vite-plus-imports': 'error',
        },
        overrides: [
            {
                files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts', '**/*.vue'],
                rules: {
                    'constructor-super': 'off',
                    'getter-return': 'off',
                    'no-class-assign': 'off',
                    'no-const-assign': 'off',
                    'no-dupe-class-members': 'off',
                    'no-dupe-keys': 'off',
                    'no-func-assign': 'off',
                    'no-import-assign': 'off',
                    'no-new-native-nonconstructor': 'off',
                    'no-obj-calls': 'off',
                    'no-redeclare': 'off',
                    'no-setter-return': 'off',
                    'no-this-before-super': 'off',
                    'no-undef': 'off',
                    'no-unreachable': 'off',
                    'no-unsafe-negation': 'off',
                    'no-var': 'error',
                    'no-with': 'off',
                    'prefer-const': 'error',
                    'prefer-rest-params': 'error',
                    'prefer-spread': 'error',
                },
            },
        ],
        options: {
            typeAware: true,
            typeCheck: true,
        },
        jsPlugins: [
            {
                name: 'vite-plus',
                specifier: 'vite-plus/oxlint-plugin',
            },
        ],
    },
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
    plugins: [vue(), vuetify(), extensionAssets()],
    build: {
        rollupOptions: {
            input: {
                history: fileURLToPath(new URL('./history.html', import.meta.url)),
                popup: fileURLToPath(new URL('./popup.html', import.meta.url)),
                service: fileURLToPath(new URL('./src/service.ts', import.meta.url)),
            },
            output: {
                chunkFileNames: '[name].[hash].js',
                assetFileNames: '[name].[hash].[ext]',
                entryFileNames: '[name].js',
                dir: 'dist',
            },
        },
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
});
