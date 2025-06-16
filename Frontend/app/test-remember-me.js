/**
 * Test script to verify Remember Me functionality
 * Run this in browser console to test token expiration logic
 */

// Helper function to get token from storage (copied from authService)
const getTokenFromStorage = (key) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    // Try to parse as JSON (new format)
    try {
      const tokenData = JSON.parse(stored);
      if (tokenData.token && tokenData.expiration) {
        // Check if token has expired based on our custom expiration
        if (Date.now() > tokenData.expiration) {
          console.log(`Token expired (custom expiration), removing from storage`);
          localStorage.removeItem(key);
          return null;
        }
        return tokenData.token;
      }
    } catch {
      // Not JSON, assume old string format
      return stored;
    }
    
    return stored;
  } catch (error) {
    console.error(`Error getting token from ${key}:`, error);
    return null;
  }
};

// Test function to simulate remember me storage
const testRememberMe = () => {
  console.log('=== Testing Remember Me Functionality ===');
  
  // Test 1: Store token with Remember Me = true (7 days)
  const rememberMeToken = {
    token: 'test-token-remember-me',
    expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    rememberMe: true
  };
  
  localStorage.setItem('test_access_token_remember', JSON.stringify(rememberMeToken));
  console.log('✓ Stored token with Remember Me (7 days)');
  console.log('Token expires at:', new Date(rememberMeToken.expiration).toISOString());
  
  // Test 2: Store token with Remember Me = false (1 day)  
  const normalToken = {
    token: 'test-token-normal',
    expiration: Date.now() + (24 * 60 * 60 * 1000), // 1 day
    rememberMe: false
  };
  
  localStorage.setItem('test_access_token_normal', JSON.stringify(normalToken));
  console.log('✓ Stored token without Remember Me (1 day)');
  console.log('Token expires at:', new Date(normalToken.expiration).toISOString());
  
  // Test 3: Store expired token
  const expiredToken = {
    token: 'test-token-expired',
    expiration: Date.now() - 1000, // 1 second ago
    rememberMe: false
  };
  
  localStorage.setItem('test_access_token_expired', JSON.stringify(expiredToken));
  console.log('✓ Stored expired token');
  
  // Test retrieving tokens
  console.log('\n=== Retrieving Tokens ===');
  
  const retrievedRememberMe = getTokenFromStorage('test_access_token_remember');
  console.log('Remember Me token:', retrievedRememberMe ? '✓ Valid' : '✗ Invalid/Expired');
  
  const retrievedNormal = getTokenFromStorage('test_access_token_normal');
  console.log('Normal token:', retrievedNormal ? '✓ Valid' : '✗ Invalid/Expired');
  
  const retrievedExpired = getTokenFromStorage('test_access_token_expired');
  console.log('Expired token:', retrievedExpired ? '✓ Valid' : '✗ Invalid/Expired (Expected)');
  
  // Test 4: Store user info with expiration
  const userInfoWithExpiration = {
    userId: 'test-user-123',
    companyId: 'test-company-456', 
    email: 'test@example.com',
    role: 'admin',
    status: 'active',
    firstName: 'Test',
    lastName: 'User',
    expiration: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    rememberMe: true
  };
  
  localStorage.setItem('test_user_info', JSON.stringify(userInfoWithExpiration));
  console.log('✓ Stored user info with expiration');
  
  // Cleanup
  console.log('\n=== Cleanup ===');
  localStorage.removeItem('test_access_token_remember');
  localStorage.removeItem('test_access_token_normal');
  localStorage.removeItem('test_access_token_expired');
  localStorage.removeItem('test_user_info');
  console.log('✓ Cleaned up test data');
  
  console.log('\n=== Test Complete ===');
  console.log('The Remember Me functionality should work as follows:');
  console.log('- When Remember Me is checked: Token expires in 7 days');
  console.log('- When Remember Me is unchecked: Token expires in 1 day');
  console.log('- Expired tokens are automatically removed from storage');
};

// Run the test
testRememberMe();
