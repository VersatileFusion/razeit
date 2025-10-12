const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Demo user credentials that your employer can use
const demoUser = {
    email: 'demo@razeit.com',
    username: 'demo_player',
    password: 'Demo123!',
    firstName: 'Alex',
    lastName: 'Johnson',
    phone: '+1234567890',
    requireOtp: false
};

async function createDemoUser() {
    console.log('🎮 Creating Demo User for Razeit Platform');
    console.log('═══════════════════════════════════════════\n');
    
    try {
        // Step 1: Register the demo user
        console.log('📝 Step 1: Registering demo user...');
        const registerResponse = await axios.post(`${API_URL}/auth/register`, demoUser);
        
        if (!registerResponse.data.success) {
            throw new Error(registerResponse.data.message);
        }
        
        console.log('✅ Demo user registered successfully!');
        
        // Step 2: Login to get token
        console.log('\n🔑 Step 2: Logging in...');
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            login: demoUser.email,
            password: demoUser.password,
            requireOtp: false
        });
        
        if (!loginResponse.data.success) {
            throw new Error(loginResponse.data.message);
        }
        
        const token = loginResponse.data.token;
        const userId = loginResponse.data.user.id;
        console.log('✅ Login successful!');
        console.log(`👤 User ID: ${userId}`);
        
        // Step 3: Update user profile with additional data
        console.log('\n📊 Step 3: Enriching user profile...');
        
        // We'll use MongoDB directly to add statistics since there's no API endpoint for it
        // This simulates a real user who has been using the platform
        const mongoose = require('mongoose');
        const User = require('./models/User');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/razeit-gaming-platform');
        
        // Update the user with rich statistics
        await User.findByIdAndUpdate(userId, {
            gems: 15000,
            'wallet.balance': 250.50,
            'wallet.currency': 'USD',
            'statistics.totalSpent': 1250.00,
            'statistics.totalEarned': 890.00,
            'statistics.itemsPurchased': 12,
            'statistics.itemsSold': 8,
            'statistics.loginCount': 45,
            'statistics.lastLogin': new Date(),
            'isVerified.email': true,
            lastSeen: new Date()
        });
        
        console.log('✅ User profile enriched with statistics!');
        
        // Close MongoDB connection
        await mongoose.connection.close();
        
        // Success Summary
        console.log('\n╔════════════════════════════════════════════╗');
        console.log('║  🎉 DEMO USER CREATED SUCCESSFULLY! 🎉    ║');
        console.log('╚════════════════════════════════════════════╝\n');
        
        console.log('📋 LOGIN CREDENTIALS:');
        console.log('┌────────────────────────────────────────┐');
        console.log('│  Email/Username: demo@razeit.com       │');
        console.log('│          or      demo_player           │');
        console.log('│  Password:       Demo123!              │');
        console.log('└────────────────────────────────────────┘\n');
        
        console.log('👤 USER PROFILE:');
        console.log(`   Name: ${demoUser.firstName} ${demoUser.lastName}`);
        console.log(`   Username: ${demoUser.username}`);
        console.log(`   Gems: 15,000 💎`);
        console.log(`   Wallet: $250.50 💰`);
        console.log(`   Items Purchased: 12 📦`);
        console.log(`   Items Sold: 8 ✅`);
        console.log(`   Total Spent: $1,250.00`);
        console.log(`   Total Earned: $890.00`);
        console.log(`   Login Count: 45 times\n`);
        
        console.log('🌐 ACCESS URLS:');
        console.log('   Login Page:    http://localhost:5000/en/signin.html');
        console.log('   Dashboard:     http://localhost:5000/en/dashboard.html');
        console.log('   Profile:       http://localhost:5000/en/profile.html');
        console.log('   Marketplace:   http://localhost:5000/en/marketplace.html');
        console.log('   Services:      http://localhost:5000/en/service.html\n');
        
        console.log('💡 TIP: Use these credentials to login and showcase the platform!');
        console.log('═══════════════════════════════════════════════════════════════\n');
        
    } catch (error) {
        console.error('\n❌ ERROR CREATING DEMO USER:\n');
        
        if (error.response) {
            console.error('Server Response:', error.response.data);
            
            // Check if user already exists
            if (error.response.data.message?.includes('already exists')) {
                console.log('\n⚠️  Demo user already exists!\n');
                console.log('📋 LOGIN CREDENTIALS:');
                console.log('┌────────────────────────────────────────┐');
                console.log('│  Email/Username: demo@razeit.com       │');
                console.log('│          or      demo_player           │');
                console.log('│  Password:       Demo123!              │');
                console.log('└────────────────────────────────────────┘\n');
                console.log('🌐 Login at: http://localhost:5000/en/signin.html\n');
                return;
            }
        } else {
            console.error('Error:', error.message);
        }
        
        console.log('\n💡 TROUBLESHOOTING:');
        console.log('   1. Make sure your server is running: npm run dev');
        console.log('   2. Check MongoDB is connected');
        console.log('   3. Verify .env file is configured correctly');
        console.log('   4. Check if port 5000 is available\n');
    }
}

// Run the script
createDemoUser();

