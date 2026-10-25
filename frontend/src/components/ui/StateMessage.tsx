import { Button } from './Button'

interface Props {
  message: string
  actionLabel: string
  onAction: () => void
}

/** Empty and error states: one sentence and a way out. */
export function StateMessage({ message, actionLabel, onAction }: Props) {
  return (
    <div className="state">
      <p>{message}</p>
      <Button variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  )
}
