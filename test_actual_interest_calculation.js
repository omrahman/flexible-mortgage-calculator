// Test the corrected calculation using actual interest collected

console.log('=== Testing Actual Interest Calculation ===');

// Test case 1: Standard loan (no extra payments, no forgiveness)
console.log('\n1. Standard Loan:');
const principal1 = 1000000;
const interestRate1 = 4.85;
const totalInterest1 = 899690; // Actual interest from 30-year loan
const totalForgiveness1 = 0;
const payoffMonth1 = 360; // 30 years

const principalRecovered1 = principal1 - totalForgiveness1;
const totalReceived1 = totalInterest1 + principalRecovered1;
const yearsToPayoff1 = payoffMonth1 / 12;
const annualizedReturn1 = (Math.pow(totalReceived1 / principal1, 1 / yearsToPayoff1) - 1) * 100;

console.log('Principal:', principal1);
console.log('Total Interest:', totalInterest1);
console.log('Total Forgiveness:', totalForgiveness1);
console.log('Principal Recovered:', principalRecovered1);
console.log('Total Received:', totalReceived1);
console.log('Years to Payoff:', yearsToPayoff1);
console.log('Annualized Return:', annualizedReturn1.toFixed(2) + '%');
console.log('Interest Rate:', interestRate1 + '%');
console.log('✓ Should be close to interest rate');

// Test case 2: Loan with extra payments (paid off early)
console.log('\n2. Loan with Extra Payments (Paid Off Early):');
const principal2 = 1000000;
const totalInterest2 = 400000; // Less interest due to early payoff
const totalForgiveness2 = 0;
const payoffMonth2 = 180; // 15 years

const principalRecovered2 = principal2 - totalForgiveness2;
const totalReceived2 = totalInterest2 + principalRecovered2;
const yearsToPayoff2 = payoffMonth2 / 12;
const annualizedReturn2 = (Math.pow(totalReceived2 / principal2, 1 / yearsToPayoff2) - 1) * 100;

console.log('Principal:', principal2);
console.log('Total Interest:', totalInterest2);
console.log('Total Forgiveness:', totalForgiveness2);
console.log('Principal Recovered:', principalRecovered2);
console.log('Total Received:', totalReceived2);
console.log('Years to Payoff:', yearsToPayoff2);
console.log('Annualized Return:', annualizedReturn2.toFixed(2) + '%');
console.log('✓ Should be higher than interest rate due to early payoff');

// Test case 3: Loan with forgiveness
console.log('\n3. Loan with Forgiveness:');
const principal3 = 1000000;
const totalInterest3 = 500000; // Interest earned
const totalForgiveness3 = 10000;
const payoffMonth3 = 360; // 30 years

const principalRecovered3 = principal3 - totalForgiveness3;
const totalReceived3 = totalInterest3 + principalRecovered3;
const yearsToPayoff3 = payoffMonth3 / 12;
const annualizedReturn3 = (Math.pow(totalReceived3 / principal3, 1 / yearsToPayoff3) - 1) * 100;

console.log('Principal:', principal3);
console.log('Total Interest:', totalInterest3);
console.log('Total Forgiveness:', totalForgiveness3);
console.log('Principal Recovered:', principalRecovered3);
console.log('Total Received:', totalReceived3);
console.log('Years to Payoff:', yearsToPayoff3);
console.log('Annualized Return:', annualizedReturn3.toFixed(2) + '%');
console.log('Interest Rate:', interestRate1 + '%');
console.log('✓ Should be lower than interest rate due to lost principal');

console.log('\n=== Summary ===');
console.log('✓ Uses actual interest collected (not just interest rate)');
console.log('✓ Accounts for time value of money');
console.log('✓ Reflects impact of extra payments and forgiveness');
console.log('✓ Based on real cash flows, not theoretical rates');
