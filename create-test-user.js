/**
 * Create Test User Script
 * Creates a test user in the database for testing purposes
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/razeit-gaming-platform';


const MONGODB_URI = 'mongodb+srv://erfanahmadvand52:SL9IpmJKT4T3lhVK@cluster0.hmm0pik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';



// Import User model
const User = require('./models/User');

// Test user configuration
const testUser = {
    email: 'test@razeit.com',
    username: 'testuser',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    gems: 10000, // Give them some gems to test with
    isVerified: {
        email: true,
        phone: false
    },
    isActive: true
};

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        throw error;
    }
}

// Create test user
async function createTestUser() {
    try {
        console.log('\n🔐 Creating test user...');
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { email: testUser.email },
                { username: testUser.username }
            ]
        });
        
        if (existingUser) {
            console.log('⚠️  Test user already exists!');
            console.log(`   Email: ${existingUser.email}`);
            console.log(`   Username: ${existingUser.username}`);
            console.log(`   Password: ${testUser.password}`);
            return existingUser;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(testUser.password, 10);
        
        // Create user
        const user = new User({
            ...testUser,
            password: hashedPassword
        });
        
        await user.save();
        console.log('✅ Test user created successfully!');
        console.log('\n📊 User Details:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Password: ${testUser.password}`);
        console.log(`   Role: ${testUser.role}`);
        console.log(`   Gems: ${testUser.gems}`);
        console.log(`   Verified: ${testUser.isVerified.email ? 'Yes' : 'No'}`);
        
        return user;
        
    } catch (error) {
        console.error('❌ Failed to create test user:', error);
        throw error;
    }
}

// Main function
async function main() {
    console.log('🌱 Creating test user for platform testing...\n');
    
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Create test user
        await createTestUser();
        
        console.log('\n🎉 Test user creation completed!');
        console.log('\n🔐 Login credentials:');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Password: ${testUser.password}`);
        console.log('\n🌐 You can now test the platform by logging in with these credentials.');
        
    } catch (error) {
        console.error('\n💥 Failed to create test user:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run the script
main();
