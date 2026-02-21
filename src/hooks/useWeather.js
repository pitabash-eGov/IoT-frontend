import { useState, useEffect } from 'react';
import { getWeather } from '../api/weather';

export default function useWeather() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { data } = await getWeather(pos.coords.latitude, pos.coords.longitude);
          setWeather(data);
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load weather');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied');
        setLoading(false);
      }
    );
  }, []);

  return { weather, loading, error };
}
