import { useNavigate } from 'react-router-dom';
import DeviceTypeIcon from './DeviceTypeIcon';
import DeviceStatusBadge from './DeviceStatusBadge';
import { formatRelative } from '../../utils/formatters';
import { MapPin } from 'lucide-react';

export default function DeviceCard({ device }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/devices/${device.id}`)}
      className="cursor-pointer rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <DeviceTypeIcon type={device.type} className="h-8 w-8" />
        <DeviceStatusBadge isOnline={device.isOnline} />
      </div>

      <h3 className="mb-1 font-semibold text-gray-900">{device.name}</h3>
      <p className="mb-3 text-xs text-gray-400">{device.type}</p>

      {device.location?.label && (
        <div className="mb-2 flex items-center gap-1 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          {device.location.label}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{device.controls?.length || 0} controls</span>
        <span>{formatRelative(device.updatedAt)}</span>
      </div>
    </div>
  );
}
