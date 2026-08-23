import mongoose from 'mongoose';

const commitSchema = new mongoose.Schema(
  {
    artifactId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Artifact', 
      required: true,
      index: true
    },
    content: { 
      type: String, 
      required: true 
    },
    parentCommit: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Commit', 
      default: null 
    },
    branch: { 
      type: String, 
      required: true, 
      default: 'main' 
    },
    message: { 
      type: String, 
      required: true 
    },
    author: { 
      type: String, 
      default: 'Mouli' 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  },
  { timestamps: true }
);

export default mongoose.model('Commit', commitSchema);
