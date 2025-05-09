import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import loadingAnimation from './assets/loading-animation.gif';
import playerAnimation from './assets/player-animation.gif';

// Preload images
const preloadImages = () => {
  const images = [loadingAnimation, playerAnimation];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });
};

// Preload images before rendering the app
preloadImages();

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
