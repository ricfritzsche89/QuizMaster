import React, { useState, useEffect } from 'react';
import HostView from './components/Host/HostView';
import ControllerView from './components/Controller/ControllerView';
import './App.css';

function App() {
  const [isController, setIsController] = useState(false);
  const [sessionId, setSessionId] = useState('main-session'); // Fixed session for simplicity, could be dynamic

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('controller') === 'true' || params.get('session')) {
      setIsController(true);
      if (params.get('session')) {
        setSessionId(params.get('session'));
      }
    }
  }, []);

  return (
    <div className="app-container">
      {isController ? (
        <ControllerView sessionId={sessionId} />
      ) : (
        <HostView sessionId={sessionId} />
      )}
    </div>
  );
}

export default App;
