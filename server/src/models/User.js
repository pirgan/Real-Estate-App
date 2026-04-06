import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ['buyer', 'seller', 'agent'], default: 'buyer' },
    savedProperties: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

// Hashes the password with bcrypt (cost factor 12) before saving whenever it has been modified.
// Mongoose 9 awaits the returned promise automatically — no next() needed for async hooks.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compares a plain-text password against the stored bcrypt hash.
// Returns a Promise<boolean> — true if they match, false otherwise.
userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Strips the password field from any JSON serialisation of a User document
// so it is never accidentally sent to the client.
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);
export default User;
