import { formatDistanceToNow, format, isPast } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDeadline = (date) =>
  format(new Date(date), "d MMM yyyy 'à' HH:mm", { locale: fr })

export const timeLeft = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr })

export const isExpired = (date) => isPast(new Date(date))

export const urgencyLevel = (deadline) => {
  const diff = new Date(deadline) - new Date()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 0)   return 'expired'
  if (hours < 24)  return 'urgent'
  if (hours < 72)  return 'soon'
  return 'ok'
}

export const initials = (name) =>
  name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '??'

export const clx = (...classes) => classes.filter(Boolean).join(' ')