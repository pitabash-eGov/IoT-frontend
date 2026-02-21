import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useDevice from '../hooks/useDevice';
import useWebSocket from '../hooks/useWebSocket';
import { updateDevice, deleteDevice } from '../api/devices';
import DeviceTypeIcon from '../components/devices/DeviceTypeIcon';
import DeviceStatusBadge from '../components/devices/DeviceStatusBadge';
import DeviceModal from '../components/devices/DeviceModal';
import ControlRenderer from '../components/controls/ControlRenderer';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import { formatDateTime } from '../utils/formatters';
import { ArrowLeft, Pencil, Trash2, MapPin, Radio } from 'lucide-react';

export default function DeviceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { device, setDevice, loading, error, refetch } = useDevice(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Subscribe to status, control, telemetry topics
  const topics = device
    ? [
        `/topic/devices/${id}/status`,
        `/topic/devices/${id}/control`,
        `/topic/devices/${id}/telemetry`,
      ]
    : [];

  const messages = useWebSocket(topics);

  // Apply live status
  const statusMsg = messages[`/topic/devices/${id}/status`];
  const telemetryMsg = messages[`/topic/devices/${id}/telemetry`];
  const controlMsg = messages[`/topic/devices/${id}/control`];

  const liveDevice = device
    ? {
        ...device,
        ...(statusMsg?.isOnline !== undefined ? { isOnline: statusMsg.isOnline } : {}),
      }
    : null;

  // Apply live control updates
  if (liveDevice && controlMsg?.controlId && liveDevice.controls) {
    liveDevice.controls = liveDevice.controls.map((c) =>
      c.id === controlMsg.controlId
        ? { ...c, currentValue: controlMsg.value }
        : c
    );
  }

  async function handleEdit(data) {
    setSubmitting(true);
    try {
      const { data: updated } = await updateDevice(id, data);
      setDevice(updated);
      setEditOpen(false);
    } catch {
      // handled by form
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteDevice(id);
      navigate('/', { replace: true });
    } catch {
      // ignore
    }
  }

  async function handleControlChange(controlId, value) {
    if (!device) return;
    const updatedControls = device.controls.map((c) =>
      c.id === controlId ? { ...c, currentValue: value } : c
    );
    try {
      const { data: updated } = await updateDevice(id, { controls: updatedControls });
      setDevice(updated);
    } catch {
      // revert by refetching
      refetch();
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} onRetry={refetch} />;
  if (!liveDevice) return <ErrorMessage message="Device not found" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <DeviceTypeIcon type={liveDevice.type} className="h-8 w-8" />
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{liveDevice.name}</h1>
          <p className="text-sm text-gray-500">{liveDevice.type}</p>
        </div>
        <DeviceStatusBadge isOnline={liveDevice.isOnline} />
        <button
          onClick={() => setEditOpen(true)}
          className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {liveDevice.location && (
          <div className="rounded-xl border bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" /> Location
            </div>
            {liveDevice.location.label && (
              <p className="text-sm text-gray-900">{liveDevice.location.label}</p>
            )}
            {liveDevice.location.address && (
              <p className="text-xs text-gray-500">{liveDevice.location.address}</p>
            )}
            {liveDevice.location.latitude != null && (
              <p className="mt-1 text-xs text-gray-400">
                {liveDevice.location.latitude}, {liveDevice.location.longitude}
              </p>
            )}
          </div>
        )}
        <div className="rounded-xl border bg-white p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700">
            <Radio className="h-4 w-4" /> MQTT
          </div>
          <p className="text-sm text-gray-900">
            {liveDevice.mqttTopicPrefix || '(not set)'}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-xs text-gray-500">Created</p>
          <p className="text-sm text-gray-900">{formatDateTime(liveDevice.createdAt)}</p>
          <p className="mt-2 text-xs text-gray-500">Updated</p>
          <p className="text-sm text-gray-900">{formatDateTime(liveDevice.updatedAt)}</p>
        </div>
      </div>

      {/* Controls */}
      {liveDevice.controls?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Controls</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveDevice.controls.map((control) => (
              <ControlRenderer
                key={control.id}
                control={control}
                onChange={(value) => handleControlChange(control.id, value)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Telemetry */}
      {telemetryMsg && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Live Telemetry</h2>
          <div className="rounded-xl border bg-white p-4">
            <pre className="overflow-x-auto text-sm text-gray-700">
              {JSON.stringify(telemetryMsg, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Modals */}
      <DeviceModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        device={liveDevice}
        onSubmit={handleEdit}
        submitting={submitting}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Device"
        message={`Are you sure you want to delete "${liveDevice.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
}
