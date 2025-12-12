import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

// Use anon key instead of service role key
// The database function insert_black_pixel() runs with SECURITY DEFINER
// so it can insert even with anon key
// Note: Supabase Edge Functions automatically inject SUPABASE_URL and SUPABASE_ANON_KEY
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

Deno.serve(async (req) => {
  // Log incoming request for debugging
  console.log('Webhook received:', {
    method: req.method,
    url: req.url,
    hasStripeSignature: !!req.headers.get('stripe-signature'),
    headers: Object.fromEntries(req.headers.entries()),
  })

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const sig = req.headers.get('stripe-signature') || ''
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''

  console.log('Webhook signature check:', {
    hasSignature: !!sig,
    signatureLength: sig.length,
    hasWebhookSecret: !!webhookSecret,
    webhookSecretLength: webhookSecret.length,
    webhookSecretPrefix: webhookSecret ? webhookSecret.substring(0, 10) + '...' : 'missing',
  })

  if (!sig) {
    console.error('Missing stripe-signature header')
    return new Response(
      JSON.stringify({ error: 'Missing stripe-signature header' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return new Response(
      JSON.stringify({ error: 'Webhook secret not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const body = await req.text()
  console.log('Webhook body length:', body.length)
  
  let stripeEvent: Stripe.Event

  try {
    // Use constructEventAsync for Deno/Edge Functions (async context required)
    stripeEvent = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
    console.log('Webhook signature verified successfully')
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    console.error('Error details:', err instanceof Error ? err.message : String(err))
    return new Response(
      JSON.stringify({ 
        error: 'Webhook signature verification failed',
        details: err instanceof Error ? err.message : String(err)
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Handle the checkout.session.completed event
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session

    console.log('Processing checkout.session.completed event:', {
      sessionId: session.id,
      metadata: session.metadata,
    })

    const x = parseInt(session.metadata?.x || '0', 10)
    const y = parseInt(session.metadata?.y || '0', 10)

    console.log('Parsed coordinates:', { x, y })

    if (x >= 0 && x < 1024 && y >= 0 && y < 1024) {
      try {
        console.log('Calling insert_black_pixel function with:', { pixel_x: x, pixel_y: y })
        
        // Call database function to insert black pixel
        // This function runs with SECURITY DEFINER, so it bypasses RLS
        const { data, error } = await supabase.rpc('insert_black_pixel', {
          pixel_x: x,
          pixel_y: y,
        })

        if (error) {
          console.error('Error updating pixel in Supabase:', error)
          console.error('Error details:', JSON.stringify(error, null, 2))
          return new Response(
            JSON.stringify({ 
              error: 'Failed to update pixel',
              details: error.message,
              code: error.code,
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          )
        }

        console.log('Successfully inserted black pixel:', { x, y, data })
      } catch (error) {
        console.error('Error processing webhook:', error)
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
        return new Response(
          JSON.stringify({ 
            error: 'Failed to process webhook',
            details: error instanceof Error ? error.message : String(error),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    } else {
      console.error('Invalid coordinates:', { x, y })
      return new Response(
        JSON.stringify({ error: 'Invalid coordinates', x, y }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  } else {
    console.log('Received event type:', stripeEvent.type, '- ignoring')
  }

  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
})

