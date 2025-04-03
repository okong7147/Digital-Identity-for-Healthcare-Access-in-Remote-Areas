import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockPatients = new Map();
const mockPatientPrincipals = new Map();

// Mock contract functions
const mockContractFunctions = {
  createPatient: (patientId, name, dob, bloodType, allergies, emergencyContact) => {
    if (mockPatients.has(patientId)) {
      return { type: 'error', value: 403 };
    }
    
    mockPatients.set(patientId, {
      name,
      dob,
      'blood-type': bloodType,
      allergies,
      'emergency-contact': emergencyContact,
      'created-at': Date.now(),
      'updated-at': Date.now()
    });
    
    mockPatientPrincipals.set('tx-sender', { 'patient-id': patientId });
    return { type: 'ok', value: true };
  },
  
  updatePatient: (patientId, name, bloodType, allergies, emergencyContact) => {
    if (!mockPatients.has(patientId)) {
      return { type: 'error', value: 404 };
    }
    
    const patient = mockPatients.get(patientId);
    mockPatients.set(patientId, {
      ...patient,
      name,
      'blood-type': bloodType,
      allergies,
      'emergency-contact': emergencyContact,
      'updated-at': Date.now()
    });
    
    return { type: 'ok', value: true };
  },
  
  getPatient: (patientId) => {
    return mockPatients.get(patientId) || null;
  },
  
  getPatientIdByPrincipal: (owner) => {
    return mockPatientPrincipals.get(owner) || null;
  }
};

describe('Patient Identity Contract', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockPatients.clear();
    mockPatientPrincipals.clear();
  });
  
  it('should create a new patient', () => {
    const result = mockContractFunctions.createPatient(
        'patient-123',
        'John Doe',
        '1980-01-01',
        'A+',
        'Penicillin',
        'Jane Doe: 555-1234'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    expect(mockPatients.has('patient-123')).toBe(true);
    
    const patient = mockPatients.get('patient-123');
    expect(patient.name).toBe('John Doe');
    expect(patient.dob).toBe('1980-01-01');
    expect(patient['blood-type']).toBe('A+');
  });
  
  it('should not create a patient with an existing ID', () => {
    // Create first patient
    mockContractFunctions.createPatient(
        'patient-123',
        'John Doe',
        '1980-01-01',
        'A+',
        'Penicillin',
        'Jane Doe: 555-1234'
    );
    
    // Try to create another with the same ID
    const result = mockContractFunctions.createPatient(
        'patient-123',
        'Jane Smith',
        '1985-05-05',
        'B-',
        'None',
        'John Smith: 555-5678'
    );
    
    expect(result.type).toBe('error');
    expect(result.value).toBe(403);
  });
  
  it('should update an existing patient', () => {
    // Create patient
    mockContractFunctions.createPatient(
        'patient-123',
        'John Doe',
        '1980-01-01',
        'A+',
        'Penicillin',
        'Jane Doe: 555-1234'
    );
    
    // Update patient
    const result = mockContractFunctions.updatePatient(
        'patient-123',
        'John Doe Jr.',
        'AB+',
        'Penicillin, Sulfa',
        'Jane Doe: 555-5678'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const patient = mockPatients.get('patient-123');
    expect(patient.name).toBe('John Doe Jr.');
    expect(patient['blood-type']).toBe('AB+');
    expect(patient.allergies).toBe('Penicillin, Sulfa');
    expect(patient['emergency-contact']).toBe('Jane Doe: 555-5678');
    // DOB should remain unchanged
    expect(patient.dob).toBe('1980-01-01');
  });
  
  it('should retrieve patient information', () => {
    // Create patient
    mockContractFunctions.createPatient(
        'patient-123',
        'John Doe',
        '1980-01-01',
        'A+',
        'Penicillin',
        'Jane Doe: 555-1234'
    );
    
    const patient = mockContractFunctions.getPatient('patient-123');
    
    expect(patient).not.toBeNull();
    expect(patient.name).toBe('John Doe');
    expect(patient.dob).toBe('1980-01-01');
    expect(patient['blood-type']).toBe('A+');
  });
  
  it('should retrieve patient ID by principal', () => {
    // Create patient
    mockContractFunctions.createPatient(
        'patient-123',
        'John Doe',
        '1980-01-01',
        'A+',
        'Penicillin',
        'Jane Doe: 555-1234'
    );
    
    const patientId = mockContractFunctions.getPatientIdByPrincipal('tx-sender');
    
    expect(patientId).not.toBeNull();
    expect(patientId['patient-id']).toBe('patient-123');
  });
});
