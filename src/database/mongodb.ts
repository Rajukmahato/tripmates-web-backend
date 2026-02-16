import mongoose from "mongoose";
import { MONGODB_URI } from "../configs";

export const connectDb = async () => {
    try {
        // Use separate test database when running tests
        const dbUri = process.env.NODE_ENV === 'test'
            ? (process.env.MONGODB_TEST_URI || MONGODB_URI.replace(/\/[^/]*$/, '/tripmates_test'))
            : MONGODB_URI;
            
        await mongoose.connect(dbUri);
        console.log("Connected to MongoDB");

    } catch (e) {
        console.error("MongoDB error: ", e);
        process.exit(1); 

    }
}