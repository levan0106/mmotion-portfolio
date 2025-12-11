import {
  CalculationInputs,
  CalculationResult,
  CalculatedVariableType,
  PaymentFrequency,
  PaymentType,
  ConsolidateRequest,
  ConsolidateResponse,
  RiskTolerance,
  YearlyProjection,
  AssetAllocation,
} from '../types/financialFreedom.types';

/**
 * Get number of periods per year based on payment frequency
 */
function getPeriodsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case PaymentFrequency.MONTHLY:
      return 12;
    case PaymentFrequency.QUARTERLY:
      return 4;
    case PaymentFrequency.YEARLY:
      return 1;
    default:
      return 12;
  }
}

/**
 * Calculate future value: FV = PV₀(1+r)^n + PMT[((1+r)^n-1)/r]
 */
export function calculateFutureValue(
  initialInvestment: number,
  periodicPayment: number,
  returnRate: number,
  periods: number
): number {
  const r = returnRate;
  const n = periods;
  const pv0 = initialInvestment || 0;
  const pmt = periodicPayment || 0;

  if (r === 0) {
    return pv0 + pmt * n;
  }

  const onePlusR = 1 + r;
  const onePlusRToN = Math.pow(onePlusR, n);
  
  const pv0Part = pv0 * onePlusRToN;
  const pmtPart = pmt * ((onePlusRToN - 1) / r);

  return pv0Part + pmtPart;
}

/**
 * Calculate future value function for Newton-Raphson: f(r) = FV - PV₀(1+r)^n - PMT[((1+r)^n-1)/r]
 */
function futureValueFunction(
  pv0: number,
  pmt: number,
  targetFv: number,
  n: number,
  r: number
): number {
  if (r === 0) {
    return (pv0 + pmt * n) - targetFv;
  }

  const onePlusR = 1 + r;
  const onePlusRToN = Math.pow(onePlusR, n);
  
  const pv0Part = pv0 * onePlusRToN;
  const pmtPart = pmt * ((onePlusRToN - 1) / r);

  return (pv0Part + pmtPart) - targetFv;
}

/**
 * Derivative of future value function
 */
function futureValueDerivative(
  pv0: number,
  pmt: number,
  n: number,
  r: number
): number {
  if (r === 0) {
    return pv0 * n + pmt * (n * (n + 1)) / 2;
  }

  const onePlusR = 1 + r;
  const onePlusRToN = Math.pow(onePlusR, n);
  const onePlusRToNMinus1 = onePlusRToN - 1;

  const pv0Derivative = pv0 * n * Math.pow(onePlusR, n - 1);
  const pmtDerivative = pmt * (
    (n * onePlusRToN * r - onePlusRToNMinus1) / (r * r)
  );

  return pv0Derivative + pmtDerivative;
}

/**
 * Solve for return rate using Newton-Raphson method
 */
function solveReturnRate(
  pv0: number,
  pmt: number,
  targetFv: number,
  n: number
): number {
  const tolerance = 0.000001;
  const maxIterations = 100;
  let rate = 0.01; // Initial guess: 1% per period

  for (let i = 0; i < maxIterations; i++) {
    const f = futureValueFunction(pv0, pmt, targetFv, n, rate);
    const fPrime = futureValueDerivative(pv0, pmt, n, rate);

    if (Math.abs(fPrime) < tolerance) {
      // Try binary search as fallback
      return solveReturnRateBinarySearch(pv0, pmt, targetFv, n);
    }

    const newRate = rate - f / fPrime;

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate;
    }

    // Prevent negative rates
    if (newRate < 0) {
      rate = 0.0001;
    } else if (newRate > 1) {
      rate = 0.5;
    } else {
      rate = newRate;
    }
  }

  // Fallback to binary search
  return solveReturnRateBinarySearch(pv0, pmt, targetFv, n);
}

/**
 * Solve for return rate using binary search (fallback method)
 */
function solveReturnRateBinarySearch(
  pv0: number,
  pmt: number,
  targetFv: number,
  n: number
): number {
  let low = 0.0001;
  let high = 1.0; // 100% per period max
  const tolerance = 0.000001;
  const maxIterations = 100;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const f = futureValueFunction(pv0, pmt, targetFv, n, mid);

    if (Math.abs(f) < tolerance) {
      return mid;
    }

    if (f > 0) {
      high = mid;
    } else {
      low = mid;
    }

    if (high - low < tolerance) {
      return mid;
    }
  }

  return (low + high) / 2;
}

/**
 * Detect which variable is missing from inputs
 * Supports both 3-parameter case (exactly 3 provided) and 2-parameter case (with target)
 */
function detectMissingVariable(inputs: CalculationInputs, hasTarget: boolean = false): CalculatedVariableType | null {
  const hasInitialInvestment = inputs.initialInvestment !== undefined && inputs.initialInvestment !== null && inputs.initialInvestment > 0;
  const hasPeriodicPayment = inputs.periodicPayment !== undefined && inputs.periodicPayment !== null && inputs.periodicPayment !== 0;
  const hasInvestmentYears = inputs.investmentYears !== undefined && inputs.investmentYears !== null && inputs.investmentYears > 0;
  const hasExpectedReturnRate = inputs.expectedReturnRate !== undefined && inputs.expectedReturnRate !== null && inputs.expectedReturnRate > 0;

  // Count how many are provided
  const providedCount = [hasInitialInvestment, hasPeriodicPayment, hasInvestmentYears, hasExpectedReturnRate]
    .filter(Boolean).length;

  // Case 1: Exactly 3 should be provided, 1 missing (standard case)
  if (providedCount === 3) {
    if (!hasExpectedReturnRate) {
      return CalculatedVariableType.RETURN_RATE;
    }
    if (!hasInvestmentYears) {
      return CalculatedVariableType.YEARS;
    }
    if (!hasPeriodicPayment) {
      return CalculatedVariableType.PERIODIC_PAYMENT;
    }
    if (!hasInitialInvestment) {
      return CalculatedVariableType.INITIAL_INVESTMENT;
    }
  }

  // Case 2: 2 parameters provided + target (new requirement: only need initial OR periodic)
  // When we have target + initial/periodic + rate/years, we can calculate the missing one
  if (hasTarget && providedCount === 2) {
    const hasInitialOrPeriodic = hasInitialInvestment || hasPeriodicPayment;
    
    // Must have at least initialInvestment OR periodicPayment
    if (!hasInitialOrPeriodic) {
      return null;
    }

    // If we have rate but not years, calculate years
    if (hasExpectedReturnRate && !hasInvestmentYears) {
      return CalculatedVariableType.YEARS;
    }
    
    // If we have years but not rate, calculate rate
    if (hasInvestmentYears && !hasExpectedReturnRate) {
      return CalculatedVariableType.RETURN_RATE;
    }

    // If we have initial but not periodic, calculate periodic
    if (hasInitialInvestment && !hasPeriodicPayment) {
      return CalculatedVariableType.PERIODIC_PAYMENT;
    }

    // If we have periodic but not initial, calculate initial
    if (hasPeriodicPayment && !hasInitialInvestment) {
      return CalculatedVariableType.INITIAL_INVESTMENT;
    }
  }

  return null; // Invalid input
}

/**
 * Calculate target present value from monthly expenses
 */
function calculateTargetPresentValue(
  monthlyExpenses: number | undefined,
  withdrawalRate: number | undefined
): number {
  if (!monthlyExpenses || !withdrawalRate) {
    return 0;
  }
  return (monthlyExpenses * 12) / withdrawalRate;
}

/**
 * Calculate present value from future value (discount with inflation)
 */
export function calculatePresentValue(
  futureValue: number,
  inflationRate: number,
  years: number
): number {
  if (years <= 0) return futureValue;
  const inflation = inflationRate / 100;
  return futureValue / Math.pow(1 + inflation, years);
}

/**
 * Calculate FV from RV (Real Value): FV = RV × (1 + i)^n
 * This is the nominal future value required to achieve a real value target
 */
export function calculateFVFromRV(
  realValue: number,
  inflationRate: number,
  periods: number
): number {
  if (periods <= 0) return realValue;
  const inflation = inflationRate / 100;
  return realValue * Math.pow(1 + inflation, periods);
}

/**
 * Calculate RV from FV (Future Value): RV = FV / (1 + i)^n
 * This converts a nominal future value to its real (inflation-adjusted) value
 */
export function calculateRVFromFV(
  futureValue: number,
  inflationRate: number,
  periods: number
): number {
  if (periods <= 0) return futureValue;
  const inflation = inflationRate / 100;
  return futureValue / Math.pow(1 + inflation, periods);
}

/**
 * Calculate PV directly from RV (Real Value)
 * Formula: PV = (RV × (1 + i)^n - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n
 * This calculates initial investment needed to achieve a real value target
 */
export function calculatePVFromRV(
  realValue: number,
  periodicPayment: number,
  returnRate: number,
  inflationRate: number,
  periods: number
): number {
  const r = returnRate;
  const i = inflationRate / 100;
  const n = periods;
  const rv = realValue;
  const pmt = periodicPayment || 0;

  // First convert RV to FV: FV = RV × (1 + i)^n
  const fv = rv * Math.pow(1 + i, n);

  // Then calculate PV from FV: PV = (FV - PMT × [((1 + r)^n - 1) / r]) / (1 + r)^n
  if (r === 0) {
    return fv - pmt * n;
  }

  const onePlusR = 1 + r;
  const onePlusRToN = Math.pow(onePlusR, n);
  const pmtPart = pmt * ((onePlusRToN - 1) / r);
  
  return (fv - pmtPart) / onePlusRToN;
}

/**
 * Calculate PMT directly from RV (Real Value)
 * Formula: PMT = (RV × (1 + i)^n - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]
 * This calculates periodic payment needed to achieve a real value target
 */
export function calculatePMTFromRV(
  realValue: number,
  initialInvestment: number,
  returnRate: number,
  inflationRate: number,
  periods: number
): number {
  const r = returnRate;
  const i = inflationRate / 100;
  const n = periods;
  const rv = realValue;
  const pv0 = initialInvestment || 0;

  // First convert RV to FV: FV = RV × (1 + i)^n
  const fv = rv * Math.pow(1 + i, n);

  // Then calculate PMT from FV: PMT = (FV - PV × (1 + r)^n) / [((1 + r)^n - 1) / r]
  if (r === 0) {
    return (fv - pv0) / n;
  }

  const onePlusR = 1 + r;
  const onePlusRToN = Math.pow(onePlusR, n);
  const pv0Part = pv0 * onePlusRToN;
  const annuityFactor = (onePlusRToN - 1) / r;
  
  return (fv - pv0Part) / annuityFactor;
}

/**
 * Solve for return rate using RV (Real Value) as target
 * Uses Newton-Raphson method with RV converted to FV internally
 */
export function solveReturnRateFromRV(
  initialInvestment: number,
  periodicPayment: number,
  targetRealValue: number,
  inflationRate: number,
  periods: number
): number {
  const i = inflationRate / 100;
  // Convert RV to FV: FV = RV × (1 + i)^n
  const targetFv = targetRealValue * Math.pow(1 + i, periods);
  
  // Use the standard solveReturnRate function
  return solveReturnRate(initialInvestment, periodicPayment, targetFv, periods);
}

/**
 * Solve for periods (years) using RV (Real Value) as target
 * Uses binary search with RV converted to FV internally
 */
export function solvePeriodsFromRV(
  initialInvestment: number,
  periodicPayment: number,
  targetRealValue: number,
  returnRatePerPeriod: number,
  inflationRate: number,
  periodsPerYear: number
): number {
  // Chuyển đổi inflationRate từ năm sang kỳ
  // Nếu periodsPerYear > 1, có nghĩa là có periodicPayment và cần chuyển đổi
  const inflationPerPeriod = (inflationRate / 100) / periodsPerYear;
  
  // Binary search for years
  const tolerance = 0.01; // 0.01 years tolerance
  const maxYears = 100; // Maximum 100 years
  let low = 0.1; // Minimum 0.1 years
  let high = maxYears;
  let bestYears = maxYears;

  for (let iter = 0; iter < 100; iter++) {
    const midYears = (low + high) / 2;
    const midPeriods = midYears * periodsPerYear;
    
    // Convert RV to FV for this period: FV = RV × (1 + i)^midPeriods
    // Đây là điểm quan trọng: tính FV từ RV, không phải từ targetPresentValue trực tiếp
    // Sử dụng inflationPerPeriod vì midPeriods là số kỳ
    const targetFv = targetRealValue * Math.pow(1 + inflationPerPeriod, midPeriods);
    
    const calculatedFV = calculateFutureValue(
      initialInvestment,
      periodicPayment,
      returnRatePerPeriod,
      midPeriods
    );

    const diff = calculatedFV - targetFv;

    if (Math.abs(diff) < tolerance * targetFv) {
      return midYears;
    }

    if (diff > 0) {
      high = midYears;
      bestYears = midYears;
    } else {
      low = midYears;
    }

    if (high - low < tolerance) {
      break;
    }
  }

  return bestYears;
}

/**
 * Generate warnings based on calculated value
 */
function generateWarnings(
  calculatedType: CalculatedVariableType,
  calculatedValue: number,
  inputs: CalculationInputs
): string[] {
  const warnings: string[] = [];

  if (calculatedType === CalculatedVariableType.RETURN_RATE) {
    if (calculatedValue > 50) {
      warnings.push('Tỷ suất lợi nhuận yêu cầu rất cao (>50%). Hãy xem xét điều chỉnh các thông số đầu vào.');
    } else if (calculatedValue < 0) {
      warnings.push('Không thể đạt được mục tiêu với các thông số hiện tại. Hãy tăng vốn ban đầu hoặc thanh toán định kỳ.');
    } else if (calculatedValue > 0 && calculatedValue < 1) {
      warnings.push('Tỷ suất lợi nhuận yêu cầu rất thấp (<1%). Có thể bạn đã nhập liệu sai. Hãy kiểm tra lại các thông số đầu vào (số tiền mục tiêu, vốn ban đầu, thanh toán định kỳ, số năm).');
    } else if (calculatedValue > 20) {
      warnings.push('Tỷ suất lợi nhuận yêu cầu khá cao (>20%). Có thể cần điều chỉnh mục tiêu hoặc tăng đầu tư.');
    }
  } else if (calculatedType === CalculatedVariableType.YEARS) {
    if (calculatedValue < 1) {
      warnings.push('Thời gian đầu tư quá ngắn (<1 năm). Hãy xem xét điều chỉnh mục tiêu.');
    } else if (calculatedValue > 50) {
      warnings.push('Thời gian đầu tư rất dài (>50 năm). Hãy xem xét tăng vốn ban đầu hoặc thanh toán định kỳ.');
    }
  } else if (calculatedType === CalculatedVariableType.PERIODIC_PAYMENT) {
    if (inputs.paymentType === PaymentType.CONTRIBUTION && calculatedValue < 0) {
      warnings.push('Thanh toán định kỳ tính được là số âm. Hãy xem xét điều chỉnh các thông số khác.');
    } else if (inputs.paymentType === PaymentType.WITHDRAWAL && calculatedValue > 0) {
      warnings.push('Thanh toán định kỳ tính được là số dương nhưng loại thanh toán là rút tiền.');
    }
  }

  // Check expectedReturnRate input (when it's not the calculated variable)
  // Warn if return rate is too low (< 1%), which might indicate input error
  if (calculatedType !== CalculatedVariableType.RETURN_RATE && 
      inputs.expectedReturnRate !== undefined && 
      inputs.expectedReturnRate !== null && 
      inputs.expectedReturnRate > 0 && 
      inputs.expectedReturnRate < 1) {
    warnings.push('Tỷ suất lợi nhuận kỳ vọng rất thấp (<1%). Có thể bạn đã nhập liệu sai. Hãy kiểm tra lại các thông số đầu vào (số tiền mục tiêu, vốn ban đầu, thanh toán định kỳ, số năm).');
  }

  return warnings;
}

/**
 * Generate suggestions based on calculation result
 */
function generateSuggestions(
  calculatedType: CalculatedVariableType,
  calculatedValue: number,
  inputs: CalculationInputs
): string[] {
  const suggestions: string[] = [];

  if (calculatedType === CalculatedVariableType.RETURN_RATE) {
    if (calculatedValue > 15) {
      suggestions.push('Xem xét tăng số tiền đầu tư ban đầu hoặc thanh toán định kỳ để giảm tỷ suất lợi nhuận yêu cầu.');
    }
    if (inputs.riskTolerance) {
      const riskLevel = inputs.riskTolerance;
      if (riskLevel === 'conservative' && calculatedValue > 8) {
        suggestions.push('Với mức độ chấp nhận rủi ro thận trọng, tỷ suất yêu cầu có thể khó đạt được. Xem xét tăng mức độ rủi ro hoặc điều chỉnh mục tiêu.');
      } else if (riskLevel === 'moderate' && calculatedValue > 12) {
        suggestions.push('Với mức độ chấp nhận rủi ro trung bình, tỷ suất yêu cầu khá cao. Xem xét tăng đầu tư hoặc điều chỉnh mục tiêu.');
      }
    }
    suggestions.push('Đề xuất phân bổ: 65% cổ phiếu, 15% trái phiếu, 10% vàng, 10% tiền mặt/tiền gửi');
  } else if (calculatedType === CalculatedVariableType.YEARS) {
    if (calculatedValue > 30) {
      suggestions.push('Thời gian đầu tư rất dài. Xem xét tăng vốn ban đầu hoặc thanh toán định kỳ để rút ngắn thời gian.');
    }
  } else if (calculatedType === CalculatedVariableType.PERIODIC_PAYMENT) {
    if (inputs.initialInvestment && Math.abs(calculatedValue) > inputs.initialInvestment) {
      suggestions.push('Thanh toán định kỳ tính được khá lớn. Xem xét tăng vốn ban đầu hoặc điều chỉnh mục tiêu.');
    }
  }

  return suggestions;
}

/**
 * Get label for calculated variable
 */
function getCalculatedVariableLabel(
  type: CalculatedVariableType,
  t: (key: string) => string
): string {
  switch (type) {
    case CalculatedVariableType.RETURN_RATE:
      return t('financialFreedom.calculatedVariables.returnRate');
    case CalculatedVariableType.YEARS:
      return t('financialFreedom.calculatedVariables.years');
    case CalculatedVariableType.PERIODIC_PAYMENT:
      return t('financialFreedom.calculatedVariables.periodicPayment');
    case CalculatedVariableType.INITIAL_INVESTMENT:
      return t('financialFreedom.calculatedVariables.initialInvestment');
    default:
      return '';
  }
}

/**
 * Main calculation function - performs all calculations based on Real Value (RV)
 * 
 * Logic:
 * - Trường hợp 1: Có Số tiền mục tiêu (targetPresentValue)
 *   1. Xác định RV = Số tiền mục tiêu (targetPresentValue)
 *   2. Tính r, n, PMT nếu không nhập thì tính dựa trên RV
 * 
 * - Trường hợp 2: Không có Số tiền mục tiêu
 *   1. Yêu cầu nhập r và n
 *   2. Xác định RV dựa trên r, n, PMT, PV
 */
export function calculateFinancialFreedom(
  inputs: CalculationInputs,
  t: (key: string) => string
): CalculationResult {
  // Validation: ít nhất phải nhập 1 trong 2 giá trị: vốn ban đầu hoặc thanh toán định kỳ
  const hasInitialInvestment = inputs.initialInvestment !== undefined && inputs.initialInvestment !== null && inputs.initialInvestment > 0;
  const hasPeriodicPayment = inputs.periodicPayment !== undefined && inputs.periodicPayment !== null && inputs.periodicPayment !== 0;
  
  if (!hasInitialInvestment && !hasPeriodicPayment) {
    throw new Error('Phải nhập ít nhất một trong hai giá trị: Vốn ban đầu hoặc Thanh toán định kỳ');
  }

  // Tạo một bản sao của inputs để không thay đổi inputs gốc
  const processedInputs: CalculationInputs = { ...inputs };
  
  // Xác định RV (Real Value - Tổng giá trị thực)
  // RV có thể từ: targetPresentValue trực tiếp hoặc tính từ monthlyExpenses
  const targetPV = processedInputs.targetPresentValue || 
    calculateTargetPresentValue(processedInputs.monthlyExpenses, processedInputs.withdrawalRate || 0.04);
  
  const hasTarget = targetPV > 0;
  const inflationRate = processedInputs.inflationRate || 4.5;
  
  // ============================================
  // TRƯỜNG HỢP 1: CÓ SỐ TIỀN MỤC TIÊU (RV)
  // ============================================
  if (hasTarget) {
    // Detect missing variable: r, n, hoặc PMT
    // Pass hasTarget=true to support 2-parameter case
    const missingVar = detectMissingVariable(processedInputs, true);
    
    // Validation: khi có target, phải có ít nhất 2 trong 4 tham số (PV hoặc PMT, r hoặc n)
    // để tính biến còn lại
    const hasInvestmentYears = processedInputs.investmentYears !== undefined && processedInputs.investmentYears !== null && processedInputs.investmentYears > 0;
    const hasExpectedReturnRate = processedInputs.expectedReturnRate !== undefined && processedInputs.expectedReturnRate !== null && processedInputs.expectedReturnRate > 0;
    const hasInitialInvestment = processedInputs.initialInvestment !== undefined && processedInputs.initialInvestment !== null && processedInputs.initialInvestment > 0;
    const hasPeriodicPayment = processedInputs.periodicPayment !== undefined && processedInputs.periodicPayment !== null && processedInputs.periodicPayment !== 0;
    
    // Must have at least initialInvestment OR periodicPayment (user requirement)
    if (!hasInitialInvestment && !hasPeriodicPayment) {
      throw new Error('Phải nhập ít nhất một trong hai giá trị: Vốn ban đầu hoặc Thanh toán định kỳ');
    }
    
    // If no missing variable detected, check if we have enough to calculate
    if (!missingVar) {
      // Need at least 3 parameters to calculate without missing variable
      const providedCount = [hasInitialInvestment, hasPeriodicPayment, hasInvestmentYears, hasExpectedReturnRate]
        .filter(Boolean).length;
      if (providedCount < 3) {
        // Try to detect what's missing with 2-parameter case
        if (providedCount === 2 && (hasExpectedReturnRate || hasInvestmentYears)) {
          // This should have been detected by detectMissingVariable, but if not, it's an error
          throw new Error('Khi có Số tiền mục tiêu, cần nhập đủ thông tin để tính toán. Vui lòng nhập thêm Số năm hoặc Tỷ suất lợi nhuận.');
        }
        throw new Error('Khi có Số tiền mục tiêu, phải nhập đầy đủ 4 tham số (Vốn ban đầu, Thanh toán định kỳ, Số năm, Tỷ suất) hoặc để trống 1-2 tham số để tính');
      }
    }
    
    // When calculating missing variable, need at least rate OR years
    if (missingVar && !hasInvestmentYears && !hasExpectedReturnRate) {
      throw new Error('Khi có Số tiền mục tiêu và tính biến thiếu, phải nhập ít nhất Số năm hoặc Tỷ suất lợi nhuận');
    }
    
    // Xử lý paymentType và tính periods
    const initialInvestment = processedInputs.initialInvestment || 0;
    let periodicPayment = processedInputs.periodicPayment || 0;
    if (processedInputs.paymentType === PaymentType.WITHDRAWAL && periodicPayment > 0) {
      periodicPayment = -periodicPayment;
    } else if (processedInputs.paymentType === PaymentType.CONTRIBUTION && periodicPayment < 0) {
      periodicPayment = Math.abs(periodicPayment);
    }
    
    // Determine periods per year and total periods
    let periodsPerYear: number;
    let totalPeriods: number;
    let returnRatePerPeriod: number;
    let inflationRatePerPeriod: number;
    let investmentYears: number;
    
    if (!periodicPayment || periodicPayment === 0) {
      periodsPerYear = 1;
      investmentYears = processedInputs.investmentYears || (missingVar === CalculatedVariableType.YEARS ? 0 : 10);
      totalPeriods = investmentYears;
      returnRatePerPeriod = (processedInputs.expectedReturnRate || 0) / 100;
      inflationRatePerPeriod = inflationRate / 100; // Annual rate, periods = years
    } else {
      periodsPerYear = getPeriodsPerYear(processedInputs.paymentFrequency);
      investmentYears = processedInputs.investmentYears || (missingVar === CalculatedVariableType.YEARS ? 0 : 10);
      totalPeriods = investmentYears * periodsPerYear;
      returnRatePerPeriod = (processedInputs.expectedReturnRate || 0) / 100 / periodsPerYear;
      inflationRatePerPeriod = inflationRate / 100 / periodsPerYear; // Convert annual to period rate
    }
    
    // Xác định RV (Tổng giá trị thực)
    // Nếu có đầy đủ PV, r, n thì tính RV từ các giá trị này
    // Nếu không thì dùng targetPresentValue
    let rv: number;
    if (hasInitialInvestment && hasExpectedReturnRate && hasInvestmentYears && !missingVar) {
      // Có đầy đủ PV, r, n: tính RV từ PV, PMT, r, n
      // Bước 1: Tính FV từ PV, PMT, r, n
      const calculatedFV = calculateFutureValue(
        initialInvestment,
        periodicPayment,
        returnRatePerPeriod,
        totalPeriods
      );
      // Bước 2: Tính RV từ FV: RV = FV / (1 + i)^n
      // Sử dụng inflationRatePerPeriod nếu có periodicPayment, ngược lại dùng inflationRate (annual)
      const inflationRateForCalculation = (!periodicPayment || periodicPayment === 0) 
        ? inflationRate 
        : inflationRatePerPeriod * 100; // Convert back to percentage for the function
      rv = calculateRVFromFV(calculatedFV, inflationRateForCalculation, totalPeriods);
    } else {
      // Không có đầy đủ PV, r, n: dùng targetPresentValue
      rv = targetPV; // RV = Số tiền mục tiêu
    }
    
    let calculatedValue: number;
    let calculatedType: CalculatedVariableType;
    
    // Tính biến thiếu dựa trên RV
    if (missingVar) {
      calculatedType = missingVar;
      
      switch (missingVar) {
        case CalculatedVariableType.RETURN_RATE: {
          if (totalPeriods <= 0) {
            throw new Error('Số năm đầu tư là bắt buộc để tính Tỷ suất lợi nhuận');
          }
          // Tính r (lãi suất) từ RV (Tổng giá trị thực)
          // solveReturnRateFromRV sẽ chuyển RV sang FV nội bộ: FV = RV × (1 + i)^n
          // Sau đó giải phương trình để tìm r sao cho FV đạt được từ PV, PMT, r, n
          // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
          const inflationRateForCalculation = (!periodicPayment || periodicPayment === 0) 
            ? inflationRate 
            : inflationRatePerPeriod * 100; // Convert back to percentage
          const ratePerPeriod = solveReturnRateFromRV(
            initialInvestment,
            periodicPayment,
            rv, // RV (số tiền mục tiêu) - nguồn gốc của tính toán
            inflationRateForCalculation,
            totalPeriods
          );
          calculatedValue = ratePerPeriod * periodsPerYear * 100; // Convert to annual percentage
          break;
        }
        
        case CalculatedVariableType.YEARS: {
          if (returnRatePerPeriod <= 0) {
            throw new Error('Tỷ suất lợi nhuận là bắt buộc để tính Số năm');
          }
          // Tính n (số kỳ/số năm) từ RV (Tổng giá trị thực)
          // solvePeriodsFromRV sẽ chuyển RV sang FV trong mỗi iteration: FV = RV × (1 + i)^n
          // Sau đó tìm n sao cho FV tính được từ PV, PMT, r, n bằng với FV từ RV
          // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
          // solvePeriodsFromRV sẽ tự động chuyển đổi trong mỗi iteration
          // Nhưng cần truyền inflationRate theo năm vì hàm này tính theo năm
          calculatedValue = solvePeriodsFromRV(
            initialInvestment,
            periodicPayment,
            rv, // RV (số tiền mục tiêu) - nguồn gốc của tính toán
            returnRatePerPeriod,
            inflationRate, // Keep annual rate, function handles conversion internally
            periodsPerYear
          );
          investmentYears = calculatedValue;
          totalPeriods = calculatedValue * periodsPerYear;
          break;
        }
        
        case CalculatedVariableType.PERIODIC_PAYMENT: {
          if (totalPeriods <= 0 || returnRatePerPeriod < 0) {
            throw new Error('Số năm và Tỷ suất lợi nhuận là bắt buộc để tính Thanh toán định kỳ');
          }
          // Tính PMT từ RV
          // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
          const inflationRateForPMT = (!periodicPayment || periodicPayment === 0) 
            ? inflationRate 
            : inflationRatePerPeriod * 100; // Convert back to percentage
          calculatedValue = calculatePMTFromRV(
            rv,
            initialInvestment,
            returnRatePerPeriod,
            inflationRateForPMT,
            totalPeriods
          );
          
          // Apply paymentType
          if (processedInputs.paymentType === PaymentType.WITHDRAWAL && calculatedValue > 0) {
            calculatedValue = -calculatedValue;
          } else if (processedInputs.paymentType === PaymentType.CONTRIBUTION && calculatedValue < 0) {
            calculatedValue = Math.abs(calculatedValue);
          }
          break;
        }
        
        case CalculatedVariableType.INITIAL_INVESTMENT: {
          if (totalPeriods <= 0 || returnRatePerPeriod < 0) {
            throw new Error('Số năm và Tỷ suất lợi nhuận là bắt buộc để tính Vốn ban đầu');
          }
          // Tính PV từ RV
          // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
          const inflationRateForPV = (!periodicPayment || periodicPayment === 0) 
            ? inflationRate 
            : inflationRatePerPeriod * 100; // Convert back to percentage
          calculatedValue = calculatePVFromRV(
            rv,
            periodicPayment,
            returnRatePerPeriod,
            inflationRateForPV,
            totalPeriods
          );
          break;
        }
        
        default:
          throw new Error('Biến tính toán không hợp lệ');
      }
    } else {
      // Không có biến thiếu, tính FV từ các tham số đã cho (bước trung gian)
      calculatedType = CalculatedVariableType.FUTURE_VALUE;
      calculatedValue = calculateFutureValue(
        initialInvestment,
        periodicPayment,
        returnRatePerPeriod,
        totalPeriods
      );
    }
    
    // BƯỚC 1: Xác định/tính toán RV (Tổng giá trị thực) TRƯỚC
    // RV đã được xác định ở trên:
    // - Nếu có đầy đủ PV, r, n: RV được tính từ PV, PMT, r, n (tính FV trước, sau đó RV = FV / (1+i)^n)
    // - Nếu không có đầy đủ: RV = targetPresentValue (số tiền mục tiêu)
    
    // BƯỚC 2: Tính FV (Tổng giá trị danh nghĩa) từ RV để đảm bảo nhất quán
    // FV = RV × (1 + i)^n
    // Điều này đảm bảo FV luôn được tính từ RV (nguồn gốc), không phải từ các tham số
    const finalTotalPeriods = missingVar === CalculatedVariableType.YEARS ? calculatedValue * periodsPerYear : totalPeriods;
    // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
    const inflationRateForFV = (!periodicPayment || periodicPayment === 0) 
      ? inflationRate 
      : inflationRatePerPeriod * 100; // Convert back to percentage
    const futureValueRequired = calculateFVFromRV(rv, inflationRateForFV, finalTotalPeriods);
    
    // Tính totalFutureValue từ RV để đảm bảo nhất quán
    // (Thay vì tính từ các tham số, tính từ RV để đảm bảo RV là nguồn gốc)
    const totalFutureValue = futureValueRequired;
    
    // Tính giá trị hiện tại (present value)
    // totalFutureValuePresentValue = RV (Tổng giá trị thực)
    // Không tính từ FV vì RV đã là giá trị thực (đã trừ lạm phát)
    const totalFutureValuePresentValue = rv; // RV (đã được tính từ PV, r, n hoặc từ targetPresentValue)
    const monthlyExpensesPresentValue = (totalFutureValuePresentValue * (processedInputs.withdrawalRate || 0.04)) / 12;
    
    // Generate warnings and suggestions
    const warnings = generateWarnings(calculatedType, calculatedValue, processedInputs);
    const suggestions = generateSuggestions(calculatedType, calculatedValue, processedInputs);
    
    return {
      calculatedVariable: {
        type: calculatedType,
        value: calculatedValue,
        label: getCalculatedVariableLabel(calculatedType, t),
      },
      futureValueRequired,
      targetPresentValue: rv,
      totalFutureValue,
      totalFutureValuePresentValue,
      monthlyExpensesPresentValue,
      investmentYears,
      isFeasible: Math.abs(totalFutureValue - futureValueRequired) / futureValueRequired < 0.1, // Within 10% tolerance
      warnings,
      suggestions,
    };
  }
  
  // ============================================
  // TRƯỜNG HỢP 2: KHÔNG CÓ SỐ TIỀN MỤC TIÊU
  // ============================================
  // Yêu cầu nhập r và n để tính RV
  const hasInvestmentYears = processedInputs.investmentYears !== undefined && processedInputs.investmentYears !== null && processedInputs.investmentYears > 0;
  const hasExpectedReturnRate = processedInputs.expectedReturnRate !== undefined && processedInputs.expectedReturnRate !== null && processedInputs.expectedReturnRate > 0;
  
  if (!hasInvestmentYears || !hasExpectedReturnRate) {
    throw new Error('Khi không có Số tiền mục tiêu, phải nhập đầy đủ Số năm và Tỷ suất lợi nhuận để tính Tổng giá trị thực');
  }
  
  // Xử lý paymentType và tính periods
  const initialInvestment = processedInputs.initialInvestment || 0;
  let periodicPayment = processedInputs.periodicPayment || 0;
  if (processedInputs.paymentType === PaymentType.WITHDRAWAL && periodicPayment > 0) {
    periodicPayment = -periodicPayment;
  } else if (processedInputs.paymentType === PaymentType.CONTRIBUTION && periodicPayment < 0) {
    periodicPayment = Math.abs(periodicPayment);
  }
  
  // Determine periods per year and total periods
  let periodsPerYear: number;
  let totalPeriods: number;
  let returnRatePerPeriod: number;
  let inflationRatePerPeriod: number;
  const investmentYears = processedInputs.investmentYears!;
  
  if (!periodicPayment || periodicPayment === 0) {
    periodsPerYear = 1;
    totalPeriods = investmentYears;
    returnRatePerPeriod = (processedInputs.expectedReturnRate || 0) / 100;
    inflationRatePerPeriod = inflationRate / 100; // Annual rate, periods = years
  } else {
    periodsPerYear = getPeriodsPerYear(processedInputs.paymentFrequency);
    totalPeriods = investmentYears * periodsPerYear;
    returnRatePerPeriod = (processedInputs.expectedReturnRate || 0) / 100 / periodsPerYear;
    inflationRatePerPeriod = inflationRate / 100 / periodsPerYear; // Convert annual to period rate
  }
  
  // BƯỚC 1: Tính FV từ PV, PMT, r, n (bước trung gian để tính RV)
  const intermediateFV = calculateFutureValue(
    initialInvestment,
    periodicPayment,
    returnRatePerPeriod,
    totalPeriods
  );
  
  // BƯỚC 2: Xác định/tính toán RV (Tổng giá trị thực) TRƯỚC
  // RV = FV / (1 + i)^n
  // Chuyển đổi inflationRate từ năm sang kỳ nếu có periodicPayment
  const inflationRateForCalculation = (!periodicPayment || periodicPayment === 0) 
    ? inflationRate 
    : inflationRatePerPeriod * 100; // Convert back to percentage
  const rv = calculateRVFromFV(intermediateFV, inflationRateForCalculation, totalPeriods);
  
  // BƯỚC 3: Tính FV (Tổng giá trị danh nghĩa) từ RV để đảm bảo nhất quán
  // FV = RV × (1 + i)^n
  const calculatedFV = calculateFVFromRV(rv, inflationRateForCalculation, totalPeriods);
  
  // Tính giá trị hiện tại (present value) từ FV
  const totalFutureValuePresentValue = calculatePresentValue(calculatedFV, inflationRate, investmentYears);
  const monthlyExpensesPresentValue = (totalFutureValuePresentValue * (processedInputs.withdrawalRate || 0.04)) / 12;
  
  return {
    calculatedVariable: {
      type: CalculatedVariableType.FUTURE_VALUE,
      value: calculatedFV,
      label: t('financialFreedom.calculatedVariables.futureValue'),
    },
    futureValueRequired: undefined, // Không có mục tiêu
    targetPresentValue: rv, // RV (Tổng giá trị thực) - được tính TRƯỚC
    totalFutureValue: calculatedFV, // FV (Tổng giá trị danh nghĩa) - được tính TỪ RV
    totalFutureValuePresentValue,
    monthlyExpensesPresentValue,
    investmentYears,
    isFeasible: undefined, // Không có mục tiêu để so sánh
    warnings: generateWarnings(CalculatedVariableType.FUTURE_VALUE, calculatedFV, processedInputs), // Check for input validation warnings (e.g., expectedReturnRate < 1%)
    suggestions: [],
  };
}

/**
 * Calculate yearly projections for asset value over time
 */
export function calculateYearlyProjections(
  inputs: CalculationInputs,
  result: CalculationResult
): Array<{ year: number; value: number; totalFutureValuePresentValue: number; totalCapital: number }> {
  let initialInvestment = inputs.initialInvestment || 0;
  
  // Get periodic payment with correct sign - MUST match the logic in calculateFinancialFreedom
  let periodicPayment: number;
  if (inputs.periodicPayment !== undefined && inputs.periodicPayment !== null) {
    periodicPayment = inputs.periodicPayment;
    if (inputs.paymentType === PaymentType.WITHDRAWAL && periodicPayment > 0) {
      periodicPayment = -periodicPayment;
    } else if (inputs.paymentType === PaymentType.CONTRIBUTION && periodicPayment < 0) {
      periodicPayment = Math.abs(periodicPayment);
    }
  } else {
    // If periodicPayment was calculated, use the calculated value (already has correct sign)
    if (result.calculatedVariable.type === CalculatedVariableType.PERIODIC_PAYMENT) {
      periodicPayment = result.calculatedVariable.value;
    } else {
      periodicPayment = 0;
    }
  }
  
  // If periodicPayment is 0 or not provided, calculate using annual compounding
  // Otherwise, use paymentFrequency to determine periods
  // MUST match the logic in calculateFinancialFreedom
  let periodsPerYear: number;
  let returnRatePerPeriod: number;
  
  if (!periodicPayment || periodicPayment === 0) {
    // No periodic payment: calculate using annual compounding
    periodsPerYear = 1;
    returnRatePerPeriod = (inputs.expectedReturnRate || 0) / 100;
  } else {
    // Has periodic payment: use paymentFrequency
    periodsPerYear = getPeriodsPerYear(inputs.paymentFrequency);
    returnRatePerPeriod = (inputs.expectedReturnRate || 0) / 100 / periodsPerYear;
  }

  // Get investment years - MUST match the logic in calculateFinancialFreedom
  // In calculateFinancialFreedom, totalFutureValuePresentValue uses: inputs.investmentYears ?? years
  // where years = inputs.investmentYears ?? 15
  // So it's effectively: inputs.investmentYears ?? 15
  // But if YEARS was calculated, we should use the calculated value for the chart
  let investmentYears: number;
  if (result.calculatedVariable.type === CalculatedVariableType.YEARS) {
    investmentYears = result.calculatedVariable.value;
  } else {
    // Match the logic in calculateFinancialFreedom: inputs.investmentYears ?? 15
    investmentYears = inputs.investmentYears ?? 15;
  }

  // Get return rate - MUST match the logic in calculateFinancialFreedom
  let finalReturnRatePerPeriod: number;
  if (result.calculatedVariable.type === CalculatedVariableType.RETURN_RATE) {
    // If periodicPayment is 0, use annual rate; otherwise use period rate
    if (!periodicPayment || periodicPayment === 0) {
      finalReturnRatePerPeriod = result.calculatedVariable.value / 100;
    } else {
      finalReturnRatePerPeriod = (result.calculatedVariable.value / 100) / periodsPerYear;
    }
  } else {
    finalReturnRatePerPeriod = returnRatePerPeriod;
  }

  // Get initial investment - MUST match the logic in calculateFinancialFreedom
  if (result.calculatedVariable.type === CalculatedVariableType.INITIAL_INVESTMENT) {
    initialInvestment = result.calculatedVariable.value;
  }

  const projections: Array<{ year: number; value: number; totalFutureValuePresentValue: number; totalCapital: number }> = [];
  
  // Calculate total future value present value (adjusted for inflation)
  const inflationRate = inputs.inflationRate || 4.5;
  
  // Use the same investmentYears that was used to calculate totalFutureValuePresentValue in result
  const finalInvestmentYears = investmentYears;
  
  for (let year = 0; year <= finalInvestmentYears; year++) {
    const periods = year * periodsPerYear;
    // Use the same formula as in calculateFinancialFreedom
    const value = calculateFutureValue(
      initialInvestment,
      periodicPayment,
      finalReturnRatePerPeriod,
      periods
    );
    
    // Total future value present value (discounted for inflation)
    // Use the same formula as in calculateFinancialFreedom
    const totalFutureValuePresentValue = calculatePresentValue(value, inflationRate, year);
    
    // Calculate total capital (cumulative: initial investment + periodic payments)
    // Vốn góp = Vốn ban đầu + (thanh toán định kỳ * số kỳ đã qua)
    // Use absolute value for contributions calculation (contributions are always positive)
    const periodicPaymentAbsolute = Math.abs(periodicPayment);
    const totalCapital = initialInvestment + (periodicPaymentAbsolute * periods);
    
    projections.push({
      year,
      value: Math.max(0, value), // Ensure non-negative
      totalFutureValuePresentValue: Math.max(0, totalFutureValuePresentValue), // Ensure non-negative
      totalCapital: Math.max(0, totalCapital), // Ensure non-negative
    });
  }

  return projections;
}

/**
 * Calculate consolidate data for financial freedom planning
 * This function performs all calculations for step 3 consolidation
 */
export function calculateConsolidate(request: ConsolidateRequest): ConsolidateResponse {
  if (!request.plans || request.plans.length === 0) {
    throw new Error('No plans provided in consolidate request');
  }

  const plan = request.plans[0];
  
  // Use targetPresentValue (RV) as the base target for consistency with step 1
  const targetPresentValue = plan.targetPresentValue || 0;
  const futureValueRequired = plan.futureValueRequired || 0;
  const targetValue = futureValueRequired || targetPresentValue || 0; // For backward compatibility
  const investmentYears = plan.investmentYears ?? 15;
  if (!investmentYears || investmentYears <= 0) {
    throw new Error(`investmentYears must be a positive number, got: ${investmentYears}`);
  }
  const requiredReturnRate = plan.requiredReturnRate || 12.5;
  const initialInvestment = plan.initialInvestment || 0;
  const periodicPayment = plan.periodicPayment || 0;
  const paymentFrequency = plan.paymentFrequency;
  const inflationRate = plan.inflationRate || 4.5;
  // Use dynamic allocation - default to empty object if not provided
  const allocation: AssetAllocation = plan.suggestedAllocation || {};

  const periodsPerYear = getPeriodsPerYear(paymentFrequency);
  const returnRatePerPeriod = requiredReturnRate / 100 / periodsPerYear;

  // Calculate yearly projections based on actual data
  // Use Math.ceil to ensure we show projections for partial years (e.g., 4.5 years -> show 5 years)
  // This allows users to see projections even when investmentYears is a decimal
  const validInvestmentYears = Math.max(1, Math.ceil(investmentYears));
  const yearlyProjections: YearlyProjection[] = Array.from({ length: validInvestmentYears }, (_, i) => {
    const year = i + 1;
    const periods = year * periodsPerYear;
    
    const portfolioValue = calculateFutureValue(
      initialInvestment,
      periodicPayment,
      returnRatePerPeriod,
      periods
    );
    // Calculate contributions using absolute value (contributions are always positive)
    // Even for withdrawals, we show the total amount contributed/withdrawn
    const periodicPaymentAbsolute = Math.abs(periodicPayment);
    const contributions = periodicPaymentAbsolute * periodsPerYear * year;
    const returns = portfolioValue - initialInvestment - (periodicPayment * periods);
    const cumulativeValue = portfolioValue;
    const progressToGoal = targetValue > 0 ? Math.min((portfolioValue / targetValue) * 100, 100) : 0;

    return {
      year,
      portfolioValue: Math.max(0, portfolioValue),
      contributions: Math.max(0, contributions),
      returns: Math.max(0, returns),
      cumulativeValue: Math.max(0, cumulativeValue),
      progressToGoal: Math.max(0, Math.min(progressToGoal, 100)),
    };
  });

  // Calculate scenarios based on risk tolerance
  // The percentages vary based on user's risk tolerance selection
  let conservativeReturn: number;
  let moderateReturn: number;
  let aggressiveReturn: number;
  
  const riskToleranceValue = plan.riskTolerance as RiskTolerance | string;
  
  // Convert to string for comparison to handle both enum and string values
  const riskToleranceStr = String(riskToleranceValue).toLowerCase();
  
  if (riskToleranceStr === 'conservative' || riskToleranceValue === RiskTolerance.CONSERVATIVE) {
    // Thận trọng: Conservative = 100%, Moderate = 130%, Aggressive = 160%
    conservativeReturn = requiredReturnRate * 1.0; // 100% of required
    moderateReturn = requiredReturnRate * 1.3; // 130% of required
    aggressiveReturn = requiredReturnRate * 1.6; // 160% of required
  } else if (riskToleranceStr === 'aggressive' || riskToleranceValue === RiskTolerance.AGGRESSIVE) {
    // Mạo hiểm: Conservative = 40%, Moderate = 70%, Aggressive = 100%
    conservativeReturn = requiredReturnRate * 0.4; // 40% of required
    moderateReturn = requiredReturnRate * 0.7; // 70% of required
    aggressiveReturn = requiredReturnRate * 1.0; // 100% of required
  } else {
    // Trung bình (default): Conservative = 70%, Moderate = 100%, Aggressive = 130%
    conservativeReturn = requiredReturnRate * 0.7; // 70% of required
    moderateReturn = requiredReturnRate * 1.0; // 100% of required
    aggressiveReturn = requiredReturnRate * 1.3; // 130% of required
  }

  // Store return rates for display
  const conservativeReturnRate = conservativeReturn;
  const moderateReturnRate = moderateReturn;
  const aggressiveReturnRate = aggressiveReturn;

  const calculateFinalValue = (returnRate: number, years: number = investmentYears) => {
    const r = returnRate / 100 / periodsPerYear;
    const periods = years * periodsPerYear;
    return calculateFutureValue(initialInvestment, periodicPayment, r, periods);
  };

  // Calculate years needed to reach target value for each scenario
  // Using binary search to find the number of years needed
  // Uses same logic as solvePeriodsFromRV: calculates from RV and converts to FV in each iteration
  const calculateYearsToGoal = (returnRate: number, targetRV: number): number => {
    if (targetRV <= 0) return investmentYears;
    
    const inflationPerPeriod = (inflationRate / 100) / periodsPerYear;
    const tolerance = 0.1; // 0.1 years tolerance
    const maxYears = 100; // Maximum 100 years
    let low = 0.1;
    let high = maxYears;
    let bestYears = maxYears;

    for (let iter = 0; iter < 100; iter++) {
      const midYears = (low + high) / 2;
      const midPeriods = midYears * periodsPerYear;
      
      // Convert RV to FV for this period: FV = RV × (1 + i)^midPeriods
      // Same logic as solvePeriodsFromRV in step 1
      const targetFV = targetRV * Math.pow(1 + inflationPerPeriod, midPeriods);
      
      const calculatedFV = calculateFinalValue(returnRate, midYears);
      const diff = calculatedFV - targetFV;

      if (Math.abs(diff) < tolerance * targetFV) {
        return midYears;
      }

      if (diff > 0) {
        high = midYears;
        bestYears = midYears;
      } else {
        low = midYears;
      }

      if (high - low < tolerance) {
        break;
      }
    }

    return bestYears;
  };

  const conservativeFinal = calculateFinalValue(conservativeReturn);
  const moderateFinal = calculateFinalValue(moderateReturn);
  const aggressiveFinal = calculateFinalValue(aggressiveReturn);

  // Calculate years to goal for each scenario based on targetPresentValue (RV) for consistency with step 1
  const conservativeYearsToGoal = targetPresentValue > 0 ? calculateYearsToGoal(conservativeReturn, targetPresentValue) : investmentYears;
  const moderateYearsToGoal = targetPresentValue > 0 ? calculateYearsToGoal(moderateReturn, targetPresentValue) : investmentYears;
  const aggressiveYearsToGoal = targetPresentValue > 0 ? calculateYearsToGoal(aggressiveReturn, targetPresentValue) : investmentYears;

  // Determine recommended scenario based on risk tolerance
  // Map riskTolerance enum to scenario - this should match the user's selection from step 1
  let recommendedScenario: 'conservative' | 'moderate' | 'aggressive' = 'moderate';
  
  // Handle both enum and string values
  if (riskToleranceStr === 'conservative' || riskToleranceValue === RiskTolerance.CONSERVATIVE) {
    recommendedScenario = 'conservative';
  } else if (riskToleranceStr === 'aggressive' || riskToleranceValue === RiskTolerance.AGGRESSIVE) {
    recommendedScenario = 'aggressive';
  } else {
    // Default to moderate for MODERATE or any other value
    recommendedScenario = 'moderate';
  }

  // Calculate milestones (25%, 50%, 100% of goal)
  const milestones = [
    { 
      year: Math.ceil(investmentYears * 0.25), 
      description: '25% of goal', 
      value: targetValue * 0.25, 
      targetValue: targetValue * 0.25 
    },
    { 
      year: Math.ceil(investmentYears * 0.5), 
      description: '50% of goal', 
      value: targetValue * 0.5, 
      targetValue: targetValue * 0.5 
    },
    { 
      year: investmentYears, 
      description: '100% of goal', 
      value: targetValue, 
      targetValue: targetValue 
    },
  ];

  // Calculate diversification score based on allocation
  // Score is based on number of asset types with allocation > 0
  const assetTypesWithAllocation = Object.keys(allocation).filter(
    key => allocation[key] > 0
  );
  const totalAssetTypes = Object.keys(allocation).length;
  // Score = (number of asset types with allocation / total asset types) * 100
  // Minimum 1 asset type, maximum score is 100
  const diversificationScore = totalAssetTypes > 0
    ? Math.min(100, Math.round((assetTypesWithAllocation.length / Math.max(totalAssetTypes, 1)) * 100))
    : 0;

  // Determine overall risk based on allocation
  // Risk is determined by the highest allocation percentage
  // High risk: any asset type > 70%
  // Low risk: highest allocation < 40% and multiple asset types well distributed
  let overallRisk: 'low' | 'medium' | 'high' = 'medium';
  const allocationValues = Object.values(allocation).map(v => Number(v));
  if (allocationValues.length > 0) {
    const maxAllocation = Math.max(...allocationValues);
    const nonZeroValues = allocationValues.filter(v => v > 0);
    const minAllocation = nonZeroValues.length > 0 ? Math.min(...nonZeroValues) : 0;
    
    if (maxAllocation > 70) {
      overallRisk = 'high';
    } else if (maxAllocation < 40 && assetTypesWithAllocation.length >= 3 && (maxAllocation - minAllocation) < 30) {
      // Well distributed: highest < 40%, at least 3 asset types, and spread < 30%
      overallRisk = 'low';
    } else {
      overallRisk = 'medium';
    }
  }

  return {
    totalTargetValue: targetValue,
    totalFutureValueRequired: targetValue,
    weightedAverageRRR: requiredReturnRate,
    combinedAllocation: allocation,
    yearlyProjections,
    scenarios: {
      conservative: {
        finalValue: conservativeFinal,
        yearsToGoal: Math.round(conservativeYearsToGoal * 100) / 100, // Round to 2 decimal places instead of ceiling
        progressPercentage: targetValue > 0 ? (conservativeFinal / targetValue) * 100 : 0,
        returnRate: conservativeReturnRate,
      },
      moderate: {
        finalValue: moderateFinal,
        yearsToGoal: Math.round(moderateYearsToGoal * 100) / 100, // Round to 2 decimal places instead of ceiling
        progressPercentage: targetValue > 0 ? (moderateFinal / targetValue) * 100 : 0,
        returnRate: moderateReturnRate,
      },
      aggressive: {
        finalValue: aggressiveFinal,
        yearsToGoal: Math.round(aggressiveYearsToGoal * 100) / 100, // Round to 2 decimal places instead of ceiling
        progressPercentage: targetValue > 0 ? (aggressiveFinal / targetValue) * 100 : 0,
        returnRate: aggressiveReturnRate,
      },
    },
    recommendedScenario,
    milestones,
    riskAssessment: {
      overallRisk,
      diversificationScore,
      recommendations: (() => {
        const recommendations: string[] = [];
        
        // Diversification recommendation
        if (diversificationScore < 60) {
          recommendations.push('Consider diversifying across more asset classes');
        } else {
          recommendations.push('Your portfolio is well diversified');
        }
        
        // Risk allocation recommendation
        const maxAllocation = allocationValues.length > 0 ? Math.max(...allocationValues) : 0;
        const maxAllocationKey = allocationValues.length > 0 
          ? Object.keys(allocation).find(key => Number(allocation[key]) === maxAllocation) || ''
          : '';
        
        if (maxAllocation > 70) {
          recommendations.push(`Consider reducing ${maxAllocationKey} allocation to manage risk`);
        } else {
          recommendations.push('Your risk allocation looks balanced');
        }
        
        return recommendations;
      })(),
    },
  };
}
