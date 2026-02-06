import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { label: '对账批次', to: '/batches' },
  { label: '异常工作台', to: '/exceptions' },
  { label: '计费标准', to: '/pricing-rules' },
];

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="text-lg font-semibold tracking-wide">
            快递对账平台
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition ${
                    isActive
                      ? 'text-slate-900'
                      : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
