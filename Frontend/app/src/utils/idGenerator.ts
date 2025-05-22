/**
 * Utility functions for generating unique IDs for various entities
 */

/**
 * Generate a random alphanumeric string of specified length
 * @param length Length of the string to generate
 * @returns Random alphanumeric string
 */
export const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
};

/**
 * Generate a payment transaction ID
 * Format: TX-YYYYMMDD-XXXXX (where XXXXX is a random string)
 * @returns Unique transaction ID
 */
export const generateTransactionId = (): string => {
  const now = new Date();
  const datePart = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  return `TX-${datePart}-${generateRandomString(5).toUpperCase()}`;
};

/**
 * Generate an order ID
 * Format: ORD-YYYYMMDD-XXXXX (where XXXXX is a random string)
 * @returns Unique order ID
 */
export const generateOrderId = (): string => {
  const now = new Date();
  const datePart = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  return `ORD-${datePart}-${generateRandomString(5).toUpperCase()}`;
};

/**
 * Generate an invoice ID
 * Format: INV-YYYYMMDD-XXXXX (where XXXXX is a random string)
 * @returns Unique invoice ID
 */
export const generateInvoiceId = (): string => {
  const now = new Date();
  const datePart = now.getFullYear() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  
  return `INV-${datePart}-${generateRandomString(5).toUpperCase()}`;
};
