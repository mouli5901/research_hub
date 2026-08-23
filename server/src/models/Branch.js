import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema(
  {
    artifactId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Artifact', 
      required: true,
      index: true
    },
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    headCommit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Commit', 
      required: true 
    }
  },
  { timestamps: true }
);

branchSchema.index({ artifactId: 1, name: 1 }, { unique: true });

export default mongoose.model('Branch', branchSchema);
