'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function RoamingCat({ userName = 'Friend' }) {
  const pathname = usePathname();
  
  const [position, setPosition] = useState({ bottom: '50px', right: '-100px' });
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [currentEdge, setCurrentEdge] = useState(0);

  const timeoutRef = useRef(null);
  const FOUR_MINUTES = 4 * 60 * 1000; 

  const getContextGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    
    if (hour < 12) timeGreeting = "Good morning";
    else if (hour < 18) timeGreeting = "Good afternoon";
    else timeGreeting = "Good evening";

    const normalizedPath = pathname.toLowerCase();

    // 1. LOST PAGE (11 Shuffled Options)
    if (normalizedPath.includes('/lost')) {
      const greetings = [
        `${timeGreeting} ${userName}, this is where missing kitty profiles are logged. Let us bring them home.`,
        `Meow, ${userName}. Keep an eye out around your neighborhood for any of these missing furry friends.`,
        `Just checking the lost listings, ${userName}. Every detail counts.`,
        `Do not worry ${userName}, our community is working hard to find these lost cats.`,
        `Checking if any new areas were reported missing today, ${userName}.`,
        `I hope these worried owners get good news very soon, ${userName}.`,
        `Meow, ${userName}. Sharing these links on social media helps a whole lot.`,
        `Staying observant is our best tool here, ${userName}.`,
        `If you recognize any face here, please report it immediately, ${userName}.`,
        `Hoping for quick reunions for everyone on this page, ${userName}.`,
        `Purrrr... cross-referencing these descriptions with my own cat memory, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. FOUND PAGE (11 Shuffled Options)
    if (normalizedPath.includes('/found')) {
      const greetings = [
        `${timeGreeting} ${userName}! Thank you to everyone looking after these found kitties.`,
        `Meow! If you spot a stray, logging them here helps worried owners immensely, ${userName}.`,
        `Just scanning the found list, ${userName}. I hope some families get reunited today.`,
        `A found cat is a beacon of hope for a sad family, ${userName}.`,
        `Thank you for checking the safe haven logs with me, ${userName}.`,
        `If you found a cat, make sure to take a clear picture of their markings, ${userName}.`,
        `Every entry here represents a safe animal waiting to go home, ${userName}.`,
        `Meow, ${userName}. Check if any of these match the active lost list.`,
        `You have a kind heart for checking the found directory, ${userName}.`,
        `Let us match these safe kitties back with their owners, ${userName}.`,
        `Purrrr... somebody out there is breathing a sigh of relief seeing these logs, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 3. ADOPTION PAGE (11 Shuffled Options)
    if (normalizedPath.includes('/adoption')) {
      const greetings = [
        `Meow, ${userName}! These pure souls are waiting for their forever homes. Maybe today is the day?`,
        `Looking to expand your family, ${userName}? Every cat here has a lot of love to give.`,
        `Purrrr... checking out the adoption gallery? They all deserve a warm bed.`,
        `Adopting saves two lives: the cat you take home and the next rescue we take in, ${userName}.`,
        `Do you see a soulmate in this line-up, ${userName}?`,
        `Every cat on this page is daydreaming about a cozy couch, ${userName}.`,
        `Meow! Giving a shelter cat a chance changes everything, ${userName}.`,
        `Take your time browsing, ${userName}. True love takes just a glance.`,
        `I wonder who will find their dynamic partner here today, ${userName}.`,
        `Fostering or adopting makes you a true hero in my book, ${userName}.`,
        `Look at those sweet whiskers waiting for a safe lap, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 4. REPORT PAGE (11 Shuffled Options)
    if (normalizedPath.includes('/report')) {
      const greetings = [
        `Thank you for being vigilant, ${userName}. Filing an accurate report helps local rescues act fast.`,
        `Meow, ${userName}. Make sure to add clear location details so search teams know where to go.`,
        `Every report brings a lost pet one step closer to safety, ${userName}.`,
        `Double-check your contact details so owners can reach you safely, ${userName}.`,
        `Your quick reporting could save a lost cat tonight, ${userName}.`,
        `Meow! Dropping an exact pin on the map makes tracking much easier, ${userName}.`,
        `An accurate timeline helps us trace where they walked, ${userName}.`,
        `Thank you for taking a moment to log this crucial data, ${userName}.`,
        `If you see a cat in distress, filling this out gets help on the way, ${userName}.`,
        `Every data point helps protect our street communities, ${userName}.`,
        `Purrrr... let us fill out these fields accurately together, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 5. NGO DASHBOARD (11 Shuffled Options)
    if (normalizedPath.includes('/ngo') || normalizedPath.includes('/dashboard')) {
      const greetings = [
        `Thank you for all your hard work behind the scenes, ${userName}. Our community relies on you.`,
        `Purrrr... checking shelter capacities and active alerts today, ${userName}?`,
        `Meow! Just running a quick background patrol for our hard-working NGO team.`,
        `Allocating resources and coordinate rescues is hard work, ${userName}. Take a break soon.`,
        `Your dashboard metrics show incredible rescue impacts this month, ${userName}.`,
        `Let us clear those pending rescue tickets together, ${userName}.`,
        `Checking dispatch logs for active rescue units, ${userName}.`,
        `The community is safer because of your coordination efforts, ${userName}.`,
        `Reviewing incoming shelter requests alongside you, ${userName}.`,
        `Meow, ${userName}. Thanks for managing the front lines for cats everywhere.`,
        `Everything looks highly optimized on your terminal today, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 6. ADMIN DASHBOARD (11 Shuffled Options)
    if (normalizedPath.includes('/admin')) {
      const greetings = [
        `Salutations, Admin ${userName}. The control panel looks completely safe from data mice.`,
        `Meow! Keeping the gears turning smoothly for Fur Ever Found today, ${userName}?`,
        `Everything is green across the system boards on my watch, ${userName}.`,
        `Database integrity check completed. No phantom mice discovered, ${userName}.`,
        `Reviewing server status and system parameters with you, Admin ${userName}.`,
        `Managing user feedback and security layers like a pro, ${userName}.`,
        `Purrrr... the code looks perfectly clean today, ${userName}.`,
        `Standing by for any high-priority console commands, ${userName}.`,
        `Systems are operational. Ready to handle traffic spikes, ${userName}.`,
        `Let me know if you need any database tables scrubbed, ${userName}.`,
        `Your administrative workspace looks incredibly organized, ${userName}.`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 7. DEFAULT/HOME PAGE (16 Shuffled Options)
    const generalGreetings = [
      `${timeGreeting} ${userName}! Hope you are having a purr-fect day!`,
      `Meow, ${userName}! Just checking in on you this ${timeGreeting.toLowerCase().split(' ')[1]}!`,
      `Staying cozy, ${userName}? I will be guarding this corner!`,
      `Hey ${userName}, thanks for visiting Fur Ever Found today!`,
      `Just patrolling the edges for lost friends, ${userName}!`,
      `Purrrr... remember to take a screen break and stretch, ${userName}!`,
      `You are looking awesome today, ${userName}. Keep it up!`,
      `Just sitting here watching the cloud traffic go by, ${userName}.`,
      `Is it time for a quick glass of water, ${userName}? Stay hydrated.`,
      `Everything is quiet and peaceful along this margin, ${userName}.`,
      `Sending you good vibes for whatever you are working on, ${userName}.`,
      `Meow! Remember to blink your eyes and stretch your posture, ${userName}.`,
      `I will just curl up right next to the scrollbar for a bit, ${userName}.`,
      `Your support makes our global cat community brighter, ${userName}.`,
      `Wishing you a highly productive and happy day, ${userName}.`,
      `Meow! If you ever feel stressed, just look at my fluffy tail for comfort.`
    ];
    return generalGreetings[Math.floor(Math.random() * generalGreetings.length)];
  };

  const summonCat = () => {
    const edgeChoice = Math.floor(Math.random() * 4);
    setCurrentEdge(edgeChoice);
    let newPos = {};

    switch (edgeChoice) {
      case 0:
        newPos = { bottom: '40px', left: '20px', right: 'auto', top: 'auto' };
        setIsFlipped(false);
        break;
      case 1:
        newPos = { bottom: '40px', right: '20px', left: 'auto', top: 'auto' };
        setIsFlipped(true);
        break;
      case 2:
        newPos = { top: '60%', right: '20px', bottom: 'auto', left: 'auto' };
        setIsFlipped(true);
        break;
      case 3:
        newPos = { top: '60%', left: '20px', bottom: 'auto', right: 'auto' };
        setIsFlipped(false);
        break;
    }

    setPosition(newPos);

    timeoutRef.current = setTimeout(() => {
      setSpeechText(getContextGreeting());

      timeoutRef.current = setTimeout(() => {
        setSpeechText('');
        setPosition((prev) => ({
          ...prev,
          left: prev.left !== 'auto' ? '-100px' : 'auto',
          right: prev.right !== 'auto' ? '-100px' : 'auto',
        }));
      }, 12000);

    }, 1200);
  };

  useEffect(() => {
    const initialTrigger = setTimeout(summonCat, 5000);
    const interval = setInterval(summonCat, FOUR_MINUTES);

    return () => {
      clearTimeout(initialTrigger);
      clearInterval(interval);
      clearTimeout(timeoutRef.current);
    };
  }, [userName, pathname]);

  const isRightEdge = currentEdge === 1 || currentEdge === 2;
  const bubbleStyle = {
    position: 'absolute',
    bottom: '65px',
    backgroundColor: 'white',
    color: '#333',
    padding: '8px 14px',
    borderRadius: '12px',
    border: '2px solid #444',
    fontSize: '12px',
    fontWeight: 'bold',
    boxShadow: '0px 4px 12px rgba(0,0,0,0.15)',
    zIndex: 10000,
    maxWidth: '240px',
    width: 'max-content',
    left: isRightEdge ? '-200px' : '10px',
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...position,
        zIndex: 9999,
        pointerEvents: 'auto',
        transition: 'all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      }}
    >
      {speechText && (
        <div style={bubbleStyle}>
          <span style={{ whiteSpace: 'normal', display: 'block', lineHeight: '1.4' }}>
            {speechText}
          </span>
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              left: isRightEdge ? 'calc(100% - 35px)' : '20px',
              width: '0',
              height: '0',
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '8px solid white',
            }}
          />
        </div>
      )}

      <div
        style={{
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
          display: 'inline-block',
        }}
      >
        <Image
          src="/pixel-cat.png"
          alt="Fur Ever Found Smart Companion"
          width={55}
          height={55}
          style={{ objectFit: 'contain' }}
          unoptimized
        />
      </div>
    </div>
  );
}