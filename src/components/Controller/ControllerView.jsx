import React, { useState, useEffect } from 'react';
import { useGameState } from '../../hooks/useGameState';
import { User, Palette, Target } from 'lucide-react';

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

const ControllerView = ({ sessionId }) => {
  const { gameState, updateGame, loading } = useGameState(sessionId);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [age, setAge] = useState(25);
  const [joined, setJoined] = useState(false);
  const [myId] = useState(() => 'player_' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Check if we already joined (localStorage)
    const savedId = localStorage.getItem(`quizmaster_id_${sessionId}`);
    if (savedId && gameState?.players?.[savedId]) {
      setJoined(true);
    }
  }, [gameState, sessionId]);

  const joinGame = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayers = { ...gameState.players };
    newPlayers[myId] = {
      name: name.trim(),
      color,
      age: parseInt(age),
      score: 0,
      ready: false
    };

    await updateGame({ players: newPlayers });
    localStorage.setItem(`quizmaster_id_${sessionId}`, myId);
    setJoined(true);
  };

  const toggleReady = async () => {
    const playerId = localStorage.getItem(`quizmaster_id_${sessionId}`);
    const newPlayers = { ...gameState.players };
    newPlayers[playerId].ready = !newPlayers[playerId].ready;
    await updateGame({ players: newPlayers });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Lade...</div>;

  if (joined) {
    if (gameState?.status === 'PLAYING') {
      return <ControllerGameView gameState={gameState} updateGame={updateGame} myId={localStorage.getItem(`quizmaster_id_${sessionId}`)} />;
    }

    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 className="title-gradient" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bereit machen!</h2>
        <div className="glass-card" style={{ marginBottom: '2rem' }}>
          <p style={{ fontSize: '1.2rem' }}>Hallo, {gameState?.players?.[localStorage.getItem(`quizmaster_id_${sessionId}`)]?.name}!</p>
          <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>Warte auf den Host oder andere Spieler...</p>
        </div>
        <button 
          onClick={toggleReady}
          style={{ width: '100%', padding: '1.5rem', fontSize: '1.2rem' }}
        >
          {gameState?.players?.[localStorage.getItem(`quizmaster_id_${sessionId}`)]?.ready ? 'Ich bin bereit! (Ja)' : 'bereit machen?'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="title-gradient" style={{ fontSize: '2.5rem' }}>Quizmaster AI</h1>
        <p style={{ color: 'var(--text-dim)' }}>Controller-Modus</p>
      </header>

      <form onSubmit={joinGame} className="glass-card">
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <User size={18} /> Name
          </label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Dein Name" 
            maxLength={15}
            required 
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Target size={18} /> Alter (für Schwierigkeit)
          </label>
          <input 
            type="number" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
            min={5} 
            max={99} 
            required 
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Palette size={18} /> Farbe wählen
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            {COLORS.map(c => (
              <div 
                key={c}
                onClick={() => setColor(c)}
                style={{ 
                  height: '40px', 
                  background: c, 
                  borderRadius: '10px', 
                  border: color === c ? '3px solid white' : 'none',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: '1rem' }}>
          Beitreten
        </button>
      </form>
    </div>
  );
};

const CATEGORIES = ['Allgemeinwissen', 'Sport', 'Film & Serien', 'Popkultur', 'Wissenschaft', 'Geschichte', 'Geografie', 'Musik'];
import { generateQuestion } from '../../services/gemini';

const ControllerGameView = ({ gameState, updateGame, myId }) => {
  const isMyTurn = gameState.currentTurn === myId;
  const [submitting, setSubmitting] = useState(false);

  const selectCategory = async (cat) => {
    setSubmitting(true);
    const myPlayer = gameState.players[myId];
    
    // 1. Update category in state
    await updateGame({ 
      category: cat,
      selectedAnswer: null 
    });

    // 2. Generate AI question
    try {
      const question = await generateQuestion(cat, myPlayer.age);
      await updateGame({ currentQuestion: question });
    } catch (err) {
      alert("Fehler bei der KI-Generierung. Bitte erneut versuchen.");
      await updateGame({ category: null });
    }
    setSubmitting(false);
  };

  const submitAnswer = async (index) => {
    if (gameState.selectedAnswer !== null) return;
    
    const isCorrect = index === gameState.currentQuestion.correctIndex;
    const newPlayers = { ...gameState.players };
    if (isCorrect) {
      newPlayers[myId].score += 100;
    }

    await updateGame({ 
      selectedAnswer: index,
      players: newPlayers
    });
  };

  if (!isMyTurn) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="glass-card">
          <p style={{ fontSize: '1.2rem' }}>Warte auf</p>
          <h2 className="title-gradient">{gameState.players[gameState.currentTurn]?.name}</h2>
          <div style={{ marginTop: '2rem' }}>
             <p>Dein Score: <span style={{ fontWeight: 'bold' }}>{gameState.players[myId]?.score}</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (!gameState.category) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2 style={{ marginBottom: '2rem' }}>Wähle eine Kategorie:</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => selectCategory(cat)}
              disabled={submitting}
              style={{ padding: '1.5rem 0.5rem', fontSize: '1rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!gameState.currentQuestion) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 className="title-gradient">Generiere Frage...</h2>
        <p style={{ marginTop: '1rem', color: 'var(--text-dim)' }}>Die KI denkt nach.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--text-dim)' }}>Kategorie: {gameState.category}</p>
        <h2 style={{ fontSize: '1.5rem' }}>{gameState.currentQuestion.question}</h2>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {gameState.currentQuestion.options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => submitAnswer(i)}
            disabled={gameState.selectedAnswer !== null}
            style={{ 
              padding: '1.2rem', 
              textAlign: 'left',
              fontSize: '1.1rem',
              background: gameState.selectedAnswer === i ? 'var(--primary-hover)' : 'var(--glass)',
              border: '1px solid var(--glass-border)'
            }}
          >
            <span style={{ fontWeight: 'bold', marginRight: '0.75rem' }}>{String.fromCharCode(65 + i)}</span>
            {opt}
          </button>
        ))}
      </div>

      {gameState.selectedAnswer !== null && (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
           <p style={{ fontSize: '1.2rem' }}>{gameState.selectedAnswer === gameState.currentQuestion.correctIndex ? '✅ Richtig!' : '❌ Falsch!'}</p>
        </div>
      )}
    </div>
  );
};

export default ControllerView;
