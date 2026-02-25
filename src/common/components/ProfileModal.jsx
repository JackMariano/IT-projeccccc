import React, { useState, useEffect } from 'react';
import { useAuth } from '../../security/AuthContext';

const ProfileModal = ({ isOpen, onClose }) => {
  const { token, user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && token) {
      fetchProfile();
    }
  }, [isOpen, token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/.netlify/functions/getProfile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile details');
      }
      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Account Details
                </h3>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  {loading && !profile ? (
                    <div className="flex flex-col items-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                      <p className="text-gray-500 text-xs">Loading latest account details...</p>
                      {authUser && (
                        <div className="mt-4 w-full space-y-4 text-sm text-gray-400 opacity-50">
                           <div className="grid grid-cols-3 gap-4">
                            <div className="font-semibold">Username</div>
                            <div className="col-span-2">{authUser.username}</div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="font-semibold">Role</div>
                            <div className="col-span-2 capitalize">{authUser.role}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : error ? (
                    <div className="text-red-500 text-center py-4">{error}</div>
                  ) : profile ? (
                    <div className="space-y-4 text-sm text-gray-700">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-500">Username</div>
                        <div className="col-span-2">{profile.username}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-500">Full Name</div>
                        <div className="col-span-2">
                          {`${profile.first_name} ${profile.middle_name ? profile.middle_name + ' ' : ''}${profile.last_name}`}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-500">Email</div>
                        <div className="col-span-2">{profile.email || 'N/A'}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-500">Role</div>
                        <div className="col-span-2 capitalize font-medium text-blue-600">{profile.role}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="font-semibold text-gray-500">Contact #</div>
                        <div className="col-span-2">{profile.contact_number || 'N/A'}</div>
                      </div>
                      {profile.emp_id && (
                        <div className="grid grid-cols-3 gap-4">
                          <div className="font-semibold text-gray-500">Employee ID</div>
                          <div className="col-span-2">{profile.emp_id}</div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">No profile data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
