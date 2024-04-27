import {
  ProductCard,
  ProductCardSkeleton,
} from '@/components/shared/ProductCard'
import db from '@/db/db'

import { Suspense } from 'react'

const getProducts = async () => {
  const products = await db.product.findMany({
    where: { isAvailableForPurchase: true },
    orderBy: { name: 'desc' },
  })
  return products
}

const ProductsPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Suspense
        fallback={
          <>
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
            <ProductCardSkeleton />
          </>
        }
      >
        <ProductSuspense />
      </Suspense>
    </div>
  )
}
export default ProductsPage

async function ProductSuspense() {
  const products = await getProducts()
  return products.map((product) => (
    <ProductCard key={product.id} {...product} />
  ))
}
