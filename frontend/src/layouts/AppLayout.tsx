import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: '对账批次', to: '/batches' },
  { label: '异常工作台', to: '/exceptions' },
  { label: '计费标准', to: '/pricing-rules' },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <div className="text-lg font-semibold tracking-wide">
              快递对账平台
            </div>
            <div className="text-xs text-slate-500">
              对账批次、异常审核与计费标准一体化管理
            </div>
          </div>
          <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1 transition ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
