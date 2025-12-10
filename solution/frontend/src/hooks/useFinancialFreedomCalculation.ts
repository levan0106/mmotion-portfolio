import { useMutation } from 'react-query';
import { CalculationInputs, CalculationResult } from '../types/financialFreedom.types';
import { calculateFinancialFreedom } from '../utils/financialFreedomCalculation';
import { useTranslation } from 'react-i18next';

export const useFinancialFreedomCalculation = () => {
  const { t } = useTranslation();
  
  return useMutation({
    mutationFn: (inputs: CalculationInputs): Promise<CalculationResult> => {
      // Calculate locally - no API call needed
      return Promise.resolve(calculateFinancialFreedom(inputs, t));
    },
  });
};

