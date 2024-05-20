import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { Card, Divider } from '@components';
import { useAppSelector } from '@redux/hooks';
import { selectHolding } from '@redux/state/holding/selectors';
import { selectProfile } from '@redux/state/profile/selectors';
import { formatNumber } from '@shared/utils';

import styles from './style';

const General = () => {
  const { holdings } = useAppSelector(selectHolding);
  const { holding, totalIncome, totalSpend } = holdings?.[0] || {};
  const { baseCurrency } = useAppSelector(selectProfile);

  const data = [
    { title: 'Spend', amount: `${formatNumber(totalSpend || 0)} ${baseCurrency?.code}` },
    { title: 'Received', amount: `${formatNumber(totalIncome || 0)} ${baseCurrency?.code}` },
    { title: 'Balance', amount: `${formatNumber(Number(holding?.balance || 0))} ${holding?.currency.code}` },
  ];

  return (
    <Card>
      {data.map((item, index) => (
        <Fragment key={item.title}>
          <View style={styles.infoContainer}>
            <Text style={styles.title}>{item.title}</Text>

            <Text style={styles.amount}>{item.amount}</Text>
          </View>

          {index !== data.length - 1 && <Divider style={styles.divider} />}
        </Fragment>
      ))}
    </Card>
  );
};

export default General;
