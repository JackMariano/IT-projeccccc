// components/NotificationProvider.jsx
import React, { useState, createContext, useContext } from "react";
import Notification from "./Notification";

const NotificationContext = createContext();

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = (message, type = "info", duration = 5000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type, duration }]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const showSuccess = (message, duration = 5000) => 
    showNotification(message, "success", duration);
  
  const showError = (message, duration = 5000) => 
    showNotification(message, "error", duration);
  
  const showWarning = (message, duration = 5000) => 
    showNotification(message, "warning", duration);
  
  const showInfo = (message, duration = 5000) => 
    showNotification(message, "info", duration);

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      removeNotification
    }}>
      {children}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
};