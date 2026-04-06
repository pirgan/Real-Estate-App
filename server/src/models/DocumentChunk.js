import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    section: { type: String, default: '' },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    wordCount: { type: Number, required: true },
  },
  { timestamps: true }
);

documentChunkSchema.index({ source: 1, chunkIndex: 1 }, { unique: true });
documentChunkSchema.index({ content: 'text', section: 'text' });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
export default DocumentChunk;
