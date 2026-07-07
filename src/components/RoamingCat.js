'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';

export default function RoamingCat({ userName = 'Friend' }) {
  const [position, setPosition] = useState({ bottom: '50px', right: '-100px' });
  const [isFlipped, setIsFlipped] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [currentEdge, setCurrentEdge] = useState(0); // Track which edge she is on

  const timeoutRef = useRef(null);
  const FOUR_MINUTES = 4 * 60 * 1000; 

  const catGreetings = [
    `Hi ${userName}! Hope you are having a purr-fect day!`,
    `Meow, ${userName}! Just checking in on you!`,
    `Psst... ${userName}... you are doing great!`,
    `Need a short cat break, ${userName}?`,
    `Staying cozy, ${userName}? I will be guarding this corner!`,
    `Hey ${userName}, thanks for visiting Fur Ever Found today!`,
    `Did you bring any treats with you, ${userName}?`,
    `Just patrolling the edges for lost friends, ${userName}!`,
    `Sending you a big warm headbutt, ${userName}!`,
    `Everything looks safe over here, ${userName}!`,
    `Don't mind me, ${userName}, just looking for a sunny spot to nap!`,
    `Your support means the world to our kitty community, ${userName}!`,
    `Meow! Keep being awesome today, ${userName}!`,
    `Is that the sound of a treat bag opening, ${userName}?!`,
    `Wishing you a luck-filled day, ${userName}!`,
    `Purrrr... remember to take a screen break and stretch, ${userName}!`,
  ];

  const summonCat = () => {
    const edgeChoice = Math.floor(Math.random() * 4);
    setCurrentEdge(edgeChoice); // Save edge choice to style the bubble dynamically
    let newPos = {};

    switch (edgeChoice) {
      case 0: // Bottom Left Corner
        newPos = { bottom: '40px', left: '20px', right: 'auto', top: 'auto' };
        setIsFlipped(false);
        break;
      case 1: // Bottom Right Corner
        newPos = { bottom: '40px', right: '20px', left: 'auto', top: 'auto' };
        setIsFlipped(true);
        break;
      case 2: // Center Right Edge
        newPos = { top: '60%', right: '20px', bottom: 'auto', left: 'auto' };
        setIsFlipped(true);
        break;
      case 3: // Center Left Edge
        newPos = { top: '60%', left: '20px', bottom: 'auto', right: 'auto' };
        setIsFlipped(false);
        break;
    }

    setPosition(newPos);

    timeoutRef.current = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * catGreetings.length);
      setSpeechText(catGreetings[randomIndex]);

      timeoutRef.current = setTimeout(() => {
        setSpeechText('');
        setPosition((prev) => ({
          ...prev,
          left: prev.left !== 'auto' ? '-100px' : 'auto',
          right: prev.right !== 'auto' ? '-100px' : 'auto',
        }));
      }, 10000);

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
  }, [userName]);

  // Dynamic positioning logic for the bubble to guarantee it never leaves the viewport
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
    maxWidth: '220px', // Prevents the bubble from getting overly wide
    width: 'max-content',
    // If on the right side, push the bubble to the left (-180px). If on left side, push to the right (10px).
    left: isRightEdge ? '-180px' : '10px', 
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
      {/* Speech Bubble */}
      {speechText && (
        <div style={bubbleStyle}>
          {speechText}
          {/* Bubble Arrow Tail */}
          <div
            style={{
              position: 'absolute',
              bottom: '-8px',
              // Anchor arrow tail directly over the cat's head
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

      {/* Cat Asset */}
      <div
        style={{
          transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
          display: 'inline-block',
        }}
      >
        <Image
          src="/pixel-cat.png"
          alt="Fur Ever Found Companion"
          width={55}
          height={55}
          style={{ objectFit: 'contain' }}
          unoptimized
        />
      </div>
    </div>
  );
}