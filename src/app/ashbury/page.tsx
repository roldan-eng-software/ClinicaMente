import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "The Ashbury | Specialty Coffee - Haight Ashbury, San Francisco",
  description: "Artisanal single-origin coffees brewed with 1960s spirit and modern precision in the heart of San Francisco's most iconic neighborhood.",
};

export default function AshburyLandingPage() {
  return (
    <div className="min-h-screen font-sans bg-[#F4F3F1]">
      {/* HEADER */}
      <header className="fixed top-0 w-full bg-[#F4F3F1]/95 backdrop-blur-sm z-50 border-b border-[#D9D7D4]">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          
          {/* Logo Section */}
          <div className="flex flex-col">
            <span className="font-bold text-2xl text-[#2B2B2B]">The Ashbury</span>
            <span className="text-[10px] font-medium text-[#C45C26] tracking-[3px] uppercase">SPECIALTY COFFEE</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10">
            <Link href="#story" className="text-xs font-bold text-[#5C5C5C] tracking-[2px] uppercase hover:text-[#2B2B2B] transition-colors">
              OUR STORY
            </Link>
            <Link href="#menu" className="text-xs font-bold text-[#5C5C5C] tracking-[2px] uppercase hover:text-[#2B2B2B] transition-colors">
              MENU
            </Link>
            <Link href="#visit" className="text-xs font-bold text-[#5C5C5C] tracking-[2px] uppercase hover:text-[#2B2B2B] transition-colors">
              VISIT US
            </Link>
          </nav>

          {/* CTA Button */}
          <Link 
            href="#" 
            className="bg-[#2B2B2B] text-white px-6 py-3 text-[11px] font-bold tracking-[1px] uppercase hover:bg-[#1a1a1a] transition-colors"
          >
            ORDER ONLINE
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative w-full h-[600px] flex items-center bg-[#2B2B2B] pt-16">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
          
          {/* Hero Content */}
          <div className="space-y-6">
            <span className="text-[11px] font-medium text-[#C45C26] tracking-[3px] uppercase">
              EST. 1967 • HAIGHT ASHBURY
            </span>
            <h1 className="text-6xl font-bold text-white leading-[1.1]">
              Coffee Born in the<br />Counterculture
            </h1>
            <p className="text-lg text-[#B5B3B0] leading-relaxed">
              Artisanal single-origin coffees brewed with<br />
              1960s spirit and modern precision in the<br />
              heart of San Francisco's most iconic neighborhood.
            </p>
            <div className="flex gap-4 pt-2">
              <Link 
                href="#menu" 
                className="bg-[#C45C26] text-white px-8 py-4 text-[12px] font-bold tracking-[1px] uppercase hover:bg-[#a84d1f] transition-colors"
              >
                VIEW MENU
              </Link>
              <Link 
                href="#story" 
                className="border border-white text-white px-8 py-4 text-[12px] font-bold tracking-[1px] uppercase hover:bg-white hover:text-[#2B2B2B] transition-colors"
              >
                OUR STORY
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative h-[400px] w-full">
            <Image 
              src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&q=80"
              alt="Vintage bohemian coffee shop interior"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* OUR STORY SECTION */}
      <section id="story" className="w-full py-20 bg-[#F4F3F1]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Story Image */}
          <div className="relative h-[450px] w-full">
            <Image 
              src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80"
              alt="Coffee shop barista pouring latte"
              fill
              className="object-cover"
            />
          </div>

          {/* Story Content */}
          <div className="space-y-6">
            <span className="text-[11px] font-bold text-[#C45C26] tracking-[3px] uppercase">
              OUR STORY
            </span>
            <h2 className="text-4xl font-bold text-[#2B2B2B] leading-tight">
              Where the Summer<br />of Love Never Ended
            </h2>
            <p className="text-base text-[#5C5C5C] leading-relaxed">
              Born in the Summer of Love, The Ashbury has been<br />
              a gathering place for artists, dreamers, and coffee<br />
              connoisseurs for over five decades.<br /><br />
              Our beans are sourced from sustainable farms across<br />
              Latin America, roasted in small batches, and brewed<br />
              with the same love and attention that started it all.
            </p>
            <p className="text-sm italic text-[#8C8A87]">
              "More than coffee. It's a way of life."
            </p>
          </div>
        </div>
      </section>

      {/* MENU SECTION */}
      <section id="menu" className="w-full py-20 bg-[#2B2B2B]">
        <div className="max-w-7xl mx-auto px-8">
          
          {/* Section Header */}
          <div className="text-center space-y-4 mb-12">
            <span className="text-[11px] font-bold text-[#C45C26] tracking-[3px] uppercase">
              OUR MENU
            </span>
            <h2 className="text-4xl font-bold text-white">
              Crafted with Care
            </h2>
          </div>

          {/* Menu Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-[#3D3D3D] p-8 space-y-4">
              <span className="text-[14px] font-bold text-[#C45C26] tracking-[2px] uppercase">
                SIGNATURE ESPRESSO
              </span>
              <h3 className="text-2xl font-bold text-white">
                The Ashbury Blend
              </h3>
              <p className="text-sm text-[#B5B3B0] leading-relaxed">
                Our signature house blend featuring notes of dark chocolate, caramel, and a hint of citrus. Medium roast.
              </p>
              <span className="text-xl font-bold text-white block pt-2">
                $4.50
              </span>
            </div>

            {/* Card 2 */}
            <div className="bg-[#3D3D3D] p-8 space-y-4">
              <span className="text-[14px] font-bold text-[#C45C26] tracking-[2px] uppercase">
                SINGLE ORIGIN
              </span>
              <h3 className="text-2xl font-bold text-white">
                Ethiopian Yirgacheffe
              </h3>
              <p className="text-sm text-[#B5B3B0] leading-relaxed">
                Bright and complex with floral aromatics, blueberry notes, and a clean, tea-like finish. Light roast.
              </p>
              <span className="text-xl font-bold text-white block pt-2">
                $5.50
              </span>
            </div>

            {/* Card 3 */}
            <div className="bg-[#3D3D3D] p-8 space-y-4">
              <span className="text-[14px] font-bold text-[#C45C26] tracking-[2px] uppercase">
                LIMITED RELEASE
              </span>
              <h3 className="text-2xl font-bold text-white">
                Colombia Huila
              </h3>
              <p className="text-sm text-[#B5B3B0] leading-relaxed">
                Rich and balanced with notes of red apple, brown sugar, and a smooth chocolate finish. Seasonal.
              </p>
              <span className="text-xl font-bold text-white block pt-2">
                $6.00
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* VISIT US SECTION */}
      <section id="visit" className="w-full py-20 bg-[#F4F3F1]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Location Content */}
          <div className="space-y-8">
            <span className="text-[11px] font-bold text-[#C45C26] tracking-[3px] uppercase">
              VISIT US
            </span>
            <h2 className="text-4xl font-bold text-[#2B2B2B]">
              Drop In Anytime
            </h2>
            
            <div className="space-y-2">
              <p className="text-lg text-[#2B2B2B] leading-relaxed">
                1569 Haight Street<br />
                San Francisco, CA 94117
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-[12px] font-bold text-[#5C5C5C] tracking-[2px] uppercase block">
                HOURS
              </span>
              <p className="text-sm text-[#5C5C5C]">
                Mon - Fri: 7:00 AM - 8:00 PM
              </p>
              <p className="text-sm text-[#5C5C5C]">
                Sat - Sun: 8:00 AM - 9:00 PM
              </p>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="relative h-[350px] w-full bg-[#D9D7D4] flex items-center justify-center">
            <span className="text-[#8C8A87]">Map Placeholder</span>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="w-full py-24 bg-[#C45C26]">
        <div className="max-w-3xl mx-auto text-center space-y-6 px-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Experience the Spirit<br />of Haight Ashbury
          </h2>
          <p className="text-lg text-white opacity-90 leading-relaxed">
            Join us for exceptional coffee, welcoming<br />
            atmosphere, and timeless vibes.
          </p>
          <Link 
            href="#" 
            className="inline-block bg-white text-[#C45C26] px-10 py-4 text-[12px] font-bold tracking-[1px] uppercase hover:bg-[#f5f5f5] transition-colors"
          >
            ORDER NOW
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-6 bg-[#2B2B2B]">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <span className="text-lg font-bold text-white">The Ashbury</span>
          <span className="text-xs text-[#8C8A87]">© 2024 The Ashbury Coffee. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
