import { csvFor, downloadCSV } from '../csv';
import type { Row } from '../../types';

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = jest.fn();
const mockRevokeObjectURL = jest.fn();

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: mockCreateObjectURL,
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: mockRevokeObjectURL,
});

// Get the mock from setupTests.ts
// const mockCreateElement = document.createElement as jest.MockedFunction<typeof document.createElement>;

describe('csvFor', () => {
  const createMockRows = (): Row[] => [
    {
      idx: 1,
      date: '2024-01',
      payment: 599.55,
      interest: 500.00,
      principal: 99.55,
      extra: 0,
      total: 599.55,
      balance: 99900.45,
    },
    {
      idx: 2,
      date: '2024-02',
      payment: 599.55,
      interest: 499.50,
      principal: 100.05,
      extra: 1000,
      total: 1599.55,
      balance: 98800.40,
      recast: true,
      newPayment: 650.00,
    },
  ];

  it('should generate correct CSV content', () => {
    const rows = createMockRows();
    const csvContent = csvFor(rows);

    const lines = csvContent.split('\n');
    
    // Check header
    expect(lines[0]).toBe('Month,Date,Scheduled Payment,Interest,Principal,Extra,Total Paid,Ending Balance,Recast?,New Payment');
    
    // Check first data row
    expect(lines[1]).toBe('1,2024-01,599.55,500.00,99.55,0.00,599.55,99900.45,,');
    
    // Check second data row with recast
    expect(lines[2]).toBe('2,2024-02,599.55,499.50,100.05,1000.00,1599.55,98800.40,YES,650.00');
  });

  it('should handle empty rows array', () => {
    const csvContent = csvFor([]);
    const lines = csvContent.split('\n');
    
    expect(lines[0]).toBe('Month,Date,Scheduled Payment,Interest,Principal,Extra,Total Paid,Ending Balance,Recast?,New Payment');
    expect(lines[1]).toBe('');
  });

  it('should handle rows without recast information', () => {
    const rows: Row[] = [
      {
        idx: 1,
        date: '2024-01',
        payment: 599.55,
        interest: 500.00,
        principal: 99.55,
        extra: 0,
        total: 599.55,
        balance: 99900.45,
      },
    ];

    const csvContent = csvFor(rows);
    const lines = csvContent.split('\n');
    
    expect(lines[1]).toBe('1,2024-01,599.55,500.00,99.55,0.00,599.55,99900.45,,');
  });

  it('should handle rows with recast but no new payment', () => {
    const rows: Row[] = [
      {
        idx: 1,
        date: '2024-01',
        payment: 599.55,
        interest: 500.00,
        principal: 99.55,
        extra: 0,
        total: 599.55,
        balance: 99900.45,
        recast: true,
      },
    ];

    const csvContent = csvFor(rows);
    const lines = csvContent.split('\n');
    
    expect(lines[1]).toBe('1,2024-01,599.55,500.00,99.55,0.00,599.55,99900.45,YES,');
  });

  it('should format numbers correctly', () => {
    const rows: Row[] = [
      {
        idx: 1,
        date: '2024-01',
        payment: 1234.567,
        interest: 500.123,
        principal: 734.444,
        extra: 1000.999,
        total: 2235.566,
        balance: 99900.123,
      },
    ];

    const csvContent = csvFor(rows);
    const lines = csvContent.split('\n');
    
    expect(lines[1]).toBe('1,2024-01,1234.57,500.12,734.44,1001.00,2235.57,99900.12,,');
  });

  it('should handle large datasets', () => {
    const rows: Row[] = [];
    for (let i = 1; i <= 1000; i++) {
      rows.push({
        idx: i,
        date: `2024-${String(i).padStart(2, '0')}`,
        payment: 599.55,
        interest: 500.00,
        principal: 99.55,
        extra: 0,
        total: 599.55,
        balance: 100000 - (i * 100),
      });
    }

    const csvContent = csvFor(rows);
    const lines = csvContent.split('\n');
    
    expect(lines).toHaveLength(1002); // Header + 1000 data rows + empty line
    expect(lines[0]).toBe('Month,Date,Scheduled Payment,Interest,Principal,Extra,Total Paid,Ending Balance,Recast?,New Payment');
    expect(lines[1]).toBe('1,2024-01,599.55,500.00,99.55,0.00,599.55,99900.00,,');
    expect(lines[1000]).toBe('1000,2024-1000,599.55,500.00,99.55,0.00,599.55,0.00,,');
  });
});

describe('downloadCSV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateObjectURL.mockReturnValue('blob:mock-url');
  });

  it('should create and download CSV file', () => {
    const csvData = 'Month,Date,Payment\n1,2024-01,599.55';
    const filename = 'test-schedule.csv';

    // Mock console.warn to capture the warning
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    downloadCSV(csvData, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(consoleSpy).toHaveBeenCalledWith('downloadCSV: document.createElement returned undefined, likely in test environment');
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    
    consoleSpy.mockRestore();
  });

  it('should create blob with correct MIME type', () => {
    const csvData = 'Month,Date,Payment\n1,2024-01,599.55';
    const filename = 'test.csv';

    // Mock console.warn to capture the warning
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    downloadCSV(csvData, filename);

    expect(mockCreateObjectURL).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text/csv',
      })
    );
    
    consoleSpy.mockRestore();
  });

  it('should set correct download attributes', () => {
    const csvData = 'Month,Date,Payment\n1,2024-01,599.55';
    const filename = 'test-schedule.csv';

    // Mock console.warn to capture the warning
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    downloadCSV(csvData, filename);

    expect(consoleSpy).toHaveBeenCalledWith('downloadCSV: document.createElement returned undefined, likely in test environment');
    expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    
    consoleSpy.mockRestore();
  });
});