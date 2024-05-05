'use client'

import { createPaymentIntent } from '@/app/actions/orders'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getDiscountedAmount } from '@/lib/discountCodeHelpers'
import { formatCurrency, formatDiscountCode } from '@/lib/formatters'
import { CheckoutPropsType } from '@/lib/types'
import { DiscountCodeType } from '@prisma/client'
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
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, useRef, useState } from 'react'

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string
)

const CheckoutForm = ({ product, discountCode }: CheckoutPropsType) => {
  const amount =
    discountCode == null
      ? product.priceInCents
      : getDiscountedAmount(discountCode, product.priceInCents)
  const isDiscounted = amount != product.priceInCents
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
            <div className="flex gap-4 items-baseline">
              <div
                className={
                  isDiscounted
                    ? 'line-through text-muted-foreground text-sm'
                    : ''
                }
              >
                {formatCurrency(product.priceInCents / 100)}
              </div>

              {isDiscounted && (
                <div className="text-lg">{formatCurrency(amount / 100)}</div>
              )}
            </div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            <div className="line-clamp-3 text-muted-foreground">
              {product.description}
            </div>
          </div>
        </div>
        <Elements
          options={{ amount, mode: 'payment', currency: 'usd' }}
          stripe={stripePromise}
        >
          <Form
            price={amount}
            productId={product.id as string}
            discountCode={discountCode}
          />
        </Elements>
      </div>
    </>
  )
}
export default CheckoutForm

function Form({
  price,
  productId,
  discountCode,
}: {
  price: number
  productId: string
  discountCode?: {
    id: string
    discountAmount: number
    discountType: DiscountCodeType
  }
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [email, setEmail] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const discountCodeRef = useRef<HTMLInputElement>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathName = usePathname()
  const coupon = searchParams.get('coupon')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (stripe == null || elements == null || email == null) return

    setIsLoading(true)

    const formSubmit = await elements.submit()
    if (formSubmit.error != null) {
      setErrorMessage(formSubmit.error.message)
      setIsLoading(false)
      return
    }

    const paymentIntent = await createPaymentIntent(
      email,
      productId,
      discountCode?.id
    )
    if (paymentIntent.error != null) {
      setErrorMessage(paymentIntent.error)
      setIsLoading(false)
      return
    }

    stripe
      .confirmPayment({
        elements,
        clientSecret: paymentIntent.clientSecret,
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
          <CardDescription className="text-destructive">
            {errorMessage && <div> {errorMessage}</div>}
            {coupon != null && discountCode == null && (
              <div>Invalid discount code</div>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentElement />
          <div className="mt-4">
            <LinkAuthenticationElement
              onChange={(e) => setEmail(e.value.email)}
            />
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="discountCode">Coupon</Label>
            <div className="flex gap-4 items-center">
              <Input
                id="discountCode"
                type="text"
                name="discountCode"
                className="max-w-xs w-full"
                defaultValue={coupon || ''}
                ref={discountCodeRef}
              />
              <Button
                type="button"
                onClick={() => {
                  const params = new URLSearchParams(searchParams)
                  params.set('coupon', discountCodeRef.current?.value || '')
                  router.push(`${pathName}?${params.toString()}`)
                }}
              >
                Apply
              </Button>
              {discountCode != null && (
                <div className="text-muted-foreground">
                  {formatDiscountCode(discountCode)} discount
                </div>
              )}
            </div>
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
