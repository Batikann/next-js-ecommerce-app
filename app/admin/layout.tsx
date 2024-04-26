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
        <NavLink href="/admin/customers">Customers</NavLink>
        <NavLink href="/admin/sales">Sales</NavLink>
      </Nav>
      <div className="container my-6">{children}</div>
    </>
  )
}
export default AdminLayout
