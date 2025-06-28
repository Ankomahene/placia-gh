'use client';

import React from 'react';
import Link from 'next/link';

interface PlacePopupProps {
  name: string;
  placeId: string;
  image?: string;
  address?: string;
  rating?: number;
  isOpen?: boolean;
  distance?: string;
  onViewDetails: () => void;
  className?: string;
  style?: React.CSSProperties;
  source?: string;
}

export function PlacePopup({
  name,
  placeId,
  image,
  address,
  rating,
  isOpen = true,
  distance,
  onViewDetails,
  className = '',
  style,
  source = 'platform',
}: PlacePopupProps) {
  // Determine the source - if source is 'google' or 'google_places', use 'google', otherwise use 'platform'
  const placeSource =
    source === 'google' || source === 'google_places' ? 'google' : 'platform';

  return (
    <div className={`custom-popup ${className}`} style={style}>
      <div
        className="custom-popup-image"
        style={{
          backgroundImage: image
            ? `url(${image})`
            : 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))',
        }}
      >
        {distance && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500',
            }}
          >
            {distance}
          </div>
        )}
      </div>
      <div className="custom-popup-content">
        <div className="custom-popup-title">{name}</div>
        {address && (
          <div className="custom-popup-address">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {address}
          </div>
        )}

        <div className="custom-popup-meta">
          <div className="custom-popup-rating">
            {rating && (
              <>
                <span className="custom-popup-rating-star">★</span>
                <span style={{ fontWeight: '500' }}>{rating}</span>
              </>
            )}
          </div>
          <div className="custom-popup-status">
            <div
              className="custom-popup-status-dot"
              style={{
                backgroundColor: isOpen ? '#10b981' : '#ef4444',
              }}
            />
            <span
              style={{
                color: isOpen ? '#10b981' : '#ef4444',
                fontWeight: '500',
              }}
            >
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>
        </div>

        <Link
          href={`/place/${placeId}?source=${placeSource}`}
          className="custom-popup-button"
          style={{ color: 'white', width: '100%' }}
          onClick={() => {
            onViewDetails();
          }}
        >
          View Details
        </Link>
      </div>
    </div>
  );
}

// CSS styles for the popup - can be imported by any map component
export const popupStyles = `
  .custom-popup {
    width: 280px;
    min-width: 280px;
    max-width: 280px;
  }
  .custom-popup-image {
    width: 100%;
    height: 140px;
    background-size: cover;
    background-position: center;
    position: relative;
    border-radius: 12px 12px 0 0;
  }
  .custom-popup-content {
    padding: 16px;
    background: white;
    color: hsl(222.2 84% 4.9%);
    border-radius: 0 0 12px 12px;
  }
  .dark .custom-popup-content {
    background: hsl(222.2 84% 4.9%);
    color: hsl(210 40% 98%);
  }
  .custom-popup-title {
    font-weight: 600;
    font-size: 16px;
    margin-bottom: 6px;
    line-height: 1.2;
  }
  .custom-popup-address {
    font-size: 13px;
    color: hsl(215.4 16.3% 46.9%);
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 4px;
    line-height: 1.3;
  }
  .dark .custom-popup-address {
    color: hsl(215.4 16.3% 65.9%);
  }
  .custom-popup-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 12px;
  }
  .custom-popup-rating {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .custom-popup-rating-star {
    color: #f59e0b;
  }
  .custom-popup-status {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .custom-popup-status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }
  .custom-popup-distance {
    color: hsl(215.4 16.3% 46.9%);
    font-size: 12px;
  }
  .dark .custom-popup-distance {
    color: hsl(215.4 16.3% 65.9%);
  }
  .custom-popup-button {
    background: hsl(262 83% 58%);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
  }
  .custom-popup-button:hover {
    background: hsl(262 83% 48%);
  }
`;
