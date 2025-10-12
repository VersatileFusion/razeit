const axios = require('axios');
const readline = require('readline');

const API_URL = 'http://localhost:5000/api';

// Create readline interface for confirmation
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Admin credentials
let adminToken = '';

// Login as admin
async function loginAdmin() {
    try {
        console.log('🔐 Logging in as admin...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            login: 'admin@razeit.com',
            password: 'Admin123!',
            requireOtp: false
        });
        adminToken = response.data.token;
        console.log('✅ Admin logged in successfully\n');
        return true;
    } catch (error) {
        console.error('❌ Failed to login as admin:', error.response?.data || error.message);
        console.log('\n⚠️  Make sure you have run seed-data.js first to create the admin user');
        return false;
    }
}

// Get all services
async function getAllServices() {
    try {
        const response = await axios.get(`${API_URL}/services?limit=100`);
        return response.data.services || [];
    } catch (error) {
        console.error('❌ Failed to fetch services:', error.response?.data || error.message);
        return [];
    }
}

// Get all marketplace items
async function getAllMarketplaceItems() {
    try {
        const response = await axios.get(`${API_URL}/marketplace?limit=100`);
        return response.data.items || [];
    } catch (error) {
        console.error('❌ Failed to fetch marketplace items:', error.response?.data || error.message);
        return [];
    }
}

// Delete service
async function deleteService(serviceId) {
    try {
        await axios.delete(`${API_URL}/services/${serviceId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete service ${serviceId}:`, error.response?.data || error.message);
        return false;
    }
}

// Delete marketplace item
async function deleteMarketplaceItem(itemId) {
    try {
        await axios.delete(`${API_URL}/marketplace/${itemId}`, {
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        });
        return true;
    } catch (error) {
        console.error(`❌ Failed to delete item ${itemId}:`, error.response?.data || error.message);
        return false;
    }
}

// Clear all services
async function clearServices() {
    console.log('📦 Fetching all services...');
    const services = await getAllServices();
    
    if (services.length === 0) {
        console.log('✅ No services found');
        return;
    }
    
    console.log(`Found ${services.length} services`);
    let deletedCount = 0;
    
    for (const service of services) {
        const success = await deleteService(service._id);
        if (success) {
            console.log(`✅ Deleted: ${service.title}`);
            deletedCount++;
        }
    }
    
    console.log(`\n✨ Deleted ${deletedCount}/${services.length} services`);
}

// Clear all marketplace items
async function clearMarketplaceItems() {
    console.log('\n📦 Fetching all marketplace items...');
    const items = await getAllMarketplaceItems();
    
    if (items.length === 0) {
        console.log('✅ No marketplace items found');
        return;
    }
    
    console.log(`Found ${items.length} marketplace items`);
    let deletedCount = 0;
    
    for (const item of items) {
        const success = await deleteMarketplaceItem(item._id);
        if (success) {
            console.log(`✅ Deleted: ${item.title}`);
            deletedCount++;
        }
    }
    
    console.log(`\n✨ Deleted ${deletedCount}/${items.length} marketplace items`);
}

// Ask for confirmation
function askConfirmation() {
    return new Promise((resolve) => {
        rl.question('⚠️  Are you sure you want to delete ALL services and marketplace items? (yes/no): ', (answer) => {
            resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
    });
}

// Main function
async function clearDatabase() {
    console.log('🗑️  Database Cleanup Tool\n');
    console.log('⚠️  Make sure your server is running on http://localhost:5000\n');
    
    try {
        // Login as admin
        const loggedIn = await loginAdmin();
        if (!loggedIn) {
            rl.close();
            return;
        }
        
        // Ask for confirmation
        const confirmed = await askConfirmation();
        
        if (!confirmed) {
            console.log('\n❌ Operation cancelled');
            rl.close();
            return;
        }
        
        console.log('\n🗑️  Starting cleanup...\n');
        
        // Clear data
        await clearServices();
        await clearMarketplaceItems();
        
        console.log('\n🎉 Database cleanup completed!');
        
    } catch (error) {
        console.error('\n💥 Cleanup failed:', error.message);
    }
    
    rl.close();
}

// Run the cleanup
clearDatabase();

