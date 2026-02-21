import DeviceCard from './DeviceCard';
import { Plus } from 'lucide-react';

export default function DeviceGrid({ devices, onAdd }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {devices.map((device) => (
        <DeviceCard key={device.id} device={device} />
      ))}

      <button
        onClick={onAdd}
        className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 bg-white text-gray-400 transition hover:border-blue-400 hover:text-blue-500"
      >
        <Plus className="h-8 w-8" />
        <span className="text-sm font-medium">Add Device</span>
      </button>
    </div>
  );
}
