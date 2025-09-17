// Debug the return formula to understand why returns are low

console.log('=== Debugging Return Formula ===');

// Test with a simple case: $100k loan at 6% for 1 year
const principal = 100000;
const interestRate = 6; // 6% annual
const monthlyRate = interestRate / 100 / 12;
const termMonths = 12;

// Calculate monthly payment
const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
const totalPaid = monthlyPayment * termMonths;
const totalInterest = totalPaid - principal;

console.log('Simple 1-year loan:');
console.log('Principal:', principal);
console.log('Interest Rate:', interestRate + '%');
console.log('Monthly Payment:', monthlyPayment.toFixed(2));
console.log('Total Paid:', totalPaid.toFixed(2));
console.log('Total Interest:', totalInterest.toFixed(2));

// My current formula
const yearsToPayoff = termMonths / 12;
const annualizedReturn = (Math.pow(totalPaid / principal, 1 / yearsToPayoff) - 1) * 100;

console.log('\nCurrent formula:');
console.log('Years to Payoff:', yearsToPayoff);
console.log('Annualized Return:', annualizedReturn.toFixed(2) + '%');
console.log('Expected:', interestRate + '%');

console.log('\nAnalysis:');
console.log('The issue might be that I\'m using totalPaid instead of just the return portion.');
console.log('For a 1-year loan, the return should equal the interest rate.');

// Let me try a different approach - what if I calculate the effective annual rate?
// For monthly compounding: EAR = (1 + monthlyRate)^12 - 1
const effectiveAnnualRate = (Math.pow(1 + monthlyRate, 12) - 1) * 100;
console.log('\nEffective Annual Rate (should equal interest rate):', effectiveAnnualRate.toFixed(2) + '%');

// The issue might be that I need to think about this differently
// The lender's return is the interest rate they charge, not necessarily what they earn
// But if I want to calculate the actual return on their investment, I need to be more careful

console.log('\nAlternative approach:');
console.log('Maybe the return should be based on the interest earned vs principal, not total received vs principal');
const returnBasedOnInterest = (totalInterest / principal) / yearsToPayoff * 100;
console.log('Return based on interest only:', returnBasedOnInterest.toFixed(2) + '%');
