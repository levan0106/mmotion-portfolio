module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    'no-console': 'warn',
    
    // Enforce camelCase naming convention
    'camelcase': ['error', {
      'properties': 'always',
      'ignoreDestructuring': false,
      'ignoreImports': false,
      'ignoreGlobals': false,
      'allow': [
        // Allow snake_case for database field names in API responses
        '^[a-z]+(_[a-z]+)*$'
      ]
    }],
    
    // Enforce consistent naming for variables and functions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'variable',
        'format': ['camelCase', 'PascalCase', 'UPPER_CASE'],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'function',
        'format': ['camelCase', 'PascalCase']
      },
      {
        'selector': 'parameter',
        'format': ['camelCase'],
        'leadingUnderscore': 'allow'
      },
      {
        'selector': 'property',
        'format': ['camelCase', 'PascalCase'],
        'leadingUnderscore': 'allow',
        'filter': {
          'regex': '^(portfolioId|assetId|tradeId|accountId|createdAt|updatedAt|tradeDate|tradeType|totalValue|totalCost|realizedPl|unrealizedPl|cashBalance|baseCurrency|assetSymbol|assetName|tradeDetailsCount|remainingQuantity|matchedTrades|stopLossPrice|takeProfitPrice|stopLossPercentage|takeProfitPercentage|isActive|alertType|currentPrice|targetPrice|triggeredAt|isAcknowledged|averagePrice|totalPnl|pnlPercentage|lastUpdated|matchedQuantity|matchedPrice|feeTax|grossPnl|netPnl|sellTradeId|buyTradeId|detailId|createdBy|updatedBy|initialValue|initialQuantity|currentValue|currentQuantity)$',
          'match': false
        }
      },
      {
        'selector': 'typeLike',
        'format': ['PascalCase']
      },
      {
        'selector': 'enumMember',
        'format': ['UPPER_CASE']
      }
    ],
    
    // Disable the default camelcase rule in favor of the more specific one above
    'camelcase': 'off'
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'logs/',
    'custom-logs/',
    'frontend/',
    '*.js',
    '*.mjs',
  ],
};
