import React from 'react';
import { CheckCircle2, Clock, ChefHat, Bike, Home, XCircle, ShoppingBag } from 'lucide-react';
import { OrderStatus, StatusHistoryItem, DeliveryMethod } from '../types.js';

interface OrderStatusTimelineProps {
  currentStatus: OrderStatus;
  history: StatusHistoryItem[];
  cancellationReason?: string;
  deliveryMethod?: DeliveryMethod;
}

const DELIVERY_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'Pending', label: 'Order Placed', desc: 'Received by kitchen', icon: Clock },
  { status: 'Accepted', label: 'Confirmed', desc: 'Accepted by admin', icon: CheckCircle2 },
  { status: 'Preparing', label: 'In Kitchen', desc: 'Cooking your snack', icon: ChefHat },
  { status: 'Out for Delivery', label: 'On The Way', desc: 'Rider headed to hostel', icon: Bike },
  { status: 'Completed', label: 'Delivered', desc: 'At your room door', icon: Home },
];

const PICKUP_STEPS: { status: OrderStatus; label: string; desc: string; icon: any }[] = [
  { status: 'Pending', label: 'Order Placed', desc: 'Received by kitchen', icon: Clock },
  { status: 'Accepted', label: 'Confirmed', desc: 'Accepted by admin', icon: CheckCircle2 },
  { status: 'Preparing', label: 'In Kitchen', desc: 'Cooking your snack', icon: ChefHat },
  { status: 'Ready for Pickup', label: 'Ready to Collect', desc: 'Pick up at shop', icon: ShoppingBag },
  { status: 'Completed', label: 'Collected', desc: 'Order completed', icon: CheckCircle2 },
];

export const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  currentStatus,
  history,
  cancellationReason,
  deliveryMethod = 'Room Delivery',
}) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-red-900 space-y-2">
        <div className="flex items-center gap-2">
          <XCircle className="w-6 h-6 text-red-600" />
          <h3 className="font-extrabold text-base">This Order Was Cancelled</h3>
        </div>
        <p className="text-sm text-red-700">
          Reason: {cancellationReason || 'Cancelled upon request.'}
        </p>
      </div>
    );
  }

  const STEPS = deliveryMethod === 'Self Pickup' ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIdx = STEPS.findIndex((s) => s.status === currentStatus);

  return (
    <div className="py-6 px-4 sm:px-6 bg-white rounded-2xl border border-[#EFE8DF] shadow-xs">
      <div className="relative">
        {/* Background track line */}
        <div className="hidden sm:block absolute top-1/2 left-6 right-6 h-1 bg-[#F0E6D8] -translate-y-1/2 -z-0" />

        {/* Active track line */}
        <div
          className="hidden sm:block absolute top-1/2 left-6 h-1 bg-[#EA580C] -translate-y-1/2 -z-0 transition-all duration-500"
          style={{
            width: `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 90)}%`,
          }}
        />

        {/* Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIdx;
            const isCurrent = idx === currentIdx;
            const isPending = idx > currentIdx;
            const Icon = step.icon;

            // Find matching history timestamp if available
            const histEntry = history.find((h) => h.status === step.status);
            const timeStr = histEntry
              ? new Date(histEntry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : null;

            return (
              <div
                key={step.status}
                className="flex sm:flex-col items-center sm:text-center gap-3 sm:gap-2"
              >
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isCurrent
                      ? 'bg-[#EA580C] text-white shadow-lg shadow-[#EA580C]/30 ring-4 ring-[#FFF2E8]'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#F5EFE6] text-[#A8907E]'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>

                <div className="min-w-0">
                  <p
                    className={`font-bold text-xs sm:text-sm tracking-tight ${
                      isCurrent
                        ? 'text-[#EA580C]'
                        : isCompleted
                        ? 'text-[#291D15]'
                        : 'text-[#8C7A6D]'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[11px] text-[#786455] hidden sm:block">{step.desc}</p>
                  {timeStr && (
                    <span className="text-[10px] font-semibold text-[#8C7A6D] block mt-0.5">
                      {timeStr}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
