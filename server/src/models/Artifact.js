import mongoose from 'mongoose';

const artifactSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    type: { 
      type: String, 
      enum: ['markdown', 'chat', 'pdf', 'code', 'text'], 
      default: 'markdown' 
    },
    defaultBranch: { 
      type: String, 
      default: 'main' 
    },
    description: { 
      type: String, 
      default: '' 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Artifact', artifactSchema);
