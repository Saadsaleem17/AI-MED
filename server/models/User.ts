import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  phone?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  profilePicture?: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationExpires?: Date;
  emailVerifiedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  // Health Profile
  bloodGroup?: string;
  height?: number; // in cm
  weight?: number; // in kg
  gender?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: function(this: IUser) { return this.authProvider !== 'google'; },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  profilePicture: {
    type: String
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  phone: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },
  verificationExpires: {
    type: Date
  },
  emailVerifiedAt: {
    type: Date
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  // Health Profile
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
  },
  height: {
    type: Number // in cm
  },
  weight: {
    type: Number // in kg
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', '']
  },
  allergies: [{
    type: String
  }],
  chronicConditions: [{
    type: String
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', UserSchema);