'use client';

export default function Error({ error, reset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <button
        onClick={() => reset()}
        className="bg-[#2D5A27] text-white px-4 py-2 rounded-lg hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
} 