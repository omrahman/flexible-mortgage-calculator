import { exportToJSON, importFromJSON, serializeLoanConfiguration, deserializeLoanConfiguration } from '../serialization';
import { CachedInputs } from '../../types';
import { SCHEMA_VERSION } from '../../constants';

const mockInputs: CachedInputs = {
  homePrice: '500000',
  downPayment: { type: 'percentage', value: '20' },
  rate: '3.5',
  termYears: '30',
  startYM: '2024-01',
  propertyTaxAnnual: '5000',
  insuranceAnnual: '1200',
  extras: [
    { id: '1', month: 12, amount: 1000, isRecurring: false },
    { id: '2', month: 24, amount: 500, isRecurring: true, recurringQuantity: 12, recurringFrequency: 'monthly' },
  ],
  autoRecast: true,
  recastMonthsText: '12, 24',
  showAll: false,
};

describe('serialization utilities', () => {
  describe('exportToJSON', () => {
    it('should serialize CachedInputs to a valid JSON string', () => {
      const jsonString = exportToJSON(mockInputs);
      const data = JSON.parse(jsonString);

      expect(data.version).toBe(SCHEMA_VERSION);
      expect(data.loan.homePrice).toBe(mockInputs.homePrice);
      expect(data.extraPayments.length).toBe(2);
    });
  });

  describe('importFromJSON', () => {
    it('should deserialize a valid JSON string to LoanConfigurationSchema', () => {
      const schema = serializeLoanConfiguration(mockInputs);
      const jsonString = JSON.stringify(schema);
      
      const result = importFromJSON(jsonString);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
      expect(result.data?.version).toBe(SCHEMA_VERSION);
      expect(result.data?.loan.homePrice).toBe(mockInputs.homePrice);
    });

    it('should return an error for invalid JSON', () => {
      const invalidJson = '{"invalid": json}';
      const result = importFromJSON(invalidJson);

      expect(result.isValid).toBe(false);
      expect(result.errors).not.toEqual([]);
    });

    it('should return an error for a schema that fails validation', () => {
        const schema = serializeLoanConfiguration(mockInputs);
        // @ts-expect-error Testing invalid input
        delete schema.loan; // Invalidate the schema
        const jsonString = JSON.stringify(schema);
        const result = importFromJSON(jsonString);
  
        expect(result.isValid).toBe(false);
        expect(result.errors?.some(e => e.toLowerCase().includes('loan'))).toBe(true);
    });
  });

  describe('round-trip serialization/deserialization', () => {
    it('should maintain data integrity after a full cycle', () => {
      const schema = serializeLoanConfiguration(mockInputs);
      const deserialized = deserializeLoanConfiguration(schema);

      // Check a few key properties to ensure they match
      expect(deserialized.homePrice).toBe(mockInputs.homePrice);
      expect(deserialized.rate).toBe(mockInputs.rate);
      expect(deserialized.extras.length).toBe(mockInputs.extras.length);
      expect(deserialized.recastMonthsText).toBe(mockInputs.recastMonthsText);
      expect(deserialized.autoRecast).toBe(mockInputs.autoRecast);
    });
  });
});
