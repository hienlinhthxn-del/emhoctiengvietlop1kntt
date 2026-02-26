import mongoose from 'mongoose';

// Lấy URI từ biến môi trường
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Trong quá trình phát triển (development), chúng ta sử dụng một biến global
 * để duy trì kết nối qua các lần tải lại module (HMR).
 * Điều này ngăn chặn việc tạo ra quá nhiều kết nối đến MongoDB Atlas.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    // Nếu đã có kết nối, trả về luôn
    if (cached.conn) {
        return cached.conn;
    }

    // Kiểm tra URI
    if (!MONGODB_URI) {
        console.error('CRITICAL: MONGODB_URI is missing in environment variables');
        throw new Error('Please define the MONGODB_URI environment variable inside .env or Vercel Dashboard');
    }

    // Nếu chưa có promise kết nối, tạo mới
    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            dbName: 'tieng-viet-1', // Tên cơ sở dữ liệu
            connectTimeoutMS: 20000, // Tăng lên 20 giây cho serverless
            socketTimeoutMS: 45000,
        };

        console.log('Connecting to MongoDB...');
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
            console.log('MongoDB: Connection established successfully to tieng-viet-1');
            return mongooseInstance;
        }).catch(err => {
            console.error('MongoDB: Connection failed:', err.message);
            cached.promise = null; // Reset promise để thử lại sau
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e: any) {
        cached.promise = null;
        console.error('MongoDB: Error awaiting connection:', e.message);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
