const mongoose = require('mongoose');
require('dotenv').config();

// Connection strings
const LOCAL_URI = 'mongodb://localhost:27017/razeit-gaming-platform';
const ATLAS_URI = process.env.MONGODB_URI;

// Collections to migrate
const COLLECTIONS = [
    'users',
    'services',
    'marketplaceitems',
    'gems',
    'wheels',
    'wheeltokens',
    'forumcategories',
    'forumtopics'
];

async function migrateToAtlas() {
    console.log('🔄 Starting Migration from Local MongoDB to Atlas');
    console.log('═══════════════════════════════════════════════════\n');

    let localConnection;
    let atlasConnection;

    try {
        // Connect to local MongoDB
        console.log('📡 Connecting to Local MongoDB...');
        localConnection = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('✅ Connected to Local MongoDB\n');

        // Connect to MongoDB Atlas
        console.log('📡 Connecting to MongoDB Atlas...');
        atlasConnection = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log('✅ Connected to MongoDB Atlas\n');

        let totalDocuments = 0;
        const migrationSummary = [];

        // Migrate each collection
        for (const collectionName of COLLECTIONS) {
            try {
                console.log(`\n📦 Migrating collection: ${collectionName}`);
                console.log('─────────────────────────────────────');

                // Get collection from local
                const localCollection = localConnection.collection(collectionName);
                
                // Check if collection exists and has data
                const count = await localCollection.countDocuments();
                
                if (count === 0) {
                    console.log(`⚠️  Collection "${collectionName}" is empty or doesn't exist - skipping`);
                    migrationSummary.push({
                        collection: collectionName,
                        documents: 0,
                        status: 'skipped'
                    });
                    continue;
                }

                console.log(`📊 Found ${count} documents`);

                // Get all documents
                const documents = await localCollection.find({}).toArray();

                // Get collection from Atlas
                const atlasCollection = atlasConnection.collection(collectionName);

                // Clear existing data in Atlas (optional - comment out if you want to keep existing data)
                console.log('🗑️  Clearing existing data in Atlas...');
                await atlasCollection.deleteMany({});

                // Insert documents into Atlas
                if (documents.length > 0) {
                    console.log('⬆️  Uploading documents to Atlas...');
                    await atlasCollection.insertMany(documents, { ordered: false });
                    console.log(`✅ Migrated ${documents.length} documents`);
                    
                    totalDocuments += documents.length;
                    migrationSummary.push({
                        collection: collectionName,
                        documents: documents.length,
                        status: 'success'
                    });
                }

            } catch (collectionError) {
                console.error(`❌ Error migrating "${collectionName}":`, collectionError.message);
                migrationSummary.push({
                    collection: collectionName,
                    documents: 0,
                    status: 'failed',
                    error: collectionError.message
                });
            }
        }

        // Display summary
        console.log('\n\n╔════════════════════════════════════════════╗');
        console.log('║     MIGRATION COMPLETED SUCCESSFULLY!      ║');
        console.log('╚════════════════════════════════════════════╝\n');

        console.log('📊 MIGRATION SUMMARY:');
        console.log('┌──────────────────────────┬────────────┬──────────┐');
        console.log('│ Collection               │ Documents  │ Status   │');
        console.log('├──────────────────────────┼────────────┼──────────┤');
        
        migrationSummary.forEach(item => {
            const collection = item.collection.padEnd(24);
            const docs = item.documents.toString().padEnd(10);
            const status = item.status === 'success' ? '✅ OK' : 
                          item.status === 'skipped' ? '⚠️  Skip' : 
                          '❌ Fail';
            console.log(`│ ${collection} │ ${docs} │ ${status.padEnd(8)} │`);
        });
        
        console.log('└──────────────────────────┴────────────┴──────────┘\n');
        console.log(`📈 Total Documents Migrated: ${totalDocuments}`);
        console.log(`🎯 Migration Success Rate: ${migrationSummary.filter(s => s.status === 'success').length}/${COLLECTIONS.length} collections\n`);

        console.log('🌐 Your data is now in MongoDB Atlas!');
        console.log('🔗 Atlas URI:', ATLAS_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
        console.log('\n✅ You can now use your application with Atlas!\n');

    } catch (error) {
        console.error('\n❌ MIGRATION FAILED:\n');
        console.error('Error:', error.message);
        console.error('\n💡 TROUBLESHOOTING:');
        console.error('  1. Make sure local MongoDB is running');
        console.error('  2. Verify .env file has correct Atlas URI');
        console.error('  3. Check network connection to Atlas');
        console.error('  4. Ensure Atlas IP whitelist includes your IP\n');
    } finally {
        // Close connections
        if (localConnection) {
            await localConnection.close();
            console.log('🔌 Disconnected from Local MongoDB');
        }
        if (atlasConnection) {
            await atlasConnection.close();
            console.log('🔌 Disconnected from MongoDB Atlas');
        }
    }
}

// Run migration
migrateToAtlas();

