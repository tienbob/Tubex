const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

const testSuppliers = [
  {
    email: 'supplier1@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Smith',
    companyName: 'ABC Electronics Supplier',
    companyType: 'supplier',
    role: 'admin',
    businessLicense: 'BL001',
    taxId: 'TAX001',
    address: {
      street: '123 Industrial Ave',
      city: 'Ho Chi Minh City',
      province: 'Ho Chi Minh',
      postalCode: '70000'
    },
    businessCategory: 'Electronics',
    employeeCount: 50,
    yearEstablished: 2020,
    contactPhone: '+84123456789'
  },
  {
    email: 'supplier2@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Doe',
    companyName: 'XYZ Manufacturing Co.',
    companyType: 'supplier',
    role: 'admin',
    businessLicense: 'BL002',
    taxId: 'TAX002',
    address: {
      street: '456 Factory Street',
      city: 'Hanoi',
      province: 'Hanoi',
      postalCode: '10000'
    },
    businessCategory: 'Manufacturing',
    employeeCount: 100,
    yearEstablished: 2018,
    contactPhone: '+84987654321'
  },
  {
    email: 'supplier3@example.com',
    password: 'password123',
    firstName: 'Mike',
    lastName: 'Johnson',
    companyName: 'Tech Components Ltd',
    companyType: 'supplier',
    role: 'admin',
    businessLicense: 'BL003',
    taxId: 'TAX003',
    address: {
      street: '789 Tech Park',
      city: 'Da Nang',
      province: 'Da Nang',
      postalCode: '50000'
    },
    businessCategory: 'Technology',
    employeeCount: 25,
    yearEstablished: 2021,
    contactPhone: '+84555444333'
  }
];

async function createSuppliers() {
  console.log('Creating test suppliers...');
  
  for (const supplier of testSuppliers) {
    try {
      console.log(`Creating supplier: ${supplier.companyName}`);
      
      const response = await axios.post(`${API_BASE_URL}/auth/register`, supplier);
      
      console.log(`✅ Successfully created: ${supplier.companyName}`);
      console.log(`   Email: ${supplier.email}`);
      console.log(`   Company ID: ${response.data.data?.companyId || 'Not available'}`);
      
    } catch (error) {
      console.error(`❌ Failed to create ${supplier.companyName}:`);
      console.error(`   Error: ${error.response?.data?.message || error.message}`);
    }
    
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Finished creating test suppliers!');
  console.log('Note: These companies will be in "pending_verification" status.');
  console.log('You may need to verify them through the admin panel or database.');
}

// Run the script
createSuppliers().catch(console.error);
