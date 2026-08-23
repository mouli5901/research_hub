import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema(
  {
    artifactId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Artifact', 
      required: true,
      index: true 
    },
    commitId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Commit', 
      required: true,
      index: true 
    },
    artifactName: { type: String, required: true },
    artifactType: { type: String, required: true },
    branch: { type: String, default: 'main' },
    chunkIndex: { type: Number, default: 0 },
    text: { type: String, required: true },
    vector: { type: [Number], default: [] }
  },
  { timestamps: true }
);

chunkSchema.index({ text: 'text' });

export default mongoose.model('Chunk', chunkSchema);
