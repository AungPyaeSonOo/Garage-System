import { useNavigate } from "react-router-dom";
import AvatarManager from "../components/AvatarManager";

function Header({ user }) {
  const navigate = useNavigate();
  const getRoleDisplay = (role) => {
    switch(role) {
      case 'admin':
        return '👑 Administrator';
      case 'salesman':
        return '💰 Salesman';
      case 'staff':
        return '👤 Staff';
      default:
        return '👤 User';
    }
  };

  const handleAvatarClick = () => {
    console.log("Avatar clicked in header");
  };

  return (
    <div className="dashboard-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <AvatarManager user={user} size={60} onClick={handleAvatarClick} />
        <div>
          <h2>
            Welcome, {user?.full_name || user?.username || 'User'}!
            <span className={`role-badge ${user?.role}`}>
              {getRoleDisplay(user?.role)}
            </span>
          </h2>
        </div>
      </div>
      {user?.role === 'admin' && (
        <button className="register-header-btn" onClick={() => navigate('/register')}>
          + Register User
        </button>
      )}
    </div>
  );
}

export default Header;