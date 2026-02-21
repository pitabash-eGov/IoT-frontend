import {
  Lightbulb,
  Thermometer,
  ToggleLeft,
  Activity,
  Camera,
  Lock,
  Fan,
  Cpu,
} from 'lucide-react';

const iconMap = {
  LIGHT: { icon: Lightbulb, color: 'text-yellow-500' },
  THERMOSTAT: { icon: Thermometer, color: 'text-red-500' },
  SWITCH: { icon: ToggleLeft, color: 'text-blue-500' },
  SENSOR: { icon: Activity, color: 'text-green-500' },
  CAMERA: { icon: Camera, color: 'text-purple-500' },
  LOCK: { icon: Lock, color: 'text-gray-600' },
  FAN: { icon: Fan, color: 'text-cyan-500' },
  CUSTOM: { icon: Cpu, color: 'text-orange-500' },
};

export function getDeviceIcon(type) {
  return iconMap[type] || iconMap.CUSTOM;
}

export const DEVICE_TYPES = [
  'LIGHT',
  'THERMOSTAT',
  'SWITCH',
  'SENSOR',
  'CAMERA',
  'LOCK',
  'FAN',
  'CUSTOM',
];

export const CONTROL_TYPES = [
  'TOGGLE',
  'SLIDER',
  'BUTTON',
  'DROPDOWN',
  'COLOR_PICKER',
];
