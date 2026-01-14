"use client";

import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  autoCloseDelay?: number;
}

// Array of success GIFs - cycles through these on each success
const successGifs = [
  '/assets/success-gifs/shia_labeouf_good_job_GIF-b44ede56-1c7d-4f3e-89cc-50e31999f09a.png',
  '/assets/success-gifs/bravo_clap_clap_GIF-b9a2dbed-7f71-4573-9469-0362778e1feb.png',
  '/assets/success-gifs/Leonardo_Dicaprio_Dancing_GIF-bc62d69f-24a3-44d6-9e6b-01c8a8e7f772.png',
  '/assets/success-gifs/Angry_Leonardo_Dicaprio_GIF-7ccb047f-7c74-4e3d-bbe6-8a5458453612.png',
  '/assets/success-gifs/the_wolf_of_wall_street_GIF-7de2b6dc-c518-4393-b82d-b395af04b8b0.png',
  '/assets/success-gifs/wolf_of_wall_street_morning_GIF-8e95e6d1-6752-4792-abc3-516e3733db67.png',
  '/assets/success-gifs/Jonah_Hill_Yes_GIF-69216460-eebc-4761-9c99-f786872052aa.png',
  '/assets/success-gifs/Jonah_Hill_Hair_Flip_GIF-d0ea514e-d124-4873-aae4-0a759584a8b5.png',
  '/assets/success-gifs/High_School_GIF-c340d962-4924-4692-b5f3-fbb9a0fcfc9d.png',
];

/**
 * Get the next GIF in rotation using localStorage to track last used index
 * Falls back to random selection if localStorage is unavailable
 */
function getNextGif(): string {
  if (typeof window === 'undefined') {
    // Server-side: return first GIF
    return successGifs[0];
  }

  try {
    const lastIndexStr = localStorage.getItem('lastSuccessGifIndex');
    const lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : -1;
    
    // Increment index and wrap around
    const nextIndex = (lastIndex + 1) % successGifs.length;
    
    // Save for next time
    localStorage.setItem('lastSuccessGifIndex', nextIndex.toString());
    
    return successGifs[nextIndex];
  } catch (error) {
    // If localStorage fails (private browsing, etc.), use random selection
    console.warn('localStorage unavailable, using random GIF selection');
    const randomIndex = Math.floor(Math.random() * successGifs.length);
    return successGifs[randomIndex];
  }
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  message = "Success! Good job!",
  autoCloseDelay = 3000 
}: SuccessModalProps) {
  // Get the next GIF when modal opens
  const [currentGif, setCurrentGif] = useState<string>(successGifs[0]);

  useEffect(() => {
    if (isOpen) {
      // Get next GIF when modal opens
      setCurrentGif(getNextGif());
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-[#000000] border-2 border-[#c5b26f] rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          {/* Success GIF */}
          <div className="mb-4 flex justify-center">
            <img
              src={currentGif}
              alt="Success celebration"
              className="max-w-full h-auto max-h-64 rounded-lg shadow-lg"
              style={{ maxWidth: '300px', height: 'auto' }}
            />
          </div>
          
          {/* Success Message */}
          <h3 className="text-2xl font-bold text-black dark:text-[#c5b26f] mb-4">
            {message}
          </h3>
          
          <Button
            variant="primary"
            onClick={onClose}
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
