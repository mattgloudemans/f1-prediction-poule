import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

const Header = ({ onMenuToggle }: HeaderProps) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <header className="glass-dark border-b border-f1-red-500/50 sticky top-0 z-40 shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Hamburger Menu */}
          <button
            onClick={onMenuToggle}
            className="text-white hover:text-f1-red-500 transition-all duration-300 hover:scale-110"
            aria-label="Toggle menu"
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo/Title */}
          <h1 className="text-2xl md:text-4xl font-bold text-gradient-red text-center flex-1 tracking-tight">
            F1 PREDICTION POULE 2025
          </h1>

          {/* User Info */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div
                  className="hidden md:block text-right cursor-pointer"
                  onClick={() => navigate('/profile')}
                >
                  <p className="text-sm font-bold hover:text-f1-red-400 transition-colors">{user.nickname}</p>
                  <p className="text-xs text-f1-red-400 font-semibold">{user.total_points} pts</p>
                </div>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.nickname}
                    className="w-10 h-10 rounded-full border-2 border-f1-red-500 shadow-f1-glow hover-scale cursor-pointer object-cover"
                    onClick={() => navigate('/profile')}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full border-2 border-f1-neutral-700 bg-f1-neutral-800 flex items-center justify-center text-sm font-bold cursor-pointer hover-scale"
                    onClick={() => navigate('/profile')}
                  >
                    {user.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-f1-gray hover:text-f1-red-400 transition-all duration-300 font-semibold"
                >
                  Logout
                </button>
              </>
            ) : (
              <a
                href="/auth"
                className="bg-f1-red-500 hover:bg-f1-red-600 text-white px-6 py-2 rounded-lg transition-all duration-300 shadow-f1-glow hover:shadow-f1-glow-lg hover:-translate-y-0.5 font-bold"
              >
                Login
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
