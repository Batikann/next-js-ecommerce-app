import DashboardCard from '@/app/admin/_components/DashboardCard'
import db from '@/db/db'
import { formatCurrency, formatDate, formatNumber } from '@/lib/formatters'
import OrdersByDayChart from './_components/_charts/OrdersByDayChart'
import ChartCard from './_components/ChartCard'
import { Prisma } from '@prisma/client'
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachWeekOfInterval,
  eachYearOfInterval,
  endOfWeek,
  interval,
  max,
  min,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import { UsersByDayChart } from './_components/_charts/UsersByDayChart'

async function getSalesData(
  createdAfter: Date | null,
  createdBefore: Date | null
) {
  const createdAtQuery: Prisma.OrderWhereInput['createdAt'] = {}
  if (createdAfter) createdAtQuery.gte = createdAfter
  if (createdBefore) createdAtQuery.lte = createdBefore

  const [data, chartData] = await Promise.all([
    db.order.aggregate({
      _sum: { pricePaidInCents: true },
      _count: true,
    }),
    db.order.findMany({
      select: { createdAt: true, pricePaidInCents: true },
      where: { createdAt: createdAtQuery },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const dayArray = eachDayOfInterval(
    interval(
      createdAfter || startOfDay(chartData[0].createdAt),
      createdBefore || new Date()
    )
  ).map((date) => {
    return {
      date: formatDate(date),
      totalSales: 0,
    }
  })

  return {
    chartData: chartData.reduce((data, order) => {
      const formattedDate = formatDate(order.createdAt)
      const entry = dayArray.find((day) => day.date === formattedDate)
      if (entry == null) return data
      entry.totalSales += order.pricePaidInCents / 100
      return data
    }, dayArray),
    amount: (data._sum.pricePaidInCents || 0) / 100,
    numberOfSales: data._count,
  }
}

async function getUserData(
  createdAfter: Date | null,
  createdBefore: Date | null
) {
  const createdAtQuery: Prisma.UserWhereInput['createdAt'] = {}
  if (createdAfter) createdAtQuery.gte = createdAfter
  if (createdBefore) createdAtQuery.lte = createdBefore

  const [userCount, orderData, chartData] = await Promise.all([
    db.user.count(),
    db.order.aggregate({
      _sum: { pricePaidInCents: true },
    }),
    db.user.findMany({
      select: { createdAt: true },
      where: { createdAt: createdAtQuery },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const { array, format } = getChartDateArray(
    createdAfter || startOfDay(chartData[0].createdAt),
    createdBefore || new Date()
  )

  const dayArray = array.map((date) => {
    return {
      date: format(date),
      totalUsers: 0,
    }
  })

  return {
    chartData: chartData.reduce((data, user) => {
      const formattedDate = format(user.createdAt)
      const entry = dayArray.find((day) => day.date === formattedDate)
      if (entry == null) return data
      entry.totalUsers += 1
      return data
    }, dayArray),
    userCount,
    averageValuePerUser:
      userCount === 0
        ? 0
        : (orderData._sum.pricePaidInCents || 0) / userCount / 100,
  }
}

async function getProductData() {
  const [activeCount, inactiveCount] = await Promise.all([
    db.product.count({
      where: { isAvailableForPurchase: true },
    }),
    db.product.count({
      where: { isAvailableForPurchase: false },
    }),
  ])
  return { activeCount, inactiveCount }
}

const AdminDashboard = async () => {
  const data = {
    title: 'Sales',
    subtitle: 'desc',
    body: 'Test',
  }

  const [salesData, userData, productData] = await Promise.all([
    getSalesData(subDays(new Date(), 16), new Date()),
    getUserData(subDays(new Date(), 16), new Date()),
    getProductData(),
  ])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DashboardCard
          title="Sales"
          subtitle={`${formatNumber(salesData.numberOfSales)} Orders`}
          body={formatCurrency(salesData.amount)}
        />
        <DashboardCard
          title="Customers"
          subtitle={`${formatCurrency(
            userData.averageValuePerUser
          )} Average Value`}
          body={formatNumber(userData.userCount)}
        />
        <DashboardCard
          title="Active Products"
          subtitle={`${formatNumber(productData.inactiveCount)} Inactive`}
          body={formatNumber(productData.activeCount)}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2  gap-4 mt-4">
        <ChartCard title="Total Sales">
          <OrdersByDayChart data={salesData.chartData} />
        </ChartCard>
        <ChartCard title="New Customers">
          <UsersByDayChart data={userData.chartData} />
        </ChartCard>
      </div>
    </>
  )
}
export default AdminDashboard

function getChartDateArray(startDate: Date, endDate: Date = new Date()) {
  const days = differenceInDays(endDate, startDate)
  if (days < 30) {
    return {
      array: eachDayOfInterval(interval(startDate, endDate)),
      format: formatDate,
    }
  }

  const weeks = differenceInWeeks(endDate, startDate)
  if (weeks < 30) {
    return {
      array: eachWeekOfInterval(interval(startDate, endDate)),
      format: (date: Date) => {
        const start = max([startOfWeek(date), startDate])
        const end = min([endOfWeek(date), endDate])

        return `${formatDate(start)} - ${formatDate(end)}`
      },
    }
  }

  const months = differenceInMonths(endDate, startDate)
  if (months < 30) {
    return {
      array: eachMonthOfInterval(interval(startDate, endDate)),
      format: new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' })
        .format,
    }
  }

  return {
    array: eachYearOfInterval(interval(startDate, endDate)),
    format: new Intl.DateTimeFormat('en', { year: 'numeric' }).format,
  }
}
