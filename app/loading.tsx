export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#D8ECF8] to-[#E8DDFB]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-700 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-violet-700">Loading...</h2>
      </div>
    </div>
  );
}