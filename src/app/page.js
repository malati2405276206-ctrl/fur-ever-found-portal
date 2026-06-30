// src/app/page.js
import Link from 'next/link'
import Image from 'next/image'
import catInBox from './cat-in-the-box.png'

export default function HomePage() {
  const stats = [
    { number: '2,400+', label: 'Cats Reunited', emoji: '🐱' },
    { number: '850+', label: 'Active Reports', emoji: '📋' },
    { number: '120+', label: 'Cities Covered', emoji: '🌿' },
    { number: '5,000+', label: 'Community Members', emoji: '💚' },
  ]

  const steps = [
    { step: '01', emoji: '📝', title: 'Report', desc: 'Post details about your lost cat or one you found nearby. Add a photo and location.', bg: 'bg-[#fef3e2]' },
    { step: '02', emoji: '🔔', title: 'Connect', desc: 'Our community gets notified. People near your location will see your report instantly.', bg: 'bg-[#e8f5e0]' },
    { step: '03', emoji: '🏠', title: 'Reunite', desc: 'Get matched with people who spotted your cat. Bring them home safely.', bg: 'bg-[#e0eef5]' },
  ]

  const services = [
    { emoji: '🔍', label: 'Find', bg: 'bg-[#fef3e2]' },
    { emoji: '🏥', label: 'Care', bg: 'bg-[#e8f5e0]' },
    { emoji: '🌱', label: 'Nurture', bg: 'bg-[#e0f5ec]' },
    { emoji: '🏠', label: 'Adopt', bg: 'bg-[#e0eef5]' },
  ]

  const reviews = [
    {
      text: 'Fur Ever Found reunited me with my cat Mochi after 3 weeks. The community here is incredible and so supportive!',
      name: 'Priya Sharma',
      city: 'Mumbai',
    },
    {
      text: 'I found a stray kitten and within hours, the owner contacted me through the app. Such a heartwarming experience!',
      name: 'Arjun Patel',
      city: 'Bangalore',
    },
    {
      text: 'The NGO dashboard makes managing rescues so simple. We have saved over 50 cats using this platform. Highly recommend!',
      name: 'Sneha Reddy',
      city: 'Hyderabad',
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: 'var(--cream)' }}>

      {/* Hero Section - Organic, nature-inspired */}
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden bg-organic-gradient">
        {/* Decorative blobs */}
        <div className="absolute top-10 right-10 w-32 h-32 sm:w-48 sm:h-48 rounded-full opacity-30 animate-float-slow" style={{ background: 'var(--sage-200)' }} />
        <div className="absolute top-40 right-1/4 w-20 h-20 sm:w-28 sm:h-28 blob-shape opacity-20 animate-float" style={{ background: 'var(--gold-light)' }} />
        <div className="absolute bottom-20 left-10 w-24 h-24 sm:w-36 sm:h-36 blob-shape-2 opacity-20 animate-float-slow" style={{ background: 'var(--sage-300)', animationDelay: '2s' }} />
        <div className="absolute top-20 left-1/4 w-16 h-16 rounded-full opacity-15" style={{ background: 'var(--blush)' }} />

        {/* Floating illustrated elements */}
        <div className="absolute top-16 right-16 sm:right-32 text-4xl sm:text-6xl animate-float opacity-80"></div>
        <div className="absolute bottom-24 right-20 text-3xl sm:text-4xl animate-float-slow opacity-70"></div>
        <div className="absolute top-32 left-8 sm:left-20 text-2xl sm:text-3xl animate-float opacity-60" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-16 left-1/3 text-2xl animate-float-slow opacity-50" style={{ animationDelay: '3s' }}>🍃</div>

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left: Text content */}
            <div className="text-left animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'var(--sage-100)', color: 'var(--sage-700)' }}>
                🐾 India&apos;s Cat Rescue Network
              </div>
              <h1 className="heading-artistic text-4xl sm:text-5xl md:text-6xl leading-tight mb-6" style={{ color: 'var(--sage-900)' }}>
                be kind{' '}
                <br />
                with cats
              </h1>
              <p className="text-base sm:text-lg mb-8 max-w-md leading-relaxed" style={{ color: 'var(--sage-700)' }}>
                Welcome to Fur Ever Found — India&apos;s community for reuniting lost cats with their families. Every whisker, every purr deserves a home.
              </p>
              <Link
                href="/report"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg text-white transition-all hover:scale-105 shadow-lg"
                style={{ background: 'var(--sage-500)', boxShadow: '0 8px 24px rgba(90, 154, 90, 0.3)' }}
              >
                Report a lost/found cat 🐱
              </Link>
            </div>

            {/* Right: Cat in the box image */}
            <div className="relative flex justify-center items-center animate-fade-in-up animation-delay-200">
              <div className="relative w- h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                <div className="absolute inset-0 blob-shape opacity-30" style={{ background: 'var(--sage-100)' }} />
                <Image
                  src={catInBox}
                  alt="Cute cat in a box"
                  className="relative z-10 w-56 h-56 sm:w-400 sm:h-400 object-contain animate-float-slow drop-shadow-lg"
                  priority
                />
                {/* Decorative floaters around the image */}
                <span className="absolute -top-2 right-4 text-2xl animate-float" style={{ animationDelay: '0.5s' }}></span>
                <span className="absolute bottom-4 -left-2 text-xl animate-float-slow" style={{ animationDelay: '1s' }}></span>
                <span className="absolute bottom-0 right-8 text-xl animate-float" style={{ animationDelay: '2s' }}></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="wave-divider" style={{ marginTop: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z" fill="var(--sage-100)" />
        </svg>
      </div>

      {/* About Section */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--sage-100)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div className="animate-fade-in-up">
              <h2 className="heading-artistic text-3xl sm:text-4xl mb-6" style={{ color: 'var(--sage-900)' }}>
                About us
              </h2>
              <p className="text-base sm:text-lg leading-relaxed mb-6" style={{ color: 'var(--sage-700)' }}>
                Welcome to Fur Ever Found! Every year, thousands of cats go missing, and many are never reunited with their families due to the lack of a centralized place to report, search, and connect lost and found cat information. At the same time, shelters, rescuers, and animal welfare organizations often face challenges in finding loving homes for rescued cats and raising awareness for their adoption efforts.

Fur Ever Found  platform helps users report lost or found cats, search existing reports, and connect with cats in need of forever homes. We also celebrate heartwarming reunions, rescue journeys, and adoption stories while offering calming, and cat-themed activities to provide comfort.

              </p>
              {/* <Link
                href="/stories"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                style={{ background: 'var(--gold-light)', color: 'var(--gold)' }}
              >
                Learn More About Us →
              </Link> */}
            </div>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-52 h-52 sm:w-64 sm:h-64 blob-shape-2 flex items-center justify-center" style={{ background: 'var(--sage-200)' }}>
                  <div className="text-center">
                    <div className="text-6xl sm:text-7xl mb-2 animate-float-slow">🐱</div>
                    <div className="text-3xl sm:text-4xl animate-float" style={{ animationDelay: '1s' }}>🌿</div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 text-2xl animate-float" style={{ animationDelay: '0.5s' }}>🦋</div>
                <div className="absolute -bottom-2 -left-4 text-xl animate-float-slow" style={{ animationDelay: '2s' }}>🐾</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wave divider */}
      <div className="wave-divider rotate-180" style={{ marginBottom: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z" fill="var(--sage-100)" />
        </svg>
      </div>

      {/* Services / What We Offer */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-artistic text-3xl sm:text-4xl mb-4" style={{ color: 'var(--sage-900)' }}>
            Services
          </h2>
          <p className="text-sm sm:text-base mb-12" style={{ color: 'var(--sage-600)' }}>What we help you do for your furry friends</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {services.map((service) => (
              <div key={service.label} className="flex flex-col items-center gap-3 group">
                <div className={`icon-circle ${service.bg} group-hover:scale-110 transition-transform`}>
                  <span className="text-3xl sm:text-4xl">{service.emoji}</span>
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--sage-700)' }}>{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--sage-50)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-artistic text-3xl sm:text-4xl mb-4" style={{ color: 'var(--sage-900)' }}>
            How It Works
          </h2>
          <p className="text-sm sm:text-base mb-12" style={{ color: 'var(--sage-600)' }}>Simple steps to reunite cats with their families</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item, i) => (
              <div key={item.step} className={`organic-card p-6 sm:p-8 animate-fade-in-up`} style={{ animationDelay: `${i * 0.2}s` }}>
                <div className={`icon-circle ${item.bg} mx-auto mb-4`}>
                  <span className="text-3xl">{item.emoji}</span>
                </div>
                <div className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--sage-400)' }}>STEP {item.step}</div>
                <h3 className="text-lg sm:text-xl font-bold mb-2" style={{ color: 'var(--sage-900)' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sage-600)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      {/* <section className="py-12 sm:py-16 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="organic-card text-center p-5 sm:p-6">
              <div className="text-2xl sm:text-3xl mb-2">{stat.emoji}</div>
              <div className="text-xl sm:text-3xl font-extrabold" style={{ color: 'var(--sage-800)' }}>{stat.number}</div>
              <div className="text-xs sm:text-sm mt-1" style={{ color: 'var(--sage-600)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section> */}

      {/* Wave divider into reviews */}
      <div className="wave-divider" style={{ marginTop: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C240,100 480,20 720,60 C960,100 1200,30 1440,50 L1440,120 L0,120 Z" fill="var(--sage-500)" />
        </svg>
      </div>

      {/* Reviews Section */}
      <footer className="py-16 sm:py-20 px-4" style={{ background: 'var(--sage-500)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 mb-8">
            {/* Brand */}
            <div>
              <div className="text-white font-bold text-lg mb-2 flex items-center gap-2">
                <span className="text-2xl">🐾</span> Fur Ever Found
              </div>
              <p className="text-sm leading-relaxed">
                India&apos;s community for reuniting lost cats with their loving families. Every cat deserves a home.
              </p>
            </div>

            {/* Pages */}
            <div>
              <div className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Pages</div>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <Link href="/lost-cats" className="hover:text-white transition">Lost Cats</Link>
                <Link href="/found-cats" className="hover:text-white transition">Found Cats</Link>
                <Link href="/stories" className="hover:text-white transition">Stories</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Explore</div>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/adoption" className="hover:text-white transition">Adoption</Link>
                <Link href="/map" className="hover:text-white transition">Map</Link>
                <Link href="/signup" className="hover:text-white transition">Join Us</Link>
                <Link href="/ngo-signup" className="hover:text-white transition">NGO Partners</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t text-center text-xs sm:text-sm" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            © 2024 Fur Ever Found. Built with 💚 for cats and their humans.
          </div>
        </div>
        
      </footer>

      {/* Wave divider out of reviews */}
      <div className="wave-divider rotate-180" style={{ marginTop: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,40 C240,100 480,20 720,60 C960,100 1200,30 1440,50 L1440,120 L0,120 Z" fill="var(--sage-500)" />
        </svg>
      </div>

      {/* CTA Banner */}
      <section className="py-16 sm:py-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <div className="organic-card p-8 sm:p-12 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-4 left-6 text-2xl opacity-40 animate-float-slow">🌿</div>
            <div className="absolute bottom-4 right-6 text-2xl opacity-40 animate-float">🐾</div>
            <div className="absolute top-6 right-10 text-xl opacity-30 animate-float-slow" style={{ animationDelay: '1.5s' }}>🦋</div>

            <div className="text-5xl sm:text-6xl mb-4">🐱</div>
            <h2 className="heading-artistic text-2xl sm:text-3xl mb-4" style={{ color: 'var(--sage-900)' }}>
              A family somewhere is waiting
            </h2>
            <p className="text-sm sm:text-base mb-8" style={{ color: 'var(--sage-600)' }}>
              Every hour matters. Post your report now — it only takes 2 minutes.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg text-white transition-all hover:scale-105"
              style={{ background: 'var(--sage-500)', boxShadow: '0 8px 24px rgba(90, 154, 90, 0.25)' }}
            >
              Join Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      
    </div>
  )
}
