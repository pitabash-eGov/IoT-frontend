export default function ToggleControl({ control, onChange }) {
  const isOn = control.currentValue === 'true';

  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{control.name}</p>
        <p className="text-xs text-gray-400">Toggle</p>
      </div>
      <button
        onClick={() => onChange(isOn ? 'false' : 'true')}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          isOn ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
            isOn ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
