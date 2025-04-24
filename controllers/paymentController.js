const Stripe = require('stripe');

require("dotenv").config();

const stripeSecretKey=process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecretKey);
exports.getCheckoutSession = async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 1000, // $10.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });
    console.log("Session stripe",session);

    res.status(200).json({ success: true, sessionId: session.id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
};