import { useI18n } from '../../i18n/useI18n'
import { WHEN_VALUES, type When } from '../../lib/filters'
import { Segmented } from '../ui/Segmented'

interface Props {
  value: When
  onChange: (value: When) => void
}

export function WhenFilter({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <Segmented<When>
      label={t('when.group')}
      value={value}
      onChange={onChange}
      options={WHEN_VALUES.map((v) => ({ value: v, label: t(`when.${v}`) }))}
    />
  )
}
