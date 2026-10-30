import React, { useState, useEffect } from 'react';
import { User, GameMode } from './models/chess';
import { authService } from './services/auth.service';

import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { GamePage } from './pages/GamePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { HowToPlayPage } from './pages/HowToPlayPage';
import { PuzzlePage } from './pages/PuzzlePage';
import { OpeningsPage } from './pages/OpeningsPage';
import { EndgameLabPage } from './pages/EndgameLabPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [currentMode, setCurrentMode] = useState<GameMode>('computer');
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());

  useEffect(() => {
    // Attempt profile fetch if token exists
    if (authService.getToken()) {
      authService.fetchProfile().then((u) => {
        if (u) setCurrentUser(u);
      });
    }
  }, []);

  const handleStartGame = (mode: GameMode) => {
    setCurrentMode(mode);
    setCurrentPage('game');
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleRegisterSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleRefreshProfile = () => {
    authService.fetchProfile().then((u) => {
      if (u) setCurrentUser(u);
    });
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Navigation */}
      <Navbar
        currentUser={currentUser}
        currentMode={currentMode}
        onSelectMode={(mode) => setCurrentMode(mode)}
        onNavigate={(page) => setCurrentPage(page)}
        currentPage={currentPage}
        onLogout={handleLogout}
      />

      {/* Main Pages */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onStartGame={handleStartGame}
            onNavigate={(page) => setCurrentPage(page)}
          />
        )}

        {currentPage === 'game' && (
          <GamePage
            initialMode={currentMode}
            currentUser={currentUser}
            onGoHome={() => setCurrentPage('home')}
            onRefreshProfile={handleRefreshProfile}
          />
        )}

        {currentPage === 'puzzles' && (
          <PuzzlePage onGoHome={() => setCurrentPage('home')} />
        )}

        {currentPage === 'openings' && (
          <OpeningsPage
            onGoHome={() => setCurrentPage('home')}
            onNavigateEndgames={() => setCurrentPage('endgames')}
          />
        )}

        {currentPage === 'endgames' && (
          <EndgameLabPage
            onGoHome={() => setCurrentPage('home')}
            onNavigateOpenings={() => setCurrentPage('openings')}
          />
        )}

        {currentPage === 'leaderboard' && <LeaderboardPage />}

        {currentPage === 'rules' && <HowToPlayPage />}

        {currentPage === 'profile' && (
          <ProfilePage
            currentUser={currentUser}
            onNavigateLogin={() => setCurrentPage('login')}
          />
        )}

        {currentPage === 'login' && (
          <LoginPage
            onSuccess={handleLoginSuccess}
            onNavigateRegister={() => setCurrentPage('register')}
          />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onSuccess={handleRegisterSuccess}
            onNavigateLogin={() => setCurrentPage('login')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-850 bg-stone-950/80 py-6 px-4 text-center text-xs text-stone-500 space-y-1">
        <p className="font-semibold text-stone-400">
          Chess Arena &copy; {new Date().getFullYear()} — Full-Stack MEAN Architecture Chess Game
        </p>
        <p className="text-[11px] text-stone-600">
          Node.js • Express • MongoDB • TypeScript • Socket.IO • ELO Rating Engine
        </p>
      </footer>
    </div>
  );
}
