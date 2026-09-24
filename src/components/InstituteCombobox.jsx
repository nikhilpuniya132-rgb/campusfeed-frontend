import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const BATHINDA_COACHING_DATA = [
  {
    category: "Ajit Road Hub",
    names: [
      "Kapil Institute", "UNCRAM", "Udaan Institute", "Prof J.S Brar Institute", 
      "Arora Classes", "Vikas Bansal Academy", "REAL INSTITUTE OF MATHS", 
      "Tanya Commerce Institute", "Arjun Physics Classes", "Sumit Bansal Academy for Civil Services", 
      "Apex Institute Bathinda", "Mahak Science Classes", "Dhillon Classes", 
      "TET BUZZER Academy", "Maths Shaalaa", "RANA'S MATHEMATICAL CLASSES", 
      "Brar Institute", "Brills Institute"
    ]
  },
  {
    category: "100 Feet Road Hub",
    names: [
      "TOP RANKERSS", "Reva Brain Makers", "Aakash Institute", "MASTERMIND CLASSES", 
      "SMCA CA Classes", "IITIAN CLASSES", "The Commerce World", "Competition Zone"
    ]
  },
  {
    category: "Other Bathinda Locations",
    names: [
      "Physics Wallah", "Rehmat Commerce Classes", "Vinayak Institute", "Apex Academy", 
      "VCC Punjab", "School of English Achievers", "Magnum Opuss", "ALLEN Career Institute", 
      "MANGLA COACHING CENTRE", "Potencia Academy", "Project Alfa Academy", 
      "White Hawk Academy", "Jindal Classes", "BANSAL COACHING CENTRE", "iiebti"
    ]
  }
];

// Helper to determine coaching hub from institute name
export function findHubForInstitute(instituteName) {
  if (!instituteName) return "Ajit Road Hub";
  for (const hub of BATHINDA_COACHING_DATA) {
    if (hub.names.some(n => n.toLowerCase() === instituteName.toLowerCase())) {
      return hub.category;
    }
  }
  return "Ajit Road Hub";
}

export default function InstituteCombobox({
  value,
  onChange,
  onSelectHub,
  placeholder = "Search or select your coaching institute..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync internal search query if external value changes
  useEffect(() => {
    if (value && value !== searchQuery) {
      setSearchQuery(value);
    }
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleMousedown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMousedown);
    return () => document.removeEventListener('mousedown', handleMousedown);
  }, []);

  // Filter institutes based on query
  const query = searchQuery.trim().toLowerCase();
  const filteredData = BATHINDA_COACHING_DATA.map(group => {
    const matchingNames = group.names.filter(name =>
      name.toLowerCase().includes(query)
    );
    return {
      category: group.category,
      names: matchingNames
    };
  }).filter(group => group.names.length > 0);

  const totalResults = filteredData.reduce((acc, g) => acc + g.names.length, 0);

  const handleSelect = (institute, hubCategory) => {
    setSearchQuery(institute);
    setIsOpen(false);
    if (onChange) onChange(institute);
    if (onSelectHub) onSelectHub(hubCategory);

    // Haptic feedback
    if (window.navigator?.vibrate) {
      window.navigator.vibrate(15);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Combobox Input Field */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: '#161616',
          border: isOpen ? '1px solid #ff5500' : '1px solid #262626',
          borderRadius: '14px',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 15px rgba(255, 85, 0, 0.15)' : 'none'
        }}
      >
        <span style={{ position: 'absolute', left: '14px', fontSize: '15px', color: '#ff7700', pointerEvents: 'none' }}>
          🏫
        </span>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
            if (onChange) onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '13px 40px 13px 40px',
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              if (onChange) onChange('');
              if (inputRef.current) inputRef.current.focus();
            }}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#a1a1aa',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        ) : (
          <span
            onClick={() => setIsOpen(!isOpen)}
            style={{
              position: 'absolute',
              right: '14px',
              fontSize: '10px',
              color: '#71717a',
              cursor: 'pointer'
            }}
          >
            ▼
          </span>
        )}
      </div>

      {/* Dropdown Options List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              background: '#121214',
              border: '1px solid #27272a',
              borderRadius: '16px',
              maxHeight: '260px',
              overflowY: 'auto',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.85)',
              padding: '6px',
              backdropFilter: 'blur(20px)'
            }}
          >
            {totalResults === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#71717a', fontSize: '13px' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: '700' }}>No exact institute found.</p>
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery, "Other Bathinda Locations")}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    background: '#ff5500',
                    color: '#fff',
                    border: 'none',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Use "{searchQuery}" as Custom Institute
                </button>
              </div>
            ) : (
              filteredData.map((group) => (
                <div key={group.category} style={{ marginBottom: '8px' }}>
                  {/* Category Header */}
                  <div
                    style={{
                      padding: '6px 10px',
                      fontSize: '10.5px',
                      fontWeight: '800',
                      color: group.category.includes('Ajit Road') ? '#ff7700' : group.category.includes('100 Feet') ? '#38bdf8' : '#a855f7',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>📍</span>
                    <span>{group.category}</span>
                    <span style={{ marginLeft: 'auto', color: '#52525b', fontSize: '10px' }}>
                      {group.names.length}
                    </span>
                  </div>

                  {/* Institute List */}
                  {group.names.map((name) => {
                    const isSelected = value?.toLowerCase() === name.toLowerCase();
                    return (
                      <div
                        key={name}
                        onClick={() => handleSelect(name, group.category)}
                        style={{
                          padding: '9px 12px',
                          borderRadius: '10px',
                          fontSize: '13.5px',
                          fontWeight: isSelected ? '800' : '600',
                          color: isSelected ? '#ffffff' : '#e4e4e7',
                          background: isSelected ? 'rgba(255, 85, 0, 0.2)' : 'transparent',
                          border: isSelected ? '1px solid rgba(255, 85, 0, 0.4)' : '1px solid transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'background 0.12s ease'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#1e1e24';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span>{name}</span>
                        {isSelected && <span style={{ color: '#ff5500', fontSize: '12px' }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
