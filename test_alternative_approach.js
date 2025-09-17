// Test alternative approach to return calculation

console.log('=== Alternative Approach to Return Calculation ===');

// Maybe the return should be based on the interest rate, adjusted for actual performance
// For a standard loan, return = interest rate
// For a loan with modifications, return = interest rate * (actual interest / expected interest)

// Test case 1: Standard loan
const principal1 = 1000000;
const interestRate1 = 4.85;
const totalInterest1 = 899690; // Actual interest from 30-year loan
const payoffMonth1 = 360;

// Expected interest for 30-year loan at 4.85%
const monthlyRate1 = interestRate1 / 100 / 12;
const monthlyPayment1 = (principal1 * monthlyRate1) / (1 - Math.pow(1 + monthlyRate1, -360));
const expectedInterest1 = (monthlyPayment1 * 360) - principal1;

console.log('1. Standard Loan:');
console.log('Interest Rate:', interestRate1 + '%');
console.log('Expected Interest:', expectedInterest1.toFixed(2));
console.log('Actual Interest:', totalInterest1);
console.log('Interest Ratio:', (totalInterest1 / expectedInterest1).toFixed(4));
console.log('Adjusted Return:', (interestRate1 * (totalInterest1 / expectedInterest1)).toFixed(2) + '%');

// Test case 2: Loan with forgiveness
const principal2 = 1000000;
const totalInterest2 = 500000; // Less interest due to forgiveness
const totalForgiveness2 = 10000;
const payoffMonth2 = 360;

// The expected interest would be less due to forgiveness reducing the balance
// But this is complex to calculate exactly
// Maybe a simpler approach: return = interest rate * (1 - forgiveness impact)

console.log('\n2. Loan with Forgiveness:');
console.log('Interest Rate:', interestRate1 + '%');
console.log('Total Forgiveness:', totalForgiveness2);
console.log('Forgiveness Impact:', (totalForgiveness2 / principal2 * 100).toFixed(2) + '%');
console.log('Simple Adjusted Return:', (interestRate1 * (1 - totalForgiveness2 / principal2)).toFixed(2) + '%');

// Test case 3: Maybe the return should just be the interest rate for standard loans
// and adjusted based on the actual interest earned for modified loans

console.log('\n3. Simple Approach:');
console.log('Standard loan return = interest rate =', interestRate1 + '%');
console.log('Modified loan return = interest rate * (actual interest / expected interest)');
console.log('This accounts for the actual performance while keeping it simple.');

// Let me try: return = interest rate * (total interest / expected interest)
const adjustedReturn2 = interestRate1 * (totalInterest2 / expectedInterest1);
console.log('Adjusted return for forgiveness case:', adjustedReturn2.toFixed(2) + '%');
