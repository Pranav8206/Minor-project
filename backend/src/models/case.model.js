import mongoose from "mongoose";

const suspectSchema = new mongoose.Schema(
  {
    suspect_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Suspect",
    },
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
    url: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
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

const timelineEventSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    event: {
      type: String,
      required: true,
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
    coordinates: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },
      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },
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
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    tags: {
      type: [String],
      default: [],
    },
    case_summary: {
      type: String,
      trim: true,
      maxlength: 500,
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
    timeline: {
      type: [timelineEventSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Case = mongoose.model("Case", caseSchema);

export default Case;