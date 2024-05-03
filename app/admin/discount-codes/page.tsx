import { Button } from '@/components/ui/button'
import PageHeader from '../_components/PageHeader'
import Link from 'next/link'
import DiscountCodeTable from './_components/DiscountCodeTable'
import { Prisma } from '@prisma/client'
import db from '@/db/db'

const WHERE_EXPIRED: Prisma.DiscountCodeWhereInput = {
  OR: [
    { limit: { not: null, lte: db.discountCode.fields.uses } },
    { expiresAt: { not: null, lte: new Date() } },
  ],
}

const SELECT_FIELDS: Prisma.DiscountCodeSelect = {
  id: true,
  allProducts: true,
  code: true,
  discountAmount: true,
  discountType: true,
  expiresAt: true,
  limit: true,
  uses: true,
  isActive: true,
  products: { select: { name: true } },
  _count: { select: { orders: true } },
}

function getExpiredDiscountCodes() {
  return db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: WHERE_EXPIRED,
    orderBy: { createdAt: 'asc' },
  })
}

function getUnexpiredDiscountCodes() {
  return db.discountCode.findMany({
    select: SELECT_FIELDS,
    where: { NOT: WHERE_EXPIRED },
    orderBy: { createdAt: 'asc' },
  })
}

export type DiscountCodesTableProps = {
  discountCodes: Awaited<ReturnType<typeof getUnexpiredDiscountCodes>>
  isInActive?: boolean
  canDeactivate?: boolean
}

const DiscountCodesPage = async () => {
  const [expiredDiscountCodes, unExpiredDiscountCodes] = await Promise.all([
    getExpiredDiscountCodes(),
    getUnexpiredDiscountCodes(),
  ])
  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <PageHeader>Coupon Codes</PageHeader>
        <Button>
          <Link href="/admin/discount-codes/new">Add Coupon</Link>
        </Button>
      </div>
      <DiscountCodeTable discountCodes={unExpiredDiscountCodes} canDeactivate />

      <div className="mt-8">
        <h2 className="text-xl font-bold">Expired Coupons</h2>
        <DiscountCodeTable discountCodes={expiredDiscountCodes} isInActive />
      </div>
    </>
  )
}
export default DiscountCodesPage
