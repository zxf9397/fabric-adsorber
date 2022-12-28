module.exports = {
  printWidth: 120,
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  arrowParens: 'avoid',
  requirePragma: false,
  proseWrap: 'preserve',
  trailingComma: 'all',
  overrides: [
    {
      files: '*.scss',
      options: {
        singleQuote: false,
      },
    },
  ],
  'prettier/prettier': [
    'error',
    {
      endOfLine: 'auto',
    },
  ],
};
