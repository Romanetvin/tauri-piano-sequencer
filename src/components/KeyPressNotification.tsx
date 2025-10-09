import React, { useEffect, useState } from 'react';

export interface KeyPress {
  id: string;
  key: string;
  note: string;
  timestamp: number;
}

interface KeyPressNotificationProps {
  keyPresses: KeyPress[];
}

const KeyPressNotification: React.FC<KeyPressNotificationProps> = ({ keyPresses }) => {
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Add new keys to visible set
    keyPresses.forEach(kp => {
      setVisibleKeys(prev => new Set(prev).add(kp.id));
    });

    // Remove old keys after animation
    const timer = setTimeout(() => {
      const now = Date.now();
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        keyPresses.forEach(kp => {
          if (now - kp.timestamp > 2000) {
            newSet.delete(kp.id);
          }
        });
        return newSet;
      });
    }, 2100);

    return () => clearTimeout(timer);
  }, [keyPresses]);

  const getVisibleKeyPresses = () => {
    return keyPresses.filter(kp => visibleKeys.has(kp.id));
  };

  const visible = getVisibleKeyPresses();

  if (visible.length === 0) return null;

  return (
    <div className="fixed right-8 bottom-32 z-40 flex flex-col gap-2 items-end pointer-events-none">
      {visible.map((keyPress) => {
        const age = Date.now() - keyPress.timestamp;
        const isFading = age > 1500;

        return (
          <div
            key={keyPress.id}
            className={`
              transform transition-all duration-300
              ${isFading ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
              bg-gradient-to-r from-indigo-500 to-indigo-600
              text-white px-4 py-2 rounded-lg shadow-lg
              font-mono font-bold text-lg
              border-2 border-indigo-400
            `}
            style={{
              animation: isFading ? 'none' : 'slideIn 0.3s ease-out',
            }}
          >
            <span className="text-2xl">{keyPress.key}</span>
            <span className="mx-2 opacity-75">→</span>
            <span className="text-lg">{keyPress.note}</span>
          </div>
        );
      })}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default KeyPressNotification;
