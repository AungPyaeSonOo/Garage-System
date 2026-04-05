// components/CartoonAvatar.jsx
function CartoonAvatar({ user, size = 50 }) {
    // Different cartoon styles available
    const styles = [
      'adventurer',     // Adventurer style
      'adventurer-neutral', // Neutral adventurer
      'avataaars',      // Avataaars style
      'big-ears',       // Big ears
      'bottts',         // Robot style
      'croodles',       // Croodles style
      'fun-emoji',      // Fun emoji
      'icons',          // Icons
      'identicon',      // Identicon style
      'micah',          // Micah style
      'miniavs',        // Mini avatars
      'open-peeps',     // Open peeps
      'personas',       // Personas
      'pixel-art'       // Pixel art
    ];
  
    // Get a consistent style based on username
    const getAvatarStyle = () => {
      const seed = user?.username || user?.email || 'user';
      const index = Math.abs(seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % styles.length;
      return styles[index];
    };
  
    // Get seed for consistent avatar
    const getSeed = () => {
      return user?.username || user?.email || user?.full_name || 'user';
    };
  
    const avatarStyle = getAvatarStyle();
    const seed = getSeed();
  
    // Background colors for different styles
    const getBackgroundColor = () => {
      const colors = {
        'adventurer': '#facc15',
        'avataaars': '#3b82f6',
        'bottts': '#10b981',
        'pixel-art': '#8b5cf6',
        'fun-emoji': '#ec4899',
        'identicon': '#f97316'
      };
      return colors[avatarStyle] || '#64748b';
    };
  
    return (
      <div style={{ position: 'relative' }}>
        <img
          src={`https://api.dicebear.com/9.x/${avatarStyle}/svg?seed=${seed}&size=${size}&backgroundColor=${getBackgroundColor().replace('#', '')}`}
          alt={`${user?.full_name || 'User'}'s avatar`}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            backgroundColor: '#f8fafc',
            objectFit: 'cover'
          }}
          onError={(e) => {
            // Fallback if style doesn't exist
            e.target.src = `https://api.dicebear.com/9.x/initials/svg?seed=${seed}&size=${size}`;
          }}
        />
        {/* Optional: Add a little indicator for online status */}
        <div style={{
          position: 'absolute',
          bottom: 2,
          right: 2,
          width: size * 0.2,
          height: size * 0.2,
          borderRadius: '50%',
          backgroundColor: '#10b981',
          border: '2px solid white'
        }} />
      </div>
    );
  }
  
  export default CartoonAvatar;