'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import styles from './SearchOverlay.module.css';

export default function SearchOverlay() {
  const { searchOpen, setSearchOpen } = useStore();
  const [query, setQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiResults, setAiResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Standard search results (Simulated client-side for speed)
  // In a real app, this would be a debounced API call to /api/products
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    if (searchOpen) { 
      setTimeout(() => inputRef.current?.focus(), 100); 
      setQuery(''); 
      setIsAiMode(false);
      setAiResults([]);
    }
  }, [searchOpen]);

  // AI Search Logic
  const handleAiSearch = async (text: string) => {
    setLoading(true);
    setIsAiMode(true);
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [text] }),
      });
      const data = await res.json();
      setAiResults(data.recommendations || []);
    } catch (err) {
      console.error('AI Search Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Voice Search Logic
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice search is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleAiSearch(transcript);
    };
    recognition.start();
  };

  if (!searchOpen) return null;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && setSearchOpen(false)}>
      <div className={styles.box}>
        <div className={styles.inputRow}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: 'rgba(201,168,76,0.6)', fontSize: 18 }}></i>
          <input
            ref={inputRef}
            className={styles.input}
            placeholder={isAiMode ? "Describe your mood or a scent..." : "Search fragrances, collections…"}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              if (isAiMode) setIsAiMode(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleAiSearch(query)}
          />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              className={`${styles.iconBtn} ${isListening ? styles.pulse : ''}`} 
              onClick={startListening}
              title="Voice Search"
            >
              <i className={`fa-solid fa-microphone ${isListening ? styles.activeIcon : ''}`}></i>
            </button>
            <button 
              className={`${styles.iconBtn} ${isAiMode ? styles.activeIcon : ''}`}
              onClick={() => handleAiSearch(query)}
              title="AI Recommend"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
            </button>
            <button className={styles.close} onClick={() => setSearchOpen(false)}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {loading && (
          <div className={styles.aiLoading}>
            <div className={styles.loader}></div>
            <p className="overline">AI is curating your matches...</p>
          </div>
        )}

        {isAiMode && aiResults.length > 0 && (
          <div className={styles.aiResults}>
            <p className="overline" style={{ marginBottom: 16 }}>AI Recommendations for: "{query}"</p>
            <div className={styles.resultsGrid}>
              {aiResults.map(p => (
                <Link key={p.id} href={`/product/${p.id}`} className={styles.aiCard} onClick={() => setSearchOpen(false)}>
                   <div className={styles.aiCardImg}>
                      <img src={p.image} alt={p.name} />
                   </div>
                   <div className={styles.aiCardInfo}>
                      <p className={styles.resultName}>{p.name}</p>
                      <p className={styles.resultTag}>{p.tagline}</p>
                   </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!isAiMode && query.length <= 1 && (
          <div className={styles.suggestions}>
            <p className="overline" style={{ marginBottom: 16 }}>Popular Searches</p>
            {['Oud', 'Rose', 'Noir', 'Amber', 'Collection'].map(t => (
              <button key={t} className={styles.tag} onClick={() => setQuery(t)}>{t}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
