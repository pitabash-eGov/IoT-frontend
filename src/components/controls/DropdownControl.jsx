export default function DropdownControl({ control, onChange }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="mb-1 text-sm font-medium text-gray-900">{control.name}</p>
      <p className="mb-2 text-xs text-gray-400">Dropdown</p>
      <select
        value={control.currentValue || ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="" disabled>Select an option</option>
        {(control.options || []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}
