import { useState } from 'react';

export default function SliderControl({ control, onChange }) {
  const min = control.minValue ?? 0;
  const max = control.maxValue ?? 100;
  const step = control.step ?? 1;
  const [localValue, setLocalValue] = useState(Number(control.currentValue) || min);

  function handleCommit() {
    onChange(String(localValue));
  }

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">{control.name}</p>
          <p className="text-xs text-gray-400">Slider</p>
        </div>
        <span className="text-lg font-semibold text-blue-600">{localValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={localValue}
        onChange={(e) => setLocalValue(Number(e.target.value))}
        onMouseUp={handleCommit}
        onTouchEnd={handleCommit}
        className="w-full accent-blue-600"
      />
      <div className="mt-1 flex justify-between text-xs text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
