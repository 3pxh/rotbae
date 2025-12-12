import { loadStripe } from '@stripe/stripe-js'
import { PUBLIC_ENV_KEYS } from '../../PubKeysEnv'

const stripePublishableKey = PUBLIC_ENV_KEYS.STRIPE_PUBLISHABLE_KEY

export const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

