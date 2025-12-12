import { Handler } from '@netlify/functions'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { x, y } = JSON.parse(event.body || '{}')

    if (typeof x !== 'number' || typeof y !== 'number') {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid x or y coordinates' }),
      }
    }

    if (x < 0 || x >= 1024 || y < 0 || y >= 1024) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Coordinates out of range' }),
      }
    }

    const origin = event.headers.origin || event.headers.referer || 'http://localhost:8888'
    const baseUrl = new URL(origin).origin

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Pixel (${x}, ${y})`,
              description: `Purchase pixel at coordinates (${x}, ${y})`,
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/void?session_id={CHECKOUT_SESSION_ID}&x=${x}&y=${y}`,
      cancel_url: `${baseUrl}/void?canceled=true`,
      metadata: {
        x: x.toString(),
        y: y.toString(),
      },
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: JSON.stringify({ sessionId: session.id }),
    }
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create checkout session' }),
    }
  }
}

