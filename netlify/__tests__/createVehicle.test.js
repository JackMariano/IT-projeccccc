// netlify/__tests__/createVehicle.test.js
import { handler } from '../functions/createVehicle';
import { neon } from '@neondatabase/serverless';

const mockSql = jest.fn(); // Mock the function returned by neon()
jest.mock('@neondatabase/serverless', () => ({
  neon: jest.fn(() => mockSql), // neon() returns mockSql
}));

describe('createVehicle', () => {
  // Clear all mocks and reset default implementation before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockSql.mockImplementation((query, ...params) => {
      return [{
        vehicle_id: 'mock-vehicle-id',
        brand: params[0],
        model: params[1],
        plate_number: params[2],
        vehicle_type: params[3],
        status: params[4],
        archived: false,
      }];
    });
  });

  it('should create a new vehicle successfully', async () => {
    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        brand: 'Toyota',
        model: 'Camry',
        plate_number: 'ABC-123',
        vehicle_type: 'Sedan',
        status: 'available',
      }),
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toEqual(expect.objectContaining({
      vehicle_id: 'mock-vehicle-id',
      brand: 'Toyota',
      model: 'Camry',
      plate_number: 'ABC-123',
      vehicle_type: 'Sedan',
      status: 'available',
    }));
    // Ensure neon() and the sql function were called
    expect(neon).toHaveBeenCalledTimes(1);
    expect(neon()).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO vehicle'));
  });

  it('should return 405 for non-POST methods', async () => {
    const mockEvent = {
      httpMethod: 'GET', // Incorrect method
      body: JSON.stringify({
        brand: 'Toyota',
        model: 'Camry',
        plate_number: 'ABC-123',
        vehicle_type: 'Sedan',
        status: 'available',
      }),
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(405);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Method not allowed');
  });

  it('should return 500 if database operation fails', async () => {
    // Make the mock SQL function throw an error
    neon.mockImplementationOnce(() => {
      const sql = jest.fn(() => {
        throw new Error('Database connection failed');
      });
      return sql;
    });

    const mockEvent = {
      httpMethod: 'POST',
      body: JSON.stringify({
        brand: 'Toyota',
        model: 'Camry',
        plate_number: 'ABC-123',
        vehicle_type: 'Sedan',
        status: 'available',
      }),
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.error).toBe('Failed to create vehicle');
    expect(body.details).toBe('Database connection failed');
  });
});
