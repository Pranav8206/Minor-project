import mongoose from "mongoose";

const suspectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const evidenceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
    },
    file_name: {
      type: String,
      trim: true,
    },
    file_url: {
      type: String,
      trim: true,
    },
    mime_type: {
      type: String,
      trim: true,
    },
    file_size: {
      type: Number,
    },
    collected_at: {
      type: Date,
    },
  },
  { _id: false }
);

const entitySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const caseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    crime_type: {
      type: String,
      required: [true, "Crime type is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["open", "investigating", "closed", "archived"],
      default: "open",
    },
    assigned_officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    suspects: {
      type: [suspectSchema],
      default: [],
    },
    evidence: {
      type: [evidenceSchema],
      default: [],
    },
    embedding: {
      type: [Number],
      default: [],
    },
    entities: {
      type: [entitySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Case = mongoose.model("Case", caseSchema);

export default Case;