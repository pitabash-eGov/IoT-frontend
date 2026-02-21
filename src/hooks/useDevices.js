import { useState, useEffect, useCallback } from 'react';
import { getDevices, createDevice, updateDevice, deleteDevice } from '../api/devices';

export default function useDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await getDevices();
      setDevices(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (deviceData) => {
    const { data } = await createDevice(deviceData);
    setDevices((prev) => [...prev, data]);
    return data;
  };

  const edit = async (id, deviceData) => {
    const { data } = await updateDevice(id, deviceData);
    setDevices((prev) => prev.map((d) => (d.id === id ? data : d)));
    return data;
  };

  const remove = async (id) => {
    await deleteDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
  };

  return { devices, loading, error, refetch: fetch, add, edit, remove };
}
