const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

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
        tags: ["csgo", "boosting", "rank", "competitive"]
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
        tags: ["dota2", "coaching", "lessons", "pro"]
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
        tags: ["rust", "building", "base", "design"]
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
        tags: ["tf2", "trading", "items", "consulting"]
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
        tags: ["csgo", "account", "prime", "trusted"]
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
        price: {
            gems: 45000,
            usd: 449.99,
            rial: 18900000
        },
        steamItemId: "AK47_FIRE_SERPENT_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/AK-47%20%7C%20Fire%20Serpent%20%28Field-Tested%29",
        tags: ["csgo", "ak47", "fire serpent", "covert"]
    },
    {
        title: "CS:GO Karambit | Fade (Factory New)",
        description: "Beautiful Karambit Fade knife in Factory New condition. Features a stunning gradient fade pattern. One of the most prestigious knives in CS:GO.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "knife",
        rarity: "mythic",
        condition: "factory-new",
        price: {
            gems: 120000,
            usd: 1199.99,
            rial: 50400000
        },
        steamItemId: "KARAMBIT_FADE_FN",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Karambit%20%7C%20Fade%20%28Factory%20New%29",
        tags: ["csgo", "knife", "karambit", "fade"]
    },
    {
        title: "Dota 2 - Dragonclaw Hook (Immortal)",
        description: "Extremely rare Dragonclaw Hook for Pudge. This immortal item is one of the most valuable items in Dota 2. Perfect condition, never duped.",
        category: "dota2",
        game: "Dota 2",
        itemType: "weapon",
        rarity: "mythic",
        price: {
            gems: 95000,
            usd: 949.99,
            rial: 39900000
        },
        steamMarketUrl: "https://steamcommunity.com/market/listings/570/Dragonclaw%20Hook",
        tags: ["dota2", "immortal", "pudge", "hook"]
    },
    {
        title: "CS:GO AWP | Dragon Lore (Minimal Wear)",
        description: "The legendary AWP Dragon Lore in Minimal Wear condition. Features intricate dragon artwork. One of the most iconic and expensive skins in CS:GO.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "weapon",
        rarity: "legendary",
        condition: "minimal-wear",
        price: {
            gems: 250000,
            usd: 2499.99,
            rial: 105000000
        },
        steamItemId: "AWP_DLORE_MW",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/AWP%20%7C%20Dragon%20Lore%20%28Minimal%20Wear%29",
        tags: ["csgo", "awp", "dragon lore", "dlore"]
    },
    {
        title: "CS:GO M4A4 | Howl (Field-Tested)",
        description: "Contraband M4A4 Howl skin in Field-Tested condition. This skin was removed from the game, making it extremely rare and valuable. Features a unique howling wolf design.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "weapon",
        rarity: "legendary",
        condition: "field-tested",
        price: {
            gems: 65000,
            usd: 649.99,
            rial: 27300000
        },
        steamItemId: "M4A4_HOWL_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/M4A4%20%7C%20Howl%20%28Field-Tested%29",
        tags: ["csgo", "m4a4", "howl", "contraband"]
    },
    {
        title: "TF2 Unusual Burning Flames Team Captain",
        description: "Extremely rare Unusual Team Captain hat with Burning Flames effect. One of the most prestigious items in Team Fortress 2. All-class item.",
        category: "tf2",
        game: "Team Fortress 2",
        itemType: "other",
        rarity: "mythic",
        price: {
            gems: 85000,
            usd: 849.99,
            rial: 35700000
        },
        steamMarketUrl: "https://backpack.tf/stats/Unusual/Team%20Captain/Tradable/Craftable/13",
        tags: ["tf2", "unusual", "team captain", "burning flames"]
    },
    {
        title: "CS:GO Butterfly Knife | Doppler Phase 2",
        description: "Beautiful Butterfly Knife with Doppler Phase 2 pattern in Factory New condition. Features pink and blue colors. Very popular knife skin.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "knife",
        rarity: "epic",
        condition: "factory-new",
        price: {
            gems: 42000,
            usd: 419.99,
            rial: 17640000
        },
        steamItemId: "BUTTERFLY_DOPPLER_P2",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Butterfly%20Knife%20%7C%20Doppler%20%28Factory%20New%29",
        tags: ["csgo", "knife", "butterfly", "doppler"]
    },
    {
        title: "Dota 2 Arcana Bundle - 5 Arcanas",
        description: "Bundle of 5 Dota 2 Arcana items including Juggernaut, Phantom Assassin, Legion Commander, Shadow Fiend, and Techies. Save 20% compared to buying individually.",
        category: "dota2",
        game: "Dota 2",
        itemType: "other",
        rarity: "legendary",
        price: {
            gems: 35000,
            usd: 349.99,
            rial: 14700000
        },
        tags: ["dota2", "arcana", "bundle", "discount"]
    },
    {
        title: "CS:GO Gloves | Crimson Weave (Field-Tested)",
        description: "Sport Gloves Crimson Weave in Field-Tested condition. Features a deep red woven pattern. Highly desirable gloves that match many red-themed loadouts.",
        category: "csgo",
        game: "Counter-Strike: Global Offensive",
        itemType: "glove",
        rarity: "epic",
        condition: "field-tested",
        price: {
            gems: 28000,
            usd: 279.99,
            rial: 11760000
        },
        steamItemId: "GLOVES_CRIMSON_WEAVE_FT",
        steamMarketUrl: "https://steamcommunity.com/market/listings/730/★%20Sport%20Gloves%20%7C%20Crimson%20Weave%20%28Field-Tested%29",
        tags: ["csgo", "gloves", "crimson weave", "sport"]
    },
    {
        title: "Rust - Tempered AK47 Skin",
        description: "Premium Tempered AK47 skin for Rust. Features a battle-worn metallic finish. One of the most popular weapon skins in Rust.",
        category: "rust",
        game: "Rust",
        itemType: "skin",
        rarity: "rare",
        price: {
            gems: 2500,
            usd: 24.99,
            rial: 1050000
        },
        tags: ["rust", "ak47", "skin", "tempered"]
    }
];

// Admin credentials (you'll need to create an admin user first)
let adminToken = '';

// Helper function to create admin account
async function createAdminUser() {
    try {
        console.log('🔐 Creating admin user...');
        const response = await axios.post(`${API_URL}/auth/register`, {
            email: 'admin@razeit.com',
            username: 'admin',
            password: 'Admin123!',
            firstName: 'Admin',
            lastName: 'User',
            requireOtp: false
        });
        
        console.log('✅ Admin user created');
        
        // Login to get token
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            login: 'admin@razeit.com',
            password: 'Admin123!',
            requireOtp: false
        });
        
        adminToken = loginResponse.data.token;
        console.log('✅ Admin logged in, token received');
        
        return adminToken;
    } catch (error) {
        if (error.response?.data?.message?.includes('already exists')) {
            console.log('⚠️  Admin user already exists, logging in...');
            try {
                const loginResponse = await axios.post(`${API_URL}/auth/login`, {
                    login: 'admin@razeit.com',
                    password: 'Admin123!',
                    requireOtp: false
                });
                adminToken = loginResponse.data.token;
                console.log('✅ Admin logged in successfully');
                return adminToken;
            } catch (loginError) {
                console.error('❌ Failed to login admin:', loginError.response?.data || loginError.message);
                throw loginError;
            }
        }
        console.error('❌ Failed to create admin:', error.response?.data || error.message);
        throw error;
    }
}

// Seed services
async function seedServices() {
    console.log('\n📦 Seeding services...');
    let successCount = 0;
    
    for (const service of services) {
        try {
            const response = await axios.post(`${API_URL}/services`, service, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Created service: ${service.title}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to create service "${service.title}":`, error.response?.data || error.message);
        }
    }
    
    console.log(`\n✨ Services seeded: ${successCount}/${services.length}`);
}

// Seed marketplace items
async function seedMarketplaceItems() {
    console.log('\n📦 Seeding marketplace items...');
    let successCount = 0;
    
    for (const item of marketplaceItems) {
        try {
            const response = await axios.post(`${API_URL}/marketplace`, item, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`✅ Created item: ${item.title}`);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to create item "${item.title}":`, error.response?.data || error.message);
        }
    }
    
    console.log(`\n✨ Marketplace items seeded: ${successCount}/${marketplaceItems.length}`);
}

// Main function
async function seedDatabase() {
    console.log('🌱 Starting database seeding...\n');
    console.log('⚠️  Make sure your server is running on http://localhost:5000\n');
    
    try {
        // Create admin user and get token
        await createAdminUser();
        
        // Seed data
        await seedServices();
        await seedMarketplaceItems();
        
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - ${services.length} services added`);
        console.log(`   - ${marketplaceItems.length} marketplace items added`);
        console.log('\n🌐 You can now view them at:');
        console.log('   - Services: http://localhost:5000/en/service.html');
        console.log('   - Marketplace: http://localhost:5000/en/marketplace.html');
        
    } catch (error) {
        console.error('\n💥 Seeding failed:', error.message);
        console.error('Make sure:');
        console.error('  1. Your server is running (npm run dev)');
        console.error('  2. MongoDB is connected');
        console.error('  3. No conflicting data exists');
    }
}

// Run the seeding
seedDatabase();

