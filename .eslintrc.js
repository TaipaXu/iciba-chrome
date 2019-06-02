module.exports = {
    env: {
        browser: true,
        webextensions: true,
        es6: true
    },
    extends: [
        'airbnb-base',
        'plugin:vue/recommended'
    ],
    globals: {
        Atomics: 'readonly',
        SharedArrayBuffer: 'readonly'
    },
    parserOptions: {
        parser: 'babel-eslint',
    },
    plugins: [
        'vue'
    ],
    rules: {
        'max-len': 'off',
        'no-console': 'off',
        'no-extend-native': 'off',
        'no-plusplus': 'off',
        'no-unused-vars': ['error', {
            'args': 'none'
        }],
        'class-methods-use-this': 'off',
        'no-nested-ternary': 'off',
        indent: ['error', 4],
        'no-restricted-syntax': 0,
        'no-empty': ['error', {
            'allowEmptyCatch': true,
        }],
        'import/prefer-default-export': 0,
    },
    overrides: [
        {
            files: ['*.vue'],
            rules: {
                indent: 'off',
                'vue/html-indent': ['error', 4, {
                    'ignores': ['VAttribute']
                }],
                'vue/html-closing-bracket-newline': 'off',
                'vue/script-indent': ['error', 4, { 'baseIndent': 1 }],
                'vue/html-self-closing': 'off',
                'vue/singleline-html-element-content-newline': 'off',
                'vue/max-attributes-per-line': 'off'
            }
        }
    ],
    settings: {
        'import/resolver': {
            webpack: { 'config': './webpack.config.js' }
        },
    },
};
