import React, { useState, useMemo } from 'react';

// A deterministic array of beautiful modern gradients
const GRADIENTS = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-rose-600',
  'from-yellow-400 to-orange-500',
  'from-indigo-400 to-blue-600',
  'from-teal-400 to-emerald-600',
  'from-red-400 to-red-600',
];

// Simple hash function to always pick the same color for the same name
const getHashForString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const UserAvatar = ({ name = 'Unknown', imageUrl, size = 'w-10 h-10', fontSize = 'text-base', className = '' }) => {
  const [imageError, setImageError] = useState(false);

  // Memoize the background class so it doesn't recalculate on every render
  const backgroundClass = useMemo(() => {
    if (imageUrl && !imageError) return ''; // No background needed if we have an image
    const safeName = name || 'Unknown';
    const index = getHashForString(safeName) % GRADIENTS.length;
    return `bg-gradient-to-br ${GRADIENTS[index]}`;
  }, [name, imageUrl, imageError]);

  const safeName = name || 'Unknown';
  const initials = safeName.charAt(0).toUpperCase();

  const baseClasses = `${size} rounded-full flex items-center justify-center flex-shrink-0 object-cover ${className}`;

  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={`${safeName}'s avatar`}
        className={baseClasses}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to name initial
  return (
    <div className={`${baseClasses} ${backgroundClass} text-white font-bold ${fontSize}`}>
      {initials}
    </div>
  );
};

export default UserAvatar;
