// components/AvatarManager.jsx
import { useState, useEffect } from 'react';
import CartoonAvatar from './CartoonAvatar';

function AvatarManager({ user, size = 50, onClick }) {
  const [avatarSrc, setAvatarSrc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  
  // Load saved avatar on mount and when user changes
  useEffect(() => {
    if (user?.user_id) {
      const savedAvatar = localStorage.getItem(`avatar-${user.user_id}`);
      if (savedAvatar) {
        setAvatarSrc(savedAvatar);
      } else {
        setAvatarSrc(null);
      }
    }
  }, [user]);

  // Handle avatar upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && user?.user_id) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setAvatarSrc(base64String);
        // Save to localStorage with user ID
        localStorage.setItem(`avatar-${user.user_id}`, base64String);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('avatarUpdated', { 
          detail: { userId: user.user_id, avatar: base64String }
        }));
      };
      reader.readAsDataURL(file);
    }
    setShowUpload(false);
  };

  // Handle avatar removal
  const handleRemoveAvatar = () => {
    if (user?.user_id) {
      setAvatarSrc(null);
      localStorage.removeItem(`avatar-${user.user_id}`);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('avatarUpdated', { 
        detail: { userId: user.user_id, avatar: null }
      }));
    }
  };

  // Listen for avatar updates from other components
  useEffect(() => {
    const handleAvatarUpdate = (event) => {
      if (event.detail.userId === user?.user_id) {
        setAvatarSrc(event.detail.avatar);
      }
    };

    window.addEventListener('avatarUpdated', handleAvatarUpdate);
    return () => window.removeEventListener('avatarUpdated', handleAvatarUpdate);
  }, [user]);

  // Handle main avatar click
  const handleAvatarClick = (e) => {
    if (onClick && typeof onClick === 'function') {
      onClick(e);
    }
    if (!avatarSrc) {
      setShowUpload(true);
    }
  };

  return (
    <div style={{ position: 'relative', cursor: onClick ? 'pointer' : 'default' }} onClick={handleAvatarClick}>
      {avatarSrc ? (
        // Uploaded photo
        <div style={{ position: 'relative' }}>
          <img 
            src={avatarSrc} 
            alt={`${user?.full_name || 'User'}'s avatar`}
            style={{
              width: size,
              height: size,
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          {/* Remove button (only shows in header where onClick exists) */}
          {onClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveAvatar();
              }}
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: size * 0.3,
                height: size * 0.3,
                borderRadius: '50%',
                background: '#ef4444',
                color: 'white',
                border: '2px solid white',
                cursor: 'pointer',
                fontSize: size * 0.15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }}
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        // Cartoon avatar
        <CartoonAvatar user={user} size={size} />
      )}

      {/* Upload overlay - only shows in header when clicked */}
      {showUpload && onClick && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={(e) => {
            e.stopPropagation();
            setShowUpload(false);
          }}
        >
          <div
            style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              width: '300px',
              textAlign: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 15px 0' }}>Upload Photo</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ marginBottom: '15px', width: '100%' }}
            />
            <button
              onClick={() => setShowUpload(false)}
              style={{
                padding: '8px 16px',
                background: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upload button (only shows in header) */}
      {onClick && !avatarSrc && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowUpload(true);
          }}
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: '50%',
            background: '#3b82f6',
            color: 'white',
            border: '2px solid white',
            cursor: 'pointer',
            fontSize: size * 0.15,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
        >
          +
        </button>
      )}
    </div>
  );
}

export default AvatarManager;