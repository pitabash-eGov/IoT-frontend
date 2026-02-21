import { useState, useEffect, useCallback } from 'react';
import { getDevice } from '../api/devices';

export default function useDevice(id) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const { data } = await getDevice(id);
      setDevice(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load device');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetch(); }, [fetch]);

  return { device, setDevice, loading, error, refetch: fetch };
}
