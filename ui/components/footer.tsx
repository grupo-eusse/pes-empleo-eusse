import Image from 'next/image';
import Link from 'next/link';
import { FaFacebookF, FaYoutube, FaInstagram } from 'react-icons/fa';

const SOCIAL_LINKS = [
  { href: 'https://www.facebook.com',  icon: FaFacebookF, label: 'Facebook',  hover: 'hover:text-blue-400' },
  { href: 'https://www.youtube.com',   icon: FaYoutube,   label: 'YouTube',   hover: 'hover:text-red-500'  },
  { href: 'https://www.instagram.com', icon: FaInstagram, label: 'Instagram', hover: 'hover:text-pink-500' },
];

export default function Footer() {
  return (
    <footer className="bg-[#003366] text-white py-4 px-6 md:px-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        <Image src="/logo-eusse-peq.png"      alt="Grupo Eusse" width={80}  height={40} className="object-contain block md:hidden" />
        <Image src="/logo-eusse-completo.png" alt="Grupo Eusse" width={100} height={60} className="object-contain hidden md:block" />

        <div className="text-center text-[12px] md:text-sm leading-tight">
          <p className="font-semibold">SOMOS EL COMBUSTIBLE DE SU VIDA</p>
          <p className="text-gray-300">
            Copyright © 2024 <span className="font-semibold">Grupo Empresarial Eusse™</span>
          </p>
        </div>

        <div className="flex items-center gap-4 text-xl">
          {SOCIAL_LINKS.map(({ href, icon: Icon, label, hover }) => (
            <Link key={label} href={href} target="_blank" aria-label={label} className={`${hover} transition-colors`}>
              <Icon />
            </Link>
          ))}
        </div>

      </div>
    </footer>
  );
}
