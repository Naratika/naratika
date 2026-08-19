import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AdConfigProvider } from './context/AdConfigContext';
import { ReaderProvider } from './context/ReaderContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { Home } from './pages/Home';
import { Discover } from './pages/Discover';
import { NovelDetail } from './pages/NovelDetail';
import { Reader } from './pages/Reader';
import { Library } from './pages/Library';
import { AuthorStudio } from './pages/AuthorStudio';
import { CreateNovel } from './pages/CreateNovel';
import { ChapterEditor } from './pages/ChapterEditor';
import { AdminDashboard } from './pages/AdminDashboard';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { RewardedAdModal } from './components/RewardedAdModal';

export function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedNovelId, setSelectedNovelId] = useState(null);
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const handleSelectNovel = (id) => {
    setSelectedNovelId(id);
    setCurrentPage('novel-detail');
  };

  const handleReadChapter = (novelId, chapterId) => {
    setSelectedNovelId(novelId);
    setSelectedChapterId(chapterId);
    setCurrentPage('reader');
  };

  const handleAddChapter = (novelId) => {
    setSelectedNovelId(novelId);
    setCurrentPage('chapter-editor');
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} onSelectNovel={handleSelectNovel} />;
      case 'discover':
        return <Discover onSelectNovel={handleSelectNovel} />;
      case 'novel-detail':
        return (
          <NovelDetail
            novelId={selectedNovelId}
            onBack={() => setCurrentPage('home')}
            onReadChapter={handleReadChapter}
          />
        );
      case 'reader':
        return (
          <Reader
            novelId={selectedNovelId}
            chapterId={selectedChapterId}
            onBack={() => setCurrentPage('novel-detail')}
            onChangeChapter={(nId, chId) => {
              setSelectedChapterId(chId);
            }}
          />
        );
      case 'library':
        return (
          <Library
            onSelectNovel={handleSelectNovel}
            onReadChapter={handleReadChapter}
            onNavigate={setCurrentPage}
          />
        );
      case 'author':
        return (
          <AuthorStudio
            onNavigate={setCurrentPage}
            onAddChapter={handleAddChapter}
          />
        );
      case 'create-novel':
        return (
          <CreateNovel
            onBack={() => setCurrentPage('author')}
            onCreated={(newId) => {
              setSelectedNovelId(newId);
              setCurrentPage('chapter-editor');
            }}
          />
        );
      case 'chapter-editor':
        return (
          <ChapterEditor
            novelId={selectedNovelId}
            onBack={() => setCurrentPage('author')}
            onSaved={() => setCurrentPage('author')}
          />
        );
      case 'admin':
        return <AdminDashboard onNavigate={setCurrentPage} />;
      case 'profile':
        return <Profile onNavigate={setCurrentPage} />;
      case 'privacy-policy':
        return <PrivacyPolicy onBack={() => setCurrentPage('profile')} />;
      default:
        return <Home onNavigate={setCurrentPage} onSelectNovel={handleSelectNovel} />;
    }
  };

  return (
    <AuthProvider>
      <AdConfigProvider>
        <ReaderProvider>
          <div className="min-h-screen bg-gray-50 text-gray-900">
            {currentPage !== 'reader' && (
              <Navbar onNavigate={setCurrentPage} currentPage={currentPage} />
            )}

            {renderContent()}

            {currentPage !== 'reader' && (
              <BottomNav currentPage={currentPage} onNavigate={setCurrentPage} />
            )}

            <InterstitialAdModal />
            <RewardedAdModal />
          </div>
        </ReaderProvider>
      </AdConfigProvider>
    </AuthProvider>
  );
}

export default App;
