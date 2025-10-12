/**
 * Direct MongoDB Seeding Script
 * This bypasses the API and inserts data directly into MongoDB
 * Use this if you have email configuration issues
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/razeit-gaming-platform';

// Import models
const User = require('./models/User');
const Service = require('./models/Service');
const MarketplaceItem = require('./models/MarketplaceItem');

// Sample data
const services = [
    {
        title: "CS:GO Rank Boosting - Silver to Gold Nova",
        description: "Professional CS:GO rank boosting service. We'll boost your account from Silver to Gold Nova ranks safely and quickly. Our professional players will play on your account using VPN protection.",
        category: "boosting",
        game: "Counter-Strike: Global Offensive",
        price: {
            gems: 5000,
            usd: 49.99,
            rial: 2100000
        },
        duration: "one-time",
        estimatedTime: "3-7 days",
        status: "active",
        requirements: [
            "Silver rank account",
            "Account credentials",
            "Email access for verification",
            "Steam Guard disabled temporarily"
        ],
        deliverables: [
            "Gold Nova rank achievement",
            "Win rate improvement",
            "Screenshot proof of rank",
            "24/7 progress updates"
        ],
        tags: ["csgo", "boosting", "rank", "competitive"],
        rating: {
            average: 4.8,
            count: 24
        }
    },
    {
        title: "Dota 2 Pro Coaching - 1-on-1 Sessions",
        description: "Learn from Immortal rank players! Get personalized coaching sessions covering mechanics, strategy, hero mastery, and game sense. Perfect for players looking to climb the ranked ladder.",
        category: "coaching",
        game: "Dota 2",
        price: {
            gems: 3000,
            usd: 29.99,
            rial: 1260000
        },
        duration: "hourly",
        estimatedTime: "1 hour per session",
        status: "active",
        requirements: [
            "Dota 2 account",
            "Discord for voice communication",
            "Willingness to learn",
            "Replay files (optional)"
        ],
        deliverables: [
            "1 hour personalized coaching",
            "Replay analysis",
            "Custom practice plan",
            "Follow-up notes and tips"
        ],
        tags: ["dota2", "coaching", "lessons", "pro"],
        rating: {
            average: 4.9,
            count: 18
        }
    },
    {
        title: "Rust Base Building Service",
        description: "Expert Rust base builders will create an optimized, raid-proof base for you. We specialize in honeycomb designs, bunker bases, and efficient farming layouts.",
        category: "other",
        game: "Rust",
        price: {
            gems: 4500,
            usd: 44.99,
            rial: 1890000
        },
        duration: "one-time",
        estimatedTime: "2-4 hours",
        status: "active",
        requirements: [
            "Server access",
            "Required building materials",
            "Preferred location marked",
            "Base size specifications"
        ],
        deliverables: [
            "Fully built optimized base",
            "Base blueprint/design document",
            "Defense strategy guide",
            "Upgrade path recommendations"
        ],
        tags: ["rust", "building", "base", "design"],
        rating: {
            average: 4.7,
            count: 31
        }
    },
    {
        title: "TF2 Trading & Item Consulting",
        description: "Professional TF2 trading consultant will help you build your inventory, find good deals, and make profitable trades. Perfect for new traders and collectors.",
        category: "coaching",
        game: "Team Fortress 2",
        price: {
            gems: 2000,
            usd: 19.99,
            rial: 840000
        },
        duration: "weekly",
        estimatedTime: "Ongoing support",
        status: "active",
        requirements: [
            "Steam account with TF2",
            "Basic understanding of trading",
            "Discord for communication",
            "Current inventory overview"
        ],
        deliverables: [
            "Weekly trading advice",
            "Market analysis",
            "Price checking service",
            "Trade opportunity alerts"
        ],
        tags: ["tf2", "trading", "items", "consulting"],
        rating: {
            average: 4.6,
            count: 12
        }
    },
    {
        title: "CS:GO Prime Account - High Trust Factor",
        description: "Pre-leveled CS:GO Prime account with high trust factor and clean record. Perfect for players wanting a fresh start or smurf account. All accounts verified and secure.",
        category: "account",
        game: "Counter-Strike: Global Offensive",
        price: {
            gems: 8000,
            usd: 79.99,
            rial: 3360000
        },
        duration: "one-time",
        estimatedTime: "Instant delivery",
        status: "active",
        requirements: [
            "Email address for account transfer",
            "Secure payment method",
            "Agreement to terms of service"
        ],
        deliverables: [
            "Full account access",
            "Prime status activated",
            "High trust factor",
            "Level 21+ profile",
            "Lifetime warranty"
        ],
        tags: ["csgo", "account", "prime", "trusted"],
        rating: {
            average: 4.9,
            count: 45
        }
    }
];

const marketplaceItems = [
    {
        title: "CS:GO AK-47 | Fire Serpent (Field-Tested)",
        description: "Rare and highly sought-after AK-47 Fire Serpent skin in Field-Tested condition. This iconic skin features a fierce red dragon design. Perfect for collectors and players alike.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "weapon",
        rarity: "legendary",
        condition: "field-tested",
        status: "active",
        price: {
            gems: 45000,
            usd: 449.99,
            rial: 18900000
        },
        steamItemId: "AK47_FIRE_SERPENT_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/AK-47%20%7C%20Fire%20Serpent%20%28Field-Tested%29",
        tags: ["csgo", "ak47", "fire serpent", "covert"],
        views: 245
    },
    {
        title: "CS:GO Karambit | Fade (Factory New)",
        description: "Beautiful Karambit Fade knife in Factory New condition. Features a stunning gradient fade pattern. One of the most prestigious knives in CS:GO.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "knife",
        rarity: "mythic",
        condition: "factory-new",
        status: "active",
        price: {
            gems: 120000,
            usd: 1199.99,
            rial: 50400000
        },
        steamItemId: "KARAMBIT_FADE_FN",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Karambit%20%7C%20Fade%20%28Factory%20New%29",
        tags: ["csgo", "knife", "karambit", "fade"],
        views: 512
    },
    {
        title: "Dota 2 - Dragonclaw Hook (Immortal)",
        description: "Extremely rare Dragonclaw Hook for Pudge. This immortal item is one of the most valuable items in Dota 2. Perfect condition, never duped.",
        category: "dota2",
        game: "Dota 2",
        itemType: "weapon",
        rarity: "mythic",
        status: "active",
        price: {
            gems: 95000,
            usd: 949.99,
            rial: 39900000
        },
        steamMarketUrl: "https://steamcommunity.com/market/listings/570/Dragonclaw%20Hook",
        tags: ["dota2", "immortal", "pudge", "hook"],
        views: 387
    },
    {
        title: "CS:GO AWP | Dragon Lore (Minimal Wear)",
        description: "The legendary AWP Dragon Lore in Minimal Wear condition. Features intricate dragon artwork. One of the most iconic and expensive skins in CS:GO.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "weapon",
        rarity: "legendary",
        condition: "minimal-wear",
        status: "active",
        price: {
            gems: 250000,
            usd: 2499.99,
            rial: 105000000
        },
        steamItemId: "AWP_DLORE_MW",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/AWP%20%7C%20Dragon%20Lore%20%28Minimal%20Wear%29",
        tags: ["csgo", "awp", "dragon lore", "dlore"],
        views: 892
    },
    {
        title: "CS:GO M4A4 | Howl (Field-Tested)",
        description: "Contraband M4A4 Howl skin in Field-Tested condition. This skin was removed from the game, making it extremely rare and valuable. Features a unique howling wolf design.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "weapon",
        rarity: "legendary",
        condition: "field-tested",
        status: "active",
        price: {
            gems: 65000,
            usd: 649.99,
            rial: 27300000
        },
        steamItemId: "M4A4_HOWL_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/M4A4%20%7C%20Howl%20%28Field-Tested%29",
        tags: ["csgo", "m4a4", "howl", "contraband"],
        views: 634
    },
    {
        title: "TF2 Unusual Burning Flames Team Captain",
        description: "Extremely rare Unusual Team Captain hat with Burning Flames effect. One of the most prestigious items in Team Fortress 2. All-class item.",
        category: "tf2",
        game: "Team Fortress 2",
        itemType: "other",
        rarity: "mythic",
        status: "active",
        price: {
            gems: 85000,
            usd: 849.99,
            rial: 35700000
        },
        steamMarketUrl: "https://backpack.tf/stats/Unusual/Team%20Captain/Tradable/Craftable/13",
        tags: ["tf2", "unusual", "team captain", "burning flames"],
        views: 421
    },
    {
        title: "CS:GO Butterfly Knife | Doppler Phase 2",
        description: "Beautiful Butterfly Knife with Doppler Phase 2 pattern in Factory New condition. Features pink and blue colors. Very popular knife skin.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "knife",
        rarity: "epic",
        condition: "factory-new",
        status: "active",
        price: {
            gems: 42000,
            usd: 419.99,
            rial: 17640000
        },
        steamItemId: "BUTTERFLY_DOPPLER_P2",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Butterfly%20Knife%20%7C%20Doppler%20%28Factory%20New%29",
        tags: ["csgo", "knife", "butterfly", "doppler"],
        views: 298
    },
    {
        title: "Dota 2 Arcana Bundle - 5 Arcanas",
        description: "Bundle of 5 Dota 2 Arcana items including Juggernaut, Phantom Assassin, Legion Commander, Shadow Fiend, and Techies. Save 20% compared to buying individually.",
        category: "dota2",
        game: "Dota 2",
        itemType: "other",
        rarity: "legendary",
        status: "active",
        price: {
            gems: 35000,
            usd: 349.99,
            rial: 14700000
        },
        tags: ["dota2", "arcana", "bundle", "discount"],
        views: 567
    },
    {
        title: "CS:GO Gloves | Crimson Weave (Field-Tested)",
        description: "Sport Gloves Crimson Weave in Field-Tested condition. Features a deep red woven pattern. Highly desirable gloves that match many red-themed loadouts.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "glove",
        rarity: "epic",
        condition: "field-tested",
        status: "active",
        price: {
            gems: 28000,
            usd: 279.99,
            rial: 11760000
        },
        steamItemId: "GLOVES_CRIMSON_WEAVE_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Sport%20Gloves%20%7C%20Crimson%20Weave%20%28Field-Tested%29",
        tags: ["csgo", "gloves", "crimson weave", "sport"],
        views: 189
    },
    {
        title: "Rust - Tempered AK47 Skin",
        description: "Premium Tempered AK47 skin for Rust. Features a battle-worn metallic finish. One of the most popular weapon skins in Rust.",
        category: "rust",
        game: "Rust",
        itemType: "skin",
        rarity: "rare",
        status: "active",
        price: {
            gems: 2500,
            usd: 24.99,
            rial: 1050000
        },
        tags: ["rust", "ak47", "skin", "tempered"],
        views: 145
    }
];

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

// Create admin user
async function createAdminUser() {
    try {
        console.log('\n🔐 Creating admin user...');
        
        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@razeit.com' });
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return existingAdmin._id;
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        
        // Create admin
        const admin = new User({
            email: 'admin@razeit.com',
            username: 'admin',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            isActive: true,
            isVerified: {
                email: true,
                phone: false
            }
        });
        
        await admin.save();
        console.log('✅ Admin user created');
        return admin._id;
        
    } catch (error) {
        console.error('❌ Failed to create admin:', error);
        throw error;
    }
}

// Seed services
async function seedServices(adminId) {
    try {
        console.log('\n📦 Seeding services...');
        
        // Clear existing services
        await Service.deleteMany({});
        console.log('  Cleared existing services');
        
        let successCount = 0;
        for (const serviceData of services) {
            try {
                const service = new Service({
                    ...serviceData,
                    provider: adminId
                });
                await service.save();
                console.log(`  ✅ Created: ${service.title}`);
                successCount++;
            } catch (error) {
                console.error(`  ❌ Failed to create "${serviceData.title}":`, error.message);
            }
        }
        
        console.log(`\n✨ Services seeded: ${successCount}/${services.length}`);
        
    } catch (error) {
        console.error('❌ Failed to seed services:', error);
        throw error;
    }
}

// Seed marketplace items
async function seedMarketplaceItems(adminId) {
    try {
        console.log('\n📦 Seeding marketplace items...');
        
        // Clear existing items
        await MarketplaceItem.deleteMany({});
        console.log('  Cleared existing marketplace items');
        
        let successCount = 0;
        for (const itemData of marketplaceItems) {
            try {
                const item = new MarketplaceItem({
                    ...itemData,
                    seller: adminId
                });
                await item.save();
                console.log(`  ✅ Created: ${item.title}`);
                successCount++;
            } catch (error) {
                console.error(`  ❌ Failed to create "${itemData.title}":`, error.message);
            }
        }
        
        console.log(`\n✨ Marketplace items seeded: ${successCount}/${marketplaceItems.length}`);
        
    } catch (error) {
        console.error('❌ Failed to seed marketplace items:', error);
        throw error;
    }
}

// Main seeding function
async function seed() {
    console.log('🌱 Starting direct database seeding...\n');
    
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Create admin user
        const adminId = await createAdminUser();
        
        // Seed data
        await seedServices(adminId);
        await seedMarketplaceItems(adminId);
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Admin user: admin@razeit.com / Admin123!`);
        console.log(`   - ${services.length} services added`);
        console.log(`   - ${marketplaceItems.length} marketplace items added`);
        console.log('\n🌐 You can now view them at:');
        console.log('   - Services: http://localhost:5000/en/service.html');
        console.log('   - Marketplace: http://localhost:5000/en/marketplace.html');
        console.log('\n🔐 Login credentials:');
        console.log('   - Email: admin@razeit.com');
        console.log('   - Password: Admin123!');
        
    } catch (error) {
        console.error('\n💥 Seeding failed:', error.message);
    } finally {
        // Close connection
        await mongoose.connection.close();
        console.log('\n👋 Database connection closed');
    }
}

// Run seeding
seed();

