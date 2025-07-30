export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="mb-8">
        <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-64"></div>
      </div>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-slate-200 rounded w-40"></div>
          <div className="h-10 bg-slate-200 rounded w-32"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}