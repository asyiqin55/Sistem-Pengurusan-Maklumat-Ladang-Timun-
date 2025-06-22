'use client';

import { Leaf } from 'lucide-react';

export default function PlotView({ plotSize, status }) {
  // Parse plot size - handle both formats: "10 m² (5m x 2m)" or "10x20"
  let width = 10, height = 10; // defaults
  
  if (plotSize) {
    // Try to extract dimensions from format "10 m² (5m x 2m)"
    const dimensionMatch = plotSize.match(/\((\d+(?:\.\d+)?)m x (\d+(?:\.\d+)?)m\)/);
    if (dimensionMatch) {
      width = Math.ceil(parseFloat(dimensionMatch[1]));
      height = Math.ceil(parseFloat(dimensionMatch[2]));
    } else {
      // Fallback: try simple "10x20" format
      const simpleMatch = plotSize.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
      if (simpleMatch) {
        width = Math.ceil(parseFloat(simpleMatch[1]));
        height = Math.ceil(parseFloat(simpleMatch[2]));
      }
    }
  }
  
  const gridCols = Math.min(width, 20); // Limit for performance
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-[#2D5A27]">Susun Atur Plot</h2>
        <p className="text-sm text-[#607D8B]">Saiz: {plotSize}</p>
      </div>
      
      <div 
        className="grid gap-2 bg-[#F5F7F2] p-4 rounded-lg"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: Math.min(width * height, 200) }).map((_, index) => (
          <div 
            key={index}
            className={`aspect-square rounded-md flex items-center justify-center ${
              status === 'Aktif' ? 'bg-[#8BC34A]' : 
              status === 'Penuaian' ? 'bg-[#FFC107]' :
              status === 'Selesai' ? 'bg-[#4CAF50]' :
              status === 'Gagal' ? 'bg-[#F44336]' :
              'bg-[#607D8B]'
            } transition-colors hover:opacity-80`}
          >
            <Leaf className="h-4 w-4 text-white" />
          </div>
        ))}
      </div>
    </div>
  );
} 