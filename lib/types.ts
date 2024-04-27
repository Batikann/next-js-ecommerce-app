import { Product } from '@prisma/client'

export type DashboardCardType = {
  title: string
  subtitle: string
  body: string
}

export type ProductGridSectionProps = {
  title: string
  productsFetcher: () => Promise<Product[]>
}

export type ProductCardProps = {
  id: string
  name: string
  priceInCents: number
  description: string
  imagePath: string
}
