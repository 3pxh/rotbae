import { Handler } from '@netlify/functions'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  const sig = event.headers['stripe-signature'] || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body || '', sig, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Webhook signature verification failed' }),
    }
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session

    const x = parseInt(session.metadata?.x || '0', 10)
    const y = parseInt(session.metadata?.y || '0', 10)

    if (x >= 0 && x < 1024 && y >= 0 && y < 1024) {
      try {
        // Upsert the pixel (update if exists, insert if not)
        const { error } = await supabase
          .from('pixels')
          .upsert(
            {
              x,
              y,
              color: 'black',
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'x,y',
            }
          )

        if (error) {
          console.error('Error updating pixel in Supabase:', error)
          return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update pixel' }),
          }
        }
      } catch (error) {
        console.error('Error processing webhook:', error)
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to process webhook' }),
        }
      }
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  }
}

