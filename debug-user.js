/**
 * Debug User Script
 * Checks user data in database and fixes password hashing issues
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = 'mongodb+srv://erfanahmadvand52:SL9IpmJKT4T3lhVK@cluster0.hmm0pik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

// Import User model
const User = require('./models/User');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Check existing user
async function checkUser() {
    try {
        console.log('\n🔍 Checking existing test user...');
        
        const user = await User.findOne({ email: 'test@razeit.com' });
        
        if (!user) {
            console.log('❌ Test user not found in database');
            return null;
        }
        
        console.log('✅ Test user found:');
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password hash: ${user.password.substring(0, 20)}...`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Gems: ${user.gems}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Email Verified: ${user.isVerified.email}`);
        
        // Test password comparison
        const testPassword = 'Test123!';
        const isPasswordValid = await user.comparePassword(testPassword);
        console.log(`   Password valid: ${isPasswordValid}`);
        
        return user;
        
    } catch (error) {
        console.error('❌ Error checking user:', error);
        throw error;
    }
}

// Fix user password
async function fixUserPassword() {
    try {
        console.log('\n🔧 Fixing user password...');
        
        const user = await User.findOne({ email: 'test@razeit.com' });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }
        
        // Set the password directly - the pre-save hook will hash it
        user.password = 'Test123!';
        await user.save();
        
        console.log('✅ Password updated successfully');
        
        // Test the password
        const isPasswordValid = await user.comparePassword('Test123!');
        console.log(`   Password test: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
        
    } catch (error) {
        console.error('❌ Error fixing password:', error);
        throw error;
    }
}

// Create a fresh test user
async function createFreshTestUser() {
    try {
        console.log('\n🆕 Creating fresh test user...');
        
        // Delete existing test user
        await User.deleteOne({ email: 'test@razeit.com' });
        console.log('   Deleted existing test user');
        
        // Create new user with proper password handling
        const user = new User({
            email: 'test@razeit.com',
            username: 'testuser',
            password: 'Test123!', // This will be hashed by the pre-save hook
            firstName: 'Test',
            lastName: 'User',
            role: 'user',
            gems: 10000,
            isVerified: {
                email: true,
                phone: false
            },
            isActive: true
        });
        
        await user.save();
        console.log('✅ Fresh test user created');
        
        // Test the password
        const isPasswordValid = await user.comparePassword('Test123!');
        console.log(`   Password test: ${isPasswordValid ? '✅ Valid' : '❌ Invalid'}`);
        
        return user;
        
    } catch (error) {
        console.error('❌ Error creating fresh user:', error);
        throw error;
    }
}

// Test login
async function testLogin() {
    try {
        console.log('\n🧪 Testing login...');
        
        const user = await User.findOne({ email: 'test@razeit.com' });
        
        if (!user) {
            console.log('❌ User not found for login test');
            return;
        }
        
        const isPasswordValid = await user.comparePassword('Test123!');
        
        if (isPasswordValid) {
            console.log('✅ Login test successful!');
            console.log('   You can now login with:');
            console.log('   Email: test@razeit.com');
            console.log('   Password: Test123!');
        } else {
            console.log('❌ Login test failed - password invalid');
        }
        
    } catch (error) {
        console.error('❌ Error testing login:', error);
        throw error;
    }
}

// Main function
async function main() {
    console.log('🔧 Debugging test user login issue...\n');
    
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Check existing user
        const existingUser = await checkUser();
        
        if (existingUser) {
            // Try to fix the password
            await fixUserPassword();
        } else {
            // Create a fresh user
            await createFreshTestUser();
        }
        
        // Test login
        await testLogin();
        
        console.log('\n🎉 Debug completed!');
        
    } catch (error) {
        console.error('\n💥 Debug failed:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the script
main();
