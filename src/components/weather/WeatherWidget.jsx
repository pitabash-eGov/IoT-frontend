import { CloudSun, Droplets, Wind, Thermometer } from 'lucide-react';

export default function WeatherWidget({ weather, loading, error }) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5">
        <div className="h-20" />
      </div>
    );
  }

  if (error || !weather) return null;

  const main = weather.main || {};
  const wind = weather.wind || {};
  const desc = weather.weather?.[0]?.description || '';
  const icon = weather.weather?.[0]?.icon;
  const name = weather.name || '';

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-5 text-white shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm font-medium opacity-80">{name}</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold">
              {main.temp != null ? Math.round(main.temp) : '--'}°
            </span>
            <span className="mb-1 text-sm capitalize opacity-80">{desc}</span>
          </div>
        </div>
        {icon ? (
          <img
            src={`https://openweathermap.org/img/wn/${icon}@2x.png`}
            alt={desc}
            className="h-16 w-16"
          />
        ) : (
          <CloudSun className="h-12 w-12 opacity-60" />
        )}
      </div>

      <div className="mt-4 flex gap-6 text-sm">
        <div className="flex items-center gap-1.5">
          <Thermometer className="h-4 w-4 opacity-70" />
          <span>Feels {main.feelsLike != null ? Math.round(main.feelsLike) : '--'}°</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Droplets className="h-4 w-4 opacity-70" />
          <span>{main.humidity ?? '--'}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Wind className="h-4 w-4 opacity-70" />
          <span>{wind.speed != null ? Math.round(wind.speed) : '--'} m/s</span>
        </div>
      </div>
    </div>
  );
}
