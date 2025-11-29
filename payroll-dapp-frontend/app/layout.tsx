// import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
// import './globals.css';
// import Providers from './providers';
// import Navbar from '@/components/Navbar';
// import ToastContainer from '@/components/ToastContainer';
// import ErrorBoundary from '@/components/ErrorBoundary';

// const inter = Inter({ subsets: ['latin'] });

// export const metadata: Metadata = {
//   title: 'Payroll DApp - GOCHAIN',
//   description: 'Hệ thống chấm công & trả lương tự động bằng blockchain',
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html>
//       <body className={inter.className}>
//         <Providers>
//           <ErrorBoundary>
//             <Navbar />
//             <main>{children}</main>
//             <ToastContainer />
//           </ErrorBoundary>
//         </Providers>
//       </body>
//     </html>
//   );
// }

// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from './providers';
import Navbar from '@/components/Navbar';
import ToastContainer from '@/components/ToastContainer';
import ErrorBoundary from '@/components/ErrorBoundary';
import RedirectHandler from '@/components/RedirectHandler';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Payroll DApp - GOCHAIN',
  description: 'Hệ thống chấm công & trả lương tự động bằng blockchain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="mdl-js">
      <body className={inter.className}>
        <Providers>
          <ErrorBoundary>
            <Navbar />
            {/* THÊM COMPONENT XỬ LÝ CHUYỂN HƯỚNG */}
            <RedirectHandler />
            <main>{children}</main>
            <ToastContainer />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
