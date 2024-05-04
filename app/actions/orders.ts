'use server'

import db from '@/db/db'
import {
  getDiscountedAmount,
  usableDiscountCodeWhere,
} from '@/lib/discountCodeHelpers'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function userOrderExists(email: string, productId: string) {
  return (
    (await db.order.findFirst({
      where: { user: { email }, productId },
      select: { id: true },
    })) != null
  )
}

export async function createPaymentIntent(
  email: string,
  productId: string,
  discountCodeId?: string
) {
  const product = await db.product.findUnique({ where: { id: productId } })
  if (product == null) return { error: 'Unexpected Error' }

  const discountCode =
    discountCodeId == null
      ? null
      : await db.discountCode.findUnique({
          where: { id: discountCodeId, ...usableDiscountCodeWhere(product.id) },
        })

  if (discountCode == null && discountCodeId != null) {
    return { error: 'Coupon has expired' }
  }
  const existingOrder = await db.order.findFirst({
    where: { user: { email }, productId },
    select: { id: true },
  })

  if (existingOrder != null) {
    return {
      error:
        'You have already purchased this product.Try dowloading it from the my orders page',
    }
  }

  const amount =
    discountCode == null
      ? product.priceInCents
      : getDiscountedAmount(discountCode, product.priceInCents)

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'USD',
    metadata: {
      productId: product.id,
      discountCodeId: discountCode?.id || null,
    },
  })

  if (paymentIntent.client_secret == null) {
    return { error: 'unkown error' }
  }

  return { clientSecret: paymentIntent.client_secret }
}
