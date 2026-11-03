import mongoose, { Schema, Document } from 'mongoose';

export interface IRewardMilestoneDoc {
  pointsRequired: number;
  rewardDescription: string;
  rewardValue: number;
  rewardType: 'discount_coupon' | 'free_item';
  isEnabled: boolean;
}

export interface IRewardConfigDoc extends Document {
  pointsPerRupee: number;
  milestones: IRewardMilestoneDoc[];
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IRewardMilestoneDoc>(
  {
    pointsRequired: { type: Number, required: true, index: true },
    rewardDescription: { type: String, required: true },
    rewardValue: { type: Number, required: true },
    rewardType: { type: String, enum: ['discount_coupon', 'free_item'], required: true },
    isEnabled: { type: Boolean, default: true }
  },
  { _id: false }
);

const RewardConfigSchema = new Schema<IRewardConfigDoc>(
  {
    pointsPerRupee: { type: Number, default: 0.1, min: 0 },
    milestones: [MilestoneSchema]
  },
  { timestamps: false }
);

export const RewardConfigModel = mongoose.models.RewardConfig || mongoose.model<IRewardConfigDoc>('RewardConfig', RewardConfigSchema);
