// https://fonts.google.com/

import { Inter, Karla, Pacifico, Poppins } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export const pacifico = Pacifico({
  weight: "400",
  display: "swap",
  preload: false,
})

export const karla = Karla({
  subsets: ['latin'],
  display: 'swap',
})

export const poppinsMediumItalic = Poppins({
  weight: '500',
  style: 'italic',
  subsets: ['latin'],
  display: 'swap',
})