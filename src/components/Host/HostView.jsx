import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useGameState } from '../../hooks/useGameState';
import { Users, Play, Settings } from 'lucide-react';

const HostView = ({ sessionId }) => {
  const { gameState, updateGame, createSession, loading } = useGameState(sessionId);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    // Generate QR URL based on current origin
    const url = new URL(window.location.href);
    url.searchParams.set('controller', 'true');
    url.searchParams.set('session', sessionId);
    setQrUrl(url.toString());

    // Initialize session if not exists
    if (!loading && !gameState) {
      createSession(sessionId, {
        status: 'LOBBY',
        players: {},
        currentTurn: null,
        round: 1,
        maxRounds: 5,
        currentQuestion: null,
        category: null,
        createdAt: new Date().toISOString()
      });
    }
  }, [sessionId, gameState, loading]);

  const startGame = () => {
    if (!gameState || Object.keys(gameState.players).length === 0) return;
    
    // Pick random starting player
    const playerIds = Object.keys(gameState.players);
    const randomPlayer = playerIds[Math.floor(Math.random() * playerIds.length)];

    updateGame({
      status: 'PLAYING',
      currentTurn: randomPlayer,
      round: 1
    });
  };

  const setMaxRounds = (rounds) => {
    updateGame({ maxRounds: rounds });
  };

  if (loading) return <div className="loading">Lade Quizmaster...</div>;

  if (gameState?.status === 'PLAYING') {
    return <HostGameView gameState={gameState} updateGame={updateGame} />;
  }

  return (
    <div className="host-lobby-container" style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '4rem', marginBottom: '1rem' }}>Quizmaster AI</h1>
        <p style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>Scanne den QR-Code, um beizutreten!</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ padding: '1.5rem', background: 'white', borderRadius: '20px', marginBottom: '2rem' }}>
            {qrUrl && <QRCodeSVG value={qrUrl} size={300} level="H" />}
          </div>
          <p style={{ fontStyle: 'italic', opacity: 0.7 }}>{qrUrl}</p>
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <Users size={32} color="var(--primary)" />
            <h2 style={{ fontSize: '2rem' }}>Spieler ({Object.keys(gameState?.players || {}).length})</h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem', minHeight: '150px' }}>
            {Object.values(gameState?.players || {}).map((player, idx) => (
              <div 
                key={idx} 
                className="player-chip" 
                style={{ 
                  background: player.color, 
                  padding: '1rem 2rem', 
                  borderRadius: '50px', 
                  color: 'white', 
                  fontWeight: 'bold',
                  boxShadow: `0 4px 15px ${player.color}44`,
                  animation: 'fadeIn 0.5s ease'
                }}
              >
                {player.name} {player.ready ? '✅' : ''}
              </div>
            ))}
            {Object.keys(gameState?.players || {}).length === 0 && (
              <p style={{ color: 'var(--text-dim)' }}>Warte auf Spieler...</p>
            )}
          </div>

          <div className="settings-section" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <Settings size={24} />
              <h3>Spiel-Einstellungen</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
              {[3, 5, 10].map(r => (
                <button 
                  key={r}
                  onClick={() => setMaxRounds(r)}
                  style={{ 
                    flex: 1, 
                    background: gameState?.maxRounds === r ? 'var(--primary)' : 'rgba(255,255,255,0.1)' 
                  }}
                >
                  {r} Runden
                </button>
              ))}
            </div>

            <button 
              onClick={startGame}
              disabled={Object.keys(gameState?.players || {}).length === 0}
              style={{ width: '100%', padding: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
            >
              <Play fill="white" /> Spiel starten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CATEGORIES = ['Allgemeinwissen', 'Sport', 'Film & Serien', 'Popkultur', 'Wissenschaft', 'Geschichte', 'Geografie', 'Musik'];

const HostGameView = ({ gameState, updateGame }) => {
  const currentPlayer = gameState.players[gameState.currentTurn];

  const handleNextTurn = () => {
    const playerIds = Object.keys(gameState.players);
    const currentIndex = playerIds.indexOf(gameState.currentTurn);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    const nextPlayer = playerIds[nextIndex];

    const nextRound = nextIndex === 0 ? gameState.round + 1 : gameState.round;

    if (nextRound > gameState.maxRounds) {
      updateGame({ status: 'RESULT' });
    } else {
      updateGame({
        currentTurn: nextPlayer,
        round: nextRound,
        currentQuestion: null,
        category: null
      });
    }
  };

  if (gameState.status === 'RESULT') {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <h1 className="title-gradient" style={{ fontSize: '4rem', marginBottom: '2rem' }}>Endergebnis</h1>
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          {Object.values(gameState.players)
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid var(--glass-border)', fontSize: '1.5rem' }}>
                <span>{i + 1}. {p.name}</span>
                <span style={{ fontWeight: 'bold' }}>{p.score} Pkt.</span>
              </div>
            ))}
        </div>
        <button onClick={() => updateGame({ status: 'LOBBY' })} style={{ marginTop: '3rem', padding: '1.5rem 3rem', fontSize: '1.5rem' }}>Zurück zur Lobby</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '3rem', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-dim)' }}>Runde {gameState.round} von {gameState.maxRounds}</h2>
          <h1 style={{ fontSize: '3rem' }}>
            {currentPlayer?.name} ist am Zug!
          </h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '1.2rem' }}>Kategorie: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{gameState.category || 'Wird gewählt...'}</span></p>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!gameState.category ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="pulse-animation" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🤔</div>
            <p style={{ fontSize: '2rem' }}>{currentPlayer?.name} wählt gerade eine Kategorie...</p>
          </div>
        ) : !gameState.currentQuestion ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div className="spin-animation" style={{ fontSize: '3rem', marginBottom: '2rem' }}>⚙️</div>
            <p style={{ fontSize: '2rem' }}>KI generiert eine Frage für {currentPlayer?.name}...</p>
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <div className="glass-card" style={{ marginBottom: '2rem', padding: '3rem', position: 'relative' }}>
               <h2 style={{ fontSize: '2.5rem', lineHeight: '1.3', textAlign: 'center' }}>{gameState.currentQuestion.question}</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {gameState.currentQuestion.options.map((opt, i) => {
                const isCorrect = i === gameState.currentQuestion.correctIndex;
                const isSelected = i === gameState.selectedAnswer;
                const showResult = gameState.selectedAnswer !== null;

                let border = '2px solid var(--glass-border)';
                let background = 'var(--glass)';
                
                if (showResult) {
                  if (isCorrect) {
                     border = '4px solid #10b981';
                     background = 'rgba(16, 185, 129, 0.1)';
                  } else if (isSelected) {
                     border = '4px solid #ef4444';
                     background = 'rgba(239, 68, 68, 0.1)';
                  }
                }

                return (
                  <div key={i} className="glass-card" style={{ 
                    padding: '1.5rem', 
                    fontSize: '1.5rem', 
                    borderRadius: '20px',
                    border,
                    background,
                    transition: 'all 0.3s ease',
                    opacity: showResult && !isCorrect && !isSelected ? 0.3 : 1
                  }}>
                    <span style={{ fontWeight: 'bold', marginRight: '1rem', color: 'var(--primary)' }}>{String.fromCharCode(65 + i)}</span>
                    {opt}
                  </div>
                );
              })}
            </div>

            {gameState.selectedAnswer !== null && (
              <div className="glass-card" style={{ marginTop: '2rem', animation: 'slideUp 0.5s ease' }}>
                <p style={{ fontSize: '1.2rem', color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  {gameState.selectedAnswer === gameState.currentQuestion.correctIndex ? 'Richtig! +100 Punkte' : 'Leider falsch!'}
                </p>
                <p style={{ fontSize: '1.1rem', opacity: 0.8 }}>{gameState.currentQuestion.explanation}</p>
                <button 
                  onClick={handleNextTurn}
                  style={{ marginTop: '1.5rem', padding: '1rem 2rem' }}
                >
                  Nächste Frage
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        {Object.values(gameState.players).map((p, i) => (
          <div key={i} style={{ background: p.color + '22', padding: '0.5rem 1rem', borderRadius: '10px', border: `1px solid ${p.color}` }}>
            {p.name}: {p.score}
          </div>
        ))}
      </footer>
    </div>
  );
};

export default HostView;
