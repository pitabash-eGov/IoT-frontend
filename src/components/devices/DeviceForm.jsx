import { useState } from 'react';
import { DEVICE_TYPES, CONTROL_TYPES } from '../../utils/deviceIcons';
import { Plus, Trash2 } from 'lucide-react';

const emptyControl = {
  name: '',
  controlType: 'TOGGLE',
  currentValue: '',
  minValue: null,
  maxValue: null,
  step: null,
  options: [],
  mqttTopic: '',
};

export default function DeviceForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'LIGHT',
    location: {
      latitude: initial?.location?.latitude ?? '',
      longitude: initial?.location?.longitude ?? '',
      address: initial?.location?.address || '',
      label: initial?.location?.label || '',
    },
    mqttTopicPrefix: initial?.mqttTopicPrefix || '',
    controls: initial?.controls?.map((c) => ({ ...c })) || [],
  });

  const [optionInput, setOptionInput] = useState({});

  function updateField(path, value) {
    setForm((prev) => {
      const next = { ...prev };
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        if (Array.isArray(obj[keys[i]])) {
          obj[keys[i]] = [...obj[keys[i]]];
          obj = obj[keys[i]];
        } else {
          obj[keys[i]] = { ...obj[keys[i]] };
          obj = obj[keys[i]];
        }
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  }

  function addControl() {
    setForm((prev) => ({
      ...prev,
      controls: [...prev.controls, { ...emptyControl }],
    }));
  }

  function removeControl(index) {
    setForm((prev) => ({
      ...prev,
      controls: prev.controls.filter((_, i) => i !== index),
    }));
  }

  function updateControl(index, field, value) {
    setForm((prev) => {
      const controls = prev.controls.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      );
      return { ...prev, controls };
    });
  }

  function addOption(index) {
    const val = (optionInput[index] || '').trim();
    if (!val) return;
    setForm((prev) => {
      const controls = prev.controls.map((c, i) =>
        i === index ? { ...c, options: [...(c.options || []), val] } : c
      );
      return { ...prev, controls };
    });
    setOptionInput((prev) => ({ ...prev, [index]: '' }));
  }

  function removeOption(controlIndex, optIndex) {
    setForm((prev) => {
      const controls = prev.controls.map((c, i) =>
        i === controlIndex
          ? { ...c, options: c.options.filter((_, j) => j !== optIndex) }
          : c
      );
      return { ...prev, controls };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const payload = {
      ...form,
      location: {
        ...form.location,
        latitude: form.location.latitude !== '' ? Number(form.location.latitude) : null,
        longitude: form.location.longitude !== '' ? Number(form.location.longitude) : null,
      },
      controls: form.controls.map((c) => ({
        ...c,
        id: c.id || undefined,
        minValue: c.minValue !== null && c.minValue !== '' ? Number(c.minValue) : null,
        maxValue: c.maxValue !== null && c.maxValue !== '' ? Number(c.maxValue) : null,
        step: c.step !== null && c.step !== '' ? Number(c.step) : null,
      })),
    };
    onSubmit(payload);
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Name & Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            className={inputCls}
            placeholder="Living Room Light"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Type</label>
          <select
            value={form.type}
            onChange={(e) => updateField('type', e.target.value)}
            className={inputCls}
          >
            {DEVICE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Location */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-gray-700">Location</legend>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.location.latitude}
              onChange={(e) => updateField('location.latitude', e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.location.longitude}
              onChange={(e) => updateField('location.longitude', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Address</label>
          <input
            value={form.location.address}
            onChange={(e) => updateField('location.address', e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">Label</label>
          <input
            value={form.location.label}
            onChange={(e) => updateField('location.label', e.target.value)}
            className={inputCls}
            placeholder="e.g. Kitchen, Warehouse A"
          />
        </div>
      </fieldset>

      {/* MQTT Topic Prefix */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">MQTT Topic Prefix</label>
        <input
          value={form.mqttTopicPrefix}
          onChange={(e) => updateField('mqttTopicPrefix', e.target.value)}
          className={inputCls}
          placeholder="home/livingroom"
        />
      </div>

      {/* Controls */}
      <fieldset className="space-y-3 rounded-lg border p-4">
        <legend className="px-2 text-sm font-medium text-gray-700">Controls</legend>
        {form.controls.map((ctrl, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Control #{i + 1}</span>
              <button type="button" onClick={() => removeControl(i)} className="text-red-400 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                required
                placeholder="Control name"
                value={ctrl.name}
                onChange={(e) => updateControl(i, 'name', e.target.value)}
                className={inputCls}
              />
              <select
                value={ctrl.controlType}
                onChange={(e) => updateControl(i, 'controlType', e.target.value)}
                className={inputCls}
              >
                {CONTROL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <input
              placeholder="MQTT Topic"
              value={ctrl.mqttTopic || ''}
              onChange={(e) => updateControl(i, 'mqttTopic', e.target.value)}
              className={inputCls}
            />

            {ctrl.controlType === 'SLIDER' && (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Min</label>
                  <input type="number" step="any" value={ctrl.minValue ?? ''} onChange={(e) => updateControl(i, 'minValue', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Max</label>
                  <input type="number" step="any" value={ctrl.maxValue ?? ''} onChange={(e) => updateControl(i, 'maxValue', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Step</label>
                  <input type="number" step="any" value={ctrl.step ?? ''} onChange={(e) => updateControl(i, 'step', e.target.value)} className={inputCls} />
                </div>
              </div>
            )}

            {ctrl.controlType === 'DROPDOWN' && (
              <div className="space-y-1">
                <label className="text-xs text-gray-500">Options</label>
                <div className="flex flex-wrap gap-1">
                  {(ctrl.options || []).map((opt, j) => (
                    <span key={j} className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                      {opt}
                      <button type="button" onClick={() => removeOption(i, j)} className="hover:text-red-500">&times;</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1">
                  <input
                    placeholder="Add option"
                    value={optionInput[i] || ''}
                    onChange={(e) => setOptionInput((p) => ({ ...p, [i]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption(i); } }}
                    className={inputCls}
                  />
                  <button type="button" onClick={() => addOption(i)} className="rounded-lg bg-blue-100 px-3 text-sm text-blue-700 hover:bg-blue-200">
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addControl}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500"
        >
          <Plus className="h-4 w-4" /> Add Control
        </button>
      </fieldset>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {submitting ? 'Saving...' : 'Save Device'}
      </button>
    </form>
  );
}
