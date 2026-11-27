import { useState } from 'react';

import type { Currency, Space } from '@api/dto';
import ConfirmationSheet from '@components/ConfirmationSheet/ConfirmationSheet';
import CurrencySheet from '@components/CurrencySheet/CurrencySheet';
import { useConfirmation, useCurrencyOptions, useToast } from '@hooks';
import { useUpdateSpaceCurrencyMutation } from '@redux/state/space/api';
import { getErrorMessage } from '@shared/utils';
import { currencySymbol } from '@shared/utils/currency';

import SettingsRow from '../SettingsRow/SettingsRow';

interface Props {
  space: Space;
}

// The owner relabels the space's currency; every amount keeps its number, nothing is converted.
const SpaceCurrencyRow = ({ space }: Props) => {
  const isOwner = space.role === 'owner';
  const { currencies } = useCurrencyOptions();
  const [isPicking, setPicking] = useState(false);
  const { lock, confirmation } = useConfirmation();
  const [updateCurrency] = useUpdateSpaceCurrencyMutation();
  const toast = useToast();

  const confirmChange = (currency: Currency) =>
    lock.ask((settle) => ({
      title: `Show amounts in ${currency.name}?`,
      description: `Every amount in “${space.name}” keeps its number and is shown in ${currency.code} (${currencySymbol(currency.code)}). Nothing is converted, and members see the change too.`,
      primaryAction: {
        label: 'Change currency',
        onPress: async () => {
          if (!settle()) return;

          const ticket = toast.begin();
          try {
            await updateCurrency({ spaceId: space.id, currencyId: currency.id }).unwrap();
            ticket.show({ tone: 'success', text: `Amounts are now shown in ${currency.code}` });
          } catch (error) {
            ticket.show({ tone: 'error', text: `Couldn’t change the currency: ${getErrorMessage(error)}` });
          }
        },
      },
      onCancel: settle,
    }));

  return (
    <>
      <SettingsRow
        icon="chart"
        label="Space currency"
        sub={isOwner ? 'Shown on every amount; nothing is converted' : 'Only the owner can change it'}
        value={`${currencySymbol(space.currency.code)} ${space.currency.code}`}
        chevron={isOwner}
        onPress={isOwner ? () => setPicking(true) : undefined}
      />

      {isOwner && (
        <CurrencySheet
          isVisible={isPicking}
          currencies={currencies}
          selectedId={space.currency.id}
          title="Space currency"
          onSelect={(currency) => {
            setPicking(false);
            if (currency.id !== space.currency.id) confirmChange(currency);
          }}
          onClose={() => setPicking(false)}
        />
      )}

      <ConfirmationSheet confirmation={confirmation} />
    </>
  );
};

export default SpaceCurrencyRow;
