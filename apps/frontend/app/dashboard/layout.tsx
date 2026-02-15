import { Nav } from '../../components/nav';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <div><Nav /><div className="p-6">{children}</div></div>;
}
