import mongoose from "mongoose";

const suspectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    normalized_name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    linked_cases: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Case",
      default: [],
    },
    image_url: {
      type: String,
      trim: true,
    },
    risk_score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Suspect = mongoose.model("Suspect", suspectSchema);

export default Suspect;