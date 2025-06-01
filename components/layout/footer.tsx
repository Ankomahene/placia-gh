import Link from "next/link";
import { Globe, MapPin, Mail, Phone, Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import { Logo } from '@/components/logo'

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-muted/30 border-t mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-4">
              <Logo />
            </Link>
            <p className="text-muted-foreground mb-4">
              Discover amazing places in Ghana with our AI-powered search platform.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Explore</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Trending Places</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Featured Locations</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Cities in Ghana</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Categories</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Add Your Business</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Press</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">14 Independence Ave, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <Link href="mailto:info@placiaGH.com" className="text-muted-foreground hover:text-primary transition-colors">
                  info@placiaGH.com
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <Link href="tel:+233123456789" className="text-muted-foreground hover:text-primary transition-colors">
                  +233 12 345 6789
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            &copy; {currentYear} PlaciaGH. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}