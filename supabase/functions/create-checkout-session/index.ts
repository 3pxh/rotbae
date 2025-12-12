import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || ''
if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY is not set')
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-12-18.acacia',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Log headers for debugging (Supabase Edge Functions require Authorization header)
  const authHeader = req.headers.get('authorization')
  const apikeyHeader = req.headers.get('apikey')
  console.log('Request headers:', {
    hasAuth: !!authHeader,
    hasApikey: !!apikeyHeader,
    authPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
  })
  
  // Note: Supabase Edge Functions automatically validate the JWT in the Authorization header
  // If we get here, the JWT validation has already passed (or the function allows anonymous access)

  // Check if Stripe key is configured
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables')
    return new Response(
      JSON.stringify({ 
        error: 'Server configuration error',
        details: 'STRIPE_SECRET_KEY is not configured. Please set it in Supabase Edge Functions secrets.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await req.json()
    console.log('Received request body:', body)
    
    const { x, y } = body

    if (typeof x !== 'number' || typeof y !== 'number') {
      console.error('Invalid coordinates:', { x, y, xType: typeof x, yType: typeof y })
      return new Response(
        JSON.stringify({ error: 'Invalid x or y coordinates', received: { x, y } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (x < 0 || x >= 1024 || y < 0 || y >= 1024) {
      return new Response(
        JSON.stringify({ error: 'Coordinates out of range' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get origin from request headers
    const origin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:5173'
    const baseUrl = new URL(origin).origin

    console.log('Creating Stripe checkout session for pixel:', { x, y, baseUrl })
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `pixel(${x}, ${y}) -> black`,
              description: `turn the pixel @ (${x}, ${y}) black.`,
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/?session_id={CHECKOUT_SESSION_ID}&x=${x}&y=${y}`,
      cancel_url: `${baseUrl}/?canceled=true`,
      metadata: {
        x: x.toString(),
        y: y.toString(),
      },
    })

    console.log('Stripe session created:', session.id)
    
    // Return both sessionId and checkoutUrl for compatibility
    // The checkoutUrl is the new way to redirect (redirectToCheckout is deprecated)
    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        checkoutUrl: session.url 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorDetails = error instanceof Error && error.cause ? String(error.cause) : undefined
    
    // If it's a Stripe error, include more details
    const stripeError = error as any
    const stripeErrorMessage = stripeError?.message || stripeError?.raw?.message || errorMessage
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: stripeErrorMessage,
        type: error instanceof Error ? error.constructor.name : typeof error,
        ...(errorDetails && { cause: errorDetails })
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

