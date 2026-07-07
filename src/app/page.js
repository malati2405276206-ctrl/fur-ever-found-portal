// src/app/page.js
import Link from 'next/link'
import Image from 'next/image'
import catInBox from './cat-in-the-box.png'
import StoryWallGrid from '@/components/StoryWallGrid'
import EmojiIcon from '@/components/EmojiIcon'


export default function HomePage() {
  const stats = [
    { number: '2,400+', label: 'Cats Reunited', icon: 'cat-face' },
    { number: '850+', label: 'Active Reports', icon: 'cat-paw' },
    { number: '120+', label: 'Cities Covered', icon: 'location-pin' },
    { number: '5,000+', label: 'Community Members', icon: 'paw-heart' },
  ]

  const steps = [
    { step: '01', title: 'Post details about your lost cat or one you found nearby. Add a photo and location.', bg: 'bg-[#F3D58D]', emoji: 'cat-paw' },
    { step: '02', title: 'Our community gets notified. People near your location will see your report instantly.', bg: 'bg-[#d6e3f0]', emoji: 'notification' },
    { step: '03', title: 'Get matched with people who spotted your cat. Bring them home safely.', bg: 'bg-[#EBDDC5]', emoji: 'house' },
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

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-28 sm:pb-36 px-4 overflow-visible" style={{ background: '#EBDDC5' }}>
        {/* Decorative yarn/sparkle icons */}
        <div className="absolute top-12 right-20 animate-float opacity-80"><EmojiIcon name="yellow-yarn" size={28} /></div>
        <div className="absolute top-24 right-1/3 animate-float-slow opacity-70" style={{ animationDelay: '1s' }}><EmojiIcon name="sparkle" size={22} /></div>
        <div className="absolute top-16 left-1/4 animate-float opacity-60" style={{ animationDelay: '0.5s' }}><EmojiIcon name="blue-yarn" size={20} /></div>
        <div className="absolute bottom-32 left-16 animate-float-slow opacity-70" style={{ animationDelay: '2s' }}><EmojiIcon name="sparkle" size={22} /></div>
        <div className="absolute bottom-40 right-16 animate-float opacity-60" style={{ animationDelay: '1.5s' }}><EmojiIcon name="yellow-yarn" size={20} /></div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid md:grid-cols-[1fr_2fr_1fr] gap-6 items-center">
            {/* Left: Free-floating cat image */}
            <div className="hidden md:flex justify-center">
              <Image
                src={catInBox}
                alt="Cute cat in a box"
                className="w-56 h-56 lg:w-72 lg:h-72 object-contain animate-float-slow drop-shadow-lg"
                priority
              />
            </div>

            {/* Center: Text content */}
            <div className="text-center animate-fade-in-up">
              <h1 className="heading-artistic text-4xl sm:text-5xl md:text-6xl leading-tight mb-6" style={{ color: '#2E4365' }}>
                be kind{' '}
                <br />
                with cats
              </h1>
              <p className="text-base sm:text-lg mb-8 max-w-lg mx-auto leading-relaxed italic" style={{ color: '#2E4365' }}>
                Report lost pets, reunite families, discover adoptable cats, and success stories—all in one caring community built for cats and the people who love them.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <a
                  href="#explore"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base transition-all hover:scale-105"
                  style={{ background: '#2E4365', color: '#F3D58D' }}
                >
                  Explore <EmojiIcon name="cat-face" size={20} />
                </a>
                <a
                  href="#happy-tails"
                  className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base transition-all hover:scale-105 border-2"
                  style={{ background: '#F3D58D', color: '#2E4365', borderColor: '#2E4365' }}
                >
                  Happy Tails <EmojiIcon name="paw-heart" size={20} />
                </a>
              </div>
            </div>

            {/* Right: Blob-framed circle */}
            <div className="hidden md:flex justify-center">
              <div className="relative w-48 h-48 lg:w-56 lg:h-56">
                <div className="absolute inset-0 blob-shape-2" style={{ background: '#F3D58D', border: '3px solid #8A3B08' }} />
                <div className="absolute inset-3 blob-shape-2 overflow-hidden flex items-center justify-center" style={{ background: '#F3D58D' }}>
                  <EmojiIcon name="cat-face" size={80} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scalloped/rounded bottom edge that overlaps the About section */}
        <div className="absolute -bottom-8 sm:-bottom-10 left-0 right-0 z-20">
          {/* Mobile: fewer semicircles */}
          <svg viewBox="0 0 480 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10 sm:hidden" style={{ filter: 'drop-shadow(0 6px 4px rgba(0, 0, 0, 0.15))', clipPath: 'inset(-0px -10px -20px -10px)' }}>
            <path d="M0,0 C60,55 120,55 180,0 C240,55 300,55 360,0 C420,55 460,55 480,0 L480,0 L0,0 Z" fill="#EBDDC5" />
          </svg>
          {/* Desktop: full semicircles */}
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-14 sm:h-20 hidden sm:block" style={{ filter: 'drop-shadow(0 6px 4px rgba(0, 0, 0, 0.15))', clipPath: 'inset(-0px -10px -20px -10px)' }}>
            <path d="M0,0 C40,70 80,70 120,0 C160,70 200,70 240,0 C280,70 320,70 360,0 C400,70 440,70 480,0 C520,70 560,70 600,0 C640,70 680,70 720,0 C760,70 800,70 840,0 C880,70 920,70 960,0 C1000,70 1040,70 1080,0 C1120,70 1160,70 1200,0 C1240,70 1280,70 1320,0 C1360,70 1400,70 1440,0 L1440,0 L0,0 Z" fill="#EBDDC5" />
          </svg>
        </div>
      </section>

      {/* About Section — negative margin so scallop overlaps on top */}
      <section className="-mt-6 sm:-mt-8 pt-16 sm:pt-20 pb-16 sm:pb-20 px-4 about-gingham relative">
        <div className="max-w-2xl mx-auto flex justify-center">
          <div className="sticky-note sticky-note-yellow animate-fade-in-up">
            <h2 className="heading-artistic text-3xl sm:text-4xl mb-4" style={{ color: '#2E4365' }}>
              About us
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: '#2E4365' }}>
              Welcome to Fur Ever Found! Every year, thousands of cats go missing, and many are never reunited with their families due to the lack of a centralized place to report, search, and connect lost and found cat information. At the same time, shelters, rescuers, and animal welfare organizations often face challenges in finding loving homes for rescued cats and raising awareness for their adoption efforts.
            </p>
            <p className="text-sm sm:text-base leading-relaxed mb-4" style={{ color: '#2E4365' }}>
              Fur Ever Found platform helps users report lost or found cats, search existing reports, and connect with cats in need of forever homes. We also celebrate heartwarming reunions, rescue journeys, and adoption stories while offering calming, cat-themed activities to provide comfort. <EmojiIcon name="cat-paw" size={16} />
            </p>
            <p className="text-sm font-medium" style={{ color: '#2E4365' }}>
              Every whisker, every purr deserves a home. Join our community and help reunite cats with their families. <EmojiIcon name="cat-face" size={16} />
            </p>
          </div>
        </div>
      </section>


      {/* Wave divider */}
      <div className="wave-divider rotate-180" style={{ marginBottom: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,80 1440,70 L1440,120 L0,120 Z" fill="var(--sage-100)" />
        </svg>
      </div>
      {/* Explore Section */}
      <section id="explore" className="scroll-mt-16 pt-8 sm:pt-10 pb-16 sm:pb-20 px-4" style={{ background: 'var(--cream)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="heading-artistic text-3xl sm:text-4xl mb-4" style={{ color: '#2E4365' }}>
            Explore
          </h2>
          <p className="text-sm sm:text-base mb-12" style={{ color: 'var(--sage-600)' }}>Discover how you can help our furry friends</p>

          {/* Negative horizontal margins to utilize the empty spaces on the left and right */}
<div className="my-12 -mx-4 sm:-mx-16 md:-mx-24 lg:-mx-36 xl:-mx-48">
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-4 w-full">
    
    {/* Lost Cat Card */}
    <Link href="/lost-cats" className="group flex flex-col justify-between bg-[#F2EAE1] border border-[#2E4365]/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 min-h-[380px] w-full">
      <div className="w-full flex-1 flex items-center justify-center bg-white rounded-2xl p-6 min-h-[220px] shadow-sm">
        <img 
          src="/lost-cat.png" 
          alt="Lost" 
          className="h-48 sm:h-56 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
        />
      </div>
      <div className="mt-5 text-center">
        <span className="text-xl font-extrabold block" style={{ color: '#2E4365' }}>Lost</span>
        <p className="text-sm mt-1 font-medium opacity-80" style={{ color: '#2E4365' }}>Report or find missing pets</p>
      </div>
    </Link>

    {/* Found Cat Card */}
    <Link href="/found-cats" className="group flex flex-col justify-between bg-[#F2EAE1] border border-[#2E4365]/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 min-h-[380px] w-full">
      <div className="w-full flex-1 flex items-center justify-center bg-white rounded-2xl p-6 min-h-[220px] shadow-sm">
        <img 
          src="/found-cat.png" 
          alt="Found" 
          className="h-48 sm:h-56 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3" 
        />
      </div>
      <div className="mt-5 text-center">
        <span className="text-xl font-extrabold block" style={{ color: '#2E4365' }}>Found</span>
        <p className="text-sm mt-1 font-medium opacity-80" style={{ color: '#2E4365' }}>Sightings and secured strays</p>
      </div>
    </Link>

    {/* Adopt Card */}
    <Link href="/adoption" className="group flex flex-col justify-between bg-[#F2EAE1] border border-[#2E4365]/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 min-h-[380px] w-full">
      <div className="w-full flex-1 flex items-center justify-center bg-white rounded-2xl p-6 min-h-[220px] shadow-sm">
        <img 
          src="/adopt-me.png" 
          alt="Adopt" 
          className="h-48 sm:h-56 w-auto object-contain transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" 
        />
      </div>
      <div className="mt-5 text-center">
        <span className="text-xl font-extrabold block" style={{ color: '#2E4365' }}>Adopt</span>
        <p className="text-sm mt-1 font-medium opacity-80" style={{ color: '#2E4365' }}>Give a cat a forever home</p>
      </div>
    </Link>

    {/* Stories Card */}
    <Link href="/stories" className="group flex flex-col justify-between bg-[#F2EAE1] border border-[#2E4365]/10 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 min-h-[380px] w-full">
      <div className="w-full flex-1 flex items-center justify-center bg-white rounded-2xl p-2 min-h-[220px] shadow-sm">
        <img 
          src="/story-book.png" 
          alt="Stories" 
          className="w-[92%] sm:w-[96%] max-h-60 object-contain transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-2" 
        />
      </div>
      <div className="mt-5 text-center">
        <span className="text-xl font-extrabold block" style={{ color: '#2E4365' }}>Stories</span>
        <p className="text-sm mt-1 font-medium opacity-80" style={{ color: '#2E4365' }}>Happy tails & success journeys</p>
      </div>
    </Link>

  </div>
</div>
        </div>
      </section>

      {/* Wavy divider into How it Works */}
      <div className="wave-divider" style={{ marginBottom: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L0,60 C180,120 360,80 540,90 C720,100 900,40 1080,60 C1260,80 1380,100 1440,80 L1440,0 Z" fill="var(--cream)" />
          <path d="M0,80 C180,120 360,80 540,100 C720,120 900,60 1080,80 C1260,100 1380,110 1440,90 L1440,120 L0,120 Z" fill="var(--sage-50)" />
        </svg>
      </div>

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
                  <EmojiIcon name={item.emoji} size={60} />
                </div>
                <div className="text-xs font-bold tracking-widest mb-2" style={{ color: 'var(--sage-400)' }}>STEP {item.step}</div>
                <h3 className="text-sm sm:text-base font-medium mb-2" style={{ color: '#2E4365' }}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--sage-600)' }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wavy divider out of How it Works */}
      <div className="wave-divider" style={{ marginTop: '-1px' }}>
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L0,60 C180,120 360,80 540,90 C720,100 900,40 1080,60 C1260,80 1380,100 1440,80 L1440,0 Z" fill="var(--sage-50)" />
          <path d="M0,80 C180,120 360,80 540,100 C720,120 900,60 1080,80 C1260,100 1380,110 1440,90 L1440,120 L0,120 Z" fill="var(--cream)" />
        </svg>
      </div>

      {/* Grid Wall Decor - Story Polaroids */}
      <div id="happy-tails" className="scroll-mt-16">
        <StoryWallGrid />
      </div>

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
                <EmojiIcon name="cat-paw" size={50} /> Fur Ever Found
              </div>
              <p className="text-sm leading-relaxed text-gray-200">
                India&apos;s community for reuniting lost cats with their loving families. Every cat deserves a home.
              </p>
            </div>

            {/* Pages */}
            <div>
              <div className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Pages</div>
              <div className="flex flex-col gap-2 text-sm text-gray-200">
                <Link href="/" className="hover:text-white transition">Home</Link>
                <Link href="/lost-cats" className="hover:text-white transition">Lost Cats</Link>
                <Link href="/found-cats" className="hover:text-white transition">Found Cats</Link>
                <Link href="/stories" className="hover:text-white transition">Stories</Link>
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">Explore</div>
              <div className="flex flex-col gap-2 text-sm text-gray-200">
                <Link href="/adoption" className="hover:text-white transition">Adoption</Link>
                <Link href="/map" className="hover:text-white transition">Map</Link>
                <Link href="/signup" className="hover:text-white transition">Join Us</Link>
                <Link href="/ngo-signup" className="hover:text-white transition">NGO Partners</Link>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t text-center text-xs sm:text-sm text-gray-200" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            © 2024 Fur Ever Found. Built with <EmojiIcon name="paw-heart" size={14} /> for cats and their humans.
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
      

      {/* Footer */}
      
    </div>
  )
}
