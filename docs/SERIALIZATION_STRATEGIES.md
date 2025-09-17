# Serialization Strategies Comparison

This document compares the output of the different serialization strategies used for generating shareable URLs.

## Sample Input Data

The following data is used as the input for each of the serialization strategies:

```json
{
  "homePrice": "500000",
  "downPayment": { "type": "percentage", "value": "10" },
  "rate": "3.25",
  "termYears": "30",
  "startYM": "2025-01",
  "propertyTaxAnnual": "6000",
  "insuranceAnnual": "1500",
  "autoRecast": false,
  "recastMonthsText": "12, 24, 36",
  "extras": [
    { "month": 6, "amount": 5000 },
    { "month": 12, "amount": 100, "isRecurring": true, "recurringQuantity": 120, "recurringFrequency": "monthly" },
    { "month": 24, "amount": 2500, "isRecurring": true, "recurringQuantity": 5, "recurringFrequency": "annually", "isForgiveness": true }
  ]
}
```

## Comparison of Outputs

Below is the serialized output for each strategy, along with the final compressed and encoded URL string.

### 1. Full JSON Strategy

This strategy produces a human-readable JSON object. It is the most verbose but also the easiest to debug.

**Serialized Output:**
```json
{
  "version": "1.0.0",
  "metadata": { ... },
  "loan": {
    "homePrice": "500000",
    "downPayment": { "type": "percentage", "value": "10" },
    "interestRate": "3.25",
    "termYears": "30",
    "startDate": "2025-01",
    "propertyTaxAnnual": "6000",
    "insuranceAnnual": "1500"
  },
  "extraPayments": [ ... ],
  "forgivenessPayments": [ ... ],
  "recastSettings": {
    "autoRecast": false,
    "recastMonths": [12, 24, 36]
  },
  "displaySettings": { "showAll": false }
}
```

### 2. Lean V1 Strategy (Array-Based)

This was the first attempt at a more compact format, using an array to eliminate keys.

**Serialized Output:**
```json
["1","500000","p","10","3.25","30","2025-01","6000","1500",0,"12,24,36",[[6,5000],[12,100,1,120,"m"],[24,2500,1,5,"a",1]]]
```

### 3. Lean V2 Strategy (Object with Short Keys)

This version reintroduces keys, but uses single characters to save space. It also omits default values and stores numbers as numeric types.

**Serialized Output:**
```json
{"v":"2","h":500000,"t":"p","d":10,"i":3.25,"s":300,"p":6000,"n":1500,"a":0,"r":"12,24,36","e":[[6,5000],[12,100,1,120,"m"],[24,2500,1,5,"a",1]]}
```

### 4. Bit Manipulation Strategy

This is the most compact format, packing the data into a sequence of bytes with no wasted space. The output shown below is an array of byte values.

**Serialized Output:**
```
[53, 122, 16, 10, 0, 16, 4, 39, 11, 184, 23, 100, 0, 0, 48, 134, 24, 136, 12, 32, 0, 0, 9, 196, 200, 20, 160]
```
