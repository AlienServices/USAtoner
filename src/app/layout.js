import './globals.css'
import { Inter } from 'next/font/google'
import { TonerProvider } from "../app/providers/toner/index";
import { CartProvider } from "../app/providers/cart/index";

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'USA Toner',
  description: 'American Made Toner!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <CartProvider>
        <TonerProvider>
          <body className={inter.className}>{children}</body>
        </TonerProvider>
      </CartProvider>
    </html>
  )
}
