export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container-page grid gap-12 py-12 md:py-20 lg:grid-cols-[1fr_480px] lg:items-start">
      <div className="surface-dark relative hidden min-h-[520px] overflow-hidden rounded-3xl bg-background p-10 lg:grid lg:content-end">
        <div
          aria-hidden
          className="absolute -top-24 -left-24 size-96 rounded-full border-[48px] border-lime/90"
        />
        <div aria-hidden className="absolute right-10 bottom-40 size-24 rounded-full bg-lime" />
        <p className="relative max-w-md font-display text-5xl leading-[0.95] font-extrabold tracking-tight">
          Every great night out starts with a <span className="text-lime">ticket.</span>
        </p>
      </div>
      <div className="w-full max-w-lg justify-self-center lg:justify-self-stretch">{children}</div>
    </div>
  );
}
