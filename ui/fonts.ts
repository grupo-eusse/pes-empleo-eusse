import { Montserrat, Satisfy } from "next/font/google";

export const satisfy = Satisfy({
  subsets: ['latin'],
  weight: '400',          
  display: 'swap',
  variable: '--font-script',
});

export const montserratBold = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: '800',
});

export const montserratSemiBold = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: '600',
});
export const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: '400',
});
