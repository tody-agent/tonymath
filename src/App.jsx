import { useEffect, useMemo, useState } from 'react'
import lessons from './lessons.json'
import { isUnlocked as checkIsUnlocked, resolveSpeechRate, generateIcsContent } from './utils.js'
import { playSfx, speakText, cancelSpeech } from './audio.js'
import './App.css'

const STEP_LABELS = [
  ['📖', 'Hiểu tình huống'],
  ['💬', 'Kể lại bằng lời'],
  ['🧩', 'Tách dữ kiện'],
  ['🗺️', 'Chọn mô hình'],
  ['➕', 'Chọn phép tính'],
  ['✏️', 'Tính toán'],
  ['🗣️', 'Viết câu trả lời'],
  ['🛡️', 'Kiểm tra']
]

const LESSON_0 = {
  id: "lesson-0",
  story: "Mẹ có 3 quả táo đỏ. Mẹ mua thêm 2 quả táo xanh. Hỏi mẹ có tất cả bao nhiêu quả táo?",
  unit: "quả táo",
  icon: "🍎",
  color: "pink",
  shortTitle: "Bài học đầu tiên",
  skill: "Cộng thêm",
  visual: {
    before: 3,
    change: 2,
    emoji: "🍎",
    changeLabel: "được mua thêm"
  },
  retellOptions: [
    "Mẹ có 3 quả táo đỏ, mua thêm 2 quả táo xanh và cần tìm tổng số táo.",
    "Mẹ có 3 quả táo rồi ăn mất 2 quả.",
    "Mẹ chia 3 quả táo cho 2 người."
  ],
  correctRetell: 0,
  facts: [
    "Mẹ có 3 quả táo đỏ",
    "Mẹ mua thêm 2 quả táo xanh",
    "Cần tìm tổng số táo"
  ],
  factRoles: [
    "known",
    "known",
    "unknown"
  ],
  models: [
    "Sơ đồ tổng - phần",
    "Trục số",
    "Nhóm bằng nhau"
  ],
  correctModel: 0,
  operations: [
    "3 + 2",
    "3 - 2",
    "3 × 2"
  ],
  correctOperation: 0,
  reasons: [
    "Vì gộp táo đỏ và táo xanh lại nên tổng tăng lên.",
    "Vì bớt đi số táo.",
    "Vì chia đều số táo."
  ],
  correctReason: 0,
  answer: 5,
  answerOptions: [
    "Mẹ có tất cả 5 quả táo.",
    "Mẹ còn lại 1 quả táo.",
    "Mẹ có 6 quả táo."
  ],
  correctAnswerSentence: 0,
  checkQuestion: "Tổng số táo (5 quả) lớn hơn số táo đỏ ban đầu (3 quả) có đúng không?",
  checkOptions: [
    "Đúng, tổng phải lớn hơn các phần gộp lại.",
    "Sai, tổng phải nhỏ hơn."
  ],
  correctCheck: 0,
  hints: [
    "Nhìn hình: có 3 táo đỏ và 2 táo xanh.",
    "Chọn câu tóm tắt đầy đủ cả táo đỏ, táo xanh và câu hỏi.",
    "Bấm 'Đã biết' cho các số đã cho, và 'Cần tìm' cho câu hỏi.",
    "Chọn mô hình gộp hai phần thành một tổng lớn.",
    "Gộp lại thì chọn phép cộng 3 + 2.",
    "Tính nhẩm xem 3 cộng 2 bằng bao nhiêu.",
    "Chọn câu trả lời có số 5 và đơn vị là quả táo.",
    "Kiểm tra lại xem tổng số táo có lớn hơn từng phần không."
  ]
}

const DEFAULT_PROGRESS = {
  completed: {},
  xp: 0,
  streak: 1,
  lastStudyDate: null,
  currentLesson: 0,
  onboarded: false,
  profile: {
    name: '',
    mascot: 'owl'
  },
  reminderTime: '19:00',
  notificationsEnabled: false
}

const DEFAULT_AUDIO_SETTINGS = {
  autoRead: true,
  speed: 'normal',
  muted: false
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('hoc-toan-vui-progress-v1')
    return saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS
  } catch {
    return DEFAULT_PROGRESS
  }
}

function loadAudioSettings() {
  try {
    const saved = localStorage.getItem('hoc-toan-vui-audio-settings-v1')
    return saved ? { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(saved) } : DEFAULT_AUDIO_SETTINGS
  } catch {
    return DEFAULT_AUDIO_SETTINGS
  }
}

let isMutedGlobal = loadAudioSettings().muted;
function playClick() {
  playSfx('click', isMutedGlobal);
}

let globalRate = resolveSpeechRate(loadAudioSettings().speed);
function speakManual(text) {
  speakText(text, globalRate);
}

function App() {
  const [progress, setProgress] = useState(loadProgress)
  const [view, setView] = useState(progress.onboarded ? 'home' : 'onboarding')
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [lessonIndex, setLessonIndex] = useState(progress.currentLesson || 0)
  const [step, setStep] = useState(0)
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings)
  const [audioPanelOpen, setAudioPanelOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [secondSelected, setSecondSelected] = useState(null)
  const [factAnswers, setFactAnswers] = useState([])
  const [numberAnswer, setNumberAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [showIosInstructions, setShowIosInstructions] = useState(false)

  const lesson = lessons[lessonIndex]
  const completedCount = Object.keys(progress.completed).length
  const level = Math.floor(progress.xp / 100) + 1
  const levelProgress = progress.xp % 100

  useEffect(() => {
    localStorage.setItem('hoc-toan-vui-progress-v1', JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !isStandalone) {
      const dismissed = localStorage.getItem('hoc-toan-vui-ios-install-dismissed');
      if (dismissed !== 'true') {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [])

  useEffect(() => {
    localStorage.setItem('hoc-toan-vui-audio-settings-v1', JSON.stringify(audioSettings))
    isMutedGlobal = audioSettings.muted
    globalRate = resolveSpeechRate(audioSettings.speed)
  }, [audioSettings])


  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (progress.lastStudyDate !== today) {
      setProgress((old) => {
        let newStreak = old.streak
        if (old.lastStudyDate) {
          const lastDate = new Date(old.lastStudyDate)
          const currentDate = new Date(today)
          const diffTime = Math.abs(currentDate - lastDate)
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
          if (diffDays === 1) {
            newStreak = old.streak + 1
          } else if (diffDays > 1) {
            newStreak = 1
          }
        } else {
          newStreak = 1
        }
        return { ...old, lastStudyDate: today, streak: newStreak }
      })
    }
  }, [progress.lastStudyDate])

  useEffect(() => {
    if (view !== 'lesson' || audioSettings.muted || !audioSettings.autoRead) return

    const rate = resolveSpeechRate(audioSettings.speed)
    let text = ""

    switch (step) {
      case 0:
        text = `Bước 1: Nhìn câu chuyện bằng hình. Đề bài: ${lesson.story}`
        break
      case 1:
        text = `Bước 2: Kể lại bằng lời. Câu chuyện này có thể kể lại thế nào? Hãy chọn câu con cho là đúng nhất.`
        break
      case 2:
        text = `Bước 3: Tách dữ kiện. Đã biết hay cần tìm? Phân loại từng mẩu thông tin bên dưới.`
        break
      case 3:
        text = `Bước 4: Chọn mô hình phù hợp. Mô hình nào diễn tả đúng mối quan hệ trong đề?`
        break
      case 4:
        text = `Bước 5: Chọn phép tính và giải thích. Phép tính nào phù hợp và tại sao?`
        break
      case 5:
        text = `Bước 6: Tự tính toán. Điền kết quả vào ô trống.`
        break
      case 6:
        text = `Bước 7: Viết câu trả lời. Chọn câu trả lời đầy đủ nhất.`
        break
      case 7:
        text = `Bước 8: Kiểm tra. ${lesson.checkQuestion}`
        break
      default:
        break
    }

    if (text) {
      const timer = setTimeout(() => {
        speakText(text, rate)
      }, 500)
      return () => {
        clearTimeout(timer)
        cancelSpeech()
      }
    }
  }, [view, lessonIndex, step, audioSettings.autoRead, audioSettings.muted, audioSettings.speed, lesson])

  useEffect(() => {
    if (view !== 'lesson' || !feedback || audioSettings.muted || !audioSettings.autoRead) return
    const rate = resolveSpeechRate(audioSettings.speed)
    const text = feedback.correct ? `Chính xác! ${feedback.message}` : `Thử lại nhé! ${feedback.message}`
    speakText(text, rate)
  }, [feedback, view, audioSettings.autoRead, audioSettings.muted, audioSettings.speed])


  const isUnlocked = (index) => checkIsUnlocked(index, progress.completed, lessons, isDevMode)

  function resetStepState(nextStep = step) {
    setSelected(null)
    setSecondSelected(null)
    setFactAnswers([])
    setNumberAnswer('')
    setFeedback(null)
    setHintOpen(false)
    setStep(nextStep)
  }

  function openLesson(index) {
    if (!isUnlocked(index)) return
    playClick()
    setLessonIndex(index)
    setProgress((old) => ({ ...old, currentLesson: index }))
    setMistakes(0)
    setHearts(3)
    resetStepState(0)
    setView('lesson')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function markAttempt(isCorrect, message) {
    if (feedback?.correct) return
    if (isCorrect) {
      playSfx('correct', audioSettings.muted)
      setFeedback({ correct: true, message })
      setProgress((old) => ({ ...old, xp: old.xp + 10 }))
    } else {
      playSfx('wrong', audioSettings.muted)
      setFeedback({ correct: false, message })
      setMistakes((value) => value + 1)
      setHearts((value) => Math.max(0, value - 1))
    }
  }

  function validateStep() {
    if (step === 0) return markAttempt(true, 'Con đã hiểu bối cảnh. Bây giờ hãy kể lại câu chuyện nhé!')
    if (step === 1) return markAttempt(selected === lesson.correctRetell, selected === lesson.correctRetell ? 'Con đã kể đúng ba ý quan trọng!' : 'Hãy xem lại điều xảy ra với số lượng.')
    if (step === 2) {
      const correct = factAnswers.length === lesson.factRoles.length && factAnswers.every((role, index) => role === lesson.factRoles[index])
      return markAttempt(correct, correct ? 'Con đã phân biệt đúng điều đã biết và điều cần tìm!' : 'Có hai dữ kiện đã biết và một điều cần tìm.')
    }
    if (step === 3) return markAttempt(selected === lesson.correctModel, selected === lesson.correctModel ? 'Mô hình này thể hiện đúng mối quan hệ trong đề.' : 'Mô hình cần giống với cách các số liên hệ với nhau.')
    if (step === 4) {
      const correct = selected === lesson.correctOperation && secondSelected === lesson.correctReason
      return markAttempt(correct, correct ? 'Đúng cả phép tính và lý do. Đây mới là hiểu bản chất!' : 'Hãy kiểm tra lại cả phép tính lẫn lý do.')
    }
    if (step === 5) return markAttempt(Number(numberAnswer) === lesson.answer, Number(numberAnswer) === lesson.answer ? 'Tính chính xác rồi!' : 'Cách làm đúng, hãy kiểm tra lại phép tính.')
    if (step === 6) return markAttempt(selected === lesson.correctAnswerSentence, selected === lesson.correctAnswerSentence ? 'Câu trả lời đủ số, đơn vị và đúng ý câu hỏi.' : 'Câu trả lời phải đúng chủ thể và đúng đơn vị.')
    if (step === 7) return markAttempt(selected === lesson.correctCheck, selected === lesson.correctCheck ? 'Con đã biết tự kiểm tra đáp án!' : 'Hãy dùng câu chuyện hoặc phép tính ngược để kiểm tra.')
  }

  function nextStep() {
    if (!feedback?.correct) return
    if (step < 7) {
      playClick()
      resetStepState(step + 1)
      return
    }
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    setProgress((old) => ({
      ...old,
      xp: old.xp + stars * 10,
      completed: {
        ...old.completed,
        [lesson.id]: { stars, mistakes, completedAt: new Date().toISOString() }
      }
    }))
    playSfx('complete', audioSettings.muted)
    setView('complete')
  }

  function speakStory() {
    const rate = resolveSpeechRate(audioSettings.speed);
    speakText(lesson.story, rate);
  }

  function resetAllProgress() {
    if (!window.confirm('Xóa toàn bộ điểm và tiến độ học trên thiết bị này?')) return
    setProgress(DEFAULT_PROGRESS)
    setLessonIndex(0)
    setView('onboarding')
    setMenuOpen(false)
  }

  const earnedStars = useMemo(
    () => Object.values(progress.completed).reduce((sum, item) => sum + item.stars, 0),
    [progress.completed]
  )

  const isStepAnswered = () => {
    if (step === 0) return true
    if (step === 1) return selected !== null
    if (step === 2) {
      return factAnswers.length === lesson.facts.length &&
             factAnswers.every((x) => x === 'known' || x === 'unknown')
    }
    if (step === 3) return selected !== null
    if (step === 4) return selected !== null && secondSelected !== null
    if (step === 5) return numberAnswer.trim() !== ''
    if (step === 6) return selected !== null
    if (step === 7) return selected !== null
    return false
  }

  function handleInstallClick() {
    playClick();
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      setShowIosInstructions(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    } else {
      alert("Để cài đặt, vui lòng sử dụng Safari/Chrome và chọn 'Thêm vào màn hình chính' từ menu trình duyệt.");
    }
  }

  function dismissInstallPrompt() {
    playClick();
    setShowInstallPrompt(false);
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos) {
      localStorage.setItem('hoc-toan-vui-ios-install-dismissed', 'true');
    }
  }

  function toggleNotifications(enabled) {
    playClick();
    if (enabled) {
      if (!('Notification' in window)) {
        alert("Trình duyệt này không hỗ trợ thông báo.");
        return;
      }
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setProgress(old => ({ ...old, notificationsEnabled: true }));
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'TRIGGER_NOTIFICATION',
              title: 'Học Toán Vui 🚀',
              body: 'Thông báo nhắc nhở hàng ngày đã được bật!'
            });
          }
        } else {
          alert("Bạn đã chặn thông báo. Vui lòng cho phép thông báo trong cài đặt trình duyệt để nhận nhắc nhở.");
        }
      });
    } else {
      setProgress(old => ({ ...old, notificationsEnabled: false }));
    }
  }

  function changeReminderTime(time) {
    playClick();
    setProgress(old => ({ ...old, reminderTime: time }));
  }

  function downloadIcsReminder() {
    playClick();
    const timeStr = progress.reminderTime || '19:00';
    const icsContent = generateIcsContent(timeStr);
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'nhac_nho_hoc_toan.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const isSessionActive = view === 'onboarding' || view === 'lesson'

  return (
    <div className={`app-shell ${isSessionActive ? 'onboarding-shell' : ''}`}>
      {!isSessionActive && (
        <header className="topbar">
          <button className="brand" onClick={() => setView('home')} aria-label="Về trang chủ">
            <span className="brand-mascot">🦉</span>
            <span><strong>Học Toán</strong><small>Học cách học</small></span>
          </button>
          <div className="top-stats">
            <div className="level-card"><span>⭐</span><div><b>Cấp độ {level}</b><div className="mini-progress"><i style={{ width: `${levelProgress}%` }} /></div></div></div>
            <div className="stat"><span>🔥</span><b>{progress.streak}</b><small>ngày</small></div>
            <div className="stat"><span>🪙</span><b>{progress.xp}</b><small>điểm</small></div>
            <button 
              onClick={() => { playSfx('click', audioSettings.muted); setIsDevMode(prev => !prev); }} 
              className={`dev-toggle-direct ${isDevMode ? 'dev-active' : ''}`}
            >
              {isDevMode ? '🔒 Khóa bài' : '🔓 Mở khóa tất cả'}
            </button>
            <div className="audio-settings-wrapper">
              <button className="audio-settings-toggle" onClick={() => { setAudioPanelOpen(prev => !prev); setMenuOpen(false); }} aria-label="Cài đặt âm thanh">
                {audioSettings.muted ? '🔇' : '🔊'}
              </button>
              {audioPanelOpen && (
                <div className="audio-settings-panel">
                  <b>Cài đặt âm thanh</b>
                  <label className="settings-row">
                    <span>Tự động đọc bài:</span>
                    <input
                      type="checkbox"
                      checked={audioSettings.autoRead}
                      onChange={(e) => {
                        playSfx('click', audioSettings.muted);
                        setAudioSettings(prev => ({ ...prev, autoRead: e.target.checked }));
                      }}
                    />
                  </label>
                  <div className="settings-row speed-control">
                    <span>Tốc độ đọc:</span>
                    <div className="speed-buttons">
                      <button
                        className={audioSettings.speed === 'slow' ? 'active' : ''}
                        onClick={() => {
                          playSfx('click', audioSettings.muted);
                          setAudioSettings(prev => ({ ...prev, speed: 'slow' }));
                        }}
                      >
                        Chậm
                      </button>
                      <button
                        className={audioSettings.speed === 'normal' ? 'active' : ''}
                        onClick={() => {
                          playSfx('click', audioSettings.muted);
                          setAudioSettings(prev => ({ ...prev, speed: 'normal' }));
                        }}
                      >
                        Vừa
                      </button>
                      <button
                        className={audioSettings.speed === 'fast' ? 'active' : ''}
                        onClick={() => {
                          playSfx('click', audioSettings.muted);
                          setAudioSettings(prev => ({ ...prev, speed: 'fast' }));
                        }}
                      >
                        Nhanh
                      </button>
                    </div>
                  </div>
                  <button
                    className="mute-btn"
                    onClick={() => {
                      const nextMuted = !audioSettings.muted;
                      setAudioSettings(prev => ({ ...prev, muted: nextMuted }));
                      if (!nextMuted) {
                        setTimeout(() => playSfx('click', false), 50);
                      }
                    }}
                  >
                    {audioSettings.muted ? '🔊 Bật âm thanh' : '🔇 Tắt toàn bộ âm'}
                  </button>
                </div>
              )}
            </div>
            <button className="avatar-button" onClick={() => { setMenuOpen((open) => !open); setAudioPanelOpen(false); }} aria-label="Menu cá nhân">👦</button>
          </div>
          {menuOpen && (
            <div className="profile-menu" style={{ width: '280px', maxHeight: '85vh', overflowY: 'auto' }}>
              <b>{progress.profile?.name ? `Bé ${progress.profile.name}` : 'Bạn nhỏ chăm học'}</b>
              <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', margin: '4px 0 12px 0' }}>
                <span>{progress.profile?.mascot === 'robot' ? '🤖' : progress.profile?.mascot === 'turtle' ? '🐢' : '🦉'}</span>
                Cố vấn: {progress.profile?.mascot === 'robot' ? 'Rô Bốt' : progress.profile?.mascot === 'turtle' ? 'Rùa Con' : 'Cú Ú'}
              </span>
              <div style={{ borderTop: '1px solid #eef2ff', padding: '12px 0' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', display: 'block', marginBottom: '8px' }}>⏰ Nhắc nhở tự động</span>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span>Chuông báo học:</span>
                  <input
                    type="checkbox"
                    checked={progress.notificationsEnabled}
                    onChange={(e) => toggleNotifications(e.target.checked)}
                  />
                </label>
                {progress.notificationsEnabled && (
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Chọn giờ báo:</span>
                    <select
                      value={progress.reminderTime || '19:00'}
                      onChange={(e) => changeReminderTime(e.target.value)}
                      style={{ padding: '2px 6px', borderRadius: '6px', fontSize: '12px' }}
                    >
                      <option value="08:00">08:00 Sáng</option>
                      <option value="09:00">09:00 Sáng</option>
                      <option value="17:00">17:00 Chiều</option>
                      <option value="19:00">19:00 Tối</option>
                      <option value="20:00">20:00 Tối</option>
                      <option value="21:00">21:00 Tối</option>
                    </select>
                  </label>
                )}
                <button 
                  onClick={downloadIcsReminder}
                  className="calendar-btn-link"
                  style={{ width: '100%', padding: '8px', fontSize: '12px', marginTop: '6px', cursor: 'pointer' }}
                >
                  ⏰ Đặt lịch chuông điện thoại
                </button>
              </div>
              <div style={{ borderTop: '1px solid #eef2ff', padding: '12px 0 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => { setIsDevMode(prev => !prev); setMenuOpen(false); }} className="dev-toggle" style={{ margin: 0 }}>
                  {isDevMode ? '🔒 Khóa chế độ Dev' : '🔓 Mở khóa tất cả'}
                </button>
                <button onClick={resetAllProgress} style={{ margin: 0, background: '#fff5f5', color: '#e53e3e', border: '1px solid #fed7d7' }}>Xóa tiến độ</button>
              </div>
            </div>
          )}
        </header>
      )}

      {!isSessionActive && (
        <aside className="sidebar">
          <nav>
            <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
            <NavButton icon="📚" label="Bài học" active={view === 'lesson'} onClick={() => setView('home')} />
            <NavButton icon="🏆" label="Thành tích" active={view === 'achievements'} onClick={() => setView('achievements')} />
            <NavButton icon="📈" label="Tiến độ" active={view === 'progress'} onClick={() => setView('progress')} />
          </nav>
          <div className="coach-card">
            <div className="coach">🙋‍♂️</div>
            <b>Cố lên!</b>
            <span>Mỗi lần giải thích được “tại sao”, bộ não của con mạnh hơn.</span>
          </div>
        </aside>
      )}

      <main className={isSessionActive ? "main-content full-width" : "main-content"}>
        {view === 'onboarding' && (
          <OnboardingView progress={progress} setProgress={setProgress} setView={setView} />
        )}
        {view === 'home' && (
          <Home
            lessons={lessons}
            progress={progress}
            openLesson={openLesson}
            isUnlocked={isUnlocked}
            completedCount={completedCount}
            earnedStars={earnedStars}
          />
        )}
        {view === 'lesson' && (
          <LessonView
            lesson={lesson}
            step={step}
            selected={selected}
            setSelected={setSelected}
            secondSelected={secondSelected}
            setSecondSelected={setSecondSelected}
            factAnswers={factAnswers}
            setFactAnswers={setFactAnswers}
            numberAnswer={numberAnswer}
            setNumberAnswer={setNumberAnswer}
            feedback={feedback}
            hintOpen={hintOpen}
            setHintOpen={setHintOpen}
            hearts={hearts}
            validateStep={validateStep}
            nextStep={nextStep}
            speakStory={speakStory}
            onBack={() => setView('home')}
            isAnswered={isStepAnswered()}
          />
        )}
        {view === 'complete' && (
          <CompleteView
            lesson={lesson}
            mistakes={mistakes}
            onHome={() => setView('home')}
            onNext={() => openLesson(Math.min(lessonIndex + 1, lessons.length - 1))}
            hasNext={lessonIndex < lessons.length - 1}
          />
        )}
        {view === 'achievements' && <Achievements progress={progress} earnedStars={earnedStars} />}
        {view === 'progress' && <ProgressView lessons={lessons} progress={progress} />}
      </main>

      {!isSessionActive && (
        <nav className="mobile-nav">
          <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
          <NavButton icon="📚" label="Bài học" active={view === 'lesson'} onClick={() => setView('home')} />
          <NavButton icon="🏆" label="Thành tích" active={view === 'achievements'} onClick={() => setView('achievements')} />
          <NavButton icon="📈" label="Tiến độ" active={view === 'progress'} onClick={() => setView('progress')} />
        </nav>
      )}

      {!isSessionActive && showInstallPrompt && (
        <div className="pwa-install-drawer">
          <div className="pwa-install-text">
            <span>📲</span>
            <div>
              <b>Cài đặt ứng dụng Học Toán</b>
              <p>Học mượt mà, không quảng cáo và không cần mạng internet!</p>
            </div>
          </div>
          <div className="pwa-install-actions">
            <button className="install-confirm" onClick={handleInstallClick}>Cài đặt</button>
            <button className="install-dismiss" onClick={dismissInstallPrompt}>Đóng</button>
          </div>
        </div>
      )}

      {showIosInstructions && (
        <div className="ios-instructions-modal" onClick={() => setShowIosInstructions(false)}>
          <div className="ios-instructions-panel" onClick={e => e.stopPropagation()}>
            <h3>Cài đặt Học Toán Vui trên iPhone/iPad</h3>
            <p>Safari trên iOS không hỗ trợ cài đặt tự động. Bạn hãy thêm vào Màn hình chính theo cách sau:</p>
            <div className="ios-steps">
              <div className="ios-step-row">
                <span>1</span>
                <p>Chạm vào nút <b>Chia sẻ</b> (biểu tượng hộp có mũi tên lên ở dưới Safari).</p>
              </div>
              <div className="ios-step-row">
                <span>2</span>
                <p>Cuộn xuống dưới rồi chọn <b>Thêm vào màn hình chính</b> (Add to Home Screen).</p>
              </div>
              <div className="ios-step-row">
                <span>3</span>
                <p>Đặt tên ứng dụng và bấm <b>Thêm</b> (Add) ở góc trên cùng bên phải.</p>
              </div>
            </div>
            <button onClick={() => setShowIosInstructions(false)}>Con đã hiểu</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SectionHeading({ num, title, desc, textToSpeak }) {
  return (
    <div className="section-heading">
      <span>{num}</span>
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {textToSpeak && (
        <button 
          className="speech-mini-btn heading-speech" 
          onClick={() => speakManual(textToSpeak)}
          aria-label="Đọc hướng dẫn"
        >
          🔊
        </button>
      )}
    </div>
  )
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button 
      className={active ? 'nav-button active' : 'nav-button'} 
      onClick={(e) => {
        playClick();
        onClick(e);
      }}
    >
      <span>{icon}</span>
      <b>{label}</b>
    </button>
  )
}

function Home({ lessons, progress, openLesson, isUnlocked, completedCount, earnedStars }) {
  return (
    <>
      <section className="journey-hero">
        <div><h1>Hành trình học toán 🚀</h1><p>Đọc hiểu, suy luận và tự giải thích từng bước.</p></div>
        <div className="treasure"><span>🧰</span><b>⭐ {completedCount}/{lessons.length}</b></div>
      </section>

      <section className="daily-strip">
        <div><span>🎯</span><p><b>Mục tiêu hôm nay</b><small>Hoàn thành một bài và giải thích được lý do chọn phép tính.</small></p></div>
        <div className="daily-score"><b>{earnedStars}</b><small>sao</small></div>
      </section>

      <div className="lesson-grid">
        {lessons.map((lesson, index) => {
          const complete = progress.completed[lesson.id]
          const unlocked = isUnlocked(index)
          return (
            <button
              key={lesson.id}
              className={`lesson-card ${lesson.color} ${!unlocked ? 'locked' : ''} ${complete ? 'completed' : ''}`}
              onClick={() => openLesson(index)}
              disabled={!unlocked}
            >
              <span className="lesson-number">{index + 1}</span>
              <span className="lesson-icon">{lesson.icon}</span>
              <strong>{lesson.shortTitle}</strong>
              <small>{lesson.skill}</small>
              <div className="stars" aria-label={`${complete?.stars || 0} sao`}>
                {[0, 1, 2].map((star) => <span key={star}>{complete && star < complete.stars ? '⭐' : '☆'}</span>)}
              </div>
              {!unlocked && <span className="lock">🔒</span>}
              {complete && <span className="check">✓</span>}
            </button>
          )
        })}
      </div>
    </>
  )
}

function LessonView(props) {
  const { lesson, step, feedback, hintOpen, setHintOpen, hearts, validateStep, nextStep, speakStory, onBack, isAnswered } = props
  const hasFeedback = Boolean(feedback);
  const isCorrect = feedback?.correct;

  return (
    <div className="lesson-page">
      <div className="lesson-toolbar">
        <button className="close-button" onClick={() => { playClick(); onBack(); }} aria-label="Quay lại danh sách bài học">✕</button>
        <div className="lesson-progress"><span style={{ width: `${((step + 1) / 8) * 100}%` }} /></div>
        <button className={`hint-button ${hintOpen ? 'active' : ''}`} onClick={() => { playClick(); setHintOpen((open) => !open); }}>💡</button>
        <div className="hearts">❤️ {hearts}</div>
      </div>

      <div className="lesson-layout">
        <ol className="steps-list">
          {STEP_LABELS.map(([icon, label], index) => (
            <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
              <span>{index < step ? '✓' : index + 1}</span><i>{icon}</i><b>{label}</b>
            </li>
          ))}
        </ol>

        <section className="exercise-card">
          <div className="story-box-wrapper">
            <div className="story-box">
              <button className="sound-button" onClick={speakStory} aria-label="Đọc đề bài">🔊</button>
              <p>{lesson.story}</p>
              <span className="story-emoji">{lesson.icon}</span>
            </div>

            {hintOpen && (
              <div className="hint-panel">
                <span>💡</span>
                <p>{lesson.hints[step]}</p>
                <button 
                  className="speech-mini-btn" 
                  onClick={() => speakManual(lesson.hints[step])}
                  aria-label="Đọc gợi ý"
                >
                  🔊
                </button>
              </div>
            )}
          </div>

          <div className="question-area">
            <StepContent {...props} />
          </div>
        </section>
      </div>

      <div className={`lesson-footer ${hasFeedback ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''}`}>
        <div className="footer-content">
          {hasFeedback ? (
            <div className="feedback-banner">
              <span className="feedback-icon">{isCorrect ? '🎉' : '🌱'}</span>
              <div className="feedback-text">
                <b>{isCorrect ? 'Chính xác!' : 'Thử lại nhé!'}</b>
                <p>{feedback.message}</p>
              </div>
              <button 
                className="speech-mini-btn feedback-speech" 
                onClick={() => speakManual(isCorrect ? `Chính xác! ${feedback.message}` : `Thử lại nhé! ${feedback.message}`)}
                aria-label="Đọc phản hồi"
              >
                🔊
              </button>
            </div>
          ) : (
            <div className="footer-tip">
            </div>
          )}

          <div className="footer-actions">
            {!hasFeedback ? (
              <>
                <button className="secondary-button footer-back" onClick={() => { playClick(); onBack(); }}>Quay lại</button>
                <button className="primary-button footer-submit" onClick={validateStep} disabled={!isAnswered}>Kiểm tra</button>
              </>
            ) : (
              <button className="primary-button footer-next" onClick={nextStep} autoFocus>
                {step === 7 ? 'Hoàn thành' : 'Tiếp theo'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StepContent({ lesson, step, selected, setSelected, secondSelected, setSecondSelected, factAnswers, setFactAnswers, numberAnswer, setNumberAnswer, feedback }) {
  const frozen = Boolean(feedback?.correct)
  if (step === 0) return <UnderstandStep lesson={lesson} />
  if (step === 1) return <OptionQuestion title="Câu chuyện này có thể kể lại thế nào?" options={lesson.retellOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
  if (step === 2) return <FactsStep lesson={lesson} answers={factAnswers} setAnswers={setFactAnswers} frozen={frozen} />
  if (step === 3) return <ModelStep lesson={lesson} selected={selected} setSelected={setSelected} frozen={frozen} />
  if (step === 4) return <OperationStep lesson={lesson} selected={selected} setSelected={setSelected} secondSelected={secondSelected} setSecondSelected={setSecondSelected} frozen={frozen} />
  if (step === 5) return <CalculationStep lesson={lesson} value={numberAnswer} setValue={setNumberAnswer} frozen={frozen} />
  if (step === 6) return <OptionQuestion title="Chọn câu trả lời đầy đủ nhất" options={lesson.answerOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
  return <OptionQuestion title={lesson.checkQuestion} options={lesson.checkOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
}

function UnderstandStep({ lesson }) {
  const visualCount = Math.min(lesson.visual.before, 12)
  const changeCount = Math.min(lesson.visual.change, 8)
  return (
    <div>
      <SectionHeading 
        num="1" 
        title="Nhìn câu chuyện bằng hình" 
        desc="Số lượng đang thay đổi hay đang được so sánh?" 
        textToSpeak="Bước 1: Nhìn câu chuyện bằng hình. Số lượng đang thay đổi hay đang được so sánh?" 
      />
      <div className="visual-story">
        <div className="visual-group"><b>Ban đầu / phần thứ nhất</b><div className="emoji-row">{Array.from({ length: visualCount }, (_, i) => <span key={i}>{lesson.visual.emoji}</span>)}</div><small>{lesson.visual.before} {lesson.unit}</small></div>
        <div className="story-arrow">→</div>
        <div className="visual-group accent"><b>{lesson.visual.changeLabel}</b><div className="emoji-row">{Array.from({ length: changeCount }, (_, i) => <span key={i}>{lesson.visual.emoji}</span>)}</div><small>{lesson.visual.change}</small></div>
        <div className="story-arrow">→</div>
        <div className="unknown-box">?</div>
      </div>
      <div className="think-prompt">🧠 Chưa cần tính. Hãy quan sát xem các số đang liên hệ với nhau như thế nào.</div>
    </div>
  )
}

function OptionQuestion({ title, options, selected, setSelected, frozen }) {
  return (
    <div>
      <SectionHeading 
        num="?" 
        title={title} 
        desc="Chạm vào câu con cho là đúng nhất." 
        textToSpeak={`${title}. Chạm vào câu con cho là đúng nhất.`} 
      />
      <div className="option-list">
        {options.map((option, index) => (
          <div key={option} className="option-row">
            <button 
              disabled={frozen} 
              className={selected === index ? 'option selected' : 'option'} 
              onClick={() => { playClick(); setSelected(index); }}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <p>{option}</p>
            </button>
            <button 
              className="speech-option-btn" 
              onClick={() => speakManual(option)}
              aria-label="Đọc lựa chọn"
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FactsStep({ lesson, answers, setAnswers, frozen }) {
  function setRole(index, role) {
    const next = [...answers]
    next[index] = role
    setAnswers(next)
  }
  return (
    <div>
      <SectionHeading 
        num="3" 
        title="Đã biết hay cần tìm?" 
        desc="Phân loại từng mẩu thông tin." 
        textToSpeak="Bước 3: Đã biết hay cần tìm? Phân loại từng mẩu thông tin." 
      />
      <div className="facts-grid">
        {lesson.facts.map((fact, index) => (
          <div className="fact-card" key={fact}>
            <div className="fact-header">
              <p>{fact}</p>
              <button 
                className="speech-mini-btn" 
                onClick={() => speakManual(fact)}
                aria-label="Đọc dữ kiện"
              >
                🔊
              </button>
            </div>
            <div>
              <button disabled={frozen} className={answers[index] === 'known' ? 'selected' : ''} onClick={() => { playClick(); setRole(index, 'known'); }}>✓ Đã biết</button>
              <button disabled={frozen} className={answers[index] === 'unknown' ? 'selected' : ''} onClick={() => { playClick(); setRole(index, 'unknown'); }}>? Cần tìm</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ModelStep({ lesson, selected, setSelected, frozen }) {
  const icons = ['▰▰', '● ● ●', '↗', '▦']
  return (
    <div>
      <SectionHeading 
        num="4" 
        title="Chọn mô hình phù hợp" 
        desc="Mô hình nào diễn tả đúng mối quan hệ trong đề?" 
        textToSpeak="Bước 4: Chọn mô hình phù hợp. Mô hình nào diễn tả đúng mối quan hệ trong đề?" 
      />
      <div className="model-grid">
        {lesson.models.map((model, index) => (
          <div key={model} className="model-wrapper">
            <button 
              disabled={frozen} 
              className={selected === index ? 'model-card selected' : 'model-card'} 
              onClick={() => { playClick(); setSelected(index); }}
            >
              <span>{icons[index]}</span>
              <b>{model}</b>
            </button>
            <button 
              className="speech-mini-btn model-speech" 
              onClick={() => speakManual(model)}
              aria-label="Đọc mô hình"
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function OperationStep({ lesson, selected, setSelected, secondSelected, setSecondSelected, frozen }) {
  return (
    <div>
      <SectionHeading 
        num="5" 
        title="Chọn phép tính và giải thích" 
        desc="Đúng phép tính chưa đủ — con cần biết tại sao." 
        textToSpeak="Bước 5: Chọn phép tính và giải thích. Đúng phép tính chưa đủ — con cần biết tại sao." 
      />
      <h3 className="mini-title">Phép tính nào phù hợp?</h3>
      <div className="operation-grid">
        {lesson.operations.map((operation, index) => (
          <button 
            disabled={frozen} 
            key={operation} 
            className={selected === index ? 'selected' : ''} 
            onClick={() => { playClick(); setSelected(index); }}
          >
            {operation}
          </button>
        ))}
      </div>
      <h3 className="mini-title">Tại sao?</h3>
      <div className="reason-list">
        {lesson.reasons.map((reason, index) => (
          <div key={reason} className="reason-row">
            <button 
              disabled={frozen} 
              className={secondSelected === index ? 'selected' : ''} 
              onClick={() => { playClick(); setSecondSelected(index); }}
            >
              <span>{index + 1}</span>
              {reason}
            </button>
            <button 
              className="speech-mini-btn" 
              onClick={() => speakManual(reason)}
              aria-label="Đọc giải thích"
            >
              🔊
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalculationStep({ lesson, value, setValue, frozen }) {
  const expression = lesson.operations[lesson.correctOperation]
  return (
    <div>
      <SectionHeading 
        num="6" 
        title="Tự tính toán" 
        desc="Điền kết quả vào ô trống." 
        textToSpeak="Bước 6: Tự tính toán. Điền kết quả vào ô trống." 
      />
      <div className="calculation-box"><span>{expression}</span><b>=</b><input disabled={frozen} inputMode="numeric" pattern="[0-9]*" value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, ''))} autoFocus /><small>{lesson.unit}</small></div>
      <div className="scratch-row"><span>🧮</span><p>Con có thể tính nhẩm, tách số tròn chục hoặc dùng phép tính ngược.</p></div>
    </div>
  )
}

function CompleteView({ lesson, mistakes, onHome, onNext, hasNext }) {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
  return (
    <section className="complete-screen">
      <div className="celebration">🎊</div>
      <h1>Hoàn thành bài học!</h1>
      <p>Con không chỉ tìm ra đáp án, mà còn biết giải thích cách suy nghĩ.</p>
      <div className="big-stars">{[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'earned' : ''}>⭐</span>)}</div>
      <div className="result-card"><div><span>🧠</span><b>+{80 + stars * 10}</b><small>điểm tư duy</small></div><div><span>🌱</span><b>{mistakes}</b><small>lần tự sửa</small></div><div><span>{lesson.icon}</span><b>{lesson.skill}</b><small>kỹ năng mới</small></div></div>
      <div className="complete-actions">
        <button className="secondary-button" onClick={() => { playClick(); onHome(); }}>Về hành trình</button>
        {hasNext && <button className="primary-button" onClick={() => { playClick(); onNext(); }}>Bài tiếp theo →</button>}
      </div>
    </section>
  )
}

function Achievements({ progress, earnedStars }) {
  const achievements = [
    ['🔎', 'Thám tử dữ kiện', Object.keys(progress.completed).length >= 2],
    ['🗣️', 'Giải thích rõ ràng', Object.keys(progress.completed).length >= 4],
    ['🧠', 'Bộ não logic', progress.xp >= 300],
    ['⭐', 'Nhà sưu tập sao', earnedStars >= 15],
    ['🔥', 'Kiên trì mỗi ngày', progress.streak >= 3],
    ['🏆', 'Chinh phục hành trình', Object.keys(progress.completed).length === lessons.length]
  ]
  return (
    <section className="simple-page"><div className="page-title"><span>🏆</span><div><h1>Thành tích</h1><p>Phần thưởng dành cho cách học tốt, không chỉ cho tốc độ.</p></div></div><div className="achievement-grid">{achievements.map(([icon, title, unlocked]) => <div key={title} className={unlocked ? 'achievement unlocked' : 'achievement'}><span>{icon}</span><b>{title}</b><small>{unlocked ? 'Đã mở khóa' : 'Tiếp tục học để mở'}</small></div>)}</div></section>
  )
}

function ProgressView({ lessons, progress }) {
  return (
    <section className="simple-page"><div className="page-title"><span>📈</span><div><h1>Tiến độ học</h1><p>Mỗi kỹ năng được ghi nhận riêng để biết con đang mạnh ở đâu.</p></div></div><div className="progress-list">{lessons.map((lesson, index) => { const item = progress.completed[lesson.id]; return <div key={lesson.id} className="progress-row"><span>{lesson.icon}</span><div><b>{index + 1}. {lesson.shortTitle}</b><small>{lesson.skill}</small></div><div className="row-stars">{item ? '⭐'.repeat(item.stars) : isNaN(index) ? '' : 'Chưa học'}</div></div> })}</div></section>
  )
}

function OnboardingView({ setProgress, setView }) {
  const [stage, setStage] = useState('welcome'); // 'welcome' | 'tutorial' | 'congrats'
  const [name, setName] = useState('');
  const [mascot, setMascot] = useState('owl'); // 'owl' | 'robot' | 'turtle'
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialSelected, setTutorialSelected] = useState(null);
  const [tutorialSecondSelected, setTutorialSecondSelected] = useState(null);
  const [tutorialFactAnswers, setTutorialFactAnswers] = useState([]);
  const [tutorialNumberAnswer, setTutorialNumberAnswer] = useState('');
  const [tutorialFeedback, setTutorialFeedback] = useState(null);
  const [tutorialHintOpen, setTutorialHintOpen] = useState(false);

  const mascots = [
    { id: 'owl', emoji: '🦉', label: 'Cú Ú', desc: 'Thích hỏi "Tại sao?"' },
    { id: 'robot', emoji: '🤖', label: 'Rô Bốt', desc: 'Vẽ sơ đồ siêu chuẩn' },
    { id: 'turtle', emoji: '🐢', label: 'Rùa Con', desc: 'Cẩn thận, bền bỉ' }
  ];

  function handleStart() {
    if (!name.trim()) return;
    playClick();
    setStage('tutorial');
  }

  function handleCongrats() {
    playClick();
    setProgress(old => ({
      ...old,
      onboarded: true,
      xp: old.xp + 100,
      profile: {
        name: name.trim(),
        mascot: mascot
      }
    }));
    setView('home');
  }

  function handleSkip() {
    playClick();
    setProgress(old => ({
      ...old,
      onboarded: true,
      profile: {
        name: name.trim() || 'Bạn nhỏ',
        mascot: mascot
      }
    }));
    setView('home');
  }

  if (stage === 'welcome') {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-card">
          <span style={{ fontSize: '48px' }}>🦉✨</span>
          <h1>Chào mừng con đến với Học Toán!</h1>
          <p>Học đọc hiểu và giải toán lời văn từng bước một cách thông minh.</p>
          
          <div className="onboarding-input-group">
            <label htmlFor="child-name">Nhập tên của con:</label>
            <input
              id="child-name"
              type="text"
              placeholder="Ví dụ: Minh An, Bảo Vy..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
            />
          </div>
          
          <div className="mascot-selection-title">Chọn người bạn đồng hành:</div>
          <div className="mascot-select-grid">
            {mascots.map(m => (
              <button
                key={m.id}
                className={`mascot-select-card ${mascot === m.id ? 'selected' : ''}`}
                onClick={() => { playClick(); setMascot(m.id); }}
              >
                <span className="emoji">{m.emoji}</span>
                <b>{m.label}</b>
                <small>{m.desc}</small>
              </button>
            ))}
          </div>
          
          <button
            className="onboarding-btn"
            disabled={!name.trim()}
            onClick={handleStart}
          >
            Bắt đầu bài học đầu tiên! 🚀
          </button>

          <button
            className="secondary-button"
            onClick={handleSkip}
            style={{ width: '100%', marginTop: '12px', padding: '14px', borderRadius: '16px', fontWeight: 'bold' }}
          >
            Bỏ qua hướng dẫn (Vào danh sách bài)
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'congrats') {
    const buddy = mascot === 'robot' ? '🤖 Rô Bốt' : mascot === 'turtle' ? '🐢 Rùa Con' : '🦉 Cú Ú';
    return (
      <div className="onboarding-screen">
        <div className="onboarding-card" style={{ maxWidth: '500px' }}>
          <div className="congrats-badge">🎖️</div>
          <h1>Bé {name} thật xuất sắc!</h1>
          <p>Con đã hoàn thành buổi huấn luyện cách học toán tư duy của <b>{buddy}</b>.</p>
          
          <div className="congrats-card">
            <span>🧠</span>
            <b>Nhận ngay +100 điểm tư duy!</b>
          </div>
          
          <button className="onboarding-btn" onClick={handleCongrats}>
            Khám phá Hành trình Học Toán 🚀
          </button>
        </div>
      </div>
    );
  }

  return (
    <OnboardingLesson
      name={name}
      mascot={mascot}
      step={tutorialStep}
      setStep={setTutorialStep}
      selected={tutorialSelected}
      setSelected={setTutorialSelected}
      secondSelected={tutorialSecondSelected}
      setSecondSelected={setTutorialSecondSelected}
      factAnswers={tutorialFactAnswers}
      setFactAnswers={setTutorialFactAnswers}
      numberAnswer={tutorialNumberAnswer}
      setNumberAnswer={setTutorialNumberAnswer}
      feedback={tutorialFeedback}
      setFeedback={setTutorialFeedback}
      hintOpen={tutorialHintOpen}
      setHintOpen={setTutorialHintOpen}
      onComplete={() => setStage('congrats')}
      onSkip={handleSkip}
    />
  );
}

function OnboardingLesson(props) {
  const {
    name, mascot, step, setStep, selected, setSelected, secondSelected, setSecondSelected,
    factAnswers, setFactAnswers, numberAnswer, setNumberAnswer, feedback, setFeedback,
    onComplete, onSkip
  } = props;

  const buddyEmoji = mascot === 'robot' ? '🤖' : mascot === 'turtle' ? '🐢' : '🦉';
  const buddyName = mascot === 'robot' ? 'Rô Bốt' : mascot === 'turtle' ? 'Rùa Con' : 'Cú Ú';
  
  const buddyMessages = useMemo(() => [
    `Chào bé ${name}! Ta là ${buddyName} đây. Hãy xem bức tranh mô tả: ban đầu có 3 quả táo đỏ, rồi thêm 2 quả táo xanh. Bấm "Kiểm tra" nào!`,
    `Tuyệt vời! Bây giờ, hãy tóm tắt câu chuyện. Hãy chọn câu A (đầy đủ cả táo đỏ, táo xanh và câu hỏi) nhé con!`,
    `Bước 3: Tách dữ kiện. Số táo mẹ có và mua thêm là "Đã biết", còn câu hỏi là "Cần tìm". Hãy chọn đúng nha!`,
    `Để giải toán lời văn, sơ đồ là người bạn tốt nhất! Hãy chọn Sơ đồ tổng - phần (ô đầu tiên) để gộp hai loại táo nhé.`,
    `Chọn phép tính phù hợp nào. Muốn biết tất cả táo, ta gộp lại bằng phép tính 3 + 2. Chọn phép tính này và lý do tại sao nhé!`,
    `Tự tính toán: 3 + 2 bằng mấy con nhỉ? Hãy gõ kết quả vào ô trống nha!`,
    `Viết câu trả lời đầy đủ: hãy chọn câu A có chứa cả kết quả 5 quả táo và câu chữ đầy đủ nhất nhé!`,
    `Bước cuối: Kiểm tra lại. Kết quả 5 quả táo có lớn hơn số táo ban đầu không? Có hợp lý không con? Chọn Đúng nào!`
  ], [name, buddyName]);

  useEffect(() => {
    speakText(buddyMessages[step], resolveSpeechRate('normal'));
  }, [step, buddyMessages]);

  function speakOnboardingStory() {
    speakText(LESSON_0.story, resolveSpeechRate('normal'));
  }

  function validateTutorialStep() {
    if (feedback?.correct) return;
    
    let correct = false;
    let msg = "";

    if (step === 0) {
      correct = true;
      msg = "Chính xác! Con đã hiểu bối cảnh câu chuyện.";
    } else if (step === 1) {
      correct = selected === 0;
      msg = correct ? "Đúng rồi! Kể lại bằng lời giúp bộ não hiểu đề tốt hơn." : "Hãy chạm vào câu A nhé!";
    } else if (step === 2) {
      correct = factAnswers[0] === 'known' && factAnswers[1] === 'known' && factAnswers[2] === 'unknown';
      msg = correct ? "Tuyệt vời! Con đã biết cách phân loại thông tin." : "Hãy bấm 'Đã biết' cho dữ kiện số, và 'Cần tìm' cho câu hỏi.";
    } else if (step === 3) {
      correct = selected === 0;
      msg = correct ? "Đúng thế! Sơ đồ tổng phần biểu thị sự gộp lại." : "Hãy chọn mô hình đầu tiên.";
    } else if (step === 4) {
      correct = selected === 0 && secondSelected === 0;
      msg = correct ? "Rất giỏi! Con vừa biết chọn phép tính vừa hiểu rõ lý do!" : "Hãy chọn phép tính 3+2 và lý do đầu tiên.";
    } else if (step === 5) {
      correct = Number(numberAnswer) === 5;
      msg = correct ? "Chính xác! 3 + 2 = 5." : "Hãy gõ số 5 nhé!";
    } else if (step === 6) {
      correct = selected === 0;
      msg = correct ? "Đúng rồi! Trả lời đầy đủ câu chữ giúp người khác dễ hiểu." : "Hãy chọn câu A.";
    } else if (step === 7) {
      correct = selected === 0;
      msg = correct ? "Xuất sắc! Tự kiểm tra lại giúp con không bao giờ sợ làm sai." : "Hãy chọn Đúng nhé.";
    }

    if (correct) {
      playSfx('correct', false);
      setFeedback({ correct: true, message: msg });
    } else {
      playSfx('wrong', false);
      setFeedback({ correct: false, message: msg });
    }
  }

  function nextTutorialStep() {
    if (!feedback?.correct) return;
    setFeedback(null);
    setSelected(null);
    setSecondSelected(null);
    setFactAnswers([]);
    setNumberAnswer('');
    
    if (step < 7) {
      playClick();
      setStep(step + 1);
    } else {
      playSfx('complete', false);
      onComplete();
    }
  }

  const hasFeedback = Boolean(feedback);
  const isCorrect = feedback?.correct;

  const isAnswered = useMemo(() => {
    if (step === 0) return true;
    if (step === 1) return selected !== null;
    if (step === 2) return factAnswers.length === 3 && !factAnswers.includes(undefined);
    if (step === 3) return selected !== null;
    if (step === 4) return selected !== null && secondSelected !== null;
    if (step === 5) return numberAnswer.trim() !== '';
    if (step === 6) return selected !== null;
    if (step === 7) return selected !== null;
    return false;
  }, [step, selected, secondSelected, factAnswers, numberAnswer]);

  return (
    <div className="lesson-page" style={{ paddingBottom: '32px' }}>
      <div className="lesson-toolbar">
        <button className="close-button" onClick={() => { playClick(); onSkip(); }} aria-label="Bỏ qua hướng dẫn">✕</button>
        <div className="lesson-progress">
          <span style={{ width: `${((step + 1) / 8) * 100}%` }} />
        </div>
        <div className="hearts">❤️ ∞</div>
      </div>

      <div className="buddy-panel">
        <div className="buddy-avatar">{buddyEmoji}</div>
        <div className="buddy-chat">
          <b>{buddyName} khuyên:</b>
          <p>{buddyMessages[step]}</p>
        </div>
      </div>

      <div className="lesson-layout">
        <ol className="steps-list">
          {STEP_LABELS.map(([icon, label], index) => (
            <li key={label} className={index === step ? 'active' : index < step ? 'done' : ''}>
              <span>{index < step ? '✓' : index + 1}</span><i>{icon}</i><b>{label}</b>
            </li>
          ))}
        </ol>

        <section className="exercise-card">
          <div className="story-box">
            <button className="sound-button" onClick={speakOnboardingStory} aria-label="Đọc đề bài">🔊</button>
            <p>{LESSON_0.story}</p>
            <span className="story-emoji">{LESSON_0.icon}</span>
          </div>

          <div className="question-area">
            <OnboardingStepContent
              step={step}
              selected={selected}
              setSelected={setSelected}
              secondSelected={secondSelected}
              setSecondSelected={setSecondSelected}
              factAnswers={factAnswers}
              setFactAnswers={setFactAnswers}
              numberAnswer={numberAnswer}
              setNumberAnswer={setNumberAnswer}
              feedback={feedback}
            />
          </div>
        </section>
      </div>

      <div className={`lesson-footer ${hasFeedback ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''}`}>
        <div className="footer-content">
          {hasFeedback ? (
            <div className="feedback-banner">
              <span className="feedback-icon">{isCorrect ? '🎉' : '🌱'}</span>
              <div className="feedback-text">
                <b>{isCorrect ? 'Chính xác!' : 'Thử lại nhé!'}</b>
                <p>{feedback.message}</p>
              </div>
            </div>
          ) : (
            <div className="footer-tip">
            </div>
          )}

          <div className="footer-actions">
            {!hasFeedback ? (
              <>
                <button className="secondary-button footer-back" onClick={() => { playClick(); onSkip(); }}>Bỏ qua</button>
                <button 
                  className="primary-button footer-submit" 
                  onClick={validateTutorialStep}
                  disabled={!isAnswered}
                >
                  Kiểm tra
                </button>
              </>
            ) : (
              <button className="primary-button footer-next" onClick={nextTutorialStep} autoFocus>
                {step === 7 ? 'Hoàn thành' : 'Tiếp theo'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingStepContent(props) {
  const { step, selected, setSelected, secondSelected, setSecondSelected, factAnswers, setFactAnswers, numberAnswer, setNumberAnswer, feedback } = props;
  const frozen = Boolean(feedback?.correct);

  if (step === 0) {
    return (
      <div>
        <SectionHeading 
          num="1" 
          title="Nhìn câu chuyện bằng hình" 
          desc="Hãy xem sự thay đổi số lượng táo." 
        />
        <div className="visual-story">
          <div className="visual-group">
            <b>Ban đầu</b>
            <div className="emoji-row">🍎🍎🍎</div>
            <small>3 quả táo đỏ</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="visual-group accent">
            <b>Mua thêm</b>
            <div className="emoji-row">🍏🍏</div>
            <small>2 quả táo xanh</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box">?</div>
        </div>
      </div>
    );
  }

  if (step === 1) {
    const options = LESSON_0.retellOptions;
    return (
      <div>
        <SectionHeading num="?" title="Kể lại bằng lời" desc="Chạm vào câu tóm tắt đúng." />
        <div className="option-list">
          {options.map((option, index) => (
            <button
              key={option}
              disabled={frozen}
              className={`option ${selected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`}
              onClick={() => { playClick(); setSelected(index); }}
              style={{ width: '100%', display: 'flex', textAlign: 'left', marginBottom: '8px', padding: '12px' }}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <p>{option}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 2) {
    const setRole = (idx, role) => {
      const next = [...factAnswers];
      next[idx] = role;
      setFactAnswers(next);
    };
    return (
      <div>
        <SectionHeading num="3" title="Đã biết hay cần tìm?" desc="Phân loại dữ kiện của bài." />
        <div className="facts-grid">
          {LESSON_0.facts.map((fact, index) => {
            const correctRole = index < 2 ? 'known' : 'unknown';
            return (
              <div className="fact-card" key={fact} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{fact}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    disabled={frozen} 
                    className={`secondary-button ${factAnswers[index] === 'known' ? 'selected' : ''} ${correctRole === 'known' ? 'guide-highlight' : 'guide-disabled'}`} 
                    onClick={() => { playClick(); setRole(index, 'known'); }}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    ✓ Đã biết
                  </button>
                  <button 
                    disabled={frozen} 
                    className={`secondary-button ${factAnswers[index] === 'unknown' ? 'selected' : ''} ${correctRole === 'unknown' ? 'guide-highlight' : 'guide-disabled'}`} 
                    onClick={() => { playClick(); setRole(index, 'unknown'); }}
                    style={{ flex: 1, padding: '8px' }}
                  >
                    ? Cần tìm
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div>
        <SectionHeading num="4" title="Chọn mô hình phù hợp" desc="Chọn mô hình diễn tả đúng mối quan hệ." />
        <div className="model-grid">
          {LESSON_0.models.map((model, index) => (
            <button 
              key={model}
              disabled={frozen} 
              className={`model-card ${selected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`} 
              onClick={() => { playClick(); setSelected(index); }}
              style={{ width: '100%', marginBottom: '8px', padding: '12px' }}
            >
              <span>{index === 0 ? '▰▰' : '● ●'}</span>
              <b>{model}</b>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 4) {
    return (
      <div>
        <SectionHeading num="5" title="Chọn phép tính và lý do" desc="Giải thích bản chất phép tính." />
        <h3 className="mini-title">Phép tính nào phù hợp?</h3>
        <div className="operation-grid" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {LESSON_0.operations.map((op, index) => (
            <button 
              disabled={frozen} 
              key={op} 
              className={`secondary-button ${selected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`} 
              onClick={() => { playClick(); setSelected(index); }}
              style={{ flex: 1, padding: '12px', fontSize: '18px', fontWeight: 'bold' }}
            >
              {op}
            </button>
          ))}
        </div>
        <h3 className="mini-title">Tại sao?</h3>
        <div className="reason-list">
          {LESSON_0.reasons.map((r, index) => (
            <button 
              disabled={frozen} 
              key={r} 
              className={`option ${secondSelected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`} 
              onClick={() => { playClick(); setSecondSelected(index); }}
              style={{ width: '100%', textAlign: 'left', marginBottom: '8px', padding: '12px' }}
            >
              <span>{index + 1}</span>
              <p>{r}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === 5) {
    return (
      <div>
        <SectionHeading num="6" title="Tự tính toán" desc="Điền kết quả vào ô trống." />
        <div className="calculation-box">
          <span>3 + 2</span>
          <b>=</b>
          <input 
            disabled={frozen} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            value={numberAnswer} 
            onChange={(e) => setNumberAnswer(e.target.value.replace(/\D/g, ''))} 
            autoFocus 
            className="guide-highlight"
            style={{ width: '80px', textAlign: 'center', fontSize: '24px', padding: '8px' }}
          />
          <small>quả táo</small>
        </div>
      </div>
    );
  }

  if (step === 6) {
    const options = LESSON_0.answerOptions;
    return (
      <div>
        <SectionHeading num="?" title="Viết câu trả lời đầy đủ" desc="Chạm vào câu trả lời đúng nhất." />
        <div className="option-list">
          {options.map((option, index) => (
            <button
              key={option}
              disabled={frozen}
              className={`option ${selected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`}
              onClick={() => { playClick(); setSelected(index); }}
              style={{ width: '100%', display: 'flex', textAlign: 'left', marginBottom: '8px', padding: '12px' }}
            >
              <span>{String.fromCharCode(65 + index)}</span>
              <p>{option}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const checkOpts = LESSON_0.checkOptions;
  return (
    <div>
      <SectionHeading num="8" title="Kiểm tra lại" desc={LESSON_0.checkQuestion} />
      <div className="option-list">
        {checkOpts.map((option, index) => (
          <button
            key={option}
            disabled={frozen}
            className={`option ${selected === index ? 'selected' : ''} ${index === 0 ? 'guide-highlight' : 'guide-disabled'}`}
            onClick={() => { playClick(); setSelected(index); }}
            style={{ width: '100%', display: 'flex', textAlign: 'left', marginBottom: '8px', padding: '12px' }}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            <p>{option}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default App
