export default function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-[24px] font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-[13px] text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
