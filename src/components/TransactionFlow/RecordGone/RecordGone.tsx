import ConfirmationContent from '@components/ConfirmationSheet/ConfirmationContent/ConfirmationContent';

interface Props {
  onClose: () => void;
}

// A message the flow's own sheet turns into, so nothing opens over it.
const RecordGone = ({ onClose }: Props) => (
  <ConfirmationContent
    title="This transaction no longer exists"
    description="It was deleted on another device or by another member of this space."
    primaryAction={{ label: 'Close', onPress: onClose }}
    secondaryAction={null}
  />
);

export default RecordGone;
