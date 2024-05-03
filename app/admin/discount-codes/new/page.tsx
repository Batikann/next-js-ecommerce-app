import db from '@/db/db'
import PageHeader from '../../_components/PageHeader'
import DiscountCodeForm from '../_components/DiscountCodeForm'

const NewDiscountCodePage = async () => {
  const products = await db.product.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
  return (
    <>
      <PageHeader>Add Coupon</PageHeader>
      <DiscountCodeForm products={products} />
    </>
  )
}
export default NewDiscountCodePage
