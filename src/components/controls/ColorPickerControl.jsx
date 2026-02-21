export default function ColorPickerControl({ control, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{control.name}</p>
        <p className="text-xs text-gray-400">Color Picker</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">{control.currentValue || '#000000'}</span>
        <input
          type="color"
          value={control.currentValue || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border"
        />
      </div>
    </div>
  );
}
