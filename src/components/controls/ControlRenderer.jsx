import ToggleControl from './ToggleControl';
import SliderControl from './SliderControl';
import ButtonControl from './ButtonControl';
import DropdownControl from './DropdownControl';
import ColorPickerControl from './ColorPickerControl';

const controlMap = {
  TOGGLE: ToggleControl,
  SLIDER: SliderControl,
  BUTTON: ButtonControl,
  DROPDOWN: DropdownControl,
  COLOR_PICKER: ColorPickerControl,
};

export default function ControlRenderer({ control, onChange }) {
  const Component = controlMap[control.controlType];
  if (!Component) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-gray-400">
        Unknown control type: {control.controlType}
      </div>
    );
  }
  return <Component control={control} onChange={onChange} />;
}
