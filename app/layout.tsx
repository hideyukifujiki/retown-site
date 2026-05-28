import "./globals.css";

export const metadata = {
  title: "リタウン 管理画面",
  description: "リタウン出張買取 管理画面",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
