import * as React from "react";
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

const Layout = React.forwardRef<HTMLDivElement, LayoutProps>(({ children, hideFooter = false }, ref) => {
  return (
    <div ref={ref} className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
});

Layout.displayName = "Layout";

export default Layout;
