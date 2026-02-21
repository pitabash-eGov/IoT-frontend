import { useState } from 'react';
import useDevices from '../hooks/useDevices';
import useWeather from '../hooks/useWeather';
import useWebSocket from '../hooks/useWebSocket';
import DeviceGrid from '../components/devices/DeviceGrid';
import DeviceModal from '../components/devices/DeviceModal';
import WeatherWidget from '../components/weather/WeatherWidget';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';

export default function DashboardPage() {
  const { devices, loading, error, refetch, add } = useDevices();
  const weather = useWeather();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to all device status topics for live online/offline indicators
  const statusUpdates = useWebSocket(
    devices.map((d) => `/topic/devices/${d.id}/status`)
  );

  // Merge live status into devices
  const liveDevices = devices.map((d) => {
    const update = statusUpdates[`/topic/devices/${d.id}/status`];
    if (update?.isOnline !== undefined) {
      return { ...d, isOnline: update.isOnline };
    }
    return d;
  });

  async function handleAdd(data) {
    setSubmitting(true);
    try {
      await add(data);
      setModalOpen(false);
    } catch {
      // DeviceForm shows error via parent
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{devices.length} device{devices.length !== 1 ? 's' : ''} registered</p>
        </div>
      </div>

      <WeatherWidget {...weather} />

      <DeviceGrid devices={liveDevices} onAdd={() => setModalOpen(true)} />

      <DeviceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
        submitting={submitting}
      />
    </div>
  );
}
