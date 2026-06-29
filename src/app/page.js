// src/app/page.js
import Link from 'next/link'

export default function HomePage() {
  const stats = [
    { number: '2,400+', label: 'Cats Reunited',     emoji: '❤️' },
    { number: '850+',   label: 'Active Reports',     emoji: '📋' },
    { number: '120+',   label: 'Cities Covered',     emoji: '📍' },
    { number: '5,000+', label: 'Community Members',  emoji: '👥' },
  ]

  const steps = [
    { step: '01', emoji: '📝', title: 'Report',  desc: 'Post details about your lost cat or one you found nearby. Add a photo and location.' },
    { step: '02', emoji: '🔔', title: 'Connect', desc: 'Our community gets notified. People near your location will see your report instantly.' },
    { step: '03', emoji: '🏠', title: 'Reunite', desc: 'Get matched with people who spotted your cat. Bring them home safely.' },
  ]

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-14 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-6">
            🐾 India&apos;s Cat Rescue Network
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Every Cat Deserves to{' '}
            <span className="text-orange-500">Find Their</span>{' '}
            Way Home
          </h1>
          <p className="text-base sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Lost your furry friend? Found a stray? Join thousands of caring people who use Fur Ever Found to bring cats back to their families.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/report" className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition shadow-lg shadow-orange-200 text-center">
              🐱 Report a Lost Cat
            </Link>
            <Link href="/lost-cats" className="bg-white hover:bg-gray-50 text-gray-800 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg border-2 border-gray-200 transition text-center">
              🔍 Browse Lost Cats
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 sm:py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
              <div className="text-2xl sm:text-3xl mb-2">{stat.emoji}</div>
              <div className="text-xl sm:text-3xl font-extrabold text-gray-900">{stat.number}</div>
              <div className="text-gray-500 text-xs sm:text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">How It Works</h2>
          <p className="text-gray-500 text-sm sm:text-base mb-10 sm:mb-12">Simple steps to reunite cats with their families</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <div className="text-3xl sm:text-4xl mb-4">{item.emoji}</div>
                <div className="text-orange-400 font-bold text-xs mb-2 tracking-widest">STEP {item.step}</div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-4xl sm:text-5xl mb-4">🐱</div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">A family somewhere is waiting</h2>
          <p className="text-orange-100 text-base sm:text-lg mb-8">Every hour matters. Post your report now — it only takes 2 minutes.</p>
          <Link href="/signup" className="inline-block bg-white text-orange-500 hover:bg-orange-50 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold text-base sm:text-lg transition">
            Join Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="text-center sm:text-left">
              <div className="text-white font-bold text-lg mb-1">🐾 Fur Ever Found</div>
              <div className="text-sm">Reuniting cats with families across India</div>
            </div>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm">
              <Link href="/lost-cats"  className="hover:text-white transition">Lost Cats</Link>
              <Link href="/found-cats" className="hover:text-white transition">Found Cats</Link>
              <Link href="/adoption"   className="hover:text-white transition">Adoption</Link>
              <Link href="/stories"    className="hover:text-white transition">Stories</Link>
              <Link href="/signup"     className="hover:text-white transition">Join Us</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-xs sm:text-sm">
            © 2024 Fur Ever Found. Built with ❤️ for cats and their humans.
          </div>
        </div>
      </footer>
    </div>
  )
}