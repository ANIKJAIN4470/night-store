import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#EFE8DF] overflow-hidden animate-pulse flex flex-col">
      <div className="aspect-4/3 w-full bg-[#EFE8DF]" />
      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-3 w-16 bg-[#EFE8DF] rounded-sm" />
          <div className="h-5 w-3/4 bg-[#EFE8DF] rounded-md" />
          <div className="h-3 w-full bg-[#EFE8DF] rounded-sm" />
          <div className="h-3 w-2/3 bg-[#EFE8DF] rounded-sm" />
        </div>
        <div className="pt-3 border-t border-[#F5EFE6] flex items-center justify-between">
          <div className="h-6 w-12 bg-[#EFE8DF] rounded-md" />
          <div className="h-8 w-16 bg-[#EFE8DF] rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
};
