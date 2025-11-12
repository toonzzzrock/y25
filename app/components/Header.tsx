'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

interface HeaderProps {
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearch?: () => void;
  onSuggestionClick?: (suggestion: any) => void;
  searchSuggestions?: any[];
  showSuggestions?: boolean;
  hideUserIcon?: boolean;
}

export default function Header({
  showSearch = false,
  searchValue = '',
  onSearchChange,
  onSearch,
  onSuggestionClick,
  searchSuggestions = [],
  showSuggestions = false,
  hideUserIcon = false,
}: HeaderProps) {
  const router = useRouter();
  const { authenticated, user } = useAuth();

  const handleYClick = () => {
    router.push(authenticated ? '/home' : '/');
  };

  const handleUserIconClick = () => {
    router.push('/profile');
  };

  const handlePublisherClick = () => {
    router.push('/publisher');
  };

  return (
    <header className="home-header">
      <div
        className="logo-btn"
        role="button"
        tabIndex={0}
        onClick={handleYClick}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleYClick();
          }
        }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'inline-flex' }}
      >
        <div className="logo">
          <span className="logo-y25">Y25</span>
          {user?.role === 'publisher' && (
            <button
              type="button"
              className="publisher-tag"
              onClick={(event) => {
                event.stopPropagation();
                handlePublisherClick();
              }}
            >
              PUBLISHER
            </button>
          )}
        </div>
      </div>

      {showSearch && (
        <div className="search-container" style={{ position: 'relative' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search the game"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch?.()}
          />
          <button className="search-button" onClick={onSearch}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#1a1a1a',
                border: '1px solid rgba(255, 87, 34, 0.3)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                marginTop: 0,
              }}
            >
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => onSuggestionClick?.(suggestion)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: index < searchSuggestions.length - 1 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 87, 34, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <img
                    src={suggestion.image_url || '/images/placeholder.svg'}
                    alt={suggestion.title}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '4px',
                      marginRight: '0.75rem',
                      objectFit: 'cover',
                    }}
                    onError={(e: any) => {
                      e.target.src = '/images/boxing-game.svg';
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0', fontWeight: '500' }}>{suggestion.title}</p>
                    <p style={{ margin: '0', fontSize: '0.8rem', color: '#999' }}>
                      {suggestion.description?.substring(0, 40)}...
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!hideUserIcon && (
        <button
          className="user-icon-btn"
          onClick={handleUserIconClick}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="2" />
            <circle cx="16" cy="12" r="5" fill="currentColor" />
            <path d="M6 26C6 21 10 18 16 18C22 18 26 21 26 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </header>
  );
}
