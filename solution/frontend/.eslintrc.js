module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
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
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      rules: {
        // Allow snake_case in test files for test data
        'camelcase': 'off',
        '@typescript-eslint/naming-convention': 'off'
      }
    }
  ]
};
