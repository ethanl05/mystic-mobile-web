const items = [
  { href: "/", label: "首页" },
  { href: "/records", label: "记录" },
  { href: "/me", label: "我的" }
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ddd2c0] bg-[#fffaf1]/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-[430px] grid-cols-3">
        {items.map((item) => (
          <a key={item.href} href={item.href} className="flex items-center justify-center text-sm font-semibold text-[#3a3028]">
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
