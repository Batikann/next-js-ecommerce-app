import { Nav, NavLink } from '@/components/shared/Nav'

export const dynamic = 'force-dynamic'

const AdminLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  return (
    <>
      <Nav>
        <NavLink href="/admin">Dashboard</NavLink>
        <NavLink href="/admin/products">Products</NavLink>
        <NavLink href="/admin/users">Customers</NavLink>
        <NavLink href="/admin/orders">Sales</NavLink>
        <NavLink href="/admin/discount-codes">Coupons</NavLink>
      </Nav>
      <div className="container my-6">{children}</div>
    </>
  )
}
export default AdminLayout
