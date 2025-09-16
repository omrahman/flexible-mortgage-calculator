// Test script to verify balance calculation with extra payments
import { buildSchedule } from './src/utils/calculations.js';

// Test case: $100,000 loan, 6% rate, 30 years, with $1000 extra payment in month 1
const testParams = {
  principal: 100000,
  annualRatePct: 6,
  termMonths: 360,
  startYM: "2024-01",
  extras: { 1: 1000 }, // $1000 extra in month 1
  recastMonths: new Set(),
  autoRecastOnExtra: false
};

console.log("Testing balance calculation with extra payments...");
console.log("Loan: $100,000 at 6% for 30 years");
console.log("Extra payment: $1,000 in month 1");
console.log("");

const result = buildSchedule(testParams);

// Show first 5 months
console.log("First 5 months of amortization:");
console.log("Month | Payment | Interest | Principal | Extra | Total | Balance");
console.log("------|---------|----------|-----------|-------|-------|--------");

for (let i = 0; i < Math.min(5, result.rows.length); i++) {
  const row = result.rows[i];
  console.log(
    `${row.idx.toString().padStart(5)} | ` +
    `$${row.payment.toFixed(2).padStart(7)} | ` +
    `$${row.interest.toFixed(2).padStart(8)} | ` +
    `$${row.principal.toFixed(2).padStart(9)} | ` +
    `$${row.extra.toFixed(2).padStart(4)} | ` +
    `$${row.total.toFixed(2).padStart(5)} | ` +
    `$${row.balance.toFixed(2).padStart(7)}`
  );
}

console.log("");
console.log("Total interest paid:", result.totalInterest);
console.log("Total paid:", result.totalPaid);
console.log("Payoff month:", result.payoffMonth);
