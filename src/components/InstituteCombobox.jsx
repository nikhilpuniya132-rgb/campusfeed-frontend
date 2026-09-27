import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const BATHINDA_INSTITUTES = [
  "Aakash Educational Services", "ALLEN Career Institute", "Physics Wallah (Vidyapeeth)", "Lakshya Institute", "Kapil Institute", "Genesis Classes", "Bansal Classes", "Edusquare", "Prof. J.S. Brar Institute", "Arjun Physics Classes", "UNCRAM", "Real Institute of Maths", "Tanya Commerce Institute", "Mahak Science Classes", "O.P. Gupta Classes", "Mastermind Classes", "Target Classes", "S.S. Classes", "Touchstone Educationalists", "Grey Matters", "Career Launcher", "TIME (Triumphant Institute)", "Kautilya Academy", "Brainmakers", "St. Joseph's Convent School", "St. Kabir Convent Senior Secondary", "Delhi Public School (DPS)", "Silver Oaks School", "RB DAV Senior Secondary Public", "Police Public School", "Baba Farid Public School", "The Millennium School", "Mount Litera Zee School", "Lord Rama Public School", "Saint Paul's High School", "M.S.D. Senior Secondary Public", "Guru Nanak Dev Public School", "Kendriya Vidyalaya No. 1", "Kendriya Vidyalaya No. 2", "Kendriya Vidyalaya No. 3", "Kendriya Vidyalaya No. 4", "Sanawar School", "Bathinda Public School", "Dasmesh Public School", "Des Raj Memorial Public School", "St. Xavier's School", "Sri Guru Harkrishan Public School", "SSD Senior Secondary School", "Rose Mary Public School", "M.H.R. Senior Secondary School", "Universal Public School", "Goodwill Public School", "Little Flower Public School", "East Point School", "Malwa Public School", "Millennium World School", "Bachpan Play School (Senior Branch)"
];

// Retain legacy export for backward compatibility
export const BATHINDA_COACHING_DATA = [
  {
    category: "Bathinda Institutes",
    names: BATHINDA_INSTITUTES
  }
];

// Helper to determine coaching hub from institute name
export function findHubForInstitute(instituteName) {
  return "Bathinda Hub";
}

export default function InstituteCombobox({
  value,
  onChange,
  onSelectHub,
  placeholder = "Search or select your school/institute..."
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
  const filteredInstitutes = BATHINDA_INSTITUTES.filter(name =>
    name.toLowerCase().includes(query)
  );

  const totalResults = filteredInstitutes.length;

  const handleSelect = (institute, hubCategory = "Bathinda Hub") => {
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
          background: '#f9fafb',
          border: isOpen ? '1px solid #000000' : '1px solid #e5e7eb',
          borderRadius: '14px',
          transition: 'all 0.15s ease',
          boxShadow: 'none'
        }}
      >
        <span style={{ position: 'absolute', left: '14px', fontSize: '15px', color: '#6b7280', pointerEvents: 'none' }}>
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
            color: '#000000',
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
              background: '#e5e7eb',
              border: 'none',
              color: '#374151',
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
              color: '#6b7280',
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
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '16px',
              maxHeight: '260px',
              overflowY: 'auto',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
              padding: '6px'
            }}
          >
            {totalResults === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                <p style={{ margin: '0 0 6px 0', fontWeight: '700', color: '#000000' }}>No exact institute found.</p>
                <button
                  type="button"
                  onClick={() => handleSelect(searchQuery, "Bathinda Hub")}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    background: '#000000',
                    color: '#ffffff',
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
              <div>
                <div
                  style={{
                    padding: '6px 10px',
                    fontSize: '10.5px',
                    fontWeight: '800',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #f3f4f6',
                    marginBottom: '4px'
                  }}
                >
                  <span>🏫 Bathinda Institutes</span>
                  <span>{filteredInstitutes.length}</span>
                </div>
                {filteredInstitutes.map((name) => {
                  const isSelected = value?.toLowerCase() === name.toLowerCase();
                  return (
                    <div
                      key={name}
                      onClick={() => handleSelect(name, "Bathinda Hub")}
                      style={{
                        padding: '9px 12px',
                        borderRadius: '10px',
                        fontSize: '13.5px',
                        fontWeight: isSelected ? '800' : '600',
                        color: isSelected ? '#000000' : '#374151',
                        background: isSelected ? '#f3f4f6' : 'transparent',
                        border: isSelected ? '1px solid #e5e7eb' : '1px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.background = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{name}</span>
                      {isSelected && <span style={{ color: '#000000', fontSize: '12px', fontWeight: '900' }}>✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
