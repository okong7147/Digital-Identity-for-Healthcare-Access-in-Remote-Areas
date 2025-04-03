import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity contract interactions
const mockProviders = new Map();
const mockProviderPrincipals = new Map();
let mockAdmin = 'admin-principal';

// Mock contract functions
const mockContractFunctions = {
  registerProvider: (providerId, name, specialty, licenseNumber) => {
    if (mockProviders.has(providerId)) {
      return { type: 'error', value: 403 };
    }
    
    mockProviders.set(providerId, {
      name,
      specialty,
      'license-number': licenseNumber,
      'is-verified': false,
      'created-at': Date.now(),
      'updated-at': Date.now()
    });
    
    mockProviderPrincipals.set('tx-sender', { 'provider-id': providerId });
    return { type: 'ok', value: true };
  },
  
  verifyProvider: (providerId, sender) => {
    if (sender !== mockAdmin) {
      return { type: 'error', value: 401 };
    }
    
    if (!mockProviders.has(providerId)) {
      return { type: 'error', value: 404 };
    }
    
    const provider = mockProviders.get(providerId);
    mockProviders.set(providerId, {
      ...provider,
      'is-verified': true,
      'updated-at': Date.now()
    });
    
    return { type: 'ok', value: true };
  },
  
  isVerifiedProvider: (providerId) => {
    if (!mockProviders.has(providerId)) {
      return { type: 'ok', value: false };
    }
    
    return { type: 'ok', value: mockProviders.get(providerId)['is-verified'] };
  },
  
  getProvider: (providerId) => {
    return mockProviders.get(providerId) || null;
  },
  
  getProviderIdByPrincipal: (owner) => {
    return mockProviderPrincipals.get(owner) || null;
  }
};

describe('Provider Verification Contract', () => {
  beforeEach(() => {
    // Clear mocks before each test
    mockProviders.clear();
    mockProviderPrincipals.clear();
  });
  
  it('should register a new provider', () => {
    const providerId = 'provider-123';
    const result = mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    expect(mockProviders.has(providerId)).toBe(true);
    
    const provider = mockProviders.get(providerId);
    expect(provider.name).toBe('Dr. Jane Smith');
    expect(provider.specialty).toBe('Cardiology');
    expect(provider['license-number']).toBe('MD12345');
    expect(provider['is-verified']).toBe(false);
  });
  
  it('should not register a provider with an existing ID', () => {
    // Register first provider
    const providerId = 'provider-123';
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    // Try to register another with the same ID
    const result = mockContractFunctions.registerProvider(
        providerId,
        'Dr. John Doe',
        'Neurology',
        'MD67890'
    );
    
    expect(result.type).toBe('error');
    expect(result.value).toBe(403);
  });
  
  it('should verify a provider when admin calls', () => {
    // Register provider
    const providerId = 'provider-123';
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    // Verify provider as admin
    const result = mockContractFunctions.verifyProvider(providerId, mockAdmin);
    
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
    
    const provider = mockProviders.get(providerId);
    expect(provider['is-verified']).toBe(true);
  });
  
  it('should not verify a provider when non-admin calls', () => {
    // Register provider
    const providerId = 'provider-123';
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    // Try to verify provider as non-admin
    const result = mockContractFunctions.verifyProvider(providerId, 'not-admin');
    
    expect(result.type).toBe('error');
    expect(result.value).toBe(401);
    
    const provider = mockProviders.get(providerId);
    expect(provider['is-verified']).toBe(false);
  });
  
  it('should check if a provider is verified', () => {
    // Register provider
    const providerId = 'provider-123';
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    // Check verification status (should be false initially)
    let result = mockContractFunctions.isVerifiedProvider(providerId);
    expect(result.type).toBe('ok');
    expect(result.value).toBe(false);
    
    // Verify provider
    mockContractFunctions.verifyProvider(providerId, mockAdmin);
    
    // Check verification status again (should be true now)
    result = mockContractFunctions.isVerifiedProvider(providerId);
    expect(result.type).toBe('ok');
    expect(result.value).toBe(true);
  });
  
  it('should retrieve provider information', () => {
    // Register provider
    const providerId = 'provider-123';
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    const provider = mockContractFunctions.getProvider(providerId);
    
    expect(provider).not.toBeNull();
    expect(provider.name).toBe('Dr. Jane Smith');
    expect(provider.specialty).toBe('Cardiology');
    expect(provider['license-number']).toBe('MD12345');
  });
  
  it('should retrieve provider ID by principal', () => {
    // Register provider
    const providerId = 'provider-123';
    const owner = 'owner-principal';
    
    mockContractFunctions.registerProvider(
        providerId,
        'Dr. Jane Smith',
        'Cardiology',
        'MD12345'
    );
    
    mockProviderPrincipals.set(owner, { 'provider-id': providerId });
    
    const result = mockContractFunctions.getProviderIdByPrincipal(owner);
    
    expect(result).not.toBeNull();
    expect(result['provider-id']).toBe(providerId);
  });
});
