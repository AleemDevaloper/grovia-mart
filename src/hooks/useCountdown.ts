import { useEffect, useState } from 'react'

type Countdown = {
  hours: number
  minutes: number
  seconds: number
}

function getTimeUntilMidnight(): Countdown {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const secondsRemaining = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000))

  return {
    hours: Math.floor(secondsRemaining / 3600),
    minutes: Math.floor((secondsRemaining % 3600) / 60),
    seconds: secondsRemaining % 60,
  }
}

export function useCountdown() {
  const [countdown, setCountdown] = useState(getTimeUntilMidnight)

  useEffect(() => {
    const timer = window.setInterval(() => setCountdown(getTimeUntilMidnight()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  return countdown
}
