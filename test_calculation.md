# Test Calculation Analysis

Let me trace through a simple example to verify the balance calculation:

## Example: $100,000 loan, 6% rate, 30 years, $1,000 extra in month 1

### Month 1 Calculation:
- Starting balance: $100,000
- Monthly rate: 6% / 12 = 0.5% = 0.005
- Interest: $100,000 × 0.005 = $500
- Regular payment: $599.55 (calculated using PMT formula)
- Principal part: $599.55 - $500 = $99.55
- Extra payment: $1,000
- Total cash out: $599.55 + $1,000 = $1,599.55
- **Ending balance: $100,000 - $99.55 - $1,000 = $98,900.45**

### Month 2 Calculation:
- Starting balance: $98,900.45
- Interest: $98,900.45 × 0.005 = $494.50
- Regular payment: $599.55
- Principal part: $599.55 - $494.50 = $105.05
- Extra payment: $0 (no extra in month 2)
- Total cash out: $599.55
- **Ending balance: $98,900.45 - $105.05 - $0 = $98,795.40**

The calculation logic in `buildSchedule` function:
```typescript
bal = round2(bal - principalPart - extra);
```

This correctly subtracts both the principal part AND the extra payment from the balance.

## Potential Issues to Check:

1. **Extra payments not being passed correctly** - Check if `extrasMap` is being built properly
2. **Timing of balance update** - The balance is updated after the row is created, so the row should show the correct balance
3. **Rounding issues** - Check if rounding is causing problems
4. **Display issues** - Check if the amortization table is displaying the correct values

## Debug Steps:

1. Add console logs to see what values are being calculated
2. Check if extra payments are being included in the `extrasMap`
3. Verify the balance calculation step by step
