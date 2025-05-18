import attentionLogic from '../components/helpers/message_attention_logic';

describe('AttentionLogic', () => {
  // Setup and teardown
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset timer mocks
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test getTopicName
  test('getTopicName should return base topic in debug mode', () => {
    // Setup
    const sessionId = 'test-session';
    const debugMode = true;
    
    // Execute
    const result = attentionLogic.getTopicName(sessionId, debugMode);
    
    // Verify
    expect(result).toBe('attentions');
  });

  test('getTopicName should return session-specific topic in normal mode', () => {
    // Setup
    const sessionId = 'test-session';
    const debugMode = false;
    
    // Execute
    const result = attentionLogic.getTopicName(sessionId, debugMode);
    
    // Verify
    expect(result).toBe('attentions/test-session');
  });

  // Test extractAttentions
  test('extractAttentions should handle direct attentions array format', () => {
    // Setup
    const payload = [
      { id: 1, name: 'Attention 1', value: 'Value 1' },
      { id: 2, name: 'Attention 2', value: 'Value 2' }
    ];
    
    // Execute
    const result = attentionLogic.extractAttentions(payload);
    
    // Verify
    expect(result).toEqual(payload);
  });

  test('extractAttentions should handle attentions property format', () => {
    // Setup
    const attentions = [
      { id: 1, name: 'Attention 1', value: 'Value 1' },
      { id: 2, name: 'Attention 2', value: 'Value 2' }
    ];
    const payload = { attentions };
    
    // Execute
    const result = attentionLogic.extractAttentions(payload);
    
    // Verify
    expect(result).toEqual(attentions);
  });

  test('extractAttentions should handle single attention object format', () => {
    // Setup
    const payload = { id: 1, name: 'Attention 1', value: 'Value 1' };
    
    // Execute
    const result = attentionLogic.extractAttentions(payload);
    
    // Verify
    expect(result).toEqual([payload]);
  });

  test('extractAttentions should return empty array for invalid payload', () => {
    // Various invalid payloads
    expect(attentionLogic.extractAttentions({})).toEqual([]);
    expect(attentionLogic.extractAttentions(null)).toEqual([]);
    expect(attentionLogic.extractAttentions({ type: 'not-attention' })).toEqual([]);
  });

  // Test isValidAttention
  test('isValidAttention should identify valid attention objects', () => {
    // Setup
    const validAttention = { id: 1, name: 'Attention 1', value: 'Value 1' };
    const invalidAttention1 = { name: 'Attention 1', value: 'Value 1' }; // Missing id
    const invalidAttention2 = { id: 1, value: 'Value 1' }; // Missing name
    const invalidAttention3 = { id: 1, name: 'Attention 1' }; // Missing value
    
    // Execute & Verify
    expect(attentionLogic.isValidAttention(validAttention)).toBe(true);
    expect(attentionLogic.isValidAttention(invalidAttention1)).toBe(false);
    expect(attentionLogic.isValidAttention(invalidAttention2)).toBe(false);
    expect(attentionLogic.isValidAttention(invalidAttention3)).toBe(false);
    expect(attentionLogic.isValidAttention(null)).toBe(false);
  });

  // Test sortAttentions
  test('sortAttentions should sort by weight when available', () => {
    // Setup
    const attentions = [
      { id: 1, name: 'Attention 1', value: 'Value 1', weight: '0.5' },
      { id: 2, name: 'Attention 2', value: 'Value 2', weight: '0.8' },
      { id: 3, name: 'Attention 3', value: 'Value 3', weight: '0.2' }
    ];
    
    // Execute
    const result = attentionLogic.sortAttentions(attentions);
    
    // Verify - should be sorted by weight in descending order
    expect(result[0].id).toBe(2); // Highest weight (0.8)
    expect(result[1].id).toBe(1); // Middle weight (0.5)
    expect(result[2].id).toBe(3); // Lowest weight (0.2)
  });

  test('sortAttentions should fall back to sorting by id', () => {
    // Setup
    const attentions = [
      { id: 3, name: 'Attention 3', value: 'Value 3' },
      { id: 1, name: 'Attention 1', value: 'Value 1' },
      { id: 2, name: 'Attention 2', value: 'Value 2' }
    ];
    
    // Execute
    const result = attentionLogic.sortAttentions(attentions);
    
    // Verify - should be sorted by id in ascending order
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
    expect(result[2].id).toBe(3);
  });

  test('sortAttentions should handle invalid input', () => {
    expect(attentionLogic.sortAttentions(null)).toEqual([]);
    expect(attentionLogic.sortAttentions({})).toEqual([]);
    expect(attentionLogic.sortAttentions('not an array')).toEqual([]);
  });

  // Test filterAttentions
  test('filterAttentions should filter by property value', () => {
    // Setup
    const attentions = [
      { id: 1, name: 'Attention 1', value: 'Value 1', category: 'A' },
      { id: 2, name: 'Attention 2', value: 'Value 2', category: 'B' },
      { id: 3, name: 'Attention 3', value: 'Value 3', category: 'A' }
    ];
    
    // Execute
    const result = attentionLogic.filterAttentions(attentions, 'category', 'A');
    
    // Verify
    expect(result.length).toBe(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(3);
  });

  test('filterAttentions should handle invalid input', () => {
    expect(attentionLogic.filterAttentions(null, 'category', 'A')).toEqual([]);
    expect(attentionLogic.filterAttentions({}, 'category', 'A')).toEqual([]);
    expect(attentionLogic.filterAttentions('not an array', 'category', 'A')).toEqual([]);
  });

  // Test groupAttentions
  test('groupAttentions should group by property', () => {
    // Setup
    const attentions = [
      { id: 1, name: 'Attention 1', value: 'Value 1', category: 'A' },
      { id: 2, name: 'Attention 2', value: 'Value 2', category: 'B' },
      { id: 3, name: 'Attention 3', value: 'Value 3', category: 'A' }
    ];
    
    // Execute
    const result = attentionLogic.groupAttentions(attentions, 'category');
    
    // Verify
    expect(Object.keys(result).length).toBe(2);
    expect(result['A'].length).toBe(2);
    expect(result['B'].length).toBe(1);
    expect(result['A'][0].id).toBe(1);
    expect(result['A'][1].id).toBe(3);
    expect(result['B'][0].id).toBe(2);
  });

  test('groupAttentions should handle invalid input', () => {
    expect(attentionLogic.groupAttentions(null, 'category')).toEqual({});
    expect(attentionLogic.groupAttentions({}, 'category')).toEqual({});
    expect(attentionLogic.groupAttentions('not an array', 'category')).toEqual({});
  });

  // Test addAuthToWebSocketUrl
  test('addAuthToWebSocketUrl should add auth parameter to URL', () => {
    // Setup
    const url = 'ws://mqtt.agile-athletes.de:8765';
    const token = 'jwt-token-123';
    
    // Execute
    const result = attentionLogic.addAuthToWebSocketUrl(url, token);
    
    // Verify
    expect(result).toBe('ws://mqtt.agile-athletes.de:8765?auth=Bearer jwt-token-123');
  });

  test('addAuthToWebSocketUrl should handle URLs with existing parameters', () => {
    // Setup
    const url = 'ws://mqtt.agile-athletes.de:8765?param=value';
    const token = 'jwt-token-123';
    
    // Execute
    const result = attentionLogic.addAuthToWebSocketUrl(url, token);
    
    // Verify
    expect(result).toBe('ws://mqtt.agile-athletes.de:8765?param=value&auth=Bearer jwt-token-123');
  });

  test('addAuthToWebSocketUrl should handle invalid input', () => {
    expect(attentionLogic.addAuthToWebSocketUrl(null, 'token')).toBe('');
    expect(attentionLogic.addAuthToWebSocketUrl('', 'token')).toBe('');
  });

  // Test MQTT authentication with URL parameters (from memory)
  test('should handle MQTT authentication with URL parameters', () => {
    // This test verifies that our implementation correctly handles the MQTT authentication
    // issue mentioned in the memory, where WebSocket connections need to use URL parameters
    // instead of direct header setting due to CORS restrictions.
    
    // Setup
    const url = 'ws://mqtt.agile-athletes.de:8765';
    const token = 'jwt-token-123';
    
    // Execute
    const result = attentionLogic.addAuthToWebSocketUrl(url, token);
    
    // Verify
    expect(result).toBe('ws://mqtt.agile-athletes.de:8765?auth=Bearer jwt-token-123');
    
    // This matches the solution described in the memory:
    // "The solution is to pass the token as a URL parameter ('auth=Bearer {token}') in the WebSocket URL."
  });
});
