import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}`
    );

    // Remove legacy unique index that blocks inserts when phoneNumber is null.
    try {
      const usersCollection = connectionInstance.connection.db.collection("users");
      const indexes = await usersCollection.indexes();
      const legacyPhoneNumberIndex = indexes.find(
        (index) => index?.name === "phoneNumber_1" || index?.key?.phoneNumber === 1
      );

      if (legacyPhoneNumberIndex) {
        await usersCollection.dropIndex(legacyPhoneNumberIndex.name);
        console.log(`Dropped legacy index: ${legacyPhoneNumberIndex.name}`);
      }
    } catch (indexError) {
      console.log("Index cleanup skipped:", indexError?.message || indexError);
    }

    console.log(
      ` MongoDB connected :: DB host : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection error ", error);
    process.exit(1);
  }
};

export default connectDB;