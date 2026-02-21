import { getDeviceIcon } from '../../utils/deviceIcons';

export default function DeviceTypeIcon({ type, className = 'h-6 w-6' }) {
  const { icon: Icon, color } = getDeviceIcon(type);
  return <Icon className={`${color} ${className}`} />;
}
