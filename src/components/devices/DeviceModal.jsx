import Modal from '../ui/Modal';
import DeviceForm from './DeviceForm';

export default function DeviceModal({ open, onClose, device, onSubmit, submitting }) {
  return (
    <Modal open={open} onClose={onClose} title={device ? 'Edit Device' : 'Add Device'}>
      <DeviceForm
        initial={device}
        onSubmit={onSubmit}
        submitting={submitting}
      />
    </Modal>
  );
}
