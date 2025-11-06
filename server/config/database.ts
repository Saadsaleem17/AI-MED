import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-reports';
    
    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', (error as Error).message);
    console.log('\n⚠️  MongoDB is not running or not installed.');
    console.log('📖 Please check MONGODB_SETUP.md for installation instructions.\n');
    console.log('Options:');
    console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
    console.log('2. Use MongoDB Atlas (free cloud): https://www.mongodb.com/cloud/atlas\n');
    console.log('⚡ Server will continue running but database features will not work.\n');
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});
