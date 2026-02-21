export default function ButtonControl({ control, onChange }) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{control.name}</p>
        <p className="text-xs text-gray-400">Button</p>
      </div>
      <button
        onClick={() => onChange('pressed')}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:scale-95"
      >
        Press
      </button>
    </div>
  );
}
