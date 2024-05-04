import db from '@/db/db'
import { notFound } from 'next/navigation'
import CheckoutForm from './_components/CheckoutForm'
import { usableDiscountCodeWhere } from '@/lib/discountCodeHelpers'

const PurchasePage = async ({
  params: { id },
  searchParams: { coupon },
}: {
  params: { id: string }
  searchParams: { coupon?: string }
}) => {
  const product = await db.product.findUnique({ where: { id } })

  if (product === null) return notFound()

  const discountCode =
    coupon == null ? undefined : await getDiscountCode(coupon, product.id)

  return (
    <CheckoutForm product={product} discountCode={discountCode || undefined} />
  )
}
export default PurchasePage

function getDiscountCode(coupon: string, productId: string) {
  return db.discountCode.findUnique({
    select: { id: true, discountAmount: true, discountType: true },
    where: { ...usableDiscountCodeWhere, code: coupon },
  })
}
