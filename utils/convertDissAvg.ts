import { TFunction } from 'i18next';

export const convertDissAvg = (avg: number, t: TFunction) => {
  if (avg < 2) return t('convert_diss_avg_1');
  if (avg < 3) return t('convert_diss_avg_2');
  if (avg < 4) return t('convert_diss_avg_3');
  return t('convert_diss_avg_4');
};
