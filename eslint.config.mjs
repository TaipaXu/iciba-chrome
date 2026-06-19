import tsParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

const templateAttributeIndentRule = {
    meta: {
        type: 'layout',
        fixable: 'whitespace',
        schema: [],
        messages: {
            expected: 'Expected attribute indentation to match the opening tag.',
        },
    },
    create(context) {
        const sourceCode = context.sourceCode;
        const visitor = {
            VStartTag(node) {
                const expectedIndent = ' '.repeat(node.loc.start.column);

                for (const attribute of node.attributes) {
                    if (attribute.loc.start.line === node.loc.start.line) continue;

                    const lineStart = sourceCode.getIndexFromLoc({
                        line: attribute.loc.start.line,
                        column: 0,
                    });
                    const actualIndent = sourceCode.text.slice(lineStart, attribute.range[0]);

                    if (actualIndent === expectedIndent || !/^[ \t]*$/.test(actualIndent)) {
                        continue;
                    }

                    context.report({
                        node: attribute,
                        messageId: 'expected',
                        fix: (fixer) =>
                            fixer.replaceTextRange([lineStart, attribute.range[0]], expectedIndent),
                    });
                }
            },
        };
        const parserServices = sourceCode.parserServices ?? context.parserServices;

        return parserServices?.defineDocumentVisitor
            ? parserServices.defineDocumentVisitor(visitor)
            : parserServices?.defineTemplateBodyVisitor
              ? parserServices.defineTemplateBodyVisitor(visitor)
              : visitor;
    },
};

export default [
    {
        ignores: ['dist/**', 'dist-ssr/**'],
    },
    {
        files: ['**/*.{vue,html}'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            local: {
                rules: {
                    'template-attribute-indent': templateAttributeIndentRule,
                },
            },
            vue,
        },
        rules: {
            'local/template-attribute-indent': 'error',
            'vue/html-closing-bracket-newline': [
                'error',
                {
                    multiline: 'never',
                    selfClosingTag: {
                        multiline: 'never',
                    },
                },
            ],
            'vue/html-closing-bracket-spacing': [
                'error',
                {
                    selfClosingTag: 'always',
                },
            ],
            'vue/html-indent': [
                'error',
                4,
                {
                    attribute: 0,
                    baseIndent: 1,
                },
            ],
        },
    },
];
