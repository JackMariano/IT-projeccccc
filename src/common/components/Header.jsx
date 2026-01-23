import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../security/AuthContext';

const roleTitles = {
  admin: 'Admin Dashboard',
  driver: 'Driver Portal',
  manager: 'Manager Portal',
  shop: 'Shop Dashboard',
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const trigger = useRef(null);
  const dropdown = useRef(null);

  // close on click outside
  useEffect(() => {
    const clickHandler = ({ target }) => {
      if (!dropdown.current) return;
      if (!dropdownOpen || dropdown.current.contains(target) || trigger.current.contains(target)) return;
      setDropdownOpen(false);
    };
    document.addEventListener('click', clickHandler);
    return () => document.removeEventListener('click', clickHandler);
  });

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }) => {
      if (!dropdownOpen || keyCode !== 27) return;
      setDropdownOpen(false);
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      // Optionally navigate to login even if logout fails on server
      navigate('/login', { replace: true });
    }
  };

  const userRole = user?.role?.toLowerCase() || 'guest';
  const title = roleTitles[userRole] || 'Fleet Management';

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      
      <div className="relative">
        <button
          ref={trigger}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-3"
        >
          <span className="hidden md:block text-right">
            <span className="block text-sm font-medium text-gray-800">
              {user?.name || user?.email || 'User'}
            </span>
            <span className="block text-xs text-gray-500 capitalize">{user?.role}</span>
          </span>
          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </button>

        {/* Dropdown */}
        <div
          ref={dropdown}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setDropdownOpen(false)}
          className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 transition-all duration-200 ease-in-out ${
            dropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        >
          <div className="py-1">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-semibold">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-600 truncate">{user?.email}</p>
            </div>
            <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Profile</a>
            <button
              onClick={handleLogout}
              className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
