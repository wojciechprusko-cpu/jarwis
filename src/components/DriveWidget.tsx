import React, { useState, useEffect } from 'react';
import { HardDrive, Search, Plus, ExternalLink, RefreshCw, FileText, File, Sparkles, Check, AlertCircle, LogOut } from 'lucide-react';
import { googleDriveService } from '../services/googleDrive';
import { GoogleDriveFile } from '../types';

interface DriveWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  onAskJarvisAboutFile: (file: GoogleDriveFile) => void;
}

export function DriveWidget({ isOpen, onClose, onAskJarvisAboutFile }: DriveWidgetProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  // New file modal state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoad();
    }
  }, [isOpen]);

  const checkAuthAndLoad = async () => {
    const isAuthed = googleDriveService.isAuthenticated();
    setIsAuthenticated(isAuthed);
    if (isAuthed) {
      setUserProfile(googleDriveService.getUserProfile());
      loadFiles();
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await googleDriveService.requestAccessToken();
      setIsAuthenticated(true);
      setUserProfile(googleDriveService.getUserProfile());
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Nie udało się połączyć z Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.disconnect();
    setIsAuthenticated(false);
    setFiles([]);
    setUserProfile(null);
  };

  const loadFiles = async (query: string = searchQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const driveFiles = await googleDriveService.listFiles(query);
      setFiles(driveFiles);
    } catch (err: any) {
      setError(err.message || 'Błąd pobierania plików z dysku.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadFiles(searchQuery);
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      await googleDriveService.createFile(newFileName.trim(), newFileContent);
      setCreateSuccess(true);
      setNewFileName('');
      setNewFileContent('');
      setTimeout(() => {
        setCreateSuccess(false);
        setIsCreatingFile(false);
      }, 1500);
      await loadFiles();
    } catch (err: any) {
      setError(err.message || 'Nie udało się utworzyć pliku.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-['Orbitron'] flex items-center gap-2">
                Google Drive Intelligence
                {isAuthenticated && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-400 font-sans font-normal">
                    Połączono
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Przeglądaj pliki dysku, twórz nowe notatki i zlecaj analizę Jarvisowi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && userProfile && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 mr-2">
                {userProfile.picture && (
                  <img
                    src={userProfile.picture}
                    alt="avatar"
                    className="w-6 h-6 rounded-full border border-slate-700"
                    referrerPolicy="no-referrer"
                  />
                )}
                <span>{userProfile.name || userProfile.email}</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto">
                <HardDrive className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-lg font-bold text-slate-200">Połącz Jarvis z Google Drive</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Autoryzuj asystenta Jarvis za pomocą Google Identity Services, aby odczytywać i przeszukiwać Twoje dokumenty, arkusze i pliki.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs max-w-md mx-auto flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleConnect}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 inline-flex items-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
                {isLoading ? 'Łączenie z Google...' : 'Połącz z Google Drive'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Controls bar: Search, Refresh, New File, Disconnect */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Szukaj plików na Dysku Google..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    Szukaj
                  </button>
                </form>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsCreatingFile(!isCreatingFile)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Nowy plik
                  </button>

                  <button
                    onClick={() => loadFiles()}
                    disabled={isLoading}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
                    title="Odśwież listę"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    onClick={handleDisconnect}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/40 border border-slate-700 hover:border-red-500/40 text-slate-400 hover:text-red-400 transition-colors"
                    title="Rozłącz konto"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Create File Form Drawer */}
              {isCreatingFile && (
                <form
                  onSubmit={handleCreateFile}
                  className="p-4 rounded-xl bg-slate-800/90 border border-blue-500/30 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between text-xs text-blue-400 font-bold">
                    <span>Utwórz nowy plik na Google Drive</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingFile(false)}
                      className="text-slate-400 hover:text-slate-200"
                    >
                      ✕
                    </button>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="Nazwa pliku (np. notatka_jarvis.txt)"
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <textarea
                      rows={3}
                      value={newFileContent}
                      onChange={(e) => setNewFileContent(e.target.value)}
                      placeholder="Treść pliku lub notatki..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCreatingFile(false)}
                      className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || !newFileName.trim()}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5"
                    >
                      {createSuccess ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {createSuccess ? 'Zapisano!' : 'Zapisz na dysku'}
                    </button>
                  </div>
                </form>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Files List */}
              <div className="space-y-2">
                {isLoading && files.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-400" />
                    <span>Wczytywanie plików z Google Drive...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    Nie znaleziono plików na Dysku Google spełniających kryteria.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/40 transition-all flex flex-col justify-between gap-2 group"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-blue-400 shrink-0">
                            {file.mimeType.includes('document') || file.mimeType.includes('text') ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <File className="w-4 h-4" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-blue-300">
                              {file.name}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                              {file.modifiedTime
                                ? new Date(file.modifiedTime).toLocaleDateString('pl-PL', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Brak daty'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-[11px]">
                          <button
                            onClick={() => {
                              onAskJarvisAboutFile(file);
                              onClose();
                            }}
                            className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-semibold"
                            title="Poproś Jarvisa o podsumowanie lub analizę tego pliku"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Analizuj z Jarvis
                          </button>

                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-slate-400 hover:text-cyan-400"
                            >
                              Otwórz <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Komenda w terminalu: wpisz <strong className="text-blue-400">'dysk'</strong> lub <strong className="text-blue-400">'szukaj [nazwa]'</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
