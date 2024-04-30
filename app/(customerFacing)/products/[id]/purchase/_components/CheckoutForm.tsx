'use client'

import { userOrderExists } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatCurrency } from '@/lib/formatters'
import { CheckoutPropsType } from '@/lib/types'
import {
  Elements,
  LinkAuthenticationElement,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { LoaderCircle } from 'lucide-react'
import Image from 'next/image'
import { FormEvent, useState } from 'react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
)

const CheckoutForm = ({ product, clientSecret }: CheckoutPropsType) => {
  return (
    <>
      <div className="max-w-5xl w-full mx-auto space-y-8">
        <div className="flex gap-4 items-center">
          <div className=" aspect-video flex-shrink w-1/3 relative">
            <Image
              src={product.imagePath}
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <div className="text-lg">
              {formatCurrency(product.priceInCents / 100)}
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="line-clamp-3 text-muted-foreground">
              {product.description}
            </div>
          </div>
        </div>
        <Elements options={{ clientSecret }} stripe={stripePromise}>
          <Form price={product.priceInCents} productId={product.id as string} />
        </Elements>
      </div>
    </>
  )
}
export default CheckoutForm

function Form({ price, productId }: { price: number; productId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (stripe == null || elements == null || email == null) return

    setIsLoading(true)

    const orderExist = await userOrderExists(email, productId)

    if (orderExist) {
      setErrorMessage(
        'You have already purchased this product.Try dowloading it from the my orders page'
      )
      setIsLoading(false)
      return
    }

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/stripe/purchase-success`,
        },
      })
      .then(({ error }) => {
        if (error.type === 'card_error' || error.type === 'validation_error') {
          setErrorMessage(error.message)
        } else {
          setErrorMessage('An unkown error occurred')
        }
      })
      .finally(() => setIsLoading(false))
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          {errorMessage && (
            <CardDescription className="text-destructive">
              {errorMessage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <div className="mt-4">
            <LinkAuthenticationElement
              onChange={(e) => setEmail(e.value.email)}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            size="lg"
            disabled={stripe == null || elements == null || isLoading}
          >
            {isLoading ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              `Purchase - ${formatCurrency(price / 100)}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
