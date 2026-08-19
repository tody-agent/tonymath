import React, { useEffect, useMemo, useState, useRef, useCallback, Component } from 'react'
import {
  resolveSpeechRate,
  generateIcsContent,
  getLearningPlan,
  getWelcomeBackNudge,
  getCompletionPraise,
  applyLessonResult,
  applyStepMistake,
  getActiveProgress,
  getRecentlyStudiedLesson,
  ACHIEVEMENT_DEFINITIONS,
  getUnlockedAchievementIds,
  isChallengeModeActive,
  updateBehavioralMetrics,
  getDailyQuests,
  generateMathGateQuestion,
  verifyMathGateAnswer,
  triggerHaptic
} from './utils.js'
import { playSfx, speakText, cancelSpeech } from './audio.js'
import { playMascotReaction } from './audioEngine.js'
import { getMascotSpeech, MASCOT_PROFILES, getIndicatorGuide } from './mascotDialogs.js'
import './App.css'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error('Học Toán Vui ErrorBoundary caught error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-card" style={{ padding: '32px 20px', textAlign: 'center', margin: '24px auto', maxWidth: '420px', background: '#fff', borderRadius: '24px', boxShadow: '0 12px 36px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🦉✨</div>
          <h3 style={{ margin: '0 0 10px', color: '#1e1b4b', fontSize: '20px', fontWeight: 900 }}>Ối, có chút trục trặc nhỏ!</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
            Đừng lo lắng nhé thám tử nhí! Bấm nút bên dưới để quay lại bài học hoặc trang chủ.
          </p>
          <button 
            className="hero-primary-btn" 
            style={{ padding: '14px 28px', borderRadius: '16px', fontSize: '16px', width: '100%', cursor: 'pointer' }}
            onClick={() => {
              this.setState({ hasError: false, error: null })
              if (this.props.onReset) this.props.onReset()
              else window.location.reload()
            }}
          >
            Quay lại trang chủ 🏠
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const STUDY_MODES = {
  full: { id: 'full', title: 'Từng bước (8 bước)', steps: [0, 1, 2, 3, 4, 5, 6, 7] },
  express: { id: 'express', title: 'Rút gọn (5 bước)', steps: [0, 3, 4, 5, 6] },
  pro: { id: 'pro', title: 'Siêu tốc (3 bước)', steps: [4, 5, 6] }
}

function getActiveSteps(mode, lesson) {
  const baseSteps = STUDY_MODES[mode]?.steps || STUDY_MODES.full.steps
  if (!lesson) return baseSteps
  const shouldSkipStep5 = lesson.skill === 'Suy luận logic' || lesson.answer === 0
  return baseSteps.filter(s => !(s === 5 && shouldSkipStep5))
}

const STEP_LABELS = [
  ['👀', 'Nhìn hình'],
  ['💬', 'Kể lại'],
  ['🧩', 'Đã biết / cần tìm'],
  ['🗺️', 'Chọn mô hình'],
  ['➕', 'Phép tính & vì sao'],
  ['✏️', 'Tự tính'],
  ['🗣️', 'Câu trả lời'],
  ['🛡️', 'Kiểm tra']
]


const DEFAULT_PROGRESS = {
  completed: {},
  attempts: {},
  weakSkills: {},
  xp: 0,
  streak: 1,
  lastStudyDate: null,
  lastActiveDate: null,
  currentLesson: 0,
  onboarded: false,
  challengeMode: false,
  studyMode: 'full',
  profile: {
    name: '',
    mascot: 'owl'
  },
  reminderTime: '19:00',
  notificationsEnabled: false,
  welcomeNudgeDismissedOn: null,
  stepFailsSession: {},
  unlockedAchievements: {}
}

const DEFAULT_AUDIO_SETTINGS = {
  autoRead: true,
  speed: 'normal',
  muted: false
}

const STORAGE_KEY_PROGRESS = 'hoctoanvui-progress-v1';
const STORAGE_KEY_PROGRESS_LEGACY = 'tonymath-progress-v1';
const STORAGE_KEY_NAME = 'hoctoanvui-student-name';
const STORAGE_KEY_NAME_LEGACY = 'tonymath-student-name';
const STORAGE_KEY_AUDIO = 'hoctoanvui-audio-settings-v1';
const STORAGE_KEY_AUDIO_LEGACY = 'tonymath-audio-settings-v1';
const STORAGE_KEY_PWA_DISMISSED = 'hoctoanvui-pwa-dismissed-until';
const STORAGE_KEY_PWA_DISMISSED_LEGACY = 'tonymath-pwa-dismissed-until';
const STORAGE_KEY_IOS_DISMISSED = 'hoctoanvui-ios-install-dismissed';
const STORAGE_KEY_IOS_DISMISSED_LEGACY = 'tonymath-ios-install-dismissed';

function getStoredItem(key, legacyKey) {
  try {
    const val = localStorage.getItem(key);
    if (val !== null) return val;
    if (legacyKey) return localStorage.getItem(legacyKey);
    return null;
  } catch {
    return null;
  }
}

function setStoredItem(key, value, legacyKey) {
  try {
    localStorage.setItem(key, value);
    if (legacyKey) {
      localStorage.setItem(legacyKey, value);
    }
  } catch {
    // Ignore storage quota or disabled storage
  }
}

function loadProgress() {
  try {
    const saved = getStoredItem(STORAGE_KEY_PROGRESS, STORAGE_KEY_PROGRESS_LEGACY);
    const cachedName = getStoredItem(STORAGE_KEY_NAME, STORAGE_KEY_NAME_LEGACY) || '';
    if (!saved) {
      return {
        ...DEFAULT_PROGRESS,
        profile: { ...DEFAULT_PROGRESS.profile, name: cachedName }
      }
    }
    const parsed = JSON.parse(saved)
    
    // Automatic migration logic for backwards compatibility
    const completed = {};
    if (parsed.completed) {
      Object.entries(parsed.completed).forEach(([key, val]) => {
        if (key.startsWith('lesson-') && !key.includes('_')) {
          completed[`grade-4_math_${key}`] = val;
        } else {
          completed[key] = val;
        }
      });
    } else {
      Object.assign(completed, DEFAULT_PROGRESS.completed);
    }
    
    const attempts = {};
    if (parsed.attempts) {
      Object.entries(parsed.attempts).forEach(([key, val]) => {
        if (key.startsWith('lesson-') && !key.includes('_')) {
          attempts[`grade-4_math_${key}`] = val;
        } else {
          attempts[key] = val;
        }
      });
    } else {
      Object.assign(attempts, DEFAULT_PROGRESS.attempts);
    }

    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      profile: {
        ...DEFAULT_PROGRESS.profile,
        ...(parsed.profile || {}),
        name: parsed.profile?.name || cachedName
      },
      completed,
      attempts,
      weakSkills: parsed.weakSkills || {},
      unlockedAchievements: parsed.unlockedAchievements || {}
    }
  } catch {
    const cachedName = getStoredItem(STORAGE_KEY_NAME, STORAGE_KEY_NAME_LEGACY) || '';
    return {
      ...DEFAULT_PROGRESS,
      profile: { ...DEFAULT_PROGRESS.profile, name: cachedName }
    }
  }
}

function loadAudioSettings() {
  try {
    const saved = getStoredItem(STORAGE_KEY_AUDIO, STORAGE_KEY_AUDIO_LEGACY);
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

function getUrlTestParams() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    return {
      view: params.get('view'),
      step: params.has('step') ? parseInt(params.get('step'), 10) : undefined,
      feedback: params.get('feedback'),
      hintConfirm: params.get('hintConfirm') === 'true',
      hintOpen: params.get('hintOpen') === 'true',
      guide: params.get('guide'),
      mathGate: params.get('mathGate') === 'true',
      chest: params.get('chest') === 'true',
      boss: params.get('boss') === 'true',
      gameOver: params.get('gameOver') === 'true',
      pwaPrompt: params.get('pwaPrompt') === 'true',
      iosModal: params.get('iosModal') === 'true',
      welcomeNudge: params.get('welcomeNudge') === 'true',
      badgeInfo: params.get('badgeInfo'),
      toast: params.get('toast')
    };
  } catch {
    return {};
  }
}

function App() {
  const urlParams = useMemo(() => getUrlTestParams(), [])
  const [progress, setProgress] = useState(() => {
    const loaded = loadProgress();
    if (urlParams.view && urlParams.view !== 'onboarding') {
      return {
        ...loaded,
        onboarded: true,
        profile: { ...loaded.profile, name: loaded.profile?.name || 'Bảo Minh', mascot: loaded.profile?.mascot || 'owl' }
      };
    }
    return loaded;
  })
  const [view, setView] = useState(() => urlParams.view || (progress.onboarded ? 'home' : 'onboarding'))
  const [toast, setToast] = useState(() => urlParams.toast ? { message: urlParams.toast, icon: '✨', type: 'info' } : null)
  const toastTimeoutRef = useRef(null)

  const showToast = useCallback((message, icon = '✨', type = 'info', duration = 3500) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setToast({ message, icon, type })
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null)
    }, duration)
  }, [])

  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(() => urlParams.pwaPrompt || false)
  const [lessonIndex, setLessonIndex] = useState(progress.currentLesson || 0)
  const [step, setStep] = useState(() => urlParams.step !== undefined ? urlParams.step : 0)
  const [audioSettings, setAudioSettings] = useState(loadAudioSettings)
  const [audioPanelOpen, setAudioPanelOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [secondSelected, setSecondSelected] = useState(null)
  const [factAnswers, setFactAnswers] = useState([])
  const [numberAnswer, setNumberAnswer] = useState('')
  const [feedback, setFeedback] = useState(() => {
    if (urlParams.feedback === 'correct') {
      return { correct: true, message: 'Rất chính xác! Con đã tìm ra đúng phép tính và giải thích rất thông minh 🎉' }
    }
    if (urlParams.feedback === 'wrong') {
      return { correct: false, message: 'Chưa chính xác rồi. Hãy đọc kỹ lại dữ kiện và quan sát hình minh họa nhé 🌱' }
    }
    return null
  })
  const [hintOpen, setHintOpen] = useState(() => urlParams.hintOpen || false)
  const [hintUnlockedForCurrentStep, setHintUnlockedForCurrentStep] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(() => urlParams.hintConfirm || false)
  const [isGameOver, setIsGameOver] = useState(() => urlParams.gameOver || false)
  const [mistakes, setMistakes] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileTab, setProfileTab] = useState('kid')
  const [showMathGate, setShowMathGate] = useState(() => urlParams.mathGate || false)
  const [mathGateQuestion, setMathGateQuestion] = useState(() => urlParams.mathGate ? generateMathGateQuestion() : null)
  const [mathGateInput, setMathGateInput] = useState('')
  const [mathGateError, setMathGateError] = useState('')
  const [selectedBadgeInfo, setSelectedBadgeInfo] = useState(null)
  const [mascotSpeechBubble, setMascotSpeechBubble] = useState('')
  const mascotBubbleTimeout = useRef(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [activeGuide, setActiveGuide] = useState(() => urlParams.guide || null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [showIosInstructions, setShowIosInstructions] = useState(() => urlParams.iosModal || false)
  const [stepFailsSession, setStepFailsSession] = useState({})
  const [showWelcomeNudge, setShowWelcomeNudge] = useState(() => urlParams.welcomeNudge || false)
  const [prevXpLevel, setPrevXpLevel] = useState(() => Math.floor((progress.xp || 0) / 100) + 1)
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([])
  const isInitialMount = useRef(true)
  const [lessonStartTime, setLessonStartTime] = useState(null)
  const [stepStartTime, setStepStartTime] = useState(null)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [hasUsedShield, setHasUsedShield] = useState(false)
  const [stepConfettiActive, setStepConfettiActive] = useState(false)
  const [currentStreak, setCurrentStreak] = useState(0)

  const [showChestOverlay, setShowChestOverlay] = useState(() => urlParams.chest || false)
  const [showBossOverlay, setShowBossOverlay] = useState(() => urlParams.boss || false)
  const [chestRewardAwarded, setChestRewardAwarded] = useState(false)

  // Dynamic lesson packs states
  const [lessons, setLessons] = useState([])
  const [registry, setRegistry] = useState(null)
  const [loadingPack, setLoadingPack] = useState(true)
  const currentGrade = progress.currentGrade || 'grade-4'
  const currentSubject = progress.currentSubject || 'math'

  // Timed Arena States
  const [arenaActive, setArenaActive] = useState(false)
  const [arenaTime, setArenaTime] = useState(0)
  const [arenaScore, setArenaScore] = useState(0)
  const [arenaAttempts, setArenaAttempts] = useState(0)
  const [arenaQuestion, setArenaQuestion] = useState(null)
  const [arenaAnswerVal, setArenaAnswerVal] = useState('')
  const [arenaFeedback, setArenaFeedback] = useState(null)

  // Buddy Corner States
  const [buddyQuestion, setBuddyQuestion] = useState(null)
  const [buddyFeedback, setBuddyFeedback] = useState(null)
  const [buddyAttempted, setBuddyAttempted] = useState(false)

  // Memoized progress mapping for active grade/subject
  const activeProgress = useMemo(() => getActiveProgress(progress, currentGrade, currentSubject), [progress, currentGrade, currentSubject])

  const earnedStars = useMemo(
    () => Object.values(activeProgress.completed).reduce((sum, item) => sum + item.stars, 0),
    [activeProgress.completed]
  )

  const getMascotEmotion = useCallback((mascotId) => {
    const active = mascotId || progress.profile?.mascot || 'owl';
    const profile = MASCOT_PROFILES[active] || MASCOT_PROFILES.owl;
    let emotion = 'idle';
    
    // 1. If in lesson view and there's a feedback message
    if (view === 'lesson' && feedback) {
      if (feedback.correct) {
        emotion = 'happy';
      } else {
        const elapsed = stepStartTime ? (Date.now() - stepStartTime) / 1000 : 0;
        if (elapsed < 4.0) {
          emotion = 'shocked';
        } else {
          emotion = 'sad';
        }
      }
    }
    // 2. If low hearts inside lesson
    else if (view === 'lesson' && hearts <= 1) {
      emotion = 'worried';
    }
    // 3. Lazy check (no studies in 2+ days)
    else {
      const lastDateStr = progress.lastActiveDate;
      if (lastDateStr) {
        const diffTime = Math.abs(Date.now() - new Date(lastDateStr).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 2) {
          emotion = 'sleepy';
        }
      }
    }

    return profile.emojis?.[emotion] || profile.emoji;
  }, [view, feedback, hearts, progress.lastActiveDate, progress.profile?.mascot, stepStartTime]);

  // Fetch registry & lessons pack
  useEffect(() => {
    let active = true
    setLoadingPack(true)
    async function loadData() {
      try {
        let reg = registry
        if (!reg) {
          const regRes = await fetch('/lessons/registry.json')
          if (regRes.ok) {
            reg = await regRes.json()
            if (active) setRegistry(reg)
          }
        }
        if (reg) {
          const gradeObj = reg.grades.find(g => g.id === currentGrade)
          const subObj = gradeObj?.subjects?.find(s => s.id === currentSubject)
          const lessonsPath = subObj?.lessonsPath || `/lessons/${currentGrade}/${currentSubject}.json`
          const lessonsRes = await fetch(lessonsPath)
          if (lessonsRes.ok) {
            const data = await lessonsRes.json()
            if (active) {
              setLessons(data)
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dynamic lesson packs:', err)
      } finally {
        if (active) setLoadingPack(false)
      }
    }
    loadData()
    return () => { active = false }
  }, [currentGrade, currentSubject, registry])

  const lesson = (lessons && lessons[lessonIndex]) ? lessons[lessonIndex] : (lessons?.[0] || null)
  const completedCount = Object.keys(activeProgress.completed || {}).length
  const level = Math.floor(progress.xp / 100) + 1
  const levelProgress = progress.xp % 100
  const learningPlan = useMemo(() => getLearningPlan(lessons, activeProgress), [lessons, activeProgress])

  // Reset feedback when user changes their answer (so they can try again and submit new answer)
  useEffect(() => {
    if (feedback && !feedback.correct) {
      setFeedback(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, secondSelected, factAnswers, numberAnswer])

  useEffect(() => {
    setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress), STORAGE_KEY_PROGRESS_LEGACY);
  }, [progress])

  // Handle game over state when hearts reach 0 in challenge mode
  useEffect(() => {
    const isChallenge = isChallengeModeActive(progress, lesson);
    if (isChallenge && hearts === 0 && view === 'lesson' && !isGameOver) {
      setIsGameOver(true);
    }
  }, [hearts, progress, lesson, view, isGameOver]);

  // Touch lastActiveDate once per day (cache “nhớ” người dùng)
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (progress.lastActiveDate !== today) {
      setProgress((old) => ({ ...old, lastActiveDate: today }))
    }
  }, [progress.lastActiveDate])

  // Escape key to close profile bottom sheet
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  // Welcome-back nudge (không chặn UI — có thể đóng)
  useEffect(() => {
    if (!progress.onboarded || view !== 'home') return
    const today = new Date().toISOString().slice(0, 10)
    if (progress.welcomeNudgeDismissedOn === today) return
    const nudge = getWelcomeBackNudge(progress, today)
    if (nudge.gap === null || nudge.gap >= 0) {
      setShowWelcomeNudge(true)
      if (nudge.gap >= 2 || nudge.streak >= 3) {
        playSfx(nudge.gap >= 2 ? 'welcome' : 'streak', audioSettings.muted)
      }
    }
    // only on first home after load / return
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, progress.onboarded])

  // Level-up celebration
  useEffect(() => {
    if (level > prevXpLevel) {
      playSfx('levelup', audioSettings.muted)
      setPrevXpLevel(level)
    } else if (level < prevXpLevel) {
      setPrevXpLevel(level)
    }
  }, [level, prevXpLevel, audioSettings.muted])

  // Auto-unlock achievements listener
  useEffect(() => {
    if (!lessons || lessons.length === 0) return

    const currentUnlockedIds = getUnlockedAchievementIds(activeProgress, earnedStars, lessons)
    const savedUnlocked = progress.unlockedAchievements || {}
    const newlyUnlockedIds = currentUnlockedIds.filter(id => !savedUnlocked[id])

    if (newlyUnlockedIds.length > 0) {
      const now = new Date().toISOString()
      setProgress(old => {
        const nextUnlocked = { ...(old.unlockedAchievements || {}) }
        newlyUnlockedIds.forEach(id => {
          nextUnlocked[id] = now
        })
        return { ...old, unlockedAchievements: nextUnlocked }
      })

      if (!isInitialMount.current) {
        const unlockedList = newlyUnlockedIds.map(id => ACHIEVEMENT_DEFINITIONS.find(a => a.id === id)).filter(Boolean)
        setNewlyUnlockedAchievements(unlockedList)
        playSfx('complete', audioSettings.muted)
      }
    }

    if (isInitialMount.current) {
      isInitialMount.current = false
    }
  }, [
    activeProgress,
    progress.unlockedAchievements,
    audioSettings.muted,
    earnedStars,
    lessons
  ])

  useEffect(() => {
    const isDismissed = () => {
      const dismissedUntil = getStoredItem(STORAGE_KEY_PWA_DISMISSED, STORAGE_KEY_PWA_DISMISSED_LEGACY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) return true;
      if (getStoredItem(STORAGE_KEY_IOS_DISMISSED, STORAGE_KEY_IOS_DISMISSED_LEGACY) === 'true') return true;
      return false;
    };

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isDismissed()) {
        setShowInstallPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !isStandalone && !isDismissed()) {
      setShowInstallPrompt(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [])

  useEffect(() => {
    setStoredItem(STORAGE_KEY_AUDIO, JSON.stringify(audioSettings), STORAGE_KEY_AUDIO_LEGACY);
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

  // Proactive hint timer for anxious learners (budding_thinker)
  useEffect(() => {
    if (view !== 'lesson' || isGameOver || feedback?.correct) return;
    const currentArchetype = progress.behavioralProfile?.currentArchetype || 'balanced';
    if (currentArchetype !== 'budding_thinker') return;
    if (hintOpen || hintUnlockedForCurrentStep) return;

    const timer = setTimeout(() => {
      setHintOpen(true);
      setHintUnlockedForCurrentStep(true);
      
      const mascot = progress.profile?.mascot || 'owl';
      const buddy = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
      const helpText = `${buddy.name} thấy câu này hơi thử thách một chút. Con hãy xem gợi ý bên dưới nhé!`;
      
      if (!audioSettings.muted && audioSettings.autoRead) {
        speakText(helpText, resolveSpeechRate(audioSettings.speed));
      }
      setFeedback(f => f ? f : { correct: false, message: helpText });
      
      const elapsed = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 25;
      setProgress(old => updateBehavioralMetrics(old, 'hint_opened', { latency: elapsed, step }));
    }, 25000);

    return () => clearTimeout(timer);
  }, [step, view, isGameOver, feedback?.correct, progress.behavioralProfile?.currentArchetype, hintOpen, hintUnlockedForCurrentStep, stepStartTime, progress.profile?.mascot, audioSettings]);

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
    const mascot = progress.profile?.mascot || 'owl'
    const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl
    const baseRate = resolveSpeechRate(audioSettings.speed)
    const rate = baseRate * (profile.rateOffset || 1.0)
    const pitch = profile.pitch || 1.0

    if (feedback.category) {
      playMascotReaction({
        mascotId: mascot,
        category: feedback.category,
        fallbackText: feedback.message
      });
    } else {
      speakText(feedback.message, rate, null, null, pitch)
    }
  }, [feedback, view, audioSettings.autoRead, audioSettings.muted, audioSettings.speed, progress.profile?.mascot])


  const handleOpenGuide = (indicator) => {
    playClick()
    setActiveGuide(indicator)
    const mascot = progress.profile?.mascot || 'owl'
    const guideData = getIndicatorGuide(mascot, indicator, progress)
    
    if (!audioSettings.muted) {
      const textToSpeak = `${guideData.title}. ${guideData.intro} ${guideData.whatIsIt} ${guideData.howToIncrease} ${guideData.motivation}`
      const rate = resolveSpeechRate(audioSettings.speed)
      const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl
      speakText(textToSpeak, rate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0)
    }
  }

  const handleSpeakGuideManual = (indicator) => {
    if (!indicator) return
    const mascot = progress.profile?.mascot || 'owl'
    const guideData = getIndicatorGuide(mascot, indicator, progress)
    const textToSpeak = `${guideData.title}. ${guideData.intro} ${guideData.whatIsIt} ${guideData.howToIncrease} ${guideData.motivation}`
    const rate = resolveSpeechRate(audioSettings.speed)
    const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl
    speakText(textToSpeak, rate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0)
  }

  // Mặc định mở tất cả các bài học
  const isUnlocked = () => true

  function resetStepState(nextStep = step) {
    setSelected(null)
    setSecondSelected(null)
    setFactAnswers([])
    setNumberAnswer('')
    setFeedback(null)
    setHintOpen(false)
    setHintUnlockedForCurrentStep(false)
    setStep(nextStep)
    setStepStartTime(Date.now())
    setCooldownActive(false)
  }

  function handleRetryLesson() {
    playClick()
    playSfx('sparkle', audioSettings.muted)
    setHearts(3)
    setMistakes(0)
    setStepFailsSession({})
    setHasUsedShield(false)
    setCurrentStreak(0)
    const initialStep = getActiveSteps(progress.studyMode || 'full', lesson)[0]
    resetStepState(initialStep)
    setIsGameOver(false)
  }

  function openLesson(index) {
    if (index < 0 || index >= lessons.length) return
    playClick()
    playSfx('sparkle', audioSettings.muted)
    setLessonIndex(index)
    setProgress((old) => ({
      ...old,
      currentLesson: index,
      lastActiveDate: new Date().toISOString().slice(0, 10)
    }))
    const targetLesson = lessons[index]
    const initialStep = getActiveSteps(progress.studyMode || 'full', targetLesson)[0]
    setMistakes(0)
    setHearts(3)
    setStepFailsSession({})
    setHasUsedShield(false)
    setCurrentStreak(0)
    resetStepState(initialStep)
    setView('intro')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleOpenUnitChest = () => {
    playClick();
    playSfx('sparkle', audioSettings.muted);
    setProgress(old => ({
      ...old,
      xp: (old.xp || 0) + 80,
      completed: {
        ...(old.completed || {}),
        [`${currentGrade}_${currentSubject}_unit_chest`]: {
          stars: 3,
          completedAt: new Date().toISOString(),
          mistakes: 0,
          duration: 0,
          playCount: 1
        }
      }
    }));
    setChestRewardAwarded(true);
  };

  const handleStartBossChallenge = () => {
    playClick();
    setShowBossOverlay(false);
    openLesson(lessons.length - 1);
  };

  function saveProfileName() {
    const trimmed = tempName.trim();
    setProgress(old => ({
      ...old,
      profile: {
        ...old.profile,
        name: trimmed
      }
    }));
    if (trimmed) {
      setStoredItem(STORAGE_KEY_NAME, trimmed, STORAGE_KEY_NAME_LEGACY);
    }
    setIsEditingName(false);
  }

  const handleOpenParentGate = () => {
    const q = generateMathGateQuestion();
    setMathGateQuestion(q);
    setMathGateInput('');
    setMathGateError('');
    setShowMathGate(true);
    playSfx('click', audioSettings.muted);
  };

  const handleVerifyMathGate = () => {
    if (verifyMathGateAnswer(mathGateInput, mathGateQuestion.answer)) {
      playSfx('correct', audioSettings.muted);
      setProfileTab('parent');
      setShowMathGate(false);
      setMathGateError('');
    } else {
      playSfx('wrong', audioSettings.muted);
      setMathGateError('Chưa chính xác rồi ba mẹ ơi! Hãy thử lại phép tính nhé.');
    }
  };

  const handleMascotSelectAndSpeak = (key) => {
    playSfx('click', audioSettings.muted);
    setProgress(old => {
      const updated = { ...old, profile: { ...old.profile, mascot: key } };
      setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated), STORAGE_KEY_PROGRESS_LEGACY);
      return updated;
    });

    const mascotProfile = MASCOT_PROFILES[key] || MASCOT_PROFILES.owl;
    let greetingText = '';
    if (key === 'owl') {
      greetingText = 'Chào bạn nhỏ! Cú Ú sẽ cùng con giải những bài toán logic thông thái nhất nhé!';
    } else if (key === 'robot') {
      greetingText = 'Khởi động chương trình! Rô Bốt đã sẵn sàng tính toán siêu tốc cùng bạn!';
    } else {
      greetingText = 'Chào bạn nhỏ! Rùa Con sẽ cùng bạn học chậm rãi nhưng siêu chắc chắn nha!';
    }

    cancelSpeech();
    const baseRate = audioSettings.speed === 'slow' ? 0.75 : audioSettings.speed === 'fast' ? 1.15 : 0.95;
    const rate = baseRate * (mascotProfile.rateOffset || 1.0);
    const pitch = mascotProfile.pitch || 1.0;
    speakText(greetingText, rate, null, null, pitch);

    setMascotSpeechBubble(greetingText);
    if (mascotBubbleTimeout.current) {
      clearTimeout(mascotBubbleTimeout.current);
    }
    mascotBubbleTimeout.current = setTimeout(() => {
      setMascotSpeechBubble('');
    }, 5000);
  };

  const handleOpenArena = () => {
    playClick()
    if (lessons.length === 0) return
    const completedLessonIds = Object.keys(activeProgress.completed || {})
    let eligibleLessons = lessons.filter(l => completedLessonIds.includes(l.id))
    if (eligibleLessons.length === 0) {
      eligibleLessons = lessons
    }
    const randomL = eligibleLessons[Math.floor(Math.random() * eligibleLessons.length)]
    setArenaQuestion({
      lessonId: randomL.id,
      title: randomL.title,
      story: randomL.story,
      operation: randomL.operations[randomL.correctOperation],
      answer: randomL.answer,
      unit: randomL.unit
    })
    setArenaScore(0)
    setArenaAttempts(0)
    setArenaTime(60)
    setArenaAnswerVal('')
    setArenaFeedback(null)
    setArenaActive(true)
    setView('arena')
  }

  useEffect(() => {
    let timer
    if (view === 'arena' && arenaActive && arenaTime > 0) {
      timer = setInterval(() => {
        setArenaTime(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            setArenaActive(false)
            const xpGained = arenaScore * 5
            setProgress(old => ({
              ...old,
              xp: (old.xp || 0) + xpGained
            }))
            playSfx('sparkle', audioSettings.muted)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [view, arenaActive, arenaTime, arenaScore, audioSettings.muted])

  const handleCheckArenaAnswer = (e) => {
    if (e) e.preventDefault()
    if (!arenaActive || !arenaQuestion) return
    const ans = Number(arenaAnswerVal.trim())
    const isCorrect = ans === arenaQuestion.answer
    setArenaAttempts(prev => prev + 1)
    if (isCorrect) {
      playSfx('correct', audioSettings.muted)
      setArenaScore(prev => prev + 1)
      setArenaFeedback({ correct: true, message: 'Tuyệt vời! Con làm đúng rồi!' })
      setTimeout(() => {
        const completedLessonIds = Object.keys(activeProgress.completed || {})
        let eligibleLessons = lessons.filter(l => completedLessonIds.includes(l.id))
        if (eligibleLessons.length === 0) eligibleLessons = lessons
        const randomL = eligibleLessons[Math.floor(Math.random() * eligibleLessons.length)]
        setArenaQuestion({
          lessonId: randomL.id,
          title: randomL.title,
          story: randomL.story,
          operation: randomL.operations[randomL.correctOperation],
          answer: randomL.answer,
          unit: randomL.unit
        })
        setArenaAnswerVal('')
        setArenaFeedback(null)
      }, 800)
    } else {
      playSfx('wrong', audioSettings.muted)
      setArenaFeedback({ correct: false, message: `Chưa đúng rồi. Kết quả đúng là: ${arenaQuestion.answer} ${arenaQuestion.unit}.` })
      setTimeout(() => {
        const completedLessonIds = Object.keys(activeProgress.completed || {})
        let eligibleLessons = lessons.filter(l => completedLessonIds.includes(l.id))
        if (eligibleLessons.length === 0) eligibleLessons = lessons
        const randomL = eligibleLessons[Math.floor(Math.random() * eligibleLessons.length)]
        setArenaQuestion({
          lessonId: randomL.id,
          title: randomL.title,
          story: randomL.story,
          operation: randomL.operations[randomL.correctOperation],
          answer: randomL.answer,
          unit: randomL.unit
        })
        setArenaAnswerVal('')
        setArenaFeedback(null)
      }, 2500)
    }
  }

  const handleOpenBuddy = () => {
    playClick()
    if (lessons.length === 0) return
    const randomL = lessons[Math.floor(Math.random() * lessons.length)]
    const steps = [1, 3, 4]
    const pickedStep = steps[Math.floor(Math.random() * steps.length)]
    const mascotIsCorrect = Math.random() > 0.5
    let statement = ''
    let correctAnswer = ''
    if (pickedStep === 1) {
      const correctText = randomL.retellOptions[randomL.correctRetell]
      let wrongText = randomL.retellOptions[(randomL.correctRetell + 1) % randomL.retellOptions.length]
      if (wrongText === correctText) wrongText = randomL.retellOptions[(randomL.correctRetell + 2) % randomL.retellOptions.length]
      statement = `Tớ nghĩ tóm tắt/kể lại câu chuyện này là: "${mascotIsCorrect ? correctText : wrongText}"`
      correctAnswer = mascotIsCorrect ? 'yes' : 'no'
    } else if (pickedStep === 3) {
      const correctText = randomL.models[randomL.correctModel]
      let wrongText = randomL.models[(randomL.correctModel + 1) % randomL.models.length]
      statement = `Tớ chọn sơ đồ hình vẽ là: "${mascotIsCorrect ? correctText : wrongText}"`
      correctAnswer = mascotIsCorrect ? 'yes' : 'no'
    } else {
      const correctText = randomL.operations[randomL.correctOperation]
      let wrongText = randomL.operations[(randomL.correctOperation + 1) % randomL.operations.length]
      statement = `Tớ chọn phép tính cho bài này là: "${mascotIsCorrect ? correctText : wrongText}"`
      correctAnswer = mascotIsCorrect ? 'yes' : 'no'
    }
    setBuddyQuestion({
      lessonId: randomL.id,
      title: randomL.title,
      story: randomL.story,
      pickedStep,
      statement,
      correctAnswer,
      mascot: progress.profile?.mascot || 'owl'
    })
    setBuddyFeedback(null)
    setBuddyAttempted(false)
    setView('buddy')
  }

  const handleCheckBuddyAnswer = (userChoice) => {
    if (buddyAttempted) return
    playClick()
    setBuddyAttempted(true)
    const isCorrect = userChoice === buddyQuestion.correctAnswer
    const mascot = buddyQuestion.mascot || 'owl'
    const mascotName = MASCOT_PROFILES[mascot]?.name || 'Cú Ú'
    
    if (isCorrect) {
      playSfx('correct', audioSettings.muted)
      const customMsg = getMascotSpeech(mascot, true, `${mascotName} cảm ơn con rất nhiều.`)
      setBuddyFeedback({
        correct: true,
        message: customMsg
      })
      setProgress(old => ({
        ...old,
        xp: (old.xp || 0) + 15
      }))
      if (!audioSettings.muted && audioSettings.autoRead) {
        const rate = resolveSpeechRate(audioSettings.speed)
        const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl
        speakText(customMsg, rate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0)
      }
    } else {
      playSfx('wrong', audioSettings.muted)
      const customMsg = getMascotSpeech(mascot, false, `Con hãy giúp ${mascotName} suy nghĩ lại nhé!`)
      setBuddyFeedback({
        correct: false,
        message: customMsg
      })
      if (!audioSettings.muted && audioSettings.autoRead) {
        const rate = resolveSpeechRate(audioSettings.speed)
        const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl
        speakText(customMsg, rate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0)
      }
    }
  }

  function markAttempt(isCorrect, message) {
    if (feedback?.correct) return
    const mascot = progress.profile?.mascot || 'owl'
    const latency = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 5
    const currentArchetype = progress.behavioralProfile?.currentArchetype || 'balanced'

    let newStreak = currentStreak;
    if (isCorrect) {
      newStreak += 1;
    } else {
      newStreak = 0;
    }
    setCurrentStreak(newStreak);
    const isCareless = !isCorrect && latency < 4;

    if (isCorrect) {
      const praiseSfx = step === 7 ? 'praise' : 'correct'
      playSfx(praiseSfx, audioSettings.muted)
      const mascotMsg = getMascotSpeech(mascot, true, message, { archetype: currentArchetype, currentStreak: newStreak })
      let category = 'correct_logic';
      if (newStreak >= 3) {
        category = 'correct_streak';
      } else if (latency < 3) {
        category = 'correct_quick';
      }
      setFeedback({ correct: true, message: mascotMsg, category })
      if (currentArchetype === 'active_seeker' && (step === 3 || step === 5)) {
        setStepConfettiActive(true)
        setTimeout(() => setStepConfettiActive(false), 3000)
      }
      setProgress((old) => {
        const updatedXp = { ...old, xp: old.xp + 10 };
        return updateBehavioralMetrics(updatedXp, 'step_attempt', {
          latency,
          isCorrect: true,
          step,
          hintUsed: hintUnlockedForCurrentStep
        });
      })
    } else {
      if (currentArchetype === 'pioneer') {
        setCooldownActive(true);
        setTimeout(() => setCooldownActive(false), 2500);
      }

      playSfx(hearts <= 1 ? 'wrong' : 'soft_wrong', audioSettings.muted)
      const mascotMsg = getMascotSpeech(mascot, false, message, { archetype: currentArchetype, isCareless })
      const category = isCareless ? 'wrong_careless' : 'wrong_encourage';
      
      let nextHearts = hearts;
      if (hearts <= 1 && currentArchetype === 'budding_thinker' && !hasUsedShield) {
        setHasUsedShield(true);
        nextHearts = 1;
        const buddy = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
        setFeedback({ 
          correct: false, 
          message: `${mascotMsg} (🛡️ ${buddy.name} đã dùng Khiên Bảo Vệ bảo toàn tim cho con!)`,
          category
        });
      } else {
        nextHearts = Math.max(0, hearts - 1);
        setFeedback({ correct: false, message: mascotMsg, category })
      }
      setHearts(nextHearts)

      setStepFailsSession((old) => ({ ...old, [step]: (old[step] || 0) + 1 }))
      setProgress((old) => {
        const stepFailedProgress = applyStepMistake(old, { lessonId: lesson.id, skill: lesson.skill, step }, currentGrade, currentSubject);
        return updateBehavioralMetrics(stepFailedProgress, 'step_attempt', {
          latency,
          isCorrect: false,
          step,
          hintUsed: hintUnlockedForCurrentStep
        });
      })
    }
  }

  function validateStep() {
    if (step === 0) return markAttempt(true, 'Con đã “nhìn thấy” câu chuyện. Giờ kể lại nhé!')
    if (step === 1) return markAttempt(selected === lesson.correctRetell, selected === lesson.correctRetell ? 'Kể đúng ba ý quan trọng rồi!' : 'Xem lại: ban đầu – thay đổi – cần tìm.')
    if (step === 2) {
      const correct = factAnswers.length === lesson.factRoles.length && factAnswers.every((role, index) => role === lesson.factRoles[index])
      return markAttempt(correct, correct ? 'Phân loại thông tin chuẩn luôn!' : 'Thường có hai điều đã biết và một điều cần tìm.')
    }
    if (step === 3) return markAttempt(selected === lesson.correctModel, selected === lesson.correctModel ? 'Hình này khớp câu chuyện!' : 'Chọn hình kể đúng chuyện đang xảy ra.')
    if (step === 4) {
      const correct = selected === lesson.correctOperation && secondSelected === lesson.correctReason
      return markAttempt(correct, correct ? 'Đúng phép tính và biết vì sao — tuyệt!' : 'Kiểm tra lại cả phép tính lẫn lý do.')
    }
    if (step === 5) {
      if (lesson.skill === 'Suy luận logic' || lesson.answer === 0) {
        return markAttempt(true, 'Bỏ qua tính toán đối với bài suy luận logic!')
      }
      return markAttempt(Number(numberAnswer) === lesson.answer, Number(numberAnswer) === lesson.answer ? 'Tính chính xác rồi!' : 'Cách làm đúng hướng — kiểm tra lại phép tính.')
    }
    if (step === 6) return markAttempt(selected === lesson.correctAnswerSentence, selected === lesson.correctAnswerSentence ? 'Câu trả lời đủ số và đơn vị!' : 'Nhớ đúng chủ thể và đơn vị nhé.')
    if (step === 7) return markAttempt(selected === lesson.correctCheck, selected === lesson.correctCheck ? 'Biết tự kiểm tra — siêu đẳng!' : 'Thử phép ngược hoặc xem lại câu chuyện.')
  }

  function nextStep() {
    if (!feedback?.correct) return
    const activeSteps = getActiveSteps(progress.studyMode || 'full', lesson)
    const currentIdx = activeSteps.indexOf(step)
    if (currentIdx < activeSteps.length - 1) {
      playClick()
      const nextS = activeSteps[currentIdx + 1]
      resetStepState(nextS)
      return
    }
    const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1
    const praise = getCompletionPraise({
      name: progress.profile?.name,
      stars,
      mistakes,
      skill: lesson.skill,
      shortTitle: lesson.shortTitle
    })
    const isChallenge = isChallengeModeActive(progress, lesson);
    const duration = lessonStartTime ? Math.round((Date.now() - lessonStartTime) / 1000) : 0;
    setProgress((old) =>
      applyLessonResult(old, {
        lessonId: lesson.id,
        skill: lesson.skill,
        stars,
        mistakes,
        duration,
        stepFails: stepFailsSession,
        challengeMode: isChallenge
      }, currentGrade, currentSubject)
    )
    playSfx(praise.sfx || 'complete', audioSettings.muted)
    if (!audioSettings.muted && audioSettings.autoRead) {
      playMascotReaction({
        mascotId: progress.profile?.mascot || 'owl',
        category: 'complete',
        fallbackText: `${praise.headline}. ${praise.lines[0]}`
      });
    }
    setView('complete')
  }

  function dismissWelcomeNudge() {
    const today = new Date().toISOString().slice(0, 10)
    setShowWelcomeNudge(false)
    setProgress((old) => ({ ...old, welcomeNudgeDismissedOn: today }))
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

  const isStepAnswered = () => {
    if (step === 0) return true
    if (step === 1) return selected !== null
    if (step === 2) {
      return factAnswers.length === lesson.facts.length &&
             factAnswers.every((x) => x === 'known' || x === 'unknown')
    }
    if (step === 3) return selected !== null
    if (step === 4) return selected !== null && secondSelected !== null
    if (step === 5) {
      if (lesson.skill === 'Suy luận logic' || lesson.answer === 0) return true
      return numberAnswer.trim() !== ''
    }
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
          showToast("Cài đặt ứng dụng thành công! 🎉", "📲", "success");
        }
        setDeferredPrompt(null);
        setShowInstallPrompt(false);
      });
    } else {
      setShowIosInstructions(true);
    }
  }

  function dismissInstallPrompt() {
    playClick();
    triggerHaptic('light');
    setShowInstallPrompt(false);
    setStoredItem(STORAGE_KEY_PWA_DISMISSED, String(Date.now() + 7 * 24 * 60 * 60 * 1000), STORAGE_KEY_PWA_DISMISSED_LEGACY);
    setStoredItem(STORAGE_KEY_IOS_DISMISSED, 'true', STORAGE_KEY_IOS_DISMISSED_LEGACY);
  }

  function toggleNotifications(enabled) {
    playClick();
    if (enabled) {
      if (!('Notification' in window)) {
        showToast("Trình duyệt này chưa hỗ trợ thông báo tự động.", "ℹ️", "warn");
        return;
      }
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          setProgress(old => ({ ...old, notificationsEnabled: true }));
          showToast("Đã bật nhắc nhở học toán hàng ngày! 🚀", "🔔", "success");
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'TRIGGER_NOTIFICATION',
              title: 'Học Toán Vui 🚀',
              body: 'Thông báo nhắc nhở hàng ngày đã được bật!'
            });
          }
        } else {
          showToast("Thông báo đang bị chặn. Vui lòng cho phép trong cài đặt trình duyệt.", "⚠️", "warn");
        }
      });
    } else {
      setProgress(old => ({ ...old, notificationsEnabled: false }));
      showToast("Đã tắt nhắc nhở học tập.", "🔕", "info");
    }
  }

  function changeReminderTime(time) {
    playClick();
    setProgress(old => ({ ...old, reminderTime: time }));
    showToast(`Đã lưu giờ nhắc học: ${time} hàng ngày ⏰`, "⏰", "success");
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
    showToast("Đã tải tệp lịch nhắc nhở (.ics) về máy! 📅", "📅", "success");
  }

  const isSessionActive = view === 'onboarding' || view === 'lesson' || view === 'intro' || view === 'diagnostic' || view === 'boss' || view === 'complete';

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const activeDailyQuests = getDailyQuests(activeProgress, todayDateStr);
  const dailyQuestsDoneCount = activeDailyQuests.filter(q => q.completed).length;
  const dailyQuestsTotalCount = activeDailyQuests.length;
  const questsSidebarBadge = `${dailyQuestsDoneCount}/${dailyQuestsTotalCount}`;
  const mistakeLessonsCount = learningPlan?.reviews?.length || 0;

  if (loadingPack) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-card">
          <span className="loading-mascot">{getMascotEmotion(progress.profile?.mascot || 'owl')}</span>
          <h2>Đang tải bài học vui...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-shell ${isSessionActive ? 'onboarding-shell' : ''}`}>
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`app-toast toast-${toast.type || 'info'} show`} role="alert" aria-live="polite">
          <span className="toast-icon">{toast.icon}</span>
          <span className="toast-msg">{toast.message}</span>
        </div>
      )}

      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-content">
            <span className="gameover-icon">💔</span>
            <h2>Hết ❤️ mất rồi!</h2>
            <p>
              Đừng nản lòng nhé! Mỗi lần thử sai là một cơ hội để học hỏi.<br/>
              Con hãy bắt đầu lại bài học này để chinh phục nó nhé!
            </p>
            <button className="btn-retry-lesson" onClick={handleRetryLesson}>
              Thử lại bài học này
            </button>
          </div>
        </div>
      )}
      {!isSessionActive && (
        <header className="topbar">
          <button className="brand" onClick={() => setView('home')} aria-label="Về trang chủ">
            <span className="brand-mascot">{getMascotEmotion(progress.profile?.mascot || 'owl')}</span>
            <span><strong>Học Toán</strong><small>Học cách học</small></span>
          </button>
          <div className="top-stats">
            <div className="level-card" onClick={() => { playClick(); setView('progress'); }} title="Bấm để xem giải thích cấp độ"><span>⭐</span><div><b>Cấp độ {level}</b><div className="mini-progress"><i style={{ width: `${levelProgress}%` }} /></div></div></div>
            <div className="stat" onClick={() => { playClick(); setView('quests'); }} title="Bấm để xem giải thích ngày liên tiếp"><span>🔥</span><b>{progress.streak}</b><small>ngày</small></div>
            <div className="stat" onClick={() => { playClick(); setView('progress'); }} title="Bấm để xem giải thích điểm vàng"><span>🪙</span><b>{progress.xp}</b><small>điểm</small></div>
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

        </header>
      )}

      {!isSessionActive && menuOpen && (
            <>
              <div 
                className="profile-sheet-overlay" 
                onClick={() => setMenuOpen(false)}
              />
              <div className="profile-sheet-panel" onClick={(e) => e.stopPropagation()}>
                <div className="profile-sheet-drag-handle" />
                <div className="profile-sheet-header">
                  <h3>👦 Hồ sơ & Thiết lập</h3>
                  <button className="profile-sheet-close-btn" onClick={() => { setMenuOpen(false); setProfileTab('kid'); setShowMathGate(false); }} aria-label="Đóng">✕</button>
                </div>
                <div className="profile-sheet-body" style={{ position: 'relative' }}>
                  
                  {/* Tab bar header */}
                  <div className="profile-tab-header">
                    <button 
                      className={`profile-tab-btn ${profileTab === 'kid' ? 'active' : ''}`}
                      onClick={() => { playSfx('click', audioSettings.muted); setProfileTab('kid'); }}
                    >
                      👦 Của Bé
                    </button>
                    <button 
                      className={`profile-tab-btn ${profileTab === 'parent' ? 'active' : ''}`}
                      onClick={() => {
                        if (profileTab !== 'parent') {
                          handleOpenParentGate();
                        }
                      }}
                    >
                      ⚙️ Cho Ba Mẹ
                    </button>
                  </div>

                  {/* Kid View Tab */}
                  {profileTab === 'kid' && (
                    <>
                      {/* Thẻ thông tin học sinh */}
                      <div className="profile-sheet-card">
                        {isEditingName ? (
                          <div className="profile-name-edit-container">
                            <input
                              type="text"
                              className="profile-name-input"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              maxLength={20}
                              autoFocus
                            />
                            <button className="profile-name-save-btn" onClick={saveProfileName}>Lưu</button>
                            <button className="profile-name-cancel-btn" onClick={() => setIsEditingName(false)}>Hủy</button>
                          </div>
                        ) : (
                          <div className="profile-name-edit-container">
                            <span className="profile-display-name" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '24px' }}>👦</span> {progress.profile?.name ? `Bé ${progress.profile.name}` : 'Bạn nhỏ chăm học'}
                            </span>
                            <button
                              className="profile-edit-name-btn"
                              onClick={() => {
                                setTempName(progress.profile?.name || '');
                                setIsEditingName(true);
                              }}
                              aria-label="Sửa tên học sinh"
                            >
                              ✏️ Sửa tên
                            </button>
                          </div>
                        )}

                        {/* Level & Streak Stats */}
                        <div className="profile-kid-stats-row">
                          <div className="profile-stat-box">
                            <span className="profile-stat-value">🔥 {progress.streak || 0}</span>
                            <span className="profile-stat-label">Ngày liên tiếp</span>
                          </div>
                          <div className="profile-stat-box">
                            <span className="profile-stat-value">⭐ {progress.xp || 0}</span>
                            <span className="profile-stat-label">Tổng điểm XP</span>
                          </div>
                        </div>

                        {/* Level progress bar */}
                        <div className="profile-level-container">
                          <div className="profile-level-header">
                            <span className="profile-level-title">Cấp độ {Math.floor((progress.xp || 0) / 100) + 1}</span>
                            <span className="profile-level-xp">{(progress.xp || 0) % 100}/100 XP</span>
                          </div>
                          <div className="profile-level-bar-bg">
                            <div className="profile-level-bar-fill" style={{ width: `${(progress.xp || 0) % 100}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Mascot selection and interaction */}
                      <div className="profile-sheet-card">
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#312e81', fontWeight: 800 }}>
                          {MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'} Chọn bạn đồng hành
                        </h4>
                        
                        {/* Dynamic Speech bubble */}
                        {mascotSpeechBubble && (
                          <div className="profile-mascot-dialogue">
                            <span>💬</span>
                            <span>{mascotSpeechBubble}</span>
                          </div>
                        )}

                        <div className="mascot-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                          {Object.keys(MASCOT_PROFILES).map(key => {
                            const mascotProfile = MASCOT_PROFILES[key];
                            const isSelected = (progress.profile?.mascot || 'owl') === key;
                            return (
                              <div 
                                key={key}
                                className={`mascot-select-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => handleMascotSelectAndSpeak(key)}
                                style={{
                                  padding: '10px 4px',
                                  borderRadius: '12px',
                                  border: isSelected ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                                  background: isSelected ? 'var(--primary-light)' : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  textAlign: 'center',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <span className="mascot-emoji" style={{ fontSize: '24px', display: 'block', marginBottom: '2px' }}>{mascotProfile.emoji}</span>
                                <span className="mascot-label" style={{ fontSize: '11px', fontWeight: 'bold' }}>{mascotProfile.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Badge achievements grid */}
                      <div className="profile-sheet-card">
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#312e81', fontWeight: 800 }}>
                          🏆 Huy hiệu đã đạt
                        </h4>
                        <div className="profile-badges-grid">
                          {ACHIEVEMENT_DEFINITIONS.map(def => {
                            const isUnlocked = progress.unlockedAchievements?.[def.id] || def.checkUnlocked(progress, progress.xp, []);
                            return (
                              <div 
                                key={def.id}
                                className={`profile-badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
                                onClick={() => {
                                  playSfx('click', audioSettings.muted);
                                  setSelectedBadgeInfo({
                                    ...def,
                                    isUnlocked
                                  });
                                }}
                              >
                                <span className="profile-badge-icon">{def.icon}</span>
                                <span className="profile-badge-title">{def.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Math Gate launcher */}
                      <button 
                        onClick={handleOpenParentGate}
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '14px',
                          border: 'none',
                          background: '#f1f5f9',
                          color: '#475569',
                          fontWeight: '800',
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginTop: '8px',
                          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
                        }}
                      >
                        ⚙️ Góc dành cho Phụ huynh
                      </button>
                    </>
                  )}

                  {/* Parent View Tab */}
                  {profileTab === 'parent' && (
                    <>
                      {/* Back navigation to Kid view */}
                      <button 
                        onClick={() => { playSfx('click', audioSettings.muted); setProfileTab('kid'); }}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff',
                          color: '#4f46e5',
                          fontWeight: '800',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          marginBottom: '16px'
                        }}
                      >
                        ⬅️ Quay về Hồ sơ của Bé
                      </button>

                      {/* Lớp & Môn học */}
                      <div className="profile-sheet-card">
                        <h4>🏫 Lớp học của con</h4>
                        <div className="pills-grid" style={{ marginBottom: '16px' }}>
                          {registry?.grades.map(g => (
                            <button
                              key={g.id}
                              disabled={g.comingSoon}
                              className={`pill-button ${currentGrade === g.id ? 'selected' : ''}`}
                              onClick={() => {
                                const newGrade = g.id;
                                const gradeObj = registry?.grades.find(gr => gr.id === newGrade);
                                const defaultSub = gradeObj?.subjects?.find(s => !s.comingSoon)?.id || 'math';
                                playSfx('click', audioSettings.muted);
                                setProgress(old => ({ ...old, currentGrade: newGrade, currentSubject: defaultSub }));
                              }}
                            >
                              {g.title} {g.comingSoon ? '(Sắp có)' : ''}
                            </button>
                          ))}
                        </div>

                        <h4>📖 Môn học đăng ký</h4>
                        <div className="pills-grid">
                          {registry?.grades.find(g => g.id === currentGrade)?.subjects?.map(s => (
                            <button
                              key={s.id}
                              disabled={s.comingSoon}
                              className={`pill-button ${currentSubject === s.id ? 'selected' : ''}`}
                              onClick={() => {
                                playSfx('click', audioSettings.muted);
                                setProgress(old => ({ ...old, currentSubject: s.id }));
                              }}
                            >
                              {s.title} {s.comingSoon ? '(Sắp có)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Chế độ học tập */}
                      <div className="profile-sheet-card">
                        <h4>🎓 Chế độ học tập</h4>
                        <div className="pills-grid">
                          <button
                            className={`pill-button ${(progress.studyMode || 'full') === 'full' ? 'selected' : ''}`}
                            onClick={() => {
                              setProgress(old => {
                                const updated = { ...old, studyMode: 'full' };
                                setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated), STORAGE_KEY_PROGRESS_LEGACY);
                                return updated;
                              });
                              playSfx('click', audioSettings.muted);
                            }}
                          >
                            Từng bước (8 bước)
                          </button>
                          <button
                            className={`pill-button ${progress.studyMode === 'express' ? 'selected' : ''}`}
                            onClick={() => {
                              setProgress(old => {
                                const updated = { ...old, studyMode: 'express' };
                                setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated), STORAGE_KEY_PROGRESS_LEGACY);
                                return updated;
                              });
                              playSfx('click', audioSettings.muted);
                            }}
                          >
                            Rút gọn (5 bước)
                          </button>
                          <button
                            className={`pill-button ${progress.studyMode === 'pro' ? 'selected' : ''}`}
                            onClick={() => {
                              setProgress(old => {
                                const updated = { ...old, studyMode: 'pro' };
                                setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated), STORAGE_KEY_PROGRESS_LEGACY);
                                return updated;
                              });
                              playSfx('click', audioSettings.muted);
                            }}
                          >
                            Siêu tốc (3 bước)
                          </button>
                        </div>
                      </div>

                      {/* Nhắc nhở tự động */}
                      <div className="profile-sheet-card">
                        <h4>⏰ Nhắc nhở tự động</h4>
                        <div className="custom-switch-row" style={{ marginBottom: '12px' }}>
                          <div className="switch-label-desc">
                            <span>Chuông báo học hằng ngày</span>
                            <small>Nhắc bé vào học đúng giờ mỗi ngày</small>
                          </div>
                          <label className="custom-switch">
                            <input
                              type="checkbox"
                              checked={progress.notificationsEnabled}
                              onChange={(e) => toggleNotifications(e.target.checked)}
                            />
                            <span className="custom-slider"></span>
                          </label>
                        </div>

                        {progress.notificationsEnabled && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13px', marginBottom: '12px', background: '#fff', padding: '10px 14px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                            <span style={{ fontWeight: '600', color: '#475569' }}>Chọn giờ báo chuông:</span>
                            <select
                              value={progress.reminderTime || '19:00'}
                              onChange={(e) => changeReminderTime(e.target.value)}
                              className="custom-select-styled"
                            >
                              <option value="08:00">08:00 Sáng</option>
                              <option value="09:00">09:00 Sáng</option>
                              <option value="17:00">17:00 Chiều</option>
                              <option value="19:00">19:00 Tối</option>
                              <option value="20:00">20:00 Tối</option>
                              <option value="21:00">21:00 Tối</option>
                            </select>
                          </div>
                        )}
                        
                        <button 
                          onClick={downloadIcsReminder}
                          className="calendar-btn-link"
                          style={{ width: '100%', padding: '10px', fontSize: '13px', marginTop: '6px', cursor: 'pointer', borderRadius: '10px', border: '1.5px dashed #4f46e5', color: '#4f46e5', fontWeight: 'bold', background: 'transparent' }}
                        >
                          ⏰ Đặt lịch chuông điện thoại
                        </button>
                      </div>

                      {/* Chế độ thử thách */}
                      <div className="profile-sheet-card">
                        <h4>🏆 Chế độ thử thách</h4>
                        <div className="custom-switch-row">
                          <div className="switch-label-desc">
                            <span>Chế độ Thử thách ⚡</span>
                            <small>Gợi ý tốn 1 ❤️. Hết ❤️ phải học lại từ đầu (Bắt buộc với bài nâng cao lớp 4).</small>
                          </div>
                          <label className="custom-switch">
                            <input
                              type="checkbox"
                              checked={progress.challengeMode || false}
                              onChange={(e) => {
                                playSfx('click', audioSettings.muted);
                                setProgress((old) => ({ ...old, challengeMode: e.target.checked }));
                              }}
                            />
                            <span className="custom-slider"></span>
                          </label>
                        </div>
                      </div>

                      {/* Khu vực nhà phát triển / Đặt lại */}
                      <div className="profile-sheet-footer-actions" style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '16px', marginTop: '16px' }}>
                        <button 
                          onClick={() => { playClick(); setMenuOpen(false); setView('onboarding'); }} 
                          className="btn-styled-dev"
                          style={{ background: '#eef2ff', color: '#4f46e5', borderColor: '#c7d2fe' }}
                        >
                          ✨ Xem lại màn hình Chào mừng (Onboarding)
                        </button>
                        <button 
                          onClick={() => { setIsDevMode(prev => !prev); setMenuOpen(false); }} 
                          className="btn-styled-dev"
                        >
                          {isDevMode ? '🔒 Khóa chế độ Dev' : '🔓 Mở khóa tất cả bài học'}
                        </button>
                        <button 
                          onClick={resetAllProgress} 
                          className="btn-styled-reset"
                        >
                          Xóa toàn bộ tiến độ
                        </button>
                      </div>
                    </>
                  )}

                  {/* Math Gate dialogue overlay */}
                  {showMathGate && (
                    <div className="math-gate-panel">
                      <div className="math-gate-lock-icon">🔒</div>
                      <div className="math-gate-title">Góc của Phụ huynh</div>
                      <div className="math-gate-subtitle">Vui lòng hoàn thành phép tính để mở khóa cấu hình</div>
                      <div className="math-gate-question">
                        {mathGateQuestion?.questionText || 'Ba mẹ ơi, hãy tính giúp con: ?'}
                      </div>
                      
                      <div className="math-gate-input-wrapper">
                        <input
                          type="number"
                          pattern="[0-9]*"
                          inputMode="numeric"
                          className={`math-gate-input ${mathGateError ? 'error' : ''}`}
                          value={mathGateInput}
                          onChange={(e) => {
                            setMathGateInput(e.target.value);
                            setMathGateError('');
                          }}
                          placeholder="Kết quả"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleVerifyMathGate();
                            }
                          }}
                          autoFocus
                        />
                        <button 
                          className="math-gate-verify-btn"
                          onClick={handleVerifyMathGate}
                        >
                          Xác nhận
                        </button>
                      </div>

                      <div className="math-gate-error-msg">
                        {mathGateError}
                      </div>

                      <button 
                        className="math-gate-cancel-btn"
                        onClick={() => {
                          playSfx('click', audioSettings.muted);
                          setShowMathGate(false);
                          setProfileTab('kid');
                        }}
                      >
                        Quay lại
                      </button>
                    </div>
                  )}

                  {/* Badge detailed popover dialogue */}
                  {selectedBadgeInfo && (
                    <div className="badge-popover-overlay" onClick={() => setSelectedBadgeInfo(null)}>
                      <div className="badge-popover-card" onClick={(e) => e.stopPropagation()}>
                        <div className="badge-popover-icon">{selectedBadgeInfo.icon}</div>
                        <h4 className="badge-popover-title">{selectedBadgeInfo.title}</h4>
                        <p className="badge-popover-desc">{selectedBadgeInfo.description}</p>
                        
                        {/* Custom advice from active mascot */}
                        <div className="badge-popover-advice">
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#1e1b4b' }}>
                            {MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'}{' '}
                            {MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.name || 'Cú Ú'} khuyên:
                          </strong>
                          {selectedBadgeInfo.advice?.[progress.profile?.mascot || 'owl'] || selectedBadgeInfo.description}
                        </div>

                        {/* Lock / Unlock progress status */}
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: selectedBadgeInfo.isUnlocked ? '#22c55e' : '#94a3b8', marginBottom: '16px' }}>
                          {selectedBadgeInfo.isUnlocked ? '🎉 Đã mở khóa thành công!' : `🔒 Tiến trình: ${selectedBadgeInfo.current(progress, progress.xp)} / ${selectedBadgeInfo.target}`}
                        </div>

                        <button 
                          className="badge-popover-close-btn"
                          onClick={() => {
                            playSfx('click', audioSettings.muted);
                            setSelectedBadgeInfo(null);
                          }}
                        >
                          Đóng
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}

      {!isSessionActive && (
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-group">
              <span className="sidebar-group-title">Học tập</span>
              <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
              <NavButton icon="🗺️" label="Chủ đề bài học" active={view === 'lessons-menu'} onClick={() => setView('lessons-menu')} />
              <NavButton icon="⏱️" label="Đấu trường 60s" active={view === 'arena'} onClick={handleOpenArena} badge="HOT" badgeType="hot" />
              <NavButton icon="🦉" label="Bạn học Cú Ú" active={view === 'buddy'} onClick={handleOpenBuddy} />
            </div>

            <div className="sidebar-group">
              <span className="sidebar-group-title">Thành tích</span>
              <NavButton 
                icon="🎯" 
                label="Nhiệm vụ" 
                active={view === 'quests'} 
                onClick={() => { playClick(); setView('quests'); }} 
                badge={questsSidebarBadge} 
                badgeType="quest" 
              />
              <NavButton 
                icon="🏆" 
                label="Bảng xếp hạng" 
                active={view === 'leaderboard'} 
                onClick={() => { playClick(); setView('leaderboard'); }} 
              />
              <NavButton 
                icon="📓" 
                label="Sổ tay lỗi sai" 
                active={view === 'review-list'} 
                onClick={() => { playClick(); setView('review-list'); }} 
                badge={mistakeLessonsCount > 0 ? `${mistakeLessonsCount}` : null} 
                badgeType="mistake" 
              />
            </div>

            <div className="sidebar-group">
              <span className="sidebar-group-title">Cá nhân</span>
              <NavButton icon="📊" label="Hồ sơ & Năng lực" active={view === 'progress'} onClick={() => setView('progress')} />
              <NavButton icon="⚙️" label="Cài đặt phụ huynh" active={menuOpen && profileTab === 'parent'} onClick={() => { playClick(); setMenuOpen(true); handleOpenParentGate(); }} />
            </div>
          </nav>
          <CoachSidebar progress={progress} plan={learningPlan} openLesson={openLesson} getMascotEmotion={getMascotEmotion} />
        </aside>
      )}

      <main className={isSessionActive ? "main-content full-width" : "main-content"}>
        <ErrorBoundary onReset={() => setView('home')}>
        {view === 'onboarding' && (
          <OnboardingView progress={progress} setProgress={setProgress} setView={setView} />
        )}
        {view === 'home' && (
          <Home
            lessons={lessons}
            progress={activeProgress}
            openLesson={openLesson}
            completedCount={completedCount}
            currentGrade={currentGrade}
            currentSubject={currentSubject}
            onOpenArena={handleOpenArena}
            onOpenBuddy={handleOpenBuddy}
            setView={setView}
            showWelcomeNudge={showWelcomeNudge}
            onDismissNudge={dismissWelcomeNudge}
            audioSettings={audioSettings}
            getMascotEmotion={getMascotEmotion}
            onOpenChest={() => { playClick(); setChestRewardAwarded(false); setShowChestOverlay(true); }}
            onOpenBoss={() => { playClick(); setShowBossOverlay(true); }}
            onOpenQuests={() => { playClick(); setView('quests'); }}
            onOpenLeaderboard={() => { playClick(); setView('leaderboard'); }}
            onOpenReview={() => { playClick(); setView('review-list'); }}
            isUnlocked={isUnlocked}
          />
        )}
        {view === 'lessons-menu' && (
          <LessonsMenu
            lessons={lessons}
            progress={activeProgress}
            openLesson={openLesson}
            isUnlocked={isUnlocked}
            completedCount={completedCount}
            registry={registry}
            currentGrade={currentGrade}
            currentSubject={currentSubject}
            onOpenLeaderboard={() => { playClick(); setView('leaderboard'); }}
          />
        )}
        {view === 'arena' && (
          <ArenaView
            arenaQuestion={arenaQuestion}
            arenaTime={arenaTime}
            arenaScore={arenaScore}
            arenaAttempts={arenaAttempts}
            arenaAnswerVal={arenaAnswerVal}
            setArenaAnswerVal={setArenaAnswerVal}
            arenaFeedback={arenaFeedback}
            onCheckAnswer={handleCheckArenaAnswer}
            onBack={() => { playClick(); setView('home'); }}
            mascot={progress.profile?.mascot || 'owl'}
            getMascotEmotion={getMascotEmotion}
          />
        )}
        {view === 'buddy' && (
          <BuddyView
            buddyQuestion={buddyQuestion}
            buddyFeedback={buddyFeedback}
            buddyAttempted={buddyAttempted}
            onCheckAnswer={handleCheckBuddyAnswer}
            onNext={handleOpenBuddy}
            onBack={() => { playClick(); setView('home'); }}
            mascot={progress.profile?.mascot || 'owl'}
            getMascotEmotion={getMascotEmotion}
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
            setFeedback={setFeedback}
            hintOpen={hintOpen}
            setHintOpen={setHintOpen}
            hearts={hearts}
            validateStep={validateStep}
            nextStep={nextStep}
            speakStory={speakStory}
            onBack={() => {
              playClick();
              setProgress(old => updateBehavioralMetrics(old, 'exit_lesson', { step, mistakes }));
              setView('home');
            }}
            isAnswered={isStepAnswered()}
            progress={activeProgress}
            hintUnlockedForCurrentStep={hintUnlockedForCurrentStep}
            setHintUnlockedForCurrentStep={setHintUnlockedForCurrentStep}
            showHintConfirm={showHintConfirm}
            setShowHintConfirm={setShowHintConfirm}
            setHearts={setHearts}
            setMistakes={setMistakes}
            audioSettings={audioSettings}
            stepConfettiActive={stepConfettiActive}
            cooldownActive={cooldownActive}
          />
        )}
        {view === 'complete' && (
          <CompleteView
            lesson={lesson}
            mistakes={mistakes}
            progress={activeProgress}
            setProgress={setProgress}
            plan={learningPlan}
            onHome={() => setView('home')}
            onOpenLesson={openLesson}
            lessonIndex={lessonIndex}
            getMascotEmotion={getMascotEmotion}
            showToast={showToast}
          />
        )}
        {view === 'progress' && (
          <InsightsView
            lessons={lessons}
            progress={activeProgress}
            openLesson={openLesson}
            earnedStars={earnedStars}
            getMascotEmotion={getMascotEmotion}
            showToast={showToast}
            onOpenReview={() => { playClick(); setView('review-list'); }}
            onOpenSettings={() => { playClick(); setView('settings'); }}
          />
        )}
        {view === 'intro' && (
          <IntroView
            lesson={lesson}
            progress={activeProgress}
            onStart={() => {
              playClick();
              setLessonStartTime(Date.now());
              setView('lesson');
            }}
            onBack={() => { playClick(); setView('home'); }}
            mascot={progress.profile?.mascot || 'owl'}
            getMascotEmotion={getMascotEmotion}
          />
        )}
        {view === 'review-list' && (
          <ReviewListView
            lessons={lessons}
            progress={activeProgress}
            openLesson={openLesson}
            onBack={() => { playClick(); setView('home'); }}
          />
        )}
        {view === 'quests' && (
          <QuestsView
            progress={activeProgress}
            onBack={() => setView('home')}
            openLesson={openLesson}
            plan={learningPlan}
          />
        )}
        {view === 'leaderboard' && (
          <LeaderboardView
            onBack={() => setView('lessons-menu')}
            openLesson={openLesson}
            plan={learningPlan}
            progress={activeProgress}
          />
        )}
        {view === 'settings' && (
          <SettingsView
            onBack={() => setView('progress')}
            progress={activeProgress}
            setProgress={setProgress}
          />
        )}
        </ErrorBoundary>
      </main>

      <nav className={`tabbar${isSessionActive ? ' hidden' : ''}`}>
        <NavButton icon="🏠" label="Home" active={view === 'home'} onClick={() => setView('home')} />
        <NavButton icon="🗺️" label="Chủ đề" active={view === 'lessons-menu'} onClick={() => setView('lessons-menu')} />
        <NavButton icon="✏️" label="Bài tập" active={view === 'lesson' || view === 'intro'} onClick={() => {
          if (learningPlan?.primary) {
            openLesson(learningPlan.primary.index);
          } else {
            openLesson(0);
          }
        }} />
        <NavButton icon="👤" label="Hồ sơ" active={view === 'progress'} onClick={() => setView('progress')} />
      </nav>

      {view === 'home' && !isSessionActive && showInstallPrompt && !showChestOverlay && !showBossOverlay && !showMathGate && !selectedBadgeInfo && !activeGuide && !showIosInstructions && (
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

      {showChestOverlay && (
        <div className="confirm-modal-overlay" style={{ zIndex: 100000 }}>
          <div className="confirm-modal" style={{ maxWidth: '340px', padding: '24px', textAlign: 'center' }}>
            {!chestRewardAwarded ? (
              <>
                <div style={{ fontSize: '72px', animation: 'bob-avatar 2s infinite alternate', marginBottom: '12px' }}>🎁</div>
                <h3>🎉 Rương Unit!</h3>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                  Chúc mừng con đã hoàn thành tất cả bài học trong unit này. Nhấn nút để nhận phần quà bí ẩn!
                </p>
                <button 
                  className="hero-primary-btn" 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '15px' }}
                  onClick={handleOpenUnitChest}
                >
                  Mở rương 🔑
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: '72px', animation: 'bob-avatar 2s infinite alternate', marginBottom: '12px' }}>✨</div>
                <h3>🎉 Nhận Quà Xong!</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0', textAlign: 'left' }}>
                  <div style={{ padding: '8px 12px', background: '#fff7da', borderRadius: '10px', fontWeight: '850', color: '#8a6300', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⭐</span> +80 XP tích lũy
                  </div>
                  <div style={{ padding: '8px 12px', background: '#eef2fb', borderRadius: '10px', fontWeight: '850', color: '#6851e8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🏅</span> Huy hiệu Unit Explorer
                  </div>
                  <div style={{ padding: '8px 12px', background: '#e9f9ef', borderRadius: '10px', fontWeight: '850', color: '#2fbd68', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🧊</span> 1 Streak Freeze bảo vệ lửa
                  </div>
                </div>
              </>
            )}
            <button 
              className="btn-cancel" 
              style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '13px', marginTop: '8px' }}
              onClick={() => setShowChestOverlay(false)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      {showBossOverlay && (
        <div className="confirm-modal-overlay" style={{ zIndex: 100000 }}>
          <div className="confirm-modal" style={{ maxWidth: '340px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '72px', marginBottom: '12px' }}>⚔️</div>
            <h3>🔥 Thử Thách Boss Unit!</h3>
            <p style={{ fontSize: '14.5px', color: '#64748b', marginBottom: '20px', lineHeight: '1.4' }}>
              Chào mừng con đến với trận quyết đấu Boss! Hãy hoàn thành bài toán tổng hợp khó nhất của Unit để khẳng định bản thân nào!
            </p>
            <button 
              className="hero-primary-btn" 
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '15px' }}
              onClick={handleStartBossChallenge}
            >
              Quyết đấu ngay! ⚔️
            </button>
            <button 
              className="btn-cancel" 
              style={{ width: '100%', padding: '10px', borderRadius: '12px', fontSize: '13px', marginTop: '8px' }}
              onClick={() => setShowBossOverlay(false)}
            >
              Rút lui 🏃‍♂️
            </button>
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

      {activeGuide && (() => {
        const mascot = progress.profile?.mascot || 'owl';
        const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
        const mascotEmoji = getMascotEmotion(mascot);
        const mascotName = profile.name;
        const guideData = getIndicatorGuide(mascot, activeGuide, progress) || getIndicatorGuide(mascot, 'level', progress);
        if (!guideData) return null;
        
        return (
          <div className="guide-modal-overlay" onClick={() => { playClick(); setActiveGuide(null); cancelSpeech(); }}>
            <div className={`guide-modal-card theme-${mascot}`} onClick={(e) => e.stopPropagation()}>
              <button 
                className="guide-close-btn" 
                onClick={() => { playClick(); setActiveGuide(null); cancelSpeech(); }}
                aria-label="Đóng cẩm nang"
              >
                ✕
              </button>
              
              <div className="guide-title-wrapper">
                <h3>{guideData.title}</h3>
              </div>
              
              <div className="guide-mascot-section">
                <div className="guide-mascot-avatar">
                  <span className="guide-mascot-emoji">{mascotEmoji}</span>
                  <span className="guide-mascot-name">{mascotName}</span>
                </div>
                <div className="guide-speech-bubble">
                  <p className="guide-speech-text">"{guideData.intro}"</p>
                  <button className="guide-speak-btn" onClick={() => handleSpeakGuideManual(activeGuide)}>
                    🔊 Nghe đọc
                  </button>
                </div>
              </div>
              
              <div className="guide-details-list">
                <div className="guide-detail-item">
                  <div className="guide-detail-icon">❓</div>
                  <div className="guide-detail-content">
                    <span className="guide-detail-label">Giải thích</span>
                    <span className="guide-detail-text">{guideData.whatIsIt}</span>
                  </div>
                </div>
                
                <div className="guide-detail-item">
                  <div className="guide-detail-icon">💡</div>
                  <div className="guide-detail-content">
                    <span className="guide-detail-label">Cách tăng / Cách dùng</span>
                    <span className="guide-detail-text">{guideData.howToIncrease}</span>
                  </div>
                </div>
                
                <div className="guide-detail-item">
                  <div className="guide-detail-icon">🚀</div>
                  <div className="guide-detail-content">
                    <span className="guide-detail-label">{mascotName} khuyên con</span>
                    <span className="guide-detail-text">{guideData.motivation}</span>
                  </div>
                </div>
              </div>

              <div className="guide-tabs">
                <button 
                  className={`guide-tab-btn ${activeGuide === 'level' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('level')}
                >
                  ⭐ Cấp độ
                </button>
                <button 
                  className={`guide-tab-btn ${activeGuide === 'streak' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('streak')}
                >
                  🔥 Chuỗi ngày
                </button>
                <button 
                  className={`guide-tab-btn ${activeGuide === 'xp' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('xp')}
                >
                  🪙 Điểm XP
                </button>
                <button 
                  className={`guide-tab-btn ${activeGuide === 'unlock' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('unlock')}
                >
                  🔓 Tự do
                </button>
                <button 
                  className={`guide-tab-btn ${activeGuide === 'sound' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('sound')}
                >
                  🔊 Loa đọc
                </button>
                <button 
                  className={`guide-tab-btn ${activeGuide === 'avatar' ? 'active' : ''}`}
                  onClick={() => handleOpenGuide('avatar')}
                >
                  👦 Hồ sơ
                </button>
              </div>

              <button className="guide-action-btn" onClick={() => { playClick(); setActiveGuide(null); cancelSpeech(); }}>
                Con đã hiểu rồi! 👍
              </button>
            </div>
          </div>
        );
      })()}
      {newlyUnlockedAchievements.length > 0 && (
        <AchievementCelebration
          achievements={newlyUnlockedAchievements}
          mascot={progress.profile?.mascot || 'owl'}
          onClose={() => setNewlyUnlockedAchievements([])}
          getMascotEmotion={getMascotEmotion}
        />
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

function NavButton({ icon, label, active, onClick, badge, badgeType }) {
  return (
    <button 
      className={`tab${active ? ' active' : ''}`} 
      onClick={(e) => {
        playClick();
        onClick(e);
      }}
    >
      <span className="ico">{icon}</span>
      <span className="lbl">{label}</span>
      {badge && <span className={`nav-badge badge-${badgeType || 'default'}`}>{badge}</span>}
    </button>
  )
}

function Home({
  lessons,
  progress,
  openLesson,
  _completedCount,
  currentGrade,
  currentSubject,
  onOpenArena,
  onOpenBuddy,
  setView,
  showWelcomeNudge,
  onDismissNudge,
  audioSettings,
  getMascotEmotion,
  onOpenChest,
  onOpenBoss,
  onOpenQuests,
  onOpenLeaderboard,
  onOpenReview,
  isUnlocked
}) {
  const plan = getLearningPlan(lessons, progress);
  const mascot = progress?.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;
  const completedCount = Object.keys(progress.completed || {}).length;

  let speechBubbleText = '';
  if (plan?.primary) {
    if (plan.primary.kind === 'review') {
      speechBubbleText = `Chào bạn nhỏ! Có bài “${plan.primary.lesson.shortTitle}” cần chúng mình ôn tập lại đó. Cùng nhấn nút ở bên phải để ôn tập nhé! 🔄`;
    } else if (plan.primary.kind === 'mastery') {
      speechBubbleText = `Tuyệt vời! Bạn nhỏ đã hoàn thành toàn bộ bài học rồi! Con hãy chơi Đấu trường hoặc ôn bài nhé! 🏆`;
    } else {
      speechBubbleText = `Chào mừng quay trở lại! Hôm nay chúng mình cùng nhau chinh phục bài mới “${plan.primary.lesson.shortTitle}” nhé! 🚀`;
    }
  } else {
    speechBubbleText = `Chào bạn nhỏ! Hôm nay là một ngày tuyệt vời để học Toán cùng nhau. Bắt đầu ngay nhé! 🌟`;
  }

  const handleSpeakMascot = () => {
    cancelSpeech();
    playMascotReaction({
      mascotId: mascot,
      category: 'welcome',
      fallbackText: speechBubbleText
    });
  };

  const gradeLabel = currentGrade === 'grade-1' ? 'Lớp 1' : currentGrade === 'grade-2' ? 'Lớp 2' : currentGrade === 'grade-3' ? 'Lớp 3' : currentGrade === 'grade-4' ? 'Lớp 4' : 'Lớp 5';
  const remainingCount = lessons.length - completedCount;
  const todayStr = new Date().toISOString().slice(0, 10);
  const quests = getDailyQuests(progress, todayStr);
  const completedQuestsCount = quests.filter(q => q.completed).length;
  const totalQuestsCount = quests.length;

  // Split into 3 chapters for desktop roadmap
  const totalLessons = lessons.length;
  const ch1End = Math.min(30, totalLessons);
  const ch2End = Math.min(60, totalLessons);
  
  const chapters = [
    { id: 1, title: 'Chương I: Khởi động & Làm quen', start: 0, end: ch1End, icon: '🌱' },
    { id: 2, title: 'Chương II: Thực hành & Tăng tốc', start: ch1End, end: ch2End, icon: '🚀' },
    { id: 3, title: 'Chương III: Chinh phục & Nâng cao', start: ch2End, end: totalLessons, icon: '🏆' }
  ].filter(ch => ch.start < ch.end);

  const pathIndex = lessons.findIndex(l => !progress.completed?.[l.id]);
  const activeChapterId = pathIndex === -1 ? 1 : pathIndex < ch1End ? 1 : pathIndex < ch2End ? 2 : 3;

  const [expandedChapters, setExpandedChapters] = useState({
    1: true,
    2: activeChapterId >= 2,
    3: activeChapterId === 3
  });

  const toggleChapter = (id) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const chestOpened = !!progress.completed?.[`${currentGrade || 'grade-4'}_${currentSubject || 'math'}_unit_chest`] || !!progress.completed?.['unit_chest'];
  const bossCompleted = !!progress.completed?.['unit_boss'];

  return (
    <div className="home-dashboard-page">
      {/* Top Stats Header */}
      <div className="top-stats">
        <div className="brand-mini">
          <div className="logo" onClick={handleSpeakMascot}>{mascotEmoji}</div>
          <div>
            <b>Học Toán Vui</b>
            <small>Xin chào, {progress.profile?.name || 'bạn nhỏ'}!</small>
          </div>
        </div>
        <div className="stat-pills">
          <button className="pill fire" onClick={onOpenQuests}>🔥 {progress.streak || 0}</button>
          <button className="pill xp" onClick={() => setView('progress')}>⭐ {progress.xp || 0}</button>
        </div>
      </div>

      {/* Welcome nudge */}
      {showWelcomeNudge && (() => {
        const nudge = getWelcomeBackNudge(progress);
        return (
          <div className="card" style={{ padding: '14px 16px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>{nudge.mascotEmoji}</span>
            <div style={{ flex: 1 }}>
              <b style={{ fontSize: '14px' }}>{nudge.title}</b>
              <small style={{ display: 'block', marginTop: '2px', color: 'var(--muted)', fontSize: '12px', fontWeight: 700, lineHeight: '1.4' }}>{nudge.body}</small>
            </div>
            <button className="btn btn-soft btn-sm" onClick={onDismissNudge}>OK</button>
          </div>
        )
      })()}

      <div className="home-dashboard-layout">
        {/* Main Column: Hero + Chapter Roadmap Islands */}
        <div className="home-main-col">
          {/* Hero Card */}
          {plan?.primary ? (
            <div className="hero" onClick={handleSpeakMascot}>
              <div className="hero-top">
                <div>
                  <h1>{plan.primary.kind === 'review' ? 'Ôn bài cũ' : `Tiếp tục ${gradeLabel}`}</h1>
                  <p>{plan.primary.kind === 'review'
                    ? `Ôn lại "${plan.primary.lesson.shortTitle}" để ghi nhớ tốt hơn.`
                    : `Còn ${remainingCount} bài nữa. Chinh phục "${plan.primary.lesson.shortTitle}" nhé!`
                  }</p>
                </div>
                <div className="mascot-bubble">{mascotEmoji}</div>
              </div>
              <div className="hero-cta">
                <button className="btn" onClick={(e) => { e.stopPropagation(); playSfx('click', audioSettings?.muted); openLesson(plan.primary.index); }}>
                  {plan.primary.kind === 'review' ? 'Ôn tập ngay' : 'Bắt đầu học'}
                </button>
                <button className="btn secondary" onClick={(e) => { e.stopPropagation(); playSfx('click', audioSettings?.muted); setView('lessons-menu'); }}>
                  Đổi chủ đề
                </button>
              </div>
            </div>
          ) : (
            <div className="hero" onClick={handleSpeakMascot}>
              <div className="hero-top">
                <div>
                  <h1>Hoàn thành xuất sắc! 🎉</h1>
                  <p>Con đã vượt qua tất cả bài học. Thử sức Đấu trường nhé!</p>
                </div>
                <div className="mascot-bubble">{mascotEmoji}</div>
              </div>
              <div className="hero-cta">
                <button className="btn" onClick={(e) => { e.stopPropagation(); playSfx('click', audioSettings?.muted); onOpenArena(); }}>
                  Vào đấu trường ⚡
                </button>
                <button className="btn secondary" onClick={(e) => { e.stopPropagation(); playSfx('click', audioSettings?.muted); setView('lessons-menu'); }}>
                  Xem lại bài
                </button>
              </div>
            </div>
          )}

          {/* Grade Progress Bar */}
          <div className="card" style={{ padding: '14px 18px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <b style={{ fontSize: '15px' }}>🏫 Tiến độ {gradeLabel}</b>
              <small style={{ fontSize: '13px', fontWeight: 800, color: 'var(--muted)' }}>
                {completedCount}/{lessons.length} bài ({Math.round((completedCount / (lessons.length || 1)) * 100)}%)
              </small>
            </div>
            <div className="progress-track" style={{ height: '12px' }}>
              <i style={{ width: `${(completedCount / (lessons.length || 1)) * 100}%` }} />
            </div>
          </div>

          {/* Desktop Chapter Islands Roadmap */}
          <div className="desktop-roadmap-wrapper">
            <div className="section-title" style={{ marginTop: 0, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>🗺️ Lộ trình chinh phục {gradeLabel}</h2>
              <button className="linkish" onClick={() => setView('lessons-menu')}>Xem dạng danh sách ›</button>
            </div>

            {chapters.map(ch => {
              const chLessons = lessons.slice(ch.start, ch.end);
              const chCompleted = chLessons.filter(l => progress.completed?.[l.id]).length;
              const chProgress = Math.round((chCompleted / (chLessons.length || 1)) * 100);
              const isExpanded = expandedChapters[ch.id];

              return (
                <div key={ch.id} className="chapter-island-card card" style={{ marginBottom: '16px', padding: '16px' }}>
                  <div className="chapter-island-head" onClick={() => toggleChapter(ch.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="chapter-icon-badge" style={{ fontSize: '24px', background: ch.id === 1 ? '#e8f5e9' : ch.id === 2 ? '#fff3e0' : '#fce4ec', width: '44px', height: '44px', borderRadius: '12px', display: 'grid', placeItems: 'center' }}>
                        {ch.icon}
                      </span>
                      <div>
                        <b style={{ fontSize: '15px', color: '#1e293b' }}>{ch.title}</b>
                        <small style={{ display: 'block', color: 'var(--muted)', fontSize: '12px', fontWeight: 700, marginTop: '2px' }}>
                          {chCompleted}/{chLessons.length} bài hoàn thành · {chProgress}%
                        </small>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="progress-ring-mini" style={{ fontWeight: 800, fontSize: '12px', color: '#64748b' }}>
                        {chProgress}%
                      </div>
                      <span style={{ fontSize: '14px', color: '#94a3b8' }}>{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="chapter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px', marginTop: '16px' }}>
                      {chLessons.map((l, idx) => {
                        const originalIndex = ch.start + idx;
                        const complete = progress.completed?.[l.id];
                        const unlocked = isUnlocked ? isUnlocked(originalIndex) : true;
                        const isCurrent = !complete && unlocked;

                        return (
                          <button
                            key={l.id}
                            className={`desktop-lesson-cell ${complete ? 'done' : isCurrent ? 'current' : unlocked ? 'unlocked' : 'locked'}`}
                            onClick={() => openLesson(originalIndex)}
                            disabled={!unlocked}
                            title={`${originalIndex + 1}. ${l.shortTitle}`}
                          >
                            <span className="cell-num">{originalIndex + 1}</span>
                            <span className="cell-icon">{unlocked ? (l.icon || '📖') : '🔒'}</span>
                            <span className="cell-title">{l.shortTitle}</span>
                            {complete && (
                              <span className="cell-stars">
                                {'⭐'.repeat(complete.stars || 1)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {ch.id === 3 && (
                        <>
                          <button
                            className={`desktop-lesson-cell special-cell ${chestOpened ? 'done' : (completedCount === lessons.length ? 'current' : 'locked')}`}
                            onClick={onOpenChest}
                            title="Rương phần thưởng Unit"
                          >
                            <span className="cell-num">🎁</span>
                            <span className="cell-icon">{chestOpened ? '✨' : '🎁'}</span>
                            <span className="cell-title">Rương Unit</span>
                          </button>
                          <button
                            className={`desktop-lesson-cell special-cell ${bossCompleted ? 'done' : (completedCount === lessons.length && chestOpened ? 'current' : 'locked')}`}
                            onClick={onOpenBoss}
                            title="Thử thách Trùm Boss"
                          >
                            <span className="cell-num">⚔️</span>
                            <span className="cell-icon">⚔️</span>
                            <span className="cell-title">Đấu Boss</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Learning Path (Hidden on Desktop via CSS) */}
          <div className="card mobile-only-path" style={{ padding: '18px', marginBottom: '14px', textAlign: 'center' }}>
            <div className="section-title" style={{ marginTop: 0 }}>
              <h2>🗺️ Đường học của em</h2>
              <button className="linkish" onClick={() => setView('lessons-menu')}>Xem tất cả ›</button>
            </div>
            <LearningPath
              lessons={lessons}
              progress={progress}
              openLesson={openLesson}
              activeProgress={progress}
              onOpenChest={onOpenChest}
              onOpenBoss={onOpenBoss}
            />
          </div>

          {/* Recently Studied + Review */}
          {(() => {
            const recentlyStudied = getRecentlyStudiedLesson(lessons, progress, currentGrade, currentSubject);
            const actualReview = plan?.reviews?.find(r => r.lesson.id !== plan.primary?.lesson?.id) || plan?.reviews?.[0];
            if (!recentlyStudied && !actualReview) return null;
            return (
              <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
                <div className="section-title" style={{ marginTop: 0, marginBottom: '12px' }}><h2>📅 Lịch sử học tập gần đây</h2></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {recentlyStudied && (() => {
                    const recIndex = lessons.findIndex(l => l.id === recentlyStudied.id);
                    const done = progress.completed[recentlyStudied.id];
                    return (
                      <button className="history-lesson-item" onClick={() => openLesson(recIndex)}>
                        <span className="hist-icon">{recentlyStudied.icon}</span>
                        <div>
                          <b>{recentlyStudied.shortTitle}</b>
                          <small>
                            {done ? `⭐ ${done.stars}/3 · ${done.mistakes} lỗi` : 'Đang học dở dang'}
                          </small>
                        </div>
                      </button>
                    );
                  })()}
                  {actualReview && (
                    <button className="history-lesson-item review-highlight" onClick={() => openLesson(actualReview.index)}>
                      <span className="hist-icon">{actualReview.lesson.icon}</span>
                      <div>
                        <b>🔄 Cần ôn: {actualReview.lesson.shortTitle}</b>
                        <small>{actualReview.mistakes} lỗi sai cần luyện lại</small>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Right Sidecar Column (Desktop Cockpit Widgets) */}
        <aside className="home-sidecar-panel">
          {/* Daily Quests Widget */}
          <div className="sidecar-widget-card card">
            <div className="widget-header" onClick={onOpenQuests} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                <b style={{ fontSize: '14px' }}>Nhiệm vụ hôm nay</b>
              </div>
              <span className="widget-badge">{completedQuestsCount}/{totalQuestsCount}</span>
            </div>
            <div className="quests-mini-list">
              {quests.map(q => (
                <div key={q.id} className={`quest-mini-item ${q.completed ? 'done' : ''}`} onClick={onOpenQuests}>
                  <span className="quest-checkbox">{q.completed ? '✅' : '⚪'}</span>
                  <span className="quest-text">{q.title}</span>
                  <span className="quest-reward">+{q.reward} XP</span>
                </div>
              ))}
            </div>
            <button className="sidecar-action-btn" onClick={onOpenQuests}>
              Xem chi tiết nhiệm vụ ›
            </button>
          </div>

          {/* Speed Arena Teaser Widget */}
          <div className="sidecar-widget-card card arena-sidecar">
            <div className="widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⏱️</span>
                <b style={{ fontSize: '14px' }}>Đấu trường Tính Nhanh</b>
              </div>
              <span className="widget-badge hot">60s</span>
            </div>
            <p className="widget-desc">Thử thách phản xạ toán học, giải càng nhanh điểm thưởng càng cao!</p>
            <div className="arena-sidecar-stats">
              <div className="stat-box">
                <span>🔥 Chuỗi</span>
                <b>{progress.streak || 0} ngày</b>
              </div>
              <div className="stat-box">
                <span>⭐ Điểm</span>
                <b>{progress.xp || 0} XP</b>
              </div>
            </div>
            <button className="sidecar-primary-btn" onClick={onOpenArena}>
              Bắt đầu đấu trường ⚡
            </button>
          </div>

          {/* AI Buddy Advisor Widget */}
          <div className="sidecar-widget-card card buddy-sidecar">
            <div className="widget-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{mascotEmoji}</span>
                <b style={{ fontSize: '14px' }}>{mascotName} Cố Vấn</b>
              </div>
              <button className="speech-mini-icon" onClick={handleSpeakMascot} title="Nghe lời khuyên">🔊</button>
            </div>
            <p className="buddy-speech-preview">"{speechBubbleText}"</p>
            <button className="sidecar-soft-btn" onClick={onOpenBuddy}>
              Sửa lỗi cùng {mascotName} 🐢
            </button>
          </div>

          {/* Mistakes Notebook Widget */}
          {plan?.reviews?.length > 0 ? (
            <div className="sidecar-widget-card card mistake-sidecar">
              <div className="widget-header" onClick={onOpenReview} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>📓</span>
                  <b style={{ fontSize: '14px' }}>Sổ tay lỗi sai</b>
                </div>
                <span className="widget-badge danger">{plan.reviews.length} bài</span>
              </div>
              <p className="widget-desc">Có {plan.reviews.length} bài học bé từng làm sai cần ôn tập lại để củng cố kiến thức.</p>
              <button className="sidecar-action-btn" onClick={onOpenReview}>
                Mở sổ tay câu sai ›
              </button>
            </div>
          ) : (
            <div className="sidecar-widget-card card perfect-sidecar">
              <div className="widget-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✨</span>
                  <b style={{ fontSize: '14px' }}>Phong độ xuất sắc</b>
                </div>
              </div>
              <p className="widget-desc">Không có bài học nào bị sai nhiều. Hãy tiếp tục phát huy nhé!</p>
            </div>
          )}

          {/* Leaderboard Quick CTA */}
          <div className="sidecar-widget-card card leaderboard-sidecar">
            <div className="widget-header" onClick={onOpenLeaderboard} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏆</span>
                <b style={{ fontSize: '14px' }}>Bảng xếp hạng tuần</b>
              </div>
              <span className="widget-badge gold">Top 1</span>
            </div>
            <div className="leaderboard-mini-preview">
              <div className="mini-rank-item top1">
                <span>🥇</span>
                <b>{progress.profile?.name || 'Bé Bạn nhỏ'}</b>
                <small>{progress.xp || 0} XP</small>
              </div>
              <div className="mini-rank-item">
                <span>🥈</span>
                <b>Minh An</b>
                <small>420 XP</small>
              </div>
              <div className="mini-rank-item">
                <span>🥉</span>
                <b>Bảo Vy</b>
                <small>380 XP</small>
              </div>
            </div>
            <button className="sidecar-action-btn" onClick={onOpenLeaderboard}>
              Xem toàn bộ bảng vàng ›
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LessonsMenu({
  lessons,
  progress,
  openLesson,
  isUnlocked,
  completedCount,
  registry,
  currentGrade,
  currentSubject,
  onOpenLeaderboard
}) {
  const activeGradeObj = registry?.grades.find(g => g.id === currentGrade)
  const activeSubjectObj = activeGradeObj?.subjects?.find(s => s.id === currentSubject)

  const total = lessons.length;
  const ch1End = Math.min(30, total);
  const ch2End = Math.min(60, total);
  
  const chapters = [
    { id: 1, title: 'Chương I: Khởi động & Làm quen', start: 0, end: ch1End, icon: '🌱' },
    { id: 2, title: 'Chương II: Thực hành & Tăng tốc', start: ch1End, end: ch2End, icon: '🚀' },
    { id: 3, title: 'Chương III: Chinh phục & Nâng cao', start: ch2End, end: total, icon: '🏆' }
  ].filter(ch => ch.start < ch.end);

  const pathIndex = lessons.findIndex(l => !progress.completed?.[l.id]);
  const activeChapterId = pathIndex === -1 ? 1 : pathIndex < ch1End ? 1 : pathIndex < ch2End ? 2 : 3;

  const [expandedChapters, setExpandedChapters] = useState({
    1: activeChapterId === 1,
    2: activeChapterId === 2,
    3: activeChapterId === 3
  });

  const toggleChapter = (id) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="lessons-menu-page" style={{ padding: '16px', overflowY: 'auto', minHeight: '100dvh', boxSizing: 'border-box', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)' }}>
      {/* Page Head */}
      <div className="page-head">
        <h1>📚 Chọn chủ đề</h1>
        <button className="icon-btn" onClick={onOpenLeaderboard} title="Xem bảng xếp hạng">🏆</button>
      </div>

      {/* Unit Hero */}
      <div className="unit-hero">
        <span style={{ fontSize: '32px' }}>{activeSubjectObj?.icon || '📐'}</span>
        <h1>{activeGradeObj?.title || 'Lớp 3'} — {activeSubjectObj?.title || 'Toán'}</h1>
        <p>Con đang học rất tốt! Chọn bài con muốn chinh phục hôm nay nhé.</p>
        <div className="unit-meta">
          <span>📖 {lessons.length} bài</span>
          <span>✅ {completedCount} xong</span>
          <span>⭐ {completedCount * 3} sao</span>
        </div>
      </div>
      {/* Chapters as topic cards */}
      {chapters.map(ch => {
        const chLessons = lessons.slice(ch.start, ch.end);
        const chCompleted = chLessons.filter(l => progress.completed[l.id]).length;
        const chProgress = Math.round((chCompleted / (chLessons.length || 1)) * 100);
        const isExpanded = expandedChapters[ch.id];

        return (
          <div key={ch.id} style={{ marginBottom: '14px' }}>
            <button className="card topic-card" onClick={() => toggleChapter(ch.id)} style={{ width: '100%' }}>
              <div className="topic-icon" style={{ background: ch.id === 1 ? '#e8f5e9' : ch.id === 2 ? '#fff3e0' : '#fce4ec' }}>
                {ch.icon}
              </div>
              <div>
                <b>{ch.title}</b>
                <small>{chCompleted}/{chLessons.length} bài · {chProgress}%</small>
              </div>
              <div className="progress-ring" style={{ '--p': chProgress + '%' }}>
                <span>{chProgress}%</span>
              </div>
            </button>

            {isExpanded && (
              <div className="card lesson-list chapter-lessons-desktop-grid" style={{ marginTop: '8px', padding: '12px' }}>
                {chLessons.map((lesson, idx) => {
                  const originalIndex = ch.start + idx;
                  const complete = progress.completed[lesson.id];
                  const unlocked = isUnlocked(originalIndex);
                  return (
                    <button
                      key={lesson.id}
                      className="lesson-item"
                      onClick={() => openLesson(originalIndex)}
                      disabled={!unlocked}
                      style={{ opacity: unlocked ? 1 : 0.5 }}
                    >
                      <div className="li" style={{ background: unlocked ? (lesson.color || '#f0edff') : '#f1f3f5' }}>
                        {unlocked ? lesson.icon : '🔒'}
                      </div>
                      <div>
                        <b>{originalIndex + 1}. {lesson.shortTitle}</b>
                        <small>{lesson.skill}</small>
                      </div>
                      <div className={`stars-mini${complete ? '' : ' off'}`}>
                        {[0, 1, 2].map(s => <span key={s}>{complete && s < complete.stars ? '⭐' : '☆'}</span>)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  )
}

function LessonView(props) {
  const { 
    lesson, step, feedback, setFeedback, hintOpen, setHintOpen, hearts, 
    validateStep, nextStep, speakStory, onBack, isAnswered,
    progress, hintUnlockedForCurrentStep, setHintUnlockedForCurrentStep,
    showHintConfirm, setShowHintConfirm, setHearts, setMistakes, audioSettings,
    stepConfettiActive, cooldownActive, stepStartTime, setProgress
  } = props;

  const [storyExpanded, setStoryExpanded] = useState(false);
  const hasFeedback = Boolean(feedback);
  const isCorrect = feedback?.correct;

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Avoid triggering when focused inside an input if input already handles Enter
      if (e.key === 'Enter') {
        if (showHintConfirm) return;
        if (!hasFeedback && isAnswered && !cooldownActive) {
          e.preventDefault();
          validateStep();
        } else if (hasFeedback) {
          e.preventDefault();
          if (isCorrect) {
            nextStep();
          } else {
            playClick();
            setFeedback(null);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasFeedback, isCorrect, isAnswered, cooldownActive, showHintConfirm, validateStep, nextStep, setFeedback]);

  if (!lesson) {
    return (
      <div className="lesson-page" style={{ textAlign: 'center', padding: '48px 16px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 16px' }}></div>
        <p style={{ fontWeight: '800', color: '#64748b' }}>Đang tải nội dung bài học...</p>
      </div>
    );
  }

  const isChallenge = isChallengeModeActive(progress, lesson);

  const activeSteps = getActiveSteps(progress.studyMode || 'full', lesson);
  const currentStepIdx = activeSteps.indexOf(step);
  const progressPercent = activeSteps.length > 0 ? ((currentStepIdx + 1) / activeSteps.length) * 100 : 0;

  function handleConfirmHint() {
    playClick();
    triggerHaptic('light');
    setShowHintConfirm(false);
    setHearts((h) => Math.max(0, h - 1));
    setMistakes((m) => m + 1);
    setHintUnlockedForCurrentStep(true);
    setHintOpen(true);
    const elapsed = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 0;
    if (setProgress) {
      setProgress(old => updateBehavioralMetrics(old, 'hint_opened', { latency: elapsed, step }));
    }
    if (!audioSettings?.muted && audioSettings?.autoRead) {
      playMascotReaction({
        mascotId: mascot,
        category: 'hint',
        fallbackText: 'Có ngay gợi ý đây! Con hãy đọc kỹ manh mối này nhé!'
      });
    }
  }

  const mascot = progress?.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;

  return (
    <div className="lesson-page">
      {stepConfettiActive && <ConfettiCanvas active={true} />}
      <div className="practice-top">
        <button className="icon-btn" onClick={() => { playClick(); onBack(); }} aria-label="Quay lại danh sách bài học">←</button>
        <div className="practice-top-center">
          <div className="practice-progress-bar">
            <div className="practice-progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <div className="practice-step-indicator">
            <span className="step-title-text">{lesson.shortTitle}</span>
            <span className="step-count-badge">Bước {currentStepIdx + 1}/{activeSteps.length}</span>
          </div>
        </div>
        {isChallenge && <span className="challenge-badge">⚡ Thử thách</span>}
        <button 
          className={`hint-button ${hintOpen ? 'active' : ''}`} 
          onClick={() => {
            playClick();
            triggerHaptic('light');
            if (isChallenge) {
              if (hintUnlockedForCurrentStep) {
                setHintOpen((open) => !open);
              } else {
                if (hearts <= 0) {
                  speakText("Con đã hết ❤️, hãy tự suy nghĩ hoặc bắt đầu lại bài nhé!", resolveSpeechRate(audioSettings.speed));
                } else {
                  setShowHintConfirm(true);
                }
              }
            } else {
              setHintOpen((open) => {
                const nextVal = !open;
                if (nextVal) {
                  const elapsed = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 0;
                  if (setProgress) {
                    setProgress(old => updateBehavioralMetrics(old, 'hint_opened', { latency: elapsed, step }));
                  }
                }
                return nextVal;
              });
            }
          }}
          aria-label="Xem gợi ý"
        >
          💡
        </button>
        <div className="hearts-display" title={`Còn ${hearts} trái tim`}>
          {[...Array(3)].map((_, i) => <span key={i} className={`heart-icon ${i < hearts ? 'alive' : 'dead'}`}>{i < hearts ? '❤️' : '🤍'}</span>)}
        </div>
      </div>

      <div className="lesson-layout">
        <div className="steps-sidebar-col">
          <ol className="steps-list">
            {activeSteps.map((stepNum, idx) => {
              const [icon, label] = STEP_LABELS[stepNum];
              const isActive = step === stepNum;
              const isDone = activeSteps.indexOf(step) > idx;
              return (
                <li key={label} className={isActive ? 'active' : isDone ? 'done' : ''}>
                  <span>{isDone ? '✓' : idx + 1}</span><i>{icon}</i><b>{label}</b>
                </li>
              );
            })}
          </ol>
          <div className="mascot-step-companion card desktop-only">
            <span className="companion-emoji">{profile.emoji}</span>
            <div className="companion-bubble">
              <b>{profile.name} đồng hành:</b>
              <p>Đọc kỹ câu hỏi và làm từng bước con nhé!</p>
            </div>
          </div>
        </div>

        <section className="exercise-card">
          <div className="story-box-wrapper">
            <div className={`story-box ${step > 0 && !storyExpanded ? 'compact' : ''}`}>
              <div className="story-main-row">
                <button className="sound-button" onClick={speakStory} aria-label="Đọc đề bài">🔊</button>
                <p className="story-text">{lesson.story}</p>
                <span className="story-emoji">{lesson.icon}</span>
              </div>
              {step > 0 && (
                <button 
                  className="story-toggle-btn" 
                  onClick={() => { playClick(); setStoryExpanded(prev => !prev); }}
                  aria-label={storyExpanded ? "Thu gọn đề bài" : "Xem toàn bộ đề bài"}
                >
                  {storyExpanded ? "Thu gọn đề ▴" : "Xem lại đề bài ▾"}
                </button>
              )}
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

          {/* Docked Action Bar inside Exercise Card for Desktop */}
          <div className={`integrated-action-bar ${hasFeedback ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''}`}>
            {hasFeedback ? (
              <div className="feedback-banner">
                <span className="feedback-icon">{isCorrect ? '🎉' : '🌱'}</span>
                <div className="feedback-text">
                  <b>{`${MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'} ${MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.name || 'Cú Ú'}:`}</b>
                  <p>{feedback.message}</p>
                </div>
                <button 
                  className="speech-mini-btn feedback-speech" 
                  onClick={() => {
                    const mName = progress.profile?.mascot || 'owl';
                    const mProf = MASCOT_PROFILES[mName] || MASCOT_PROFILES.owl;
                    const baseRate = resolveSpeechRate(audioSettings.speed);
                    speakText(feedback.message, baseRate * (mProf.rateOffset || 1.0), null, null, mProf.pitch || 1.0);
                  }}
                  aria-label="Đọc phản hồi"
                >
                  🔊
                </button>
              </div>
            ) : null}

            <div className="action-buttons-row">
              {!hasFeedback ? (
                <>
                  <button className="secondary-button footer-back" onClick={() => { playClick(); onBack(); }}>Quay lại</button>
                  <button className="primary-button footer-submit" onClick={validateStep} disabled={!isAnswered || cooldownActive}>
                    {cooldownActive ? 'Đang tải lại...' : 'Kiểm tra'}
                    <span className="kbd-shortcut-pill desktop-only">Enter ↵</span>
                  </button>
                </>
              ) : isCorrect ? (
                <button className="primary-button footer-next" onClick={nextStep} autoFocus>
                  {activeSteps.indexOf(step) === activeSteps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'} →
                  <span className="kbd-shortcut-pill desktop-only">Enter ↵</span>
                </button>
              ) : (
                <button className="primary-button footer-next" onClick={() => { playClick(); setFeedback(null); }} autoFocus>
                  Thử lại
                  <span className="kbd-shortcut-pill desktop-only">Enter ↵</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Floating mobile footer (hidden on desktop via CSS) */}
      <div className={`lesson-footer mobile-only-footer ${hasFeedback ? (isCorrect ? 'footer-correct' : 'footer-wrong') : ''}`}>
        <div className="footer-content">
          {hasFeedback ? (
            <div className="feedback-banner">
              <span className="feedback-icon">{isCorrect ? '🎉' : '🌱'}</span>
              <div className="feedback-text">
                <b>{`${MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'} ${MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.name || 'Cú Ú'}:`}</b>
                <p>{feedback.message}</p>
              </div>
              <button 
                className="speech-mini-btn feedback-speech" 
                onClick={() => {
                  const mascot = progress.profile?.mascot || 'owl';
                  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
                  const baseRate = resolveSpeechRate(audioSettings.speed);
                  speakText(feedback.message, baseRate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0);
                }}
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
                <button className="primary-button footer-submit" onClick={validateStep} disabled={!isAnswered || cooldownActive}>{cooldownActive ? 'Đang tải lại...' : 'Kiểm tra'}</button>
              </>
            ) : isCorrect ? (
              <button className="primary-button footer-next" onClick={nextStep} autoFocus>
                {activeSteps.indexOf(step) === activeSteps.length - 1 ? 'Hoàn thành' : 'Tiếp theo'} →
              </button>
            ) : (
              <button className="primary-button footer-next" onClick={() => { playClick(); setFeedback(null); }} autoFocus>
                Thử lại
              </button>
            )}
          </div>
        </div>
      </div>

      {showHintConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3>💡 Dùng Gợi Ý Bằng ❤️</h3>
            <p>
              Mở gợi ý ở bước này sẽ tiêu hao của con <strong>1 ❤️</strong>.<br/>
              Con có đồng ý đổi ❤️ lấy gợi ý không?
            </p>
            {hearts === 1 && (
              <div className="warning-text">
                ⚠️ Chú ý: Con chỉ còn 1 ❤️. Nếu dùng gợi ý con sẽ hết ❤️ và phải làm lại bài từ đầu!
              </div>
            )}
            <div className="confirm-modal-actions" style={{ marginTop: '20px' }}>
              <button className="btn-confirm btn-friendly" onClick={handleConfirmHint}>Đồng ý</button>
              <button className="btn-cancel" onClick={() => { playClick(); setShowHintConfirm(false); }}>Hủy</button>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}

function StepContent({ lesson, step, selected, setSelected, secondSelected, setSecondSelected, factAnswers, setFactAnswers, numberAnswer, setNumberAnswer, feedback }) {
  const frozen = Boolean(feedback?.correct)
  if (step === 0) return <UnderstandStep key={lesson.id} lesson={lesson} />
  if (step === 1) return <OptionQuestion title="Câu chuyện này có thể kể lại thế nào?" options={lesson.retellOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
  if (step === 2) return <FactsStep lesson={lesson} answers={factAnswers} setAnswers={setFactAnswers} frozen={frozen} />
  if (step === 3) return <ModelStep lesson={lesson} selected={selected} setSelected={setSelected} frozen={frozen} />
  if (step === 4) return <OperationStep lesson={lesson} selected={selected} setSelected={setSelected} secondSelected={secondSelected} setSecondSelected={setSecondSelected} frozen={frozen} />
  if (step === 5) return <CalculationStep lesson={lesson} value={numberAnswer} setValue={setNumberAnswer} frozen={frozen} />
  if (step === 6) return <OptionQuestion title="Chọn câu trả lời đầy đủ nhất" options={lesson.answerOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
  return <OptionQuestion title={lesson.checkQuestion} options={lesson.checkOptions} selected={selected} setSelected={setSelected} frozen={frozen} />
}

function EmojiRow({ emoji, count, max = 12, crossed = false }) {
  const visibleCount = Math.min(Math.max(0, Number(count) || 0), max)
  if (visibleCount === 0) {
    return <div className="emoji-row emoji-row-empty"><span className="count-badge">{count}</span></div>
  }
  return (
    <div className={`emoji-row ${crossed ? 'emoji-crossed' : ''}`}>
      {Array.from({ length: visibleCount }, (_, i) => (
        <span key={i} className={crossed ? 'emoji-item crossed' : 'emoji-item'}>{emoji}</span>
      ))}
      {count > max && <span className="count-more">+{count - max}</span>}
    </div>
  )
}

function GroupsVisual({ groups, perGroup, emoji }) {
  const g = Math.min(Math.max(1, Number(groups) || 1), 6)
  const p = Math.min(Math.max(1, Number(perGroup) || 1), 8)
  return (
    <div className="groups-visual">
      {Array.from({ length: g }, (_, gi) => (
        <div key={gi} className="mini-group">
          <div className="emoji-row tight">
            {Array.from({ length: p }, (_, pi) => <span key={pi}>{emoji}</span>)}
          </div>
          <small>×{perGroup}</small>
        </div>
      ))}
    </div>
  )
}

function UnderstandStep({ lesson }) {
  const v = lesson.visual || {}
  const type = v.type || 'add'
  const emoji = v.emoji || lesson.icon || '⭐'
  const beforeLabel = v.beforeLabel || 'Ban đầu'
  const changeLabel = v.changeLabel || 'Thay đổi'
  const resultLabel = v.resultLabel || 'Cần tìm?'
  const skill = lesson.skill || ''

  // 9 Interactive Visual States
  const [averageEqual, setAverageEqual] = useState(false)
  const [cutMode, setCutMode] = useState(null) // 'cut' (cắt số lớn) or 'add' (bù số bé) or null
  const [showOneUnit, setShowOneUnit] = useState(false)
  const [unitStep, setUnitStep] = useState(0) // 0: all, 1: 1 unit, 2: target units
  const [fractionSlider, setFractionSlider] = useState(3) // 3/8
  const [gridFilled, setGridFilled] = useState(false)
  const [cashRegisterPaid, setCashRegisterPaid] = useState(false)
  const [multistepStep, setMultistepStep] = useState(0) // active ladder step

  // Additional 7 Math Problem Types States
  const [plantingStep, setPlantingStep] = useState(0)
  const [showIntervals, setShowIntervals] = useState(false)
  const [sequencePairStep, setSequencePairStep] = useState(0)
  const [geoTab, setGeoTab] = useState('single')
  const [highlightedShapeIdx, setHighlightedShapeIdx] = useState(-1)
  const [ageOffset, setAgeOffset] = useState(0)
  const [motionRunning, setMotionRunning] = useState(false)
  const [activeFormulaHide, setActiveFormulaHide] = useState(null)
  const [logicGridMatrix, setLogicGridMatrix] = useState({})
  const [activeClueIdx, setActiveClueIdx] = useState(-1)
  const [chartShowValues, setChartShowValues] = useState(false)
  const [chartLeveled, setChartLeveled] = useState(false)
  const [pictoMultiply, setPictoMultiply] = useState(false)

  const thinkByType = {
    add: 'Số lượng đang tăng — hai phần sẽ gộp thành một tổng.',
    remove: 'Có thứ bị lấy đi — số còn lại sẽ nhỏ hơn ban đầu.',
    join: 'Hai phần cùng loại đứng cạnh nhau — gộp lại thành tổng.',
    parts: 'Biết cả hộp và một phần — phần kia đang “ẩn”.',
    compare: 'Hai số đặt cạnh nhau — tìm khoảng cách (hơn / kém).',
    groups: 'Các nhóm giống hệt nhau — nghĩ đến phép nhân.',
    divide: 'Một tổng được chia đều — mỗi phần bằng nhau.',
    reverse: 'Biết kết thúc, tìm lúc mở đầu — đi ngược phép tính.',
    scale: '“Gấp mấy lần” ≠ “thêm mấy” — lặp lại cả đoạn nhiều lần.',
    mixed: 'Có hơn một hành động — làm lần lượt từng bước.',
    timeline: 'Thời gian chạy trên trục — nhảy tới mốc tròn cho dễ.',
    measure: 'Đổi về cùng đơn vị trước, rồi mới cộng hoặc trừ.'
  }

  // Determine dynamic visual helper text based on interaction
  const getThinkingGuidance = () => {
    if (skill === 'Trung bình cộng') {
      const values = v.values || [15, 9, 12]
      const sum = values.reduce((a, b) => a + b, 0)
      const avg = sum / values.length
      const unit = lesson.unit || 'đơn vị'
      return averageEqual 
        ? `San đều: Mỗi bạn sẽ có ${avg} ${unit} bằng nhau!` 
        : `Hãy bấm "San đều ${unit} 🔄" để thấy chiều cao các cột bằng nhau thế nào nhé.`
    }
    if (skill === 'Tổng và Hiệu') {
      const big = v.big || 50
      const small = v.small || 35
      const diff = v.diff || 15
      const unit = lesson.unit || 'kg'
      if (cutMode === 'cut') return `Cắt bớt phần hơn: Tổng giảm còn ${big + small} - ${diff} = ${small * 2} ${unit}. Hai phần bằng nhau có giá trị: ${small * 2} ÷ 2 = ${small} ${unit}.`
      if (cutMode === 'add') return `Thêm phần thiếu: Tổng tăng thành ${big + small} + ${diff} = ${big * 2} ${unit}. Hai phần bằng nhau có giá trị: ${big * 2} ÷ 2 = ${big} ${unit}.`
      return 'Bấm chọn "Bớt hiệu ✂️" hoặc "Bù hiệu ➕" để đưa sơ đồ về dạng hai đoạn bằng nhau.'
    }
    if (skill === 'Tổng và Tỉ số') {
      const smallPart = v.smallPart || 1
      const bigPart = v.bigPart || 3
      const total = v.total || 120
      const unit = lesson.unit || 'con'
      const oneUnitVal = total / (smallPart + bigPart)
      return showOneUnit 
        ? `Chia đều: 1 phần có giá trị là ${total} ÷ ${smallPart + bigPart} = ${oneUnitVal} ${unit}!` 
        : 'Hãy bấm "Tính 1 phần 🔍" để xem giá trị của từng ô vuông tỉ lệ.'
    }
    if (skill === 'Hiệu và Tỉ số') {
      const smallPart = v.smallPart || 1
      const bigPart = v.bigPart || 5
      const diff = v.diff || 28
      const unit = lesson.unit || 'tuổi'
      const oneUnitVal = diff / (bigPart - smallPart)
      return showOneUnit 
        ? `Giá trị 1 ô chênh lệch: ${diff} ÷ (${bigPart} - ${smallPart}) = ${oneUnitVal} ${unit}!` 
        : 'Bấm "Tìm giá trị 1 ô 🔍" để lấy hiệu chia cho hiệu số phần.'
    }
    if (skill === 'Rút về đơn vị') {
      const startCount = v.startCount || 5
      const startVal = v.startVal || 40
      const endCount = v.endCount || 7
      const unit = lesson.unit || 'kg'
      const unitVal = startVal / startCount
      if (unitStep === 1) return `Rút về đơn vị: 1 sản phẩm chứa ${startVal} ÷ ${startCount} = ${unitVal} ${unit}.`
      if (unitStep === 2) return `Nhân lên: ${endCount} sản phẩm chứa ${unitVal} × ${endCount} = ${unitVal * endCount} ${unit}!`
      return 'Bấm nút "Xem 1 đơn vị 🍼" để tính giá trị 1 đơn vị trước.'
    }
    if (skill === 'Tìm phân số của một số') {
      const total = v.total || 24
      const denominator = v.denominator || 8
      const factor = total / denominator
      const currentVal = Math.round(factor * fractionSlider)
      return `Bé chọn ${fractionSlider}/${denominator} tổng số: ${currentVal} ${lesson.unit || 'viên'}.`
    }
    if (skill === 'Diện tích hình chữ nhật' || skill === 'Diện tích') {
      const length = v.length || 25
      const width = v.width || 15
      const area = length * width
      return gridFilled 
        ? `Diện tích = Dài × Rộng = ${length} × ${width} = ${area} ${lesson.unit || 'm²'}` 
        : 'Bấm "Lát sàn gạch 🧱" để đếm diện tích bằng ô lưới trực quan.'
    }
    if (skill === 'Tính tiền thừa' || skill.includes('mua bán') || skill.includes('tiền')) {
      const itemCount = v.itemCount || 4
      const itemPrice = v.itemPrice || 7000
      const totalPaid = v.totalPaid || 50000
      const cost = itemCount * itemPrice
      const change = totalPaid - cost
      return cashRegisterPaid 
        ? `Thối tiền = Tiền đưa − Thành tiền = ${totalPaid.toLocaleString()} − ${cost.toLocaleString()} = ${change.toLocaleString()} đồng.` 
        : 'Nhấn "Thanh toán 💳" để xuất hóa đơn và tính tiền thối.'
    }
    if (skill === 'Công việc chung - Nhiều bước' || skill.includes('Nhiều bước')) {
      const steps = v.steps || [
        { label: 'Bậc 1: Tổng số bao gạo', val: '120 bao', text: 'Bước 1: Tính tổng số bao gạo = 3 × 40 = 120 bao.' },
        { label: 'Bậc 2: Tổng khối lượng gạo', val: '6000 kg', text: 'Bước 2: Tính tổng khối lượng gạo = 120 × 50 = 6000 kg.' },
        { label: 'Bậc 3: Số gạo còn lại', val: '5000 kg', text: 'Bước 3: Đổi 1 tấn = 1000 kg. Số gạo còn lại = 6000 − 1000 = 5000 kg!' }
      ]
      if (multistepStep === 1) return steps[0].text
      if (multistepStep === 2) return steps[1].text
      if (multistepStep === 3) return steps[2].text
      return 'Bấm vào từng Bậc thang để mở khóa lời giải cho bài toán nhiều bước.'
    }
    if (skill === 'Trồng cây') {
      const length = v.length || 30
      const interval = v.interval || 5
      const shape = v.shape || 'line'
      const endpoints = v.endpoints || 'both'
      const intervalsCount = Math.round(length / interval)
      let maxTrees = intervalsCount
      if (shape === 'line') {
        if (endpoints === 'both') maxTrees = intervalsCount + 1
        else if (endpoints === 'none') maxTrees = intervalsCount - 1
      }
      return plantingStep > 0
        ? `Trồng cây: Đã trồng ${plantingStep}/${maxTrees} cây trên sơ đồ.`
        : `Bấm "Trồng cây 🌳" hoặc "Đo khoảng cách 📏" để tìm hiểu cấu trúc số cây và số khoảng.`
    }
    if (skill === 'Dãy số') {
      const len = v.numbers ? v.numbers.length : 10
      const countPairs = Math.floor(len / 2)
      if (sequencePairStep > 0) {
        return `Ghép cặp: Đang ghép ${sequencePairStep}/${countPairs} cặp đầu-cuối của dãy số có tổng bằng nhau!`
      }
      return 'Bấm nút để đếm số số hạng hoặc ghép cặp tính nhanh tổng của cả dãy số.'
    }
    if (skill === 'Đếm hình') {
      if (geoTab === 'single') return 'Đang đếm các hình đơn lẻ kích thước nhỏ nhất.'
      if (geoTab.includes('double')) return 'Đang đếm các hình được ghép bởi 2 phần kề nhau.'
      if (geoTab === 'triple') return 'Đang đếm các hình được ghép bởi 3 phần.'
      if (geoTab === 'full') return 'Đang đếm hình ghép toàn bộ mảnh.'
      return 'Chọn từng tab kích thước để đếm hình theo nhóm có hệ thống nhé.'
    }
    if (skill === 'Tính tuổi') {
      const person1 = v.person1 || 'Bố'
      const person2 = v.person2 || 'Con'
      const age1 = v.age1 || 35
      const age2 = v.age2 || 5
      const diff = age1 - age2
      return ageOffset !== 0
        ? `Cỗ máy thời gian: ${ageOffset > 0 ? `Sau ${ageOffset} năm` : `${-ageOffset} năm trước`}, ${person1} ${age1 + ageOffset} tuổi, ${person2} ${age2 + ageOffset} tuổi. Khoảng chênh lệch vẫn là ${diff} tuổi!`
        : `Hiện tại ${person1} hơn ${person2} ${diff} tuổi. Kéo thanh trượt để kiểm tra chênh lệch tuổi trong quá khứ hoặc tương lai.`
    }
    if (skill === 'Chuyển động') {
      const velocity = v.velocity || 60
      const time = v.time || 2
      const distance = v.distance || 120
      if (activeFormulaHide === 'S') return `Quãng đường (S) = Vận tốc (V) × Thời gian (T) = ${velocity} × ${time} = ${distance} km.`
      if (activeFormulaHide === 'V') return `Vận tốc (V) = Quãng đường (S) ÷ Thời gian (T) = ${distance} ÷ ${time} = ${velocity} km/giờ.`
      if (activeFormulaHide === 'T') return `Thời gian (T) = Quãng đường (S) ÷ Vận tốc (V) = ${distance} ÷ ${velocity} = ${time} giờ.`
      return 'Bấm nút "Khởi hành 🏁" để xem xe chạy hoặc che tam giác S-V-T để ôn tập công thức.'
    }
    if (skill === 'Suy luận logic') {
      return activeClueIdx !== -1
        ? `Thám tử phân tích: Dựa vào manh mối "${lesson.hints && lesson.hints[activeClueIdx]}", ta dùng dấu ❌ để loại trừ và ✔️ để khẳng định.`
        : 'Hãy bấm "Gợi ý manh mối" để thám tử hướng dẫn con phân tích logic loại trừ trên bảng.'
    }
    if (skill === 'Biểu đồ') {
      const chartData = v.data || []
      const multiplier = v.multiplier || 5
      const unit = v.unit || 'cây'
      const chartType = v.chartType || 'bar'
      const sum = chartData.reduce((acc, curr) => acc + (chartType === 'pictogram' ? curr.value * multiplier : curr.value), 0)
      const avg = Math.round(sum / (chartData.length || 1))
      if (chartLeveled) {
        return `San đều: Tất cả các cột dữ liệu được cân bằng về mức trung bình cộng là ${avg} ${unit}!`
      }
      if (pictoMultiply) {
        return `Quy đổi: Nhân số lượng hình ảnh với ${multiplier} để tính quả táo thực tế.`
      }
      return chartType === 'bar'
        ? 'Chạm vào cột biểu đồ để hiện số liệu hoặc bấm "San đều dữ liệu" để xem mức trung bình.'
        : 'Nhấp nút "Quy đổi" để nhân hệ số biểu đồ tranh ra giá trị thật.'
    }
    return thinkByType[type] || 'Hãy quan sát hình vẽ để hiểu chuyện gì đang xảy ra.'
  }

  let body
  
  // Render Custom Widgets based on Skill
  if (skill === 'Trung bình cộng') {
    const values = v.values || [15, 9, 12]
    const labels = v.labels || ['An', 'Bình', 'Cường']
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / values.length
    
    // Normalize height mapping
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)
    const heightForVal = (val) => {
      if (maxVal === minVal) return 80
      return 40 + ((val - minVal) / (maxVal - minVal)) * 60
    }

    body = (
      <div className="custom-widget average-widget">
        <div className="average-columns-container">
          {values.map((val, idx) => {
            const h = averageEqual ? heightForVal(avg) : heightForVal(val)
            return (
              <div className="average-col" key={idx}>
                <div className="avg-bar-label">{labels[idx] || `Bạn ${idx + 1}`}</div>
                <div className="avg-bar-visual-wrap">
                  <div className={`avg-bar-fill col-${idx === 0 ? 'hung' : idx === 1 ? 'dung' : 'sang'}`} style={{ height: `${h}px` }}>
                    <span className="avg-number">{averageEqual ? avg : val}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); triggerHaptic('light'); setAverageEqual(prev => !prev); }}>
            {averageEqual ? 'Xem ban đầu ⏪' : `San đều ${lesson.unit || 'cột'} 🔄`}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Tổng và Hiệu') {
    const big = v.big || 50
    const small = v.small || 35
    const diff = v.diff || 15
    const unit = lesson.unit || 'kg'
    const labelBig = v.bigLabel || 'Số lớn'
    const labelSmall = v.smallLabel || 'Số bé'
    
    body = (
      <div className="custom-widget sumdiff-widget">
        <div className="bar-model-container">
          <div className="model-row">
            <span className="row-label">{labelBig}:</span>
            <div className="model-bar-wrap">
              <div className={`model-bar bar-big ${cutMode === 'cut' ? 'contracted' : ''}`}>
                <span>{cutMode === 'cut' ? `${small} ${unit}` : `${big} ${unit}`}</span>
              </div>
              {cutMode !== 'cut' && (
                <div className="model-barbar-diff">
                  <span>+{diff}</span>
                </div>
              )}
            </div>
          </div>
          <div className="model-row">
            <span className="row-label">{labelSmall}:</span>
            <div className="model-bar-wrap">
              <div className={`model-bar bar-small ${cutMode === 'add' ? 'expanded' : ''}`}>
                <span>{cutMode === 'add' ? `${big} ${unit}` : `${small} ${unit}`}</span>
              </div>
              {cutMode === 'add' && (
                <div className="model-barbar-diff added">
                  <span>+{diff}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="widget-controls">
          <button className={`secondary-button ${cutMode === 'cut' ? 'selected' : ''}`} onClick={() => { playClick(); setCutMode(cutMode === 'cut' ? null : 'cut'); }}>
            ✂️ Bớt hiệu (Tìm số bé)
          </button>
          <button className={`secondary-button ${cutMode === 'add' ? 'selected' : ''}`} onClick={() => { playClick(); setCutMode(cutMode === 'add' ? null : 'add'); }}>
            ➕ Bù hiệu (Tìm số lớn)
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Tổng và Tỉ số') {
    const smallPart = v.smallPart || 1
    const bigPart = v.bigPart || 3
    const labelSmall = v.smallLabel || 'Số bé'
    const labelBig = v.bigLabel || 'Số lớn'
    const total = v.total || 120
    const unit = lesson.unit || 'con'
    
    body = (
      <div className="custom-widget ratio-widget">
        <div className="ratio-bars">
          <div className="ratio-row">
            <span className="row-label">{labelSmall} ({smallPart} phần):</span>
            <div className="lego-line">
              {Array.from({ length: smallPart }).map((_, i) => (
                <div key={i} className={`lego-brick ${showOneUnit ? 'highlight-brick' : ''}`}>{labelSmall}</div>
              ))}
            </div>
          </div>
          <div className="ratio-row">
            <span className="row-label">{labelBig} ({bigPart} phần):</span>
            <div className="lego-line">
              {Array.from({ length: bigPart }).map((_, i) => (
                <div key={i} className="lego-brick">{labelBig}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="total-bracket-label">Tổng: {total} {unit} ({smallPart + bigPart} phần bằng nhau)</div>
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setShowOneUnit(prev => !prev); }}>
            {showOneUnit ? 'Ẩn gợi ý ⏪' : 'Tính 1 phần 🔍'}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Hiệu và Tỉ số') {
    const smallPart = v.smallPart || 1
    const bigPart = v.bigPart || 5
    const labelSmall = v.smallLabel || 'Số bé'
    const labelBig = v.bigLabel || 'Số lớn'
    const diff = v.diff || 28
    const unit = lesson.unit || 'tuổi'
    
    body = (
      <div className="custom-widget ratio-widget">
        <div className="ratio-bars">
          <div className="ratio-row">
            <span className="row-label">{labelSmall} ({smallPart} phần):</span>
            <div className="lego-line">
              {Array.from({ length: smallPart }).map((_, i) => (
                <div key={i} className={`lego-brick ${showOneUnit ? 'highlight-brick' : ''}`}>{labelSmall}</div>
              ))}
            </div>
          </div>
          <div className="ratio-row">
            <span className="row-label">{labelBig} ({bigPart} phần):</span>
            <div className="lego-line">
              {Array.from({ length: smallPart }).map((_, i) => (
                <div key={i} className="lego-brick">{labelBig}</div>
              ))}
              {Array.from({ length: bigPart - smallPart }).map((_, i) => (
                <div key={i} className={`lego-brick outline-brick ${showOneUnit ? 'highlight-brick' : ''}`}>+{i + 1}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="total-bracket-label highlight-text">Hiệu số phần: {bigPart} − {smallPart} = {bigPart - smallPart} phần chênh lệch (= {diff} {unit})</div>
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setShowOneUnit(prev => !prev); }}>
            {showOneUnit ? 'Ẩn gợi ý ⏪' : 'Tìm giá trị 1 ô 🔍'}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Rút về đơn vị') {
    const startCount = v.startCount || 5
    const startVal = v.startVal || 40
    const endCount = v.endCount || 7
    const emoji = v.emoji || '🌾'
    const unit = lesson.unit || 'kg'
    const unitVal = startVal / startCount
    const endVal = unitVal * endCount
    const noun = v.noun || 'bao gạo'
    const targetNoun = v.targetNoun || 'bao như thế'
    
    body = (
      <div className="custom-widget unitary-widget">
        <div className="factory-display">
          <div className="factory-shelf">
            <b>Ban đầu: {startCount} {noun}</b>
            <div className="factory-items">
              {Array.from({ length: Math.min(startCount, 10) }).map((_, i) => (
                <span key={i} className={`factory-item ${unitStep >= 1 ? 'highlight-item' : ''}`}>{emoji}</span>
              ))}
            </div>
            <small>= {startVal} {unit}</small>
          </div>
          
          {unitStep >= 1 && (
            <div className="factory-shelf accent-shelf">
              <b>Bước 1: Rút về 1 {noun}</b>
              <div className="factory-items">
                <span className="factory-item highlight-item animated-pulse">{emoji}</span>
              </div>
              <small>= {unitVal} {unit}</small>
            </div>
          )}

          {unitStep >= 2 && (
            <div className="factory-shelf result-shelf">
              <b>Bước 2: Hỏi {endCount} {targetNoun}</b>
              <div className="factory-items">
                {Array.from({ length: Math.min(endCount, 10) }).map((_, i) => (
                  <span key={i} className="factory-item">{emoji}</span>
                ))}
              </div>
              <small>= {endVal} {unit}</small>
            </div>
          )}
        </div>
        
        <div className="widget-controls">
          {unitStep === 0 && (
            <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setUnitStep(1); }}>🍼 Xem 1 {noun}</button>
          )}
          {unitStep === 1 && (
            <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setUnitStep(2); }}>🚛 Tính {endCount} {noun}</button>
          )}
          {unitStep === 2 && (
            <button className="secondary-button" onClick={() => { playClick(); setUnitStep(0); }}>Quay lại ⏪</button>
          )}
        </div>
      </div>
    )
  } else if (skill === 'Tìm phân số của một số') {
    const total = v.total || 24
    const denominator = v.denominator || 8
    const factor = total / denominator
    const emoji = v.emoji || '🍬'
    const unit = lesson.unit || 'viên bi'
    
    body = (
      <div className="custom-widget fraction-widget">
        <div className="chocolate-bar" style={{ display: 'grid', gridTemplateColumns: `repeat(${denominator}, 1fr)`, gap: '4px' }}>
          {Array.from({ length: denominator }).map((_, idx) => (
            <div key={idx} className={`chocolate-segment ${idx < fractionSlider ? 'segment-active' : ''}`} style={{ border: '2px solid #ccc', borderRadius: '4px', textAlign: 'center', padding: '6px 0', fontSize: '20px', backgroundColor: idx < fractionSlider ? '#ffe082' : '#f5f5f5' }}>
              {emoji}
            </div>
          ))}
        </div>
        <div className="fraction-label">
          <b>Phân số đã chọn: {fractionSlider}/{denominator}</b>
          <p>Tương đương: {fractionSlider} phần × {factor} = {Math.round(fractionSlider * factor)} {unit}.</p>
        </div>
        <div className="fraction-slider-control">
          <input
            type="range"
            min="1"
            max={denominator}
            value={fractionSlider}
            onChange={(e) => { playClick(); setFractionSlider(Number(e.target.value)); }}
          />
        </div>
      </div>
    )
  } else if (skill === 'Diện tích hình chữ nhật' || skill === 'Diện tích') {
    const width = v.width || 15
    const length = v.length || 25
    const emoji = v.emoji || '🏠'
    const gridRows = v.gridRows || 3
    const gridCols = v.gridCols || 5
    
    body = (
      <div className="custom-widget grid-widget">
        <div className="geometry-grid-container">
          <div className="geometry-grid-y-label">Chiều rộng: {width} m</div>
          <div className="grid-visual-matrix">
            {Array.from({ length: gridRows }).map((_, r) => (
              <div key={r} className="grid-visual-row">
                {Array.from({ length: gridCols }).map((_, c) => (
                  <div key={c} className={`grid-visual-cell ${gridFilled ? 'filled' : ''}`}>
                    {emoji}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="geometry-grid-x-label">Chiều dài: {length} m</div>
        
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setGridFilled(prev => !prev); }}>
            {gridFilled ? 'Xem lưới trống ⏪' : 'Lát sàn gạch 🧱'}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Tính tiền thừa' || skill.includes('tiền') || skill.includes('mua bán')) {
    const itemName = v.itemName || 'Quyển vở'
    const itemCount = v.itemCount || 4
    const itemPrice = v.itemPrice || 7000
    const totalPaid = v.totalPaid || 50000
    const cost = itemCount * itemPrice
    const change = totalPaid - cost
    
    body = (
      <div className="custom-widget cashregister-widget">
        <div className="receipt-paper">
          <h4 className="receipt-header">🧾 HÓA ĐƠN TOÁN VUI</h4>
          <div className="receipt-line"><span>{itemCount} {itemName} x {itemPrice.toLocaleString()}đ</span><b>{cost.toLocaleString()}đ</b></div>
          <div className="receipt-divider" />
          <div className="receipt-line"><span>Khách đưa:</span><b>{totalPaid.toLocaleString()}đ</b></div>
          {cashRegisterPaid && (
            <>
              <div className="receipt-line text-green"><span>Tiền thối lại:</span><b>{change.toLocaleString()}đ</b></div>
              <div className="receipt-footer">Cảm ơn con đã mua hàng! 🦉</div>
            </>
          )}
        </div>
        
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setCashRegisterPaid(prev => !prev); }}>
            {cashRegisterPaid ? 'Hủy giao dịch ⏪' : 'Thanh toán 💳'}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Công việc chung - Nhiều bước' || skill.includes('Nhiều bước') || skill.includes('hai bước')) {
    const steps = v.steps || [
      { label: 'Bậc 1: Tổng số bao gạo', val: '120 bao' },
      { label: 'Bậc 2: Tổng khối lượng gạo', val: '6000 kg' },
      { label: 'Bậc 3: Số gạo còn lại', val: '5000 kg' }
    ]
    
    body = (
      <div className="custom-widget multistep-widget">
        <div className="multistep-ladder">
          {steps.slice().reverse().map((step, idx) => {
            const stepNum = steps.length - idx
            return (
              <button key={idx} className={`ladder-step step-${stepNum} ${multistepStep >= stepNum ? 'active' : ''}`} onClick={() => { playClick(); setMultistepStep(stepNum); }}>
                <span>{step.label}</span>
                {multistepStep >= stepNum && <b>{step.val}</b>}
              </button>
            )
          })}
        </div>
        <div className="widget-controls">
          <button className="secondary-button" onClick={() => { playClick(); setMultistepStep(0); }}>Đặt lại ⏪</button>
        </div>
      </div>
    )
  } else if (skill === 'Trồng cây' || v.type === 'planting') {
    const length = v.length || 30
    const interval = v.interval || 5
    const shape = v.shape || 'line'
    const endpoints = v.endpoints || 'both'
    const emoji = v.emoji || '🌳'
    const unit = v.unit || 'm'
    const intervalsCount = Math.round(length / interval)
    let maxTrees = intervalsCount
    if (shape === 'line') {
      if (endpoints === 'both') maxTrees = intervalsCount + 1
      else if (endpoints === 'none') maxTrees = intervalsCount - 1
    }
    const startPlanting = () => {
      setPlantingStep(0)
      let current = 0
      const timer = setInterval(() => {
        current += 1
        if (current <= maxTrees) {
          setPlantingStep(current)
          playClick()
        } else {
          clearInterval(timer)
        }
      }, 300)
    }
    body = (
      <div className="custom-widget planting-widget">
        <div className={`planting-area ${shape}`}>
          {shape === 'line' ? (
            <div className="planting-road">
              <div className="road-line" />
              <div className="trees-container">
                {Array.from({ length: maxTrees }).map((_, idx) => {
                  let positionPercent = 0
                  if (maxTrees > 1) {
                    if (endpoints === 'both') {
                      positionPercent = (idx / (maxTrees - 1)) * 100
                    } else if (endpoints === 'one') {
                      positionPercent = (idx / maxTrees) * 100
                    } else if (endpoints === 'none') {
                      positionPercent = ((idx + 1) / (maxTrees + 1)) * 100
                    }
                  }
                  return (
                    <div 
                      key={idx} 
                      className={`planted-tree-wrapper ${idx < plantingStep ? 'visible' : ''}`}
                      style={{ left: `${positionPercent}%` }}
                    >
                      <span className="tree-emoji">{emoji}</span>
                      <small className="tree-index">{idx + 1}</small>
                    </div>
                  )
                })}
              </div>
              {showIntervals && (
                <div className="intervals-container">
                  {Array.from({ length: intervalsCount }).map((_, idx) => {
                    const widthPercent = 100 / intervalsCount
                    const leftPercent = idx * widthPercent
                    return (
                      <div 
                        key={idx} 
                        className="interval-measure-cung"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      >
                        <span className="interval-line-arc" />
                        <span className="interval-text">{interval}{unit}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="planting-pond-container">
              <div className={`pond-shape ${shape}`}>
                <div className="pond-water">Ao</div>
              </div>
              <div className="pond-trees">
                {Array.from({ length: maxTrees }).map((_, idx) => {
                  const angle = (idx / maxTrees) * 2 * Math.PI
                  const radius = 60
                  const x = 70 + radius * Math.cos(angle)
                  const y = 70 + radius * Math.sin(angle)
                  return (
                    <div 
                      key={idx} 
                      className={`planted-tree-wrapper circular ${idx < plantingStep ? 'visible' : ''}`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                    >
                      <span className="tree-emoji">{emoji}</span>
                      <small className="tree-index">{idx + 1}</small>
                    </div>
                  )
                })}
              </div>
              {showIntervals && (
                <div className="pond-intervals-label">
                  Chu vi: {length}m gồm {intervalsCount} khoảng {interval}m
                </div>
              )}
            </div>
          )}
        </div>
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={startPlanting}>
            🌳 Trồng cây ({maxTrees} cây)
          </button>
          <button className="secondary-button" onClick={() => { playClick(); setShowIntervals(prev => !prev); }}>
            {showIntervals ? 'Ẩn khoảng cách ⏪' : 'Đo khoảng cách 📏'}
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Dãy số' || v.type === 'sequence') {
    const numbers = v.numbers || [2, 4, 6, 8, 10, 12, 14, 16, 18, 20]
    const pairs = []
    const len = numbers.length
    for (let i = 0; i < Math.floor(len / 2); i++) {
      pairs.push({
        firstIdx: i,
        lastIdx: len - 1 - i,
        firstVal: numbers[i],
        lastVal: numbers[len - 1 - i],
        sum: numbers[i] + numbers[len - 1 - i]
      })
    }
    body = (
      <div className="custom-widget sequence-widget">
        <div className="sequence-row">
          {numbers.map((num, idx) => {
            let pairColorClass = ''
            if (sequencePairStep > 0) {
              const pairIdx = pairs.findIndex(p => p.firstIdx === idx || p.lastIdx === idx)
              if (pairIdx !== -1 && pairIdx < sequencePairStep) {
                const colors = ['pair-red', 'pair-green', 'pair-blue', 'pair-orange', 'pair-purple']
                pairColorClass = colors[pairIdx % colors.length]
              }
            }
            return (
              <div key={idx} className={`sequence-step-card ${pairColorClass}`}>
                <span className="step-num-val">{num}</span>
                <small className="step-num-idx">Số {idx + 1}</small>
              </div>
            )
          })}
        </div>
        {sequencePairStep > 0 && pairs.length > 0 && (
          <div className="sequence-pairs-list animate-pop">
            <h5 className="pairs-title">Kết quả ghép cặp:</h5>
            <div className="pairs-grid">
              {pairs.slice(0, sequencePairStep).map((pair, idx) => (
                <div key={idx} className="pair-match-row">
                  <span>Cặp {idx + 1}: {pair.firstVal} + {pair.lastVal} = </span>
                  <b>{pair.sum}</b>
                </div>
              ))}
            </div>
            {len % 2 !== 0 && sequencePairStep >= Math.floor(len / 2) && (
              <div className="mid-number-note">
                Số ở chính giữa đứng một mình: <b>{numbers[Math.floor(len / 2)]}</b>
              </div>
            )}
          </div>
        )}
        <div className="widget-controls">
          <button className="primary-button btn-widget-interact" onClick={() => {
            playClick()
            if (sequencePairStep >= pairs.length) {
              setSequencePairStep(0)
            } else {
              setSequencePairStep(prev => prev + 1)
            }
          }}>
            {sequencePairStep >= pairs.length ? 'Nhập lại ⏪' : `Ghép cặp tiếp theo 🤝 (${sequencePairStep}/${pairs.length})`}
          </button>
          <button className="secondary-button" onClick={() => { playClick(); setSequencePairStep(pairs.length); }}>
            Ghép toàn bộ ⚡
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Đếm hình' || v.type === 'geometry-count') {
    const shapeType = v.shapeType || 'line-segments'
    const points = v.points || 4
    const cols = v.cols || 2
    const rows = v.rows || 2
    const piecesCount = v.piecesCount || 3
    body = (
      <div className="custom-widget geometry-widget">
        <div className="geometry-svg-container">
          {shapeType === 'line-segments' ? (
            <svg viewBox="0 0 300 80" className="geometry-svg">
              <line x1="20" y1="40" x2="280" y2="40" stroke="#94a3b8" strokeWidth="4" />
              {Array.from({ length: points }).map((_, idx) => {
                const x = 20 + (260 / (points - 1)) * idx
                const labels = ['A', 'C', 'D', 'B', 'E', 'F']
                const label = labels[idx] || `P${idx + 1}`
                return (
                  <g key={idx}>
                    <circle cx={x} cy="40" r="6" fill="#1e293b" />
                    <text x={x} y="25" textAnchor="middle" fontWeight="800" fontSize="14">{label}</text>
                  </g>
                )
              })}
              {(() => {
                if (geoTab === 'all') return null
                const stepCount = geoTab === 'single' ? 1 : geoTab === 'double' ? 2 : 3
                const activeSegments = []
                for (let i = 0; i <= points - 1 - stepCount; i++) {
                  activeSegments.push({ start: i, end: i + stepCount })
                }
                if (highlightedShapeIdx !== -1 && activeSegments[highlightedShapeIdx]) {
                  const seg = activeSegments[highlightedShapeIdx]
                  const x1 = 20 + (260 / (points - 1)) * seg.start
                  const x2 = 20 + (260 / (points - 1)) * seg.end
                  return (
                    <line x1={x1} y1="40" x2={x2} y2="40" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" opacity="0.8" />
                  )
                }
                return null
              })()}
            </svg>
          ) : shapeType === 'triangle' ? (
            <svg viewBox="0 0 200 150" className="geometry-svg triangle-svg">
              <polygon points="100,10 20,130 180,130" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
              {Array.from({ length: piecesCount - 1 }).map((_, idx) => {
                const ratio = (idx + 1) / piecesCount
                const bottomX = 20 + 160 * ratio
                return (
                  <line key={idx} x1="100" y1="10" x2={bottomX} y2="130" stroke="#94a3b8" strokeWidth="2" />
                )
              })}
              {(() => {
                if (geoTab === 'all') return null
                const stepCount = geoTab === 'single' ? 1 : geoTab === 'double' ? 2 : 3
                const triangles = []
                for (let i = 0; i <= piecesCount - stepCount; i++) {
                  triangles.push({ start: i, end: i + stepCount })
                }
                if (highlightedShapeIdx !== -1 && triangles[highlightedShapeIdx]) {
                  const t = triangles[highlightedShapeIdx]
                  const xLeft = 20 + (160 / piecesCount) * t.start
                  const xRight = 20 + (160 / piecesCount) * t.end
                  const pointsStr = `100,10 ${xLeft},130 ${xRight},130`
                  return (
                    <polygon points={pointsStr} fill="#f59e0b" opacity="0.4" stroke="#d97706" strokeWidth="3" />
                  )
                }
                return null
              })()}
              {Array.from({ length: piecesCount }).map((_, idx) => {
                const ratioCenter = (idx + 0.5) / piecesCount
                const cx = 20 + 160 * ratioCenter
                const cy = 100
                return (
                  <text key={idx} x={cx} y={cy} textAnchor="middle" fontWeight="bold" fill="#64748b" fontSize="12">{idx + 1}</text>
                )
              })}
            </svg>
          ) : (
            <div className="rectangle-grid-count">
              <div 
                className="grid-matrix" 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gridTemplateRows: `repeat(${rows}, 1fr)`,
                  gap: '4px',
                  width: '180px',
                  height: '120px',
                  margin: '0 auto',
                  background: '#cbd5e1',
                  padding: '4px',
                  borderRadius: '6px'
                }}
              >
                {Array.from({ length: rows * cols }).map((_, idx) => {
                  const r = Math.floor(idx / cols)
                  const c = idx % cols
                  let isHighlighted = false
                  if (geoTab !== 'all' && highlightedShapeIdx !== -1) {
                    const items = []
                    if (geoTab === 'single') {
                      for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols; j++) {
                          items.push({ r1: i, r2: i, c1: j, c2: j })
                        }
                      }
                    } else if (geoTab === 'double-h') {
                      for (let i = 0; i < rows; i++) {
                        for (let j = 0; j < cols - 1; j++) {
                          items.push({ r1: i, r2: i, c1: j, c2: j + 1 })
                        }
                      }
                    } else if (geoTab === 'double-v') {
                      for (let i = 0; i < rows - 1; i++) {
                        for (let j = 0; j < cols; j++) {
                          items.push({ r1: i, r2: i + 1, c1: j, c2: j })
                        }
                      }
                    } else if (geoTab === 'full') {
                      items.push({ r1: 0, r2: rows - 1, c1: 0, c2: cols - 1 })
                    }
                    const it = items[highlightedShapeIdx]
                    if (it && r >= it.r1 && r <= it.r2 && c >= it.c1 && c <= it.c2) {
                      isHighlighted = true
                    }
                  }
                  return (
                    <div 
                      key={idx} 
                      className={`grid-piece-cell ${isHighlighted ? 'highlighted' : ''}`}
                      style={{ 
                        background: isHighlighted ? '#fde047' : '#f8fafc',
                        border: isHighlighted ? '2px solid #eab308' : '1px solid #e2e8f0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '800',
                        color: '#475569',
                        minHeight: '40px'
                      }}
                    >
                      {idx + 1}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="geometry-tabs">
          {shapeType === 'line-segments' && (
            <>
              <button className={geoTab === 'single' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('single'); setHighlightedShapeIdx(0); }}>Đoạn đơn (3) 🟥</button>
              <button className={geoTab === 'double' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('double'); setHighlightedShapeIdx(0); }}>Ghép 2 (2) 🟧</button>
              <button className={geoTab === 'triple' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('triple'); setHighlightedShapeIdx(0); }}>Ghép 3 (1) 🟨</button>
            </>
          )}
          {shapeType === 'triangle' && (
            <>
              <button className={geoTab === 'single' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('single'); setHighlightedShapeIdx(0); }}>Hình đơn (3) 🟥</button>
              <button className={geoTab === 'double' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('double'); setHighlightedShapeIdx(0); }}>Ghép 2 (2) 🟧</button>
              <button className={geoTab === 'triple' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('triple'); setHighlightedShapeIdx(0); }}>Ghép 3 (1) 🟨</button>
            </>
          )}
          {shapeType === 'rectangle' && (
            <>
              <button className={geoTab === 'single' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('single'); setHighlightedShapeIdx(0); }}>Đơn (4) 🟥</button>
              <button className={geoTab === 'double-h' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('double-h'); setHighlightedShapeIdx(0); }}>Ghép 2 Ngang (2) 🟧</button>
              <button className={geoTab === 'double-v' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('double-v'); setHighlightedShapeIdx(0); }}>Ghép 2 Dọc (2) 🟨</button>
              <button className={geoTab === 'full' ? 'active' : ''} onClick={() => { playClick(); setGeoTab('full'); setHighlightedShapeIdx(0); }}>Ghép 4 (1) 🟩</button>
            </>
          )}
        </div>
        {geoTab !== 'all' && (
          <div className="geometry-navigator">
            {(() => {
              let limit = 0
              if (shapeType === 'line-segments' || shapeType === 'triangle') {
                limit = geoTab === 'single' ? 3 : geoTab === 'double' ? 2 : 1
              } else if (shapeType === 'rectangle') {
                limit = geoTab === 'single' ? 4 : geoTab === 'double-h' ? 2 : geoTab === 'double-v' ? 2 : 1
              }
              return (
                <div className="navigator-controls">
                  <button 
                    disabled={highlightedShapeIdx <= 0}
                    className="secondary-button"
                    onClick={() => { playClick(); setHighlightedShapeIdx(p => p - 1); }}
                  >
                    ◀ Trước
                  </button>
                  <span style={{ margin: '0 12px', fontWeight: 'bold' }}>Hình {highlightedShapeIdx + 1} / {limit}</span>
                  <button 
                    disabled={highlightedShapeIdx >= limit - 1}
                    className="secondary-button"
                    onClick={() => { playClick(); setHighlightedShapeIdx(p => p + 1); }}
                  >
                    Sau ▶
                  </button>
                </div>
              )
            })()}
          </div>
        )}
      </div>
    )
  } else if (skill === 'Tính tuổi' || v.type === 'age-machine') {
    const person1 = v.person1 || 'Bố'
    const person2 = v.person2 || 'Con'
    const age1 = v.age1 || 35
    const age2 = v.age2 || 5
    const diff = age1 - age2
    const currentAge1 = age1 + ageOffset
    const currentAge2 = age2 + ageOffset
    body = (
      <div className="custom-widget age-widget">
        <div className="age-bars-container">
          <div className="age-row">
            <span className="age-label"><b>{person1}</b> ({currentAge1}t):</span>
            <div className="age-bar-wrapper">
              <div 
                className="age-bar bar-p1" 
                style={{ width: `${Math.min(100, (currentAge1 / 70) * 100)}%`, backgroundColor: '#3b82f6', height: '24px', borderRadius: '6px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', paddingLeft: '8px', transition: 'width 0.3s ease' }}
              >
                <span>{currentAge1}</span>
              </div>
            </div>
          </div>
          <div className="age-row" style={{ marginTop: '12px' }}>
            <span className="age-label"><b>{person2}</b> ({currentAge2}t):</span>
            <div className="age-bar-wrapper" style={{ position: 'relative' }}>
              <div 
                className="age-bar bar-p2" 
                style={{ width: `${Math.min(100, (currentAge2 / 70) * 100)}%`, backgroundColor: '#10b981', height: '24px', borderRadius: '6px', color: '#fff', fontWeight: 'bold', display: 'flex', alignItems: 'center', paddingLeft: '8px', transition: 'width 0.3s ease' }}
              >
                <span>{currentAge2}</span>
              </div>
              <div 
                className="age-gap-marker"
                style={{ 
                  position: 'absolute',
                  left: `${(currentAge2 / 70) * 100}%`,
                  width: `${(diff / 70) * 100}%`,
                  height: '24px',
                  border: '2px dashed #eab308',
                  background: '#fef08a80',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#854d0e',
                  top: '0',
                  transition: 'left 0.3s ease'
                }}
              >
                <span>Hiệu: {diff} tuổi (Không đổi) 🔒</span>
              </div>
            </div>
          </div>
        </div>
        <div className="age-slider-control" style={{ marginTop: '24px', textAlign: 'center' }}>
          <div className="slider-labels" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '8px' }}>
            <span>⏮️ 10 năm trước</span>
            <span style={{ color: '#1e293b', fontSize: '14px' }}><b>Cỗ Máy Thời Gian: {ageOffset === 0 ? 'Hiện nay' : ageOffset > 0 ? `Sau ${ageOffset} năm` : `Trước ${-ageOffset} năm`}</b></span>
            <span>20 năm sau ⏭️</span>
          </div>
          <input 
            type="range"
            min="-10"
            max="20"
            value={ageOffset}
            style={{ width: '100%' }}
            onChange={(e) => { playClick(); setAgeOffset(Number(e.target.value)); }}
          />
        </div>
      </div>
    )
  } else if (skill === 'Chuyển động' || v.type === 'motion') {
    const vehicle = v.vehicle || '🚗'
    const velocity = v.velocity || 60
    const time = v.time || 2
    const distance = v.distance || 120
    const isMultiChặng = v.bikeDist != null
    body = (
      <div className="custom-widget motion-widget">
        <div className="motion-track-container" style={{ height: '60px', background: '#334155', borderRadius: '12px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <div className="road-stripes" style={{ position: 'absolute', width: '100%', borderTop: '2px dashed #cbd5e1', top: '50%' }} />
          <div 
            className="motion-vehicle"
            style={{ 
              position: 'absolute',
              fontSize: '32px',
              transition: motionRunning ? 'left 4s linear' : 'left 0.5s ease',
              left: motionRunning ? '85%' : '5%'
            }}
          >
            <span>{vehicle}</span>
          </div>
        </div>
        <div className="motion-formulas-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div className="formula-triangle-widget" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div className="tri-layer layer-top" style={{ marginBottom: '8px' }}>
              <button 
                className={`tri-btn ${activeFormulaHide === 'S' ? 'hidden-value' : ''}`}
                style={{ background: activeFormulaHide === 'S' ? '#f59e0b' : '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                onClick={() => { playClick(); setActiveFormulaHide(activeFormulaHide === 'S' ? null : 'S'); }}
              >
                {activeFormulaHide === 'S' ? '❓ Quãng đường (S)' : 'S (Quãng đường)'}
              </button>
            </div>
            <div className="tri-layer layer-bottom" style={{ display: 'flex', gap: '8px' }}>
              <button 
                className={`tri-btn ${activeFormulaHide === 'V' ? 'hidden-value' : ''}`}
                style={{ background: activeFormulaHide === 'V' ? '#f59e0b' : '#10b981', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                onClick={() => { playClick(); setActiveFormulaHide(activeFormulaHide === 'V' ? null : 'V'); }}
              >
                {activeFormulaHide === 'V' ? '❓ Vận tốc (V)' : 'V (Vận tốc)'}
              </button>
              <button 
                className={`tri-btn ${activeFormulaHide === 'T' ? 'hidden-value' : ''}`}
                style={{ background: activeFormulaHide === 'T' ? '#f59e0b' : '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
                onClick={() => { playClick(); setActiveFormulaHide(activeFormulaHide === 'T' ? null : 'T'); }}
              >
                {activeFormulaHide === 'T' ? '❓ Thời gian (T)' : 'T (Thời gian)'}
              </button>
            </div>
          </div>
          <div className="formula-explanation-box" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '100px' }}>
            {activeFormulaHide === 'S' && (
              <div style={{ textAlign: 'center' }}>
                <b style={{ color: '#3b82f6' }}>Tìm Quãng đường (S):</b>
                <p style={{ margin: '6px 0', fontSize: '18px', fontWeight: 'bold' }}>S = V × T</p>
                <small style={{ color: '#64748b' }}>Lấy Vận tốc nhân với Thời gian.</small>
              </div>
            )}
            {activeFormulaHide === 'V' && (
              <div style={{ textAlign: 'center' }}>
                <b style={{ color: '#10b981' }}>Tìm Vận tốc (V):</b>
                <p style={{ margin: '6px 0', fontSize: '18px', fontWeight: 'bold' }}>V = S ÷ T</p>
                <small style={{ color: '#64748b' }}>Lấy Quãng đường chia cho Thời gian.</small>
              </div>
            )}
            {activeFormulaHide === 'T' && (
              <div style={{ textAlign: 'center' }}>
                <b style={{ color: '#ec4899' }}>Tìm Thời gian (T):</b>
                <p style={{ margin: '6px 0', fontSize: '18px', fontWeight: 'bold' }}>T = S ÷ V</p>
                <small style={{ color: '#64748b' }}>Lấy Quãng đường chia cho Vận tốc.</small>
              </div>
            )}
            {!activeFormulaHide && (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                Bài này: S = {distance} km, V = {velocity} km/h, T = {time} giờ.
                <br />
                Chạm vào các ô trong tam giác trái để mở công thức ẩn!
              </div>
            )}
          </div>
        </div>
        {isMultiChặng && (
          <div className="multi-stage-indicator" style={{ marginTop: '16px', background: '#fef08a', padding: '10px 14px', borderRadius: '8px', border: '1px solid #fef08a', fontSize: '12px', fontWeight: 'bold', color: '#854d0e', lineHeight: '1.6' }}>
            Chặng 1 (Xe đạp): {v.bikeDist}km ÷ {v.bikeV}km/h = <b>{v.bikeDist/v.bikeV} giờ</b>.
            <br />
            Chặng 2 (Đi bộ): {v.walkDist}km ÷ {v.walkV}km/h = <b>{v.walkDist/v.walkV} giờ</b>.
          </div>
        )}
        <div className="widget-controls" style={{ marginTop: '20px' }}>
          <button className="primary-button btn-widget-interact" onClick={() => {
            playClick()
            setMotionRunning(false)
            setTimeout(() => setMotionRunning(true), 50)
          }}>
            🏁 Khởi hành
          </button>
          <button className="secondary-button" onClick={() => { playClick(); setMotionRunning(false); }}>
            Đặt lại ⏪
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Suy luận logic' || v.type === 'logic-grid') {
    const rows = v.rows || ['An', 'Bình', 'Cường']
    const cols = v.cols || ['Đỏ', 'Xanh', 'Vàng']
    const handleCellClick = (rIdx, cIdx) => {
      playClick()
      const nextMatrix = { ...logicGridMatrix }
      const key = `${rIdx}-${cIdx}`
      const currentVal = nextMatrix[key] || 0
      nextMatrix[key] = (currentVal + 1) % 3
      setLogicGridMatrix(nextMatrix)
    }
    const getCellSymbol = (rIdx, cIdx) => {
      const val = logicGridMatrix[`${rIdx}-${cIdx}`] || 0
      if (val === 1) return '❌'
      if (val === 2) return '✔️'
      return ''
    }
    const autoSolveClue = () => {
      playClick()
      const clues = lesson.hints || []
      const nextClueIdx = activeClueIdx + 1
      if (nextClueIdx < clues.length) {
        setActiveClueIdx(nextClueIdx)
        const nextMatrix = { ...logicGridMatrix }
        if (lesson.id === 'lesson-53') {
          if (nextClueIdx === 0) {
            nextMatrix['1-2'] = 2
            nextMatrix['1-0'] = 1
            nextMatrix['1-1'] = 1
            nextMatrix['0-2'] = 1
            nextMatrix['2-2'] = 1
          } else if (nextClueIdx === 1) {
            nextMatrix['0-0'] = 1
          } else if (nextClueIdx >= 2) {
            nextMatrix['0-1'] = 2
            nextMatrix['2-0'] = 2
            nextMatrix['2-1'] = 1
          }
        } else {
          const solution = v.solution || {}
          rows.forEach((r, rI) => {
            cols.forEach((c, cI) => {
              if (solution[r] === c) {
                if (nextClueIdx >= 2) nextMatrix[`${rI}-${cI}`] = 2
              } else {
                if (nextClueIdx >= 1) nextMatrix[`${rI}-${cI}`] = 1
              }
            })
          })
        }
        setLogicGridMatrix(nextMatrix)
      } else {
        setActiveClueIdx(-1)
        setLogicGridMatrix({})
      }
    }
    body = (
      <div className="custom-widget logic-widget">
        <div style={{ overflowX: 'auto' }}>
          <table className="logic-grid-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', margin: '10px 0', border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>Thám tử</th>
                {cols.map((col) => <th key={col} style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={row}>
                  <td style={{ padding: '8px', border: '1px solid #cbd5e1', fontWeight: 'bold', background: '#f8fafc' }}>{row}</td>
                  {cols.map((col, cIdx) => {
                    const symbol = getCellSymbol(rIdx, cIdx)
                    return (
                      <td 
                        key={col} 
                        style={{ padding: '8px', border: '1px solid #cbd5e1', fontSize: '20px', cursor: 'pointer', minWidth: '50px', background: symbol === '❌' ? '#fee2e2' : symbol === '✔️' ? '#dcfce7' : '#fff' }}
                        onClick={() => handleCellClick(rIdx, cIdx)}
                      >
                        {symbol}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="logic-hints-box" style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>Chạm vào các ô trong bảng để đánh dấu: Trống ➜ ❌ (Sai) ➜ ✔️ (Đúng)</p>
          {activeClueIdx !== -1 && (
            <div className="active-clue-card animate-pop" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '8px', color: '#1e40af', marginTop: '12px', fontSize: '12px' }}>
              🔍 <b>Manh mối {activeClueIdx + 1}:</b>
              <p style={{ margin: '4px 0 0 0' }}>{(lesson.hints && lesson.hints[activeClueIdx]) || 'Hãy phân tích bảng và suy luận loại trừ.'}</p>
            </div>
          )}
        </div>
        <div className="widget-controls" style={{ marginTop: '20px' }}>
          <button className="primary-button btn-widget-interact" onClick={autoSolveClue}>
            {activeClueIdx === -1 ? '🔍 Xem Manh mối 1' : activeClueIdx + 1 < (lesson.hints?.length || 4) ? `🔍 Manh mối tiếp theo (${activeClueIdx + 1})` : 'Đặt lại bảng ⏪'}
          </button>
          <button className="secondary-button" onClick={() => { playClick(); setLogicGridMatrix({}); setActiveClueIdx(-1); }}>
            Xóa bảng 🧹
          </button>
        </div>
      </div>
    )
  } else if (skill === 'Biểu đồ' || v.type === 'chart-analysis') {
    const chartType = v.chartType || 'bar'
    const chartData = v.data || []
    const multiplier = v.multiplier || 5
    const unit = v.unit || 'cây'
    const sum = chartData.reduce((acc, curr) => acc + (chartType === 'pictogram' ? curr.value * multiplier : curr.value), 0)
    const avg = Math.round(sum / (chartData.length || 1))
    const maxVal = Math.max(...chartData.map(d => chartType === 'pictogram' ? d.value * multiplier : d.value))
    body = (
      <div className="custom-widget chart-widget">
        {chartType === 'bar' ? (
          <div className="bar-chart-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div className="chart-bars-wrap" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', height: '140px', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
              {chartData.map((d, idx) => {
                const currentVal = chartLeveled ? avg : d.value
                const heightPercent = (currentVal / maxVal) * 90
                const colors = ['#60a5fa', '#34d399', '#f87171', '#fb7185', '#a78bfa']
                return (
                  <div key={idx} className="chart-bar-column" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '60px' }}>
                    <div className="bar-visual-wrapper" style={{ height: '110px', width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <div 
                        className="chart-column-bar"
                        style={{ 
                          height: `${Math.max(5, heightPercent)}%`,
                          width: '28px',
                          background: colors[idx % colors.length],
                          borderRadius: '4px 4px 0 0',
                          position: 'relative',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          transition: 'height 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          cursor: 'pointer'
                        }}
                        onClick={() => { playClick(); setChartShowValues(prev => !prev); }}
                      >
                        {chartShowValues && (
                          <span style={{ position: 'absolute', top: '-22px', background: '#1e293b', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '2px 4px', borderRadius: '4px' }}>
                            {currentVal}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="column-label" style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginTop: '6px' }}>{d.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="pictogram-container" style={{ background: '#fff', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            {chartData.map((d, idx) => (
              <div key={idx} className="picto-row" style={{ display: 'flex', alignItems: 'center', margin: '8px 0' }}>
                <span className="picto-row-label" style={{ width: '80px', fontWeight: 'bold', fontSize: '13px' }}>{d.label}:</span>
                <div className="picto-apples" style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: d.value }).map((_, i) => (
                    <span 
                      key={i} 
                      className="picto-apple-icon" 
                      style={{ fontSize: '24px', cursor: 'pointer' }}
                      onClick={() => { playClick(); setPictoMultiply(prev => !prev); }}
                    >
                      🍎
                    </span>
                  ))}
                </div>
                <span style={{ marginLeft: '12px', fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>
                  = {pictoMultiply ? d.value * multiplier : d.value} {pictoMultiply ? unit : 'hình'}
                </span>
              </div>
            ))}
            <div className="picto-multiplier-legend" style={{ marginTop: '16px', background: '#f8fafc', padding: '8px 12px', borderRadius: '6px', border: '1px dashed #cbd5e1', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
              🔑 Chú thích: 1 hình 🍎 = <b>{multiplier} {unit}</b>. Bấm vào quả táo để quy đổi!
            </div>
          </div>
        )}
        <div className="widget-controls" style={{ marginTop: '20px' }}>
          {chartType === 'bar' ? (
            <>
              <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setChartLeveled(prev => !prev); }}>
                {chartLeveled ? 'Hiện ban đầu ⏪' : 'San đều cột (Trung bình) 📊'}
              </button>
              <button className="secondary-button" onClick={() => { playClick(); setChartShowValues(prev => !prev); }}>
                {chartShowValues ? 'Ẩn số liệu 🤫' : 'Hiện số liệu 🔢'}
              </button>
            </>
          ) : (
            <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setPictoMultiply(prev => !prev); }}>
              {pictoMultiply ? 'Hiện số hình ảnh 🖼️' : `Quy đổi ra ${unit} 🍎`}
            </button>
          )}
        </div>
      </div>
    )
  } else {
    // FALLBACK: default visual layout for Lessons 1 - 32
    const midSymbol = type === 'join' || type === 'add' || type === 'parts' ? '+' : '→'
    
    if (type === 'groups' || type === 'scale') {
      body = (
        <div className="visual-story visual-groups-layout">
          <div className="visual-group">
            <b>{beforeLabel}</b>
            <GroupsVisual groups={v.before} perGroup={Math.min(v.change, 8)} emoji={emoji} />
            <small>{v.before} nhóm</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="visual-group accent">
            <b>{changeLabel}</b>
            <div className="big-number-hint">× {v.change}</div>
            <small>mỗi nhóm {v.change}</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box" title={resultLabel}>
            <span>?</span>
            <small>{resultLabel}</small>
          </div>
        </div>
      )
    } else if (type === 'compare') {
      body = (
        <div className="visual-story visual-compare-layout">
          <div className="visual-group">
            <b>{beforeLabel}</b>
            <EmojiRow emoji={emoji} count={v.before} max={12} />
            <small>{v.before}</small>
            <div className="compare-bar" style={{ width: `${Math.min(100, (v.before / Math.max(v.before, v.change, 1)) * 100)}%` }} />
          </div>
          <div className="story-arrow">vs</div>
          <div className="visual-group accent">
            <b>{changeLabel}</b>
            <EmojiRow emoji={emoji} count={v.change} max={12} />
            <small>{v.change}</small>
            <div className="compare-bar short" style={{ width: `${Math.min(100, (v.change / Math.max(v.before, v.change, 1)) * 100)}%` }} />
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box" title={resultLabel}>
            <span>?</span>
            <small>{resultLabel}</small>
          </div>
        </div>
      )
    } else if (type === 'remove') {
      body = (
        <div className="visual-story">
          <div className="visual-group">
            <b>{beforeLabel}</b>
            <EmojiRow emoji={emoji} count={v.before} max={12} />
            <small>{v.before}</small>
          </div>
          <div className="story-arrow">−</div>
          <div className="visual-group accent">
            <b>{changeLabel}</b>
            <EmojiRow emoji={emoji} count={v.change} max={8} crossed />
            <small>{v.change}</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box" title={resultLabel}>
            <span>?</span>
            <small>{resultLabel}</small>
          </div>
        </div>
      )
    } else if (type === 'divide') {
      body = (
        <div className="visual-story">
          <div className="visual-group">
            <b>{beforeLabel}</b>
            <EmojiRow emoji={emoji} count={v.before} max={12} />
            <small>{v.before}</small>
          </div>
          <div className="story-arrow">÷</div>
          <div className="visual-group accent">
            <b>{changeLabel}</b>
            <div className="big-number-hint">{v.change}</div>
            <small>phần / nhóm</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box" title={resultLabel}>
            <span>?</span>
            <small>{resultLabel}</small>
          </div>
        </div>
      )
    } else {
      body = (
        <div className="visual-story">
          <div className="visual-group">
            <b>{beforeLabel}</b>
            <EmojiRow emoji={emoji} count={v.before} max={12} />
            <small>{v.before}</small>
          </div>
          <div className="story-arrow">{midSymbol}</div>
          <div className="visual-group accent">
            <b>{changeLabel}</b>
            <EmojiRow emoji={v.emoji2 || emoji} count={v.change} max={8} />
            <small>{v.change}{v.extra != null ? ` · thêm ${v.extra}` : ''}</small>
          </div>
          <div className="story-arrow">→</div>
          <div className="unknown-box" title={resultLabel}>
            <span>?</span>
            <small>{resultLabel}</small>
          </div>
        </div>
      )
    }
  }

  if (v.distractor) {
    body = (
      <>
        {body}
        <div className="distractor-chip">🪄 Thông tin thừa: {v.distractor}</div>
      </>
    )
  }

  return (
    <div>
      <SectionHeading num="1" title="Nhìn câu chuyện bằng hình" desc="Quan sát sơ đồ trực quan diễn tả câu chuyện." />
      {body}
      <div className="think-box">
        <span className="think-icon">💡</span>
        <div className="think-text">
          <b>Mascot khuyên con suy nghĩ:</b>
          <p>{getThinkingGuidance()}</p>
        </div>
      </div>
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
              onClick={() => { playClick(); triggerHaptic('light'); setSelected(index); }}
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
        desc="Thông tin nào đề đã cho? Thông tin nào đang hỏi?" 
        textToSpeak="Bước 3: Đã biết hay cần tìm? Thông tin nào đề đã cho? Thông tin nào đang hỏi?" 
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
              <button disabled={frozen} className={answers[index] === 'known' ? 'selected' : ''} onClick={() => { playClick(); triggerHaptic('light'); setRole(index, 'known'); }}>✓ Đã biết</button>
              <button disabled={frozen} className={answers[index] === 'unknown' ? 'selected' : ''} onClick={() => { playClick(); triggerHaptic('light'); setRole(index, 'unknown'); }}>? Cần tìm</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function modelIconFor(label, index) {
  const t = (label || '').toLowerCase()
  if (t.includes('trục') || t.includes('thời gian')) return '📏'
  if (t.includes('so sánh') || t.includes('thanh') || t.includes('chênh')) return '⚖️'
  if (t.includes('nhóm') || t.includes('bằng nhau') || t.includes('mảng') || t.includes('hàng')) return '▦'
  if (t.includes('chia') || t.includes('phần bằng')) return '➗'
  if (t.includes('bớt') || t.includes('trừ') || t.includes('còn')) return '➖'
  if (t.includes('gộp') || t.includes('tổng') || t.includes('ghép') || t.includes('cộng') || t.includes('nối')) return '➕'
  if (t.includes('ngược')) return '🔄'
  if (t.includes('đồng hồ')) return '⏰'
  if (t.includes('bảng')) return '📋'
  if (t.includes('cạnh') || t.includes('chu vi') || t.includes('hình')) return '⬜'
  const fallback = ['🗺️', '🧩', '📐', '📊']
  return fallback[index % fallback.length]
}

function ModelStep({ lesson, selected, setSelected, frozen }) {
  return (
    <div>
      <SectionHeading
        num="4"
        title="Chọn mô hình phù hợp"
        desc="Hình nào “kể lại” đúng câu chuyện trong đề?"
        textToSpeak="Bước 4: Chọn mô hình phù hợp. Hình nào kể lại đúng câu chuyện trong đề?"
      />
      <div className="model-grid">
        {lesson.models.map((model, index) => (
          <div key={model} className="model-wrapper">
            <button
              disabled={frozen}
              className={selected === index ? 'model-card selected' : 'model-card'}
              onClick={() => { playClick(); setSelected(index); }}
            >
              <span className="model-emoji">{modelIconFor(model, index)}</span>
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
        desc="Đúng phép tính chưa đủ — hãy nói được vì sao." 
        textToSpeak="Bước 5: Chọn phép tính và giải thích. Đúng phép tính chưa đủ — hãy nói được vì sao." 
      />
      <h3 className="mini-title">Phép tính nào khớp câu chuyện?</h3>
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
      <div className="scratch-row"><span>🧮</span><p>Mẹo: tách số tròn chục, cộng/trừ nhẩm, hoặc làm ngược để kiểm tra.</p></div>
    </div>
  )
}
function CompleteView({ lesson, mistakes, progress, setProgress, plan, onHome, onOpenLesson, _lessonIndex, getMascotEmotion, showToast }) {
  const stars = mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1

  const hasNext = plan?.primary && plan.primary.lesson.id !== lesson.id
  const onNext = () => {
    if (plan?.primary) {
      onOpenLesson(plan.primary.index)
    }
  }

  const currentMode = progress?.studyMode || 'full';
  
  const completedThreeStarCount = useMemo(() => {
    if (!progress?.completed) return 0;
    return Object.values(progress.completed).filter(done => (done.stars || done.bestStars) === 3).length;
  }, [progress]);

  const [nudgeMode, setNudgeMode] = useState(null);

  useEffect(() => {
    if (mistakes === 0) {
      if (currentMode === 'full' && completedThreeStarCount >= 3) {
        setNudgeMode('express');
      } else if (currentMode === 'express' && completedThreeStarCount >= 6) {
        setNudgeMode('pro');
      }
    }
  }, [currentMode, completedThreeStarCount, mistakes]);

  function handleAcceptNudge() {
    if (!nudgeMode) return;
    playClick();
    playSfx('sparkle', isMutedGlobal);
    setProgress(old => {
      const updated = {
        ...old,
        studyMode: nudgeMode
      };
      setStoredItem(STORAGE_KEY_PROGRESS, JSON.stringify(updated), STORAGE_KEY_PROGRESS_LEGACY);
      return updated;
    });
    if (showToast) {
      showToast(`Đã chuyển sang Chế độ ${nudgeMode === 'express' ? 'Rút gọn ⚡' : 'Siêu tốc 🚀'} thành công!`, "🎉", "success");
    }
    setNudgeMode(null);
  }

  function handleDeclineNudge() {
    playClick();
    setNudgeMode(null);
  }

  return (
    <div className="overlay show" style={{ zIndex: 99 }}>
      <div className="sheet compact">
        <div className="cele">
          <div className="burst">🎊</div>
          <h2>Hoàn thành bài học!</h2>
          <p>Con không chỉ tìm ra đáp án, mà còn biết giải thích cách suy nghĩ.</p>
          
          <div className="stars-row">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < stars ? 'on' : ''}>⭐</span>
            ))}
          </div>

          <div className="result-grid">
            <div className="card">
              <span>🧠</span>
              <b>+{80 + stars * 10}</b>
              <small>Tư duy</small>
            </div>
            <div className="card">
              <span>🌱</span>
              <b>{mistakes}</b>
              <small>Lần tự sửa</small>
            </div>
            <div className="card">
              <span>{lesson.icon}</span>
              <b style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>{lesson.skill}</b>
              <small>Kỹ năng</small>
            </div>
          </div>

          {nudgeMode && (() => {
            const nudgeMascot = progress.profile?.mascot || 'owl';
            const nudgeProfile = MASCOT_PROFILES[nudgeMascot] || MASCOT_PROFILES.owl;
            const nudgeEmoji = getMascotEmotion ? getMascotEmotion(nudgeMascot) : nudgeProfile.emoji;
            return (
              <div className="card" style={{ padding: '12px', margin: '12px 0', textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '32px' }}>{nudgeEmoji}</span>
                  <div style={{ flex: 1 }}>
                    <b style={{ fontSize: '13px' }}>{nudgeProfile.name} khuyên con:</b>
                    <p style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 700, lineHeight: 1.4, margin: '4px 0 10px' }}>
                      {nudgeMode === 'express' 
                        ? 'Con giải toán rất nhanh! Chuyển sang Chế độ Rút gọn (5 bước) nhé?' 
                        : 'Con học siêu đỉnh! Thử Chế độ Siêu tốc (3 bước) nhé?'}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary btn-sm" onClick={handleAcceptNudge}>
                        {nudgeMode === 'express' ? 'Rút gọn ⚡' : 'Siêu tốc 🚀'}
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={handleDeclineNudge}>Giữ nguyên</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'grid', gap: '8px', marginTop: '16px' }}>
            {hasNext && (
              <button className="btn btn-primary btn-block" onClick={() => { playClick(); onNext(); }}>
                Bài tiếp theo →
              </button>
            )}
            <button className="btn btn-ghost btn-block" onClick={() => { playClick(); onHome(); }}>
              Về hành trình
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const ONBOARDING_TEST_QUESTIONS_BY_GRADE = {
  'grade-1': [
    {
      id: 1,
      story: "Vy có 3 quả táo đỏ. Mẹ cho Vy thêm 2 quả táo nữa. Hỏi Vy có tất cả bao nhiêu quả táo?",
      options: ["4 quả táo", "5 quả táo", "6 quả táo"],
      correctIndex: 1,
      difficulty: "easy",
      skill: "Cộng trong phạm vi 10",
      emoji: "🍎"
    },
    {
      id: 2,
      story: "Bé Bo có 7 cái kẹo. Bo ăn mất 3 cái kẹo. Hỏi Bo còn lại bao nhiêu cái kẹo?",
      options: ["4 cái kẹo", "3 cái kẹo", "5 cái kẹo"],
      correctIndex: 0,
      difficulty: "easy",
      skill: "Trừ trong phạm vi 10",
      emoji: "🍬"
    },
    {
      id: 3,
      story: "Trong ổ có 9 quả trứng. Gà mẹ đẻ thêm 5 quả nữa. Hỏi trong ổ có tất cả bao nhiêu quả trứng?",
      options: ["13 quả trứng", "14 quả trứng", "15 quả trứng"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Cộng trong phạm vi 20",
      emoji: "🥚"
    },
    {
      id: 4,
      story: "Vy có 10 bút chì màu. An có ít hơn Vy 3 cái. Hỏi An có bao nhiêu cái bút chì màu?",
      options: ["7 cái", "8 cái", "6 cái"],
      correctIndex: 0,
      difficulty: "hard",
      skill: "So sánh hơn kém",
      emoji: "✏️"
    }
  ],
  'grade-2': [
    {
      id: 1,
      story: "An mua vở hết 28 nghìn đồng, mua bút hết 25 nghìn đồng. Hỏi An mua cả hai hết bao nhiêu nghìn đồng?",
      options: ["43 nghìn đồng", "53 nghìn đồng", "52 nghìn đồng"],
      correctIndex: 1,
      difficulty: "easy",
      skill: "Cộng có nhớ phạm vi 100",
      emoji: "📚"
    },
    {
      id: 2,
      story: "Mỗi đĩa có 5 cái bánh ngọt. Mẹ xếp 4 đĩa bánh như thế. Hỏi có tất cả bao nhiêu cái bánh ngọt?",
      options: ["20 cái bánh", "15 cái bánh", "25 cái bánh"],
      correctIndex: 0,
      difficulty: "medium",
      skill: "Nhân cơ bản (Bảng 5)",
      emoji: "🧁"
    },
    {
      id: 3,
      story: "Cô giáo có 18 viên kẹo dâu. Cô chia đều cho 2 bạn nhỏ. Hỏi mỗi bạn nhận được bao nhiêu viên kẹo?",
      options: ["8 viên kẹo", "9 viên kẹo", "10 viên kẹo"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Chia đều cơ bản",
      emoji: "🍬"
    },
    {
      id: 4,
      story: "Bao gạo thứ nhất nặng 45 kg. Bao thứ hai nhẹ hơn bao thứ nhất 18 kg. Hỏi bao thứ hai nặng bao nhiêu kg?",
      options: ["27 kg", "37 kg", "25 kg"],
      correctIndex: 0,
      difficulty: "hard",
      skill: "Trừ có nhớ phạm vi 100",
      emoji: "🌾"
    }
  ],
  'grade-3': [
    {
      id: 1,
      story: "Một máy làm được 120 cái bánh trong 1 phút. Hỏi trong 3 phút, máy đó làm được bao nhiêu cái bánh?",
      options: ["360 cái bánh", "240 cái bánh", "123 cái bánh"],
      correctIndex: 0,
      difficulty: "easy",
      skill: "Nhân nhiều chữ số",
      emoji: "🏭"
    },
    {
      id: 2,
      story: "Nam lắp ráp được 12 mô hình Lego. Số mô hình của Bo lắp được gấp 3 lần của Nam. Hỏi Bo lắp được bao nhiêu mô hình?",
      options: ["15 mô hình", "36 mô hình", "24 mô hình"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Gấp một số lần",
      emoji: "🧩"
    },
    {
      id: 3,
      story: "Vy mua 5 hộp bánh ngọt, mỗi hộp có 4 cái bánh. Vy đã ăn hết 3 cái bánh. Hỏi Vy còn lại bao nhiêu cái bánh?",
      options: ["17 cái bánh", "23 cái bánh", "12 cái bánh"],
      correctIndex: 0,
      difficulty: "hard",
      skill: "Bài toán 2 bước giải",
      emoji: "🧁"
    },
    {
      id: 4,
      story: "Một mảnh vườn hình chữ nhật có chiều dài 15 mét và chiều rộng 10 mét. Hỏi chu vi vườn hoa đó là bao nhiêu mét?",
      options: ["25 mét", "50 mét", "150 mét"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Chu vi hình chữ nhật",
      emoji: "📐"
    }
  ],
  'grade-4': [
    {
      id: 1,
      story: "Nhà An nuôi 5 chú gà con. Hôm nay mẹ mua thêm 4 chú gà con nữa. Hỏi nhà An có tất cả bao nhiêu chú gà con?",
      options: ["7 chú gà con", "9 chú gà con", "2 chú gà con"],
      correctIndex: 1,
      difficulty: "easy",
      skill: "Phép cộng cơ bản",
      emoji: "🐥"
    },
    {
      id: 2,
      story: "Cô giáo chia đều 24 cái kẹo cho 3 tổ học sinh. Hỏi mỗi tổ nhận được bao nhiêu cái kẹo?",
      options: ["6 cái kẹo", "8 cái kẹo", "12 cái kẹo"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Phép chia đều",
      emoji: "🍬"
    },
    {
      id: 3,
      story: "Bạn Vy gấp được 18 ngôi sao giấy. Bạn Hà gấp được ít hơn bạn Vy 5 ngôi sao. Hỏi cả hai bạn gấp được bao nhiêu ngôi sao giấy?",
      options: ["13 ngôi sao giấy", "23 ngôi sao giấy", "31 ngôi sao giấy"],
      correctIndex: 2,
      difficulty: "medium",
      skill: "So sánh ít hơn",
      emoji: "⭐"
    },
    {
      id: 4,
      story: "Hai anh em gom được 20 vỏ lon để tái chế. Anh gom được nhiều hơn em 4 vỏ lon. Hỏi em gom được bao nhiêu vỏ lon?",
      options: ["12 vỏ lon", "8 vỏ lon", "16 vỏ lon"],
      correctIndex: 1,
      difficulty: "hard",
      skill: "Tìm hai số (Tổng - Hiệu)",
      emoji: "🥫"
    }
  ],
  'grade-5': [
    {
      id: 1,
      story: "Một bình chứa 5/6 lít nước chanh leo. Vy uống hết 1/3 lít nước. Hỏi trong bình còn lại bao nhiêu phần lít nước?",
      options: ["1/2 lít", "1/3 lít", "7/6 lít"],
      correctIndex: 0,
      difficulty: "easy",
      skill: "Phép tính phân số",
      emoji: "🥤"
    },
    {
      id: 2,
      story: "Một chiếc áo len giá gốc là 200 nghìn đồng. Hôm nay cửa hàng giảm giá 15%. Hỏi chiếc áo len được giảm bao nhiêu nghìn đồng?",
      options: ["15 nghìn đồng", "30 nghìn đồng", "185 nghìn đồng"],
      correctIndex: 1,
      difficulty: "medium",
      skill: "Tỉ số phần trăm",
      emoji: "🏷"
    },
    {
      id: 3,
      story: "Vy tự dọn phòng mất 3 giờ, Hà tự dọn mất 6 giờ. Hỏi nếu cả hai bạn cùng dọn dẹp thì mất bao nhiêu giờ sẽ xong?",
      options: ["9 giờ", "2 giờ", "4.5 giờ"],
      correctIndex: 1,
      difficulty: "hard",
      skill: "Công việc chung",
      emoji: "🧹"
    },
    {
      id: 4,
      story: "Một tàu hỏa chạy quãng đường dài 120 km trong thời gian 2.5 giờ. Hỏi vận tốc trung bình của tàu hỏa đó là bao nhiêu km/h?",
      options: ["48 km/h", "50 km/h", "300 km/h"],
      correctIndex: 0,
      difficulty: "medium",
      skill: "Chuyển động nâng cao",
      emoji: "🚂"
    }
  ]
};

function OnboardingView({ setProgress, setView }) {
  const [stage, setStage] = useState('welcome'); // 'welcome' | 'test' | 'assessment'
  const [step, setStep] = useState(1); // 1: Tên con, 2: Chọn lớp, 3: Chọn bạn đồng hành
  const [name, setName] = useState(() => getStoredItem(STORAGE_KEY_NAME, STORAGE_KEY_NAME_LEGACY) || '');
  const [mascot, setMascot] = useState('owl');
  const [selectedGrade, setSelectedGrade] = useState('grade-4');
  const [showAllMascots, setShowAllMascots] = useState(false);
  const [score, setScore] = useState(0);

  const quickNames = ['Minh An', 'Bảo Long', 'Tuệ Lâm', 'Gia Huy'];

  const grades = [
    { id: 'grade-1', label: 'Lớp 1', emoji: '👶', desc: 'Số đếm & Cộng trừ trong phạm vi 10, 100', color: '#f59e0b', bg: '#fef3c7' },
    { id: 'grade-2', label: 'Lớp 2', emoji: '🎒', desc: 'Nhân chia & Toán đố có lời văn', color: '#ef4444', bg: '#fee2e2' },
    { id: 'grade-3', label: 'Lớp 3', emoji: '✏️', desc: 'Bảng cửu chương, Đo lường & Hình học', color: '#f97316', bg: '#ffedd5' },
    { id: 'grade-4', label: 'Lớp 4', emoji: '📐', desc: 'Trung bình cộng, Tổng-Hiệu, Tìm hai số', color: '#3b82f6', bg: '#dbeafe', badge: 'Phổ biến 🔥' },
    { id: 'grade-5', label: 'Lớp 5', emoji: '🚀', desc: 'Phân số, Số thập phân & Chuyển động', color: '#8b5cf6', bg: '#f3e8ff' }
  ];

  const primaryMascotKeys = ['owl', 'robot', 'turtle'];
  const allMascotKeys = Object.keys(MASCOT_PROFILES);
  const displayedMascotKeys = showAllMascots ? allMascotKeys : primaryMascotKeys;

  const currentMascotProfile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const currentGradeObj = grades.find(g => g.id === selectedGrade) || grades[3];

  function handleQuickName(suggestedName) {
    playClick();
    setName(suggestedName);
    setStoredItem(STORAGE_KEY_NAME, suggestedName, STORAGE_KEY_NAME_LEGACY);
  }

  function handleGradeSelect(gradeId) {
    playClick();
    setSelectedGrade(gradeId);
    // Smooth auto-advance to Step 3
    setTimeout(() => {
      setStep(3);
    }, 280);
  }

  function handleDirectStart() {
    playClick();
    const finalName = name.trim() || 'Bạn nhỏ';
    setProgress(old => ({
      ...old,
      onboarded: true,
      currentGrade: selectedGrade,
      xp: old.xp + 50,
      profile: {
        name: finalName,
        mascot: mascot,
        academicLevel: 'Tân binh khởi động',
        startingRecommendation: 'lesson-1'
      }
    }));
    setStoredItem(STORAGE_KEY_NAME, finalName, STORAGE_KEY_NAME_LEGACY);
    setView('home');
  }

  function handleStartChallenge() {
    if (!name.trim()) return;
    playClick();
    setStoredItem(STORAGE_KEY_NAME, name.trim(), STORAGE_KEY_NAME_LEGACY);
    setStage('test');
  }

  if (stage === 'welcome') {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-card onboarding-wizard-card">
          {/* Step Progress Pills */}
          <div className="wizard-progress-bar">
            <div className={`wizard-step-pill ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`} onClick={() => setStep(1)}>
              <span className="step-num">{step > 1 ? '✓' : '1'}</span>
              <span className="step-label">Tên con</span>
            </div>
            <div className="wizard-connector" style={{ background: step >= 2 ? 'var(--primary, #6366f1)' : '#e2e8f0' }} />
            <div className={`wizard-step-pill ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`} onClick={() => name.trim() && setStep(2)}>
              <span className="step-num">{step > 2 ? '✓' : '2'}</span>
              <span className="step-label">Khối lớp</span>
            </div>
            <div className="wizard-connector" style={{ background: step >= 3 ? 'var(--primary, #6366f1)' : '#e2e8f0' }} />
            <div className={`wizard-step-pill ${step >= 3 ? 'active' : ''}`} onClick={() => name.trim() && setStep(3)}>
              <span className="step-num">3</span>
              <span className="step-label">Bạn cố vấn</span>
            </div>
          </div>

          {/* STEP 1: NAME INPUT */}
          {step === 1 && (
            <div className="wizard-step-body animate-fade-in">
              <span className="onboarding-header-emoji">🦉✨</span>
              <h1>Chào bạn nhỏ! Tên của con là gì?</h1>
              <p className="wizard-subtitle">Hãy nhập tên để Cú Ú và các bạn linh vật dễ dàng trò chuyện cùng con nhé!</p>

              <div className="onboarding-input-group">
                <div className="onboarding-input-wrapper">
                  <span className="input-icon">✍️</span>
                  <input
                    id="child-name"
                    type="text"
                    placeholder="Ví dụ: Minh An, Bảo Vy, Gia Huy..."
                    value={name}
                    onChange={e => {
                      const val = e.target.value;
                      setName(val);
                      setStoredItem(STORAGE_KEY_NAME, val, STORAGE_KEY_NAME_LEGACY);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && name.trim()) {
                        playClick();
                        setStep(2);
                      }
                    }}
                    maxLength={20}
                    autoFocus
                  />
                </div>
              </div>

              {/* Quick Pick Chips */}
              <div className="quick-name-box">
                <span className="quick-name-title">💡 Hoặc chọn nhanh:</span>
                <div className="quick-name-chips">
                  {quickNames.map(qName => (
                    <button
                      key={qName}
                      type="button"
                      className={`quick-name-chip ${name === qName ? 'selected' : ''}`}
                      onClick={() => handleQuickName(qName)}
                    >
                      {qName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wizard-actions">
                <button
                  className="onboarding-btn"
                  disabled={!name.trim()}
                  onClick={() => { playClick(); setStep(2); }}
                >
                  Tiếp tục chọn Lớp ➜
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: GRADE SELECTION */}
          {step === 2 && (
            <div className="wizard-step-body animate-fade-in">
              <div className="wizard-top-back">
                <button className="wizard-back-btn" onClick={() => { playClick(); setStep(1); }}>
                  ← Đổi tên
                </button>
              </div>
              <span className="onboarding-header-emoji">🎒📚</span>
              <h1>Con đang học Lớp mấy nè?</h1>
              <p className="wizard-subtitle">Học Toán Vui sẽ chuẩn bị bài học phù hợp nhất với lớp của con!</p>

              <div className="grade-select-wizard-grid">
                {grades.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    className={`grade-wizard-card ${selectedGrade === g.id ? 'selected' : ''}`}
                    style={{
                      '--card-color': g.color,
                      '--card-bg': g.bg
                    }}
                    onClick={() => handleGradeSelect(g.id)}
                  >
                    <div className="grade-card-icon">{g.emoji}</div>
                    <div className="grade-card-content">
                      <div className="grade-card-header">
                        <b>{g.label}</b>
                        {g.badge && <span className="grade-hot-badge">{g.badge}</span>}
                      </div>
                      <small>{g.desc}</small>
                    </div>
                    <div className="grade-card-radio">
                      {selectedGrade === g.id ? '✓' : ''}
                    </div>
                  </button>
                ))}
              </div>

              <div className="wizard-actions">
                <button
                  className="onboarding-btn"
                  onClick={() => { playClick(); setStep(3); }}
                >
                  Tiếp tục chọn Bạn Đồng Hành ➜
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: MASCOT SELECTION & INSTANT START */}
          {step === 3 && (
            <div className="wizard-step-body animate-fade-in">
              <div className="wizard-top-back">
                <button className="wizard-back-btn" onClick={() => { playClick(); setStep(2); }}>
                  ← Đổi lớp học
                </button>
              </div>
              <span className="onboarding-header-emoji">{currentMascotProfile.emoji}🌟</span>
              <h1>Chọn Bạn Cố Vấn của con!</h1>
              <p className="wizard-subtitle">Bạn ấy sẽ luôn bên cạnh cổ vũ và hướng dẫn con trong suốt các bài toán.</p>

              {/* Realtime Mascot Bubble */}
              <div className="mascot-live-greeting-bubble">
                <span className="bubble-avatar">{currentMascotProfile.emoji}</span>
                <div className="bubble-text">
                  <b>{currentMascotProfile.name}:</b>
                  <p>Chào <b>{name.trim() || 'bạn nhỏ'}</b>! Tớ rất vui được cùng cậu chinh phục <b>{currentGradeObj.label}</b>!</p>
                </div>
              </div>

              <div className="mascot-wizard-grid">
                {displayedMascotKeys.map(k => {
                  const mProf = MASCOT_PROFILES[k];
                  if (!mProf) return null;
                  return (
                    <button
                      key={k}
                      type="button"
                      className={`mascot-wizard-card ${mascot === k ? 'selected' : ''}`}
                      onClick={() => { playClick(); setMascot(k); }}
                    >
                      <span className="mascot-card-emoji">{mProf.emoji}</span>
                      <b>{mProf.name}</b>
                      <small>{mProf.desc}</small>
                    </button>
                  );
                })}
              </div>

              {!showAllMascots && (
                <button
                  type="button"
                  className="toggle-more-mascots-btn"
                  onClick={() => { playClick(); setShowAllMascots(true); }}
                >
                  🐾 Xem thêm các bạn linh vật khác ({allMascotKeys.length - primaryMascotKeys.length} bạn)
                </button>
              )}

              {/* Action Hub: 2 Clear & Fun Options */}
              <div className="onboarding-final-cta-grid">
                <button
                  className="onboarding-btn primary-start-btn"
                  onClick={handleDirectStart}
                >
                  <span className="btn-icon">🚀</span>
                  <div className="btn-text-wrap">
                    <b>Vào Lớp Học Ngay!</b>
                    <small>Nhận ngay +50 XP Tân Binh</small>
                  </div>
                </button>

                <button
                  className="onboarding-btn-challenge"
                  onClick={handleStartChallenge}
                >
                  <span className="btn-icon">🕵️‍♂️</span>
                  <div className="btn-text-wrap">
                    <b>Thử tài 1 câu Thám tử Nhí</b>
                    <small>Kiểm tra nhanh 30s (+100 XP ⭐)</small>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'test') {
    return (
      <OnboardingTest
        name={name}
        mascot={mascot}
        grade={selectedGrade}
        onComplete={(finalScore) => {
          setScore(finalScore);
          setStage('assessment');
        }}
        onSkip={handleDirectStart}
      />
    );
  }

  if (stage === 'assessment') {
    return (
      <AssessmentReport
        name={name}
        mascot={mascot}
        grade={selectedGrade}
        score={score}
        setProgress={setProgress}
        setView={setView}
      />
    );
  }

  return null;
}

function OnboardingTest({ name, mascot, grade, onComplete, onSkip }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);

  const questions = ONBOARDING_TEST_QUESTIONS_BY_GRADE[grade] || ONBOARDING_TEST_QUESTIONS_BY_GRADE['grade-4'];
  const currentQuestion = questions[currentIndex];
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emojis?.idle || profile.emoji;
  const mascotName = profile.name;

  useEffect(() => {
    cancelSpeech();
    speakText(currentQuestion.story, resolveSpeechRate('normal'));
  }, [currentIndex, currentQuestion]);

  function handleSelectOption(index) {
    if (feedback) return;
    playClick();
    setSelectedOption(index);
  }

  function handleCheck() {
    if (selectedOption === null || feedback) return;

    const isCorrect = selectedOption === currentQuestion.correctIndex;
    let message = "";
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      message = "Câu trả lời hoàn toàn chính xác! Con tư duy nhạy bén thật đó!";
    } else {
      if (currentQuestion.difficulty === 'hard') {
        message = "Câu hỏi thử thách này hơi lắt léo một chút, nhưng con đã rất cố gắng rồi!";
      } else {
        message = "Chưa chính xác câu này, nhưng không sao hết nè! Chúng ta sẽ cùng rèn luyện thêm nhé!";
      }
    }

    const mascotMsg = getMascotSpeech(mascot, isCorrect, message);
    
    playSfx(isCorrect ? 'correct' : 'wrong', false);
    cancelSpeech();
    speakText(mascotMsg, resolveSpeechRate('normal'));
    
    setFeedback({
      correct: isCorrect,
      message: mascotMsg
    });
  }

  function handleNext() {
    const finalScore = score + (selectedOption === currentQuestion.correctIndex ? 1 : 0);
    setSelectedOption(null);
    setFeedback(null);
    if (currentIndex < questions.length - 1) {
      playClick();
      setCurrentIndex(prev => prev + 1);
    } else {
      playSfx('complete', false);
      onComplete(finalScore);
    }
  }

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="lesson-page onboarding-test-page" style={{ paddingBottom: '32px' }}>
      <div className="lesson-toolbar">
        <button className="close-button" onClick={onSkip} aria-label="Bỏ qua kiểm tra">✕</button>
        <div className="lesson-progress">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="test-progress-text" style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '16px' }}>
          Câu {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <div className="buddy-panel test-buddy-panel">
        <div className="buddy-avatar">{mascotEmoji}</div>
        <div className="buddy-chat">
          <b>{mascotName} đồng hành:</b>
          <p>Hãy cùng suy nghĩ và chọn câu trả lời đúng nhất nhé, thám tử nhí {name}!</p>
        </div>
      </div>

      <div className="lesson-layout test-layout">
        <section className="exercise-card test-exercise-card" style={{ flex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <div className="story-box test-story-box">
            <button className="sound-button" onClick={() => speakText(currentQuestion.story, resolveSpeechRate('normal'))} aria-label="Đọc đề bài">🔊</button>
            <p style={{ fontSize: '18px', lineHeight: '1.6', fontWeight: '500' }}>{currentQuestion.story}</p>
            <span className="story-emoji">{currentQuestion.emoji}</span>
          </div>

          <div className="question-area test-options-area" style={{ marginTop: '24px' }}>
            <div className="option-list">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={option}
                  disabled={feedback !== null}
                  className={`option ${selectedOption === index ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(index)}
                  style={{ width: '100%', display: 'flex', textAlign: 'left', marginBottom: '12px', padding: '16px', borderRadius: '16px' }}
                >
                  <span style={{ minWidth: '32px', height: '32px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', marginRight: '12px', fontWeight: 'bold' }}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <p style={{ margin: 0, fontSize: '16px', alignSelf: 'center' }}>{option}</p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className={`lesson-footer ${feedback ? (feedback.correct ? 'footer-correct' : 'footer-wrong') : ''}`}>
        <div className="footer-content">
          {feedback ? (
            <div className="feedback-banner">
              <span className="feedback-icon">{feedback.correct ? '🎉' : '🌱'}</span>
              <div className="feedback-text">
                <b>{feedback.correct ? 'Chính xác!' : 'Cố lên nhé!'}</b>
                <p>{feedback.message}</p>
              </div>
            </div>
          ) : (
            <div className="footer-tip">
              {currentQuestion.difficulty === 'hard' && (
                <span className="challenge-badge" style={{ background: '#f59e0b', color: '#fff', padding: '4px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                  ⭐ Thử Thách
                </span>
              )}
            </div>
          )}

          <div className="footer-actions">
            {!feedback ? (
              <>
                <button className="secondary-button footer-back" onClick={onSkip}>Bỏ qua</button>
                <button 
                  className="primary-button footer-submit" 
                  onClick={handleCheck}
                  disabled={selectedOption === null}
                >
                  Kiểm tra
                </button>
              </>
            ) : (
              <button className="primary-button footer-next" onClick={handleNext} autoFocus>
                {currentIndex === questions.length - 1 ? 'Xem Kết Quả' : 'Tiếp theo'} →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AssessmentReport({ name, mascot, grade, score, setProgress, setView }) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emojis?.idle || profile.emoji;
  const mascotName = profile.name;

  let tier = '';
  let desc = '';
  let startingLessonId = '';
  let startingLessonTitle = '';
  let skills = [];

  const gradeMapping = {
    'grade-1': {
      easy: { id: 'lesson-1', title: 'Bài 1: Bé Lan đếm táo đỏ' },
      medium: { id: 'lesson-6', title: 'Bài 6: Bóng bay của bé Vy' },
      hard: { id: 'lesson-17', title: 'Bài 17: Đồ chơi Lego của bé Bo' }
    },
    'grade-2': {
      easy: { id: 'lesson-1', title: 'Bài 1: Mua sách giáo khoa' },
      medium: { id: 'lesson-11', title: 'Bài 11: Mỗi ngày đọc sách' },
      hard: { id: 'lesson-21', title: 'Bài 21: Cây thước kẻ kẻ thẳng' }
    },
    'grade-3': {
      easy: { id: 'lesson-1', title: 'Bài 1: Nhà máy sản xuất bánh kẹo' },
      medium: { id: 'lesson-15', title: 'Bài 15: Hạc giấy trang trí phòng học' },
      hard: { id: 'lesson-27', title: 'Bài 27: Quãng đường chạy đi học' }
    },
    'grade-4': {
      easy: { id: 'lesson-1', title: 'Bài 1: Cam trung bình cộng' },
      medium: { id: 'lesson-11', title: 'Bài 11: Mua vở chuẩn bị đi học' },
      hard: { id: 'lesson-27', title: 'Bài 27: Chu vi khu vườn' }
    },
    'grade-5': {
      easy: { id: 'lesson-1', title: 'Bài 1: Bình nước chanh leo giải khát' },
      medium: { id: 'lesson-15', title: 'Bài 15: Bể cá cảnh Vy yêu thích' },
      hard: { id: 'lesson-27', title: 'Bài 27: Bé Vy đạp xe dạo chơi' }
    }
  };

  const levelInfo = gradeMapping[grade] || gradeMapping['grade-4'];
  let currentSelection;

  if (score <= 1) {
    tier = 'Khởi động vững chắc';
    desc = `Con làm quen tốt với các phép tính cơ bản. ${mascotName} sẽ đồng hành cùng con chinh phục các bài toán đọc hiểu lời văn từ bước cơ bản nhất nhé!`;
    currentSelection = levelInfo.easy;
    skills = [
      { name: 'Đọc hiểu đề', percent: 65, color: '#3b82f6' },
      { name: 'Phép tính cơ bản', percent: 75, color: '#10b981' },
      { name: 'Giải toán nâng cao', percent: 40, color: '#f59e0b' }
    ];
  } else if (score <= 3) {
    tier = 'Bứt phá tư duy';
    desc = `Con giải rất tốt các bài toán cơ bản và có phản xạ logic nhạy bén! ${mascotName} sẽ cùng con luyện tập giải toán nhiều bước tính phức tạp nhé!`;
    currentSelection = levelInfo.medium;
    skills = [
      { name: 'Đọc hiểu đề', percent: 85, color: '#3b82f6' },
      { name: 'Phép tính cơ bản', percent: 88, color: '#10b981' },
      { name: 'Giải toán nâng cao', percent: 65, color: '#f59e0b' }
    ];
  } else {
    tier = 'Thử thách siêu cấp';
    desc = `Tư duy toán học của con thật xuất chúng! Hãy sẵn sàng cùng ${mascotName} chinh phục Chế độ Thử thách với các bài toán và tính toán nâng cao nhé!`;
    currentSelection = levelInfo.hard;
    skills = [
      { name: 'Đọc hiểu đề', percent: 95, color: '#3b82f6' },
      { name: 'Phép tính cơ bản', percent: 98, color: '#10b981' },
      { name: 'Giải toán nâng cao', percent: 90, color: '#f59e0b' }
    ];
  }

  startingLessonId = currentSelection.id;
  startingLessonTitle = currentSelection.title;

  useEffect(() => {
    cancelSpeech();
    const praiseText = `Chúc mừng thám tử nhí ${name} đã hoàn thành bài đánh giá! Xếp hạng học lực của con là: ${tier}. Hãy cùng bắt đầu hành trình nhé!`;
    speakText(praiseText, resolveSpeechRate('normal'));
  }, [name, tier]);

  function handleCompleteOnboarding() {
    playClick();
    setProgress(old => ({
      ...old,
      onboarded: true,
      currentGrade: grade,
      xp: old.xp + 100,
      profile: {
        ...old.profile,
        name: name,
        mascot: mascot,
        academicLevel: tier,
        startingRecommendation: startingLessonId
      }
    }));
    setView('home');
  }

  return (
    <div className="onboarding-screen assessment-screen">
      <div className="onboarding-card assessment-card">
        <div className="congrats-badge" style={{ fontSize: '64px', margin: '0 auto 12px' }}>🏆</div>
        <h1 style={{ fontSize: '28px', color: '#1e3a8a', marginBottom: '8px' }}>Hồ Sơ Năng Lực Toán Học</h1>
        <p className="subtitle" style={{ color: '#6b7280', fontSize: '16px', marginBottom: '24px' }}>
          Được chứng nhận bởi cố vấn <b>{mascotEmoji} {mascotName}</b>
        </p>

        <div className="certificate-box" style={{ border: '3px dashed #d1d5db', borderRadius: '24px', padding: '24px', background: '#f9fafb', position: 'relative', marginBottom: '24px' }}>
          <div className="mascot-badge-circle" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', margin: '-60px auto 16px', border: '3px solid #fff', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {mascotEmoji}
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', margin: '0 0 12px' }}>
            Bé: {name}
          </h2>
          <div className="tier-badge" style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '18px', marginBottom: '16px' }}>
            🎖️ {tier}
          </div>
          <p style={{ fontSize: '15px', color: '#4b5563', lineHeight: '1.6', margin: '0 auto 12px', maxWidth: '400px' }}>
            {desc}
          </p>
          <div className="xp-reward" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef3c7', color: '#92400e', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', fontSize: '14px' }}>
            🌟 Nhận +100 XP điểm tư duy đầu tiên!
          </div>
        </div>

        <div className="skills-section" style={{ width: '100%', textAlign: 'left', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', marginBottom: '16px' }}>Phân tích các kỹ năng:</h3>
          <div className="skills-grid" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {skills.map(s => (
              <div key={s.name} className="skill-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#4b5563' }}>
                  <span>{s.name}</span>
                  <span>{s.percent}%</span>
                </div>
                <div className="skill-bar-wrapper" style={{ height: '12px', background: '#e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                  <div className="skill-bar-fill" style={{ width: `${s.percent}%`, height: '100%', background: s.color, borderRadius: '6px', transition: 'width 1s ease-out' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="starting-rec-box" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🚀</span>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 'bold', textTransform: 'uppercase' }}>Bài học khuyên dùng bắt đầu:</span>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#14532d' }}>{startingLessonTitle}</div>
          </div>
        </div>

        <button className="onboarding-btn" onClick={handleCompleteOnboarding} style={{ width: '100%', padding: '16px' }}>
          Bắt đầu hành trình học 🚀
        </button>
      </div>
    </div>
  );
}
function ArenaView({
  arenaQuestion,
  arenaTime,
  arenaScore,
  arenaAttempts,
  arenaAnswerVal,
  setArenaAnswerVal,
  arenaFeedback,
  onCheckAnswer,
  onBack,
  mascot,
  getMascotEmotion
}) {
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : (MASCOT_PROFILES[mascot]?.emoji || '🦉')

  return (
    <div className="arena-page">
      <div className="arena-header">
        <button className="back-btn" onClick={onBack}>✕ Thoát Đấu Trường</button>
        <div className="arena-stats">
          <div className="arena-timer">⏱️ <b>{arenaTime} giây</b></div>
          <div className="arena-score">🎯 <b>{arenaScore} câu đúng</b></div>
        </div>
      </div>

      {arenaTime > 0 && arenaQuestion ? (
        <div className="arena-body">
          <div className="arena-mascot-row">
            <span className="arena-mascot">{mascotEmoji}</span>
            <div className="arena-bubble">
              <b>Cố lên thám tử nhí! Giải nhanh câu này nhé:</b>
            </div>
          </div>

          <div className="arena-question-card">
            <h3>{arenaQuestion.title}</h3>
            <p className="arena-story">{arenaQuestion.story}</p>
            
            <form className="arena-form" onSubmit={onCheckAnswer}>
              <div className="arena-math-display">
                <span className="math-op">{arenaQuestion.operation}</span>
                <span className="math-equals">=</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={arenaAnswerVal}
                  onChange={(e) => setArenaAnswerVal(e.target.value.replace(/\D/g, ''))}
                  placeholder="?"
                  autoFocus
                  disabled={arenaFeedback !== null}
                />
                <span className="math-unit">{arenaQuestion.unit}</span>
              </div>
              
              {arenaFeedback === null && (
                <button type="submit" className="arena-submit-btn" disabled={arenaAnswerVal.trim() === ''}>Trả lời</button>
              )}
            </form>

            {arenaFeedback && (
              <div className={`arena-feedback ${arenaFeedback.correct ? 'correct' : 'wrong'}`}>
                <span>{arenaFeedback.correct ? '🎉' : '🌱'}</span>
                <p>{arenaFeedback.message}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="arena-summary-card">
          <span className="summary-icon">🏆</span>
          <h2>Hết giờ rồi!</h2>
          <p>Chúc mừng con đã hoàn thành thử thách Đấu trường Tính nhanh!</p>
          <div className="summary-stats">
            <div className="summary-stat-row">
              <span>Số câu giải đúng:</span>
              <b>{arenaScore} câu</b>
            </div>
            <div className="summary-stat-row">
              <span>Tổng số lần thử:</span>
              <b>{arenaAttempts} lần</b>
            </div>
            <div className="summary-stat-row highlight-xp">
              <span>Điểm kinh nghiệm nhận được:</span>
              <b>+{arenaScore * 5} XP ⭐</b>
            </div>
          </div>
          <div className="summary-actions">
            <button className="primary-button" onClick={onBack}>Quay lại trang chủ</button>
          </div>
        </div>
      )}
    </div>
  )
}

function BuddyView({
  buddyQuestion,
  buddyFeedback,
  buddyAttempted,
  onCheckAnswer,
  onNext,
  onBack,
  mascot,
  getMascotEmotion
}) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;

  return (
    <div className="buddy-page">
      <div className="buddy-header">
        <button className="back-btn" onClick={onBack}>✕ Thoát Góc Cố Vấn</button>
        <div className="buddy-title-badge">🧠 Sửa lỗi cho Linh vật</div>
      </div>

      {!buddyQuestion ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: '24px', margin: '20px auto', maxWidth: '400px', border: '1.5px solid #e2e8f0' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>🦉</div>
          <h3 style={{ fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Góc Cố Vấn Học Tập</h3>
          <p style={{ fontSize: '13.5px', color: '#64748b', marginBottom: '20px', lineHeight: '1.5' }}>
            Giúp {mascotName} phát hiện và sửa các lỗi tư duy sai lầm để rèn luyện tư duy phản biện nhé!
          </p>
          <button className="primary-button" style={{ minHeight: '46px', padding: '0 24px', borderRadius: '14px', width: '100%' }} onClick={onNext}>
            Bắt đầu giải đố ✨
          </button>
        </div>
      ) : (
        <div className="buddy-body">
          <div className="buddy-mascot-chat">
            <span className="buddy-mascot-large">{mascotEmoji}</span>
            <div className="buddy-speech-bubble">
              <b>{mascotName} nói:</b>
              <p>"{buddyQuestion.statement}"</p>
              <small>Theo bạn, tớ chọn thế đúng hay sai nhỉ?</small>
            </div>
          </div>

          <div className="buddy-context-card">
            <h3>Đề bài: {buddyQuestion.title}</h3>
            <p className="buddy-story-desc">"{buddyQuestion.story}"</p>

            {!buddyAttempted ? (
              <div className="buddy-decision-buttons">
                <button className="buddy-dec-btn btn-yes" onClick={() => onCheckAnswer('yes')}>
                  <span>👍</span>
                  <b>Mascot đúng rồi</b>
                </button>
                <button className="buddy-dec-btn btn-no" onClick={() => onCheckAnswer('no')}>
                  <span>👎</span>
                  <b>Có lỗi sai nha!</b>
                </button>
              </div>
            ) : (
              <div className="buddy-result-area">
                {buddyFeedback && (
                  <div className={`buddy-feedback-banner ${buddyFeedback.correct ? 'correct' : 'wrong'}`}>
                    <span className="feedback-icon">{buddyFeedback.correct ? '🎉' : '🌱'}</span>
                    <p>{buddyFeedback.message}</p>
                  </div>
                )}
                
                <div className="buddy-result-actions">
                  <button className="primary-button" onClick={onNext}>Thử câu khác ➡️</button>
                  <button className="secondary-button" onClick={onBack}>Về trang chủ 🏠</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}



function InsightsView({ lessons, progress, openLesson, earnedStars, getMascotEmotion, onOpenReview, onOpenSettings }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  // 1. Character & Header indicators
  const level = Math.floor((progress.xp || 0) / 100) + 1;
  const levelProgress = (progress.xp || 0) % 100;
  const streak = progress.streak || 0;
  const xp = progress.xp || 0;
  
  const mascot = progress.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;
  const studentName = progress.profile?.name || 'Bé';

  // 2. Behavioral Archetype
  const archetype = progress.behavioralProfile?.currentArchetype || 'balanced';
  
  let _archetypeTitle = 'Chiến Binh Cân Bằng ⚔️';
  let _archetypeDesc = 'Con có sự cân bằng tuyệt vời giữa tốc độ và độ chính xác khi giải toán!';
  let _archetypeColor = '#10B981'; // green

  if (archetype === 'pioneer') {
    _archetypeTitle = 'Chiến Sĩ Tốc Độ ⚡';
    _archetypeDesc = 'Con giải bài siêu nhanh! Hãy chú ý rà soát kỹ các dữ kiện để tránh lỗi sai cẩu thả nhé!';
    _archetypeColor = '#3B82F6'; // blue
  } else if (archetype === 'scholar') {
    _archetypeTitle = 'Học Giả Uyên Bác 🧠';
    _archetypeDesc = 'Con lập luận vô cùng chặt chẽ và chính xác. Hãy tự tin tăng tốc độ giải nhanh hơn nữa nhé!';
    _archetypeColor = '#8B5CF6'; // purple
  } else if (archetype === 'budding_thinker') {
    _archetypeTitle = 'Chiến Sĩ Bền Bỉ 🐢';
    _archetypeDesc = 'Con rất kiên trì và cẩn thận. Đừng ngại thử sức tự trả lời trước khi dùng gợi ý nhé!';
    _archetypeColor = '#F59E0B'; // orange
  } else if (archetype === 'active_seeker') {
    _archetypeTitle = 'Nhà Khám Phá Nhí 🗺️';
    _archetypeDesc = 'Con rất yêu thích tìm tòi những thử thách mới! Hãy kiên trì hoàn thành bài học đang làm nhé!';
    _archetypeColor = '#EC4899'; // pink
  }

  // 3. RPG attributes calculation
  const totalLessons = lessons.length || 1;
  const completedLessons = Object.keys(progress.completed || {}).length;
  const logicPower = Math.round((completedLessons / totalLessons) * 100);

  // Speed
  const completedList = Object.values(progress.completed || {});
  const lessonsWithDuration = completedList.filter(item => (item.duration || 0) > 0);
  const avgDuration = lessonsWithDuration.length > 0
    ? Math.round(lessonsWithDuration.reduce((acc, curr) => acc + curr.duration, 0) / lessonsWithDuration.length)
    : 60; // default 60s
  
  let speedRank = 'Thong thả 🐢';
  let speedScore = 50;
  if (avgDuration < 45) {
    speedRank = 'Sấm sét ⚡';
    speedScore = 95;
  } else if (avgDuration <= 90) {
    speedRank = 'Gió lốc 🌀';
    speedScore = 75;
  } else {
    speedScore = Math.max(10, Math.round(100 - (avgDuration / 3)));
  }

  // Accuracy
  const attemptsList = Object.values(progress.attempts || {});
  const totalPlays = attemptsList.reduce((acc, curr) => acc + (curr.playCount || 0), 0);
  const totalMistakes = attemptsList.reduce((acc, curr) => acc + (curr.totalMistakes || 0), 0);
  const accuracy = totalPlays > 0
    ? Math.max(0, Math.min(100, Math.round(100 - (totalMistakes / (totalPlays * 7) * 100))))
    : 100;

  // Stamina/Streak Score
  const staminaScore = Math.min(100, streak * 20);

  // 4. Achievements Mapping
  const achievementsList = ACHIEVEMENT_DEFINITIONS.map(def => {
    const isUnlocked = progress.unlockedAchievements?.[def.id] || def.checkUnlocked(progress, earnedStars, lessons)
    const target = typeof def.target === 'function' ? def.target(progress, earnedStars, lessons) : def.target
    const current = Math.min(target, def.current(progress, earnedStars, lessons))
    const percent = Math.floor((current / target) * 100)

    return {
      ...def,
      target,
      current,
      percent,
      unlocked: !!isUnlocked,
      unlockedAt: progress.unlockedAchievements?.[def.id] || null
    }
  })

  // 5. Mistake Monster Analysis
  const stepFailCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  attemptsList.forEach(att => {
    if (att.stepFails) {
      Object.entries(att.stepFails).forEach(([stepStr, count]) => {
        const stepNum = parseInt(stepStr, 10);
        if (stepNum >= 1 && stepNum <= 7) {
          stepFailCounts[stepNum] += count;
        }
      });
    }
  });

  let maxStep = 0;
  let maxCount = 0;
  Object.entries(stepFailCounts).forEach(([stepStr, count]) => {
    if (count > maxCount) {
      maxCount = count;
      maxStep = parseInt(stepStr, 10);
    }
  });

  let monsterName = 'Trạng thái Hòa Bình 🕊️';
  let monsterEmoji = '🕊️';
  let monsterDesc = 'Bé chưa gặp phải Quái vật lỗi sai nào! Năng lực toán học của bé rất hoàn hảo.';
  let monsterTip = 'Cú Ú khuyên: Hãy tiếp tục duy trì phong độ tuyệt vời này và rèn luyện thêm nhiều bài học mới nhé!';
  let monsterHP = 0;

  if (maxCount > 0) {
    monsterHP = Math.min(100, maxCount * 10);
    if (maxStep === 1 || maxStep === 2) {
      monsterName = 'Quái vật Đọc Lướt';
      monsterEmoji = '🦇';
      monsterDesc = 'Bé hay vội vàng giải bài khi chưa kịp đọc kỹ đề và phân tích thông tin của câu chuyện.';
      monsterTip = `${mascotName} khuyên: Bé nên lấy nháp viết ra các dữ liệu đề cho và đề hỏi, hoặc nhấn nút 🔊 để nghe đọc lại câu chuyện thật chậm nhé!`;
    } else if (maxStep === 3) {
      monsterName = 'Quái vật Lệch Sơ Đồ';
      monsterEmoji = '👾';
      monsterDesc = 'Bé gặp khó khăn trong việc chọn sơ đồ đoạn thẳng hoặc trục số biểu diễn tương quan đại lượng.';
      monsterTip = `${mascotName} khuyên: Bé hãy mở nháp vẽ thử các đoạn thẳng dài ngắn khác nhau để so sánh trước khi chọn mô hình nhé!`;
    } else if (maxStep === 4) {
      monsterName = 'Quái vật Nhầm Phép Tính';
      monsterEmoji = '🦖';
      monsterDesc = 'Bé hiểu đề bài nhưng hay bị nhầm lẫn giữa việc dùng phép cộng, trừ, nhân, hay chia.';
      monsterTip = `${mascotName} khuyên: Bé hãy tự hỏi xem muốn tìm đại lượng lớn hơn hay nhỏ hơn để chọn phép tính phù hợp nhé!`;
    } else if (maxStep === 5) {
      monsterName = 'Quái vật Tính Nhầm';
      monsterEmoji = '🕷️';
      monsterDesc = 'Bé lập luận hoàn toàn chính xác nhưng hay tính nhẩm sai kết quả phép tính.';
      monsterTip = `${mascotName} khuyên: Đừng vội vàng! Bé hãy đặt tính dọc ra nháp và tính lại hai lần trước khi điền nhé!`;
    } else if (maxStep >= 6) {
      monsterName = 'Quái vật Quên Kiểm Tra';
      monsterEmoji = '🐢';
      monsterDesc = 'Bé điền sai đơn vị hoặc không kiểm tra lại xem kết quả có hợp lý hay không.';
      monsterTip = `${mascotName} khuyên: Sau khi làm xong, bé hãy tự hỏi xem con số đó có nằm giữa số bé nhất và lớn nhất của đề bài không nhé!`;
    }
  }

  // Find a lesson containing a failure at the weakest step to recommend for monster challenge
  let challengeLessonIndex = 0;
  let hasChallengeLesson = false;
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    const att = progress.attempts?.[l.id];
    if (att && att.stepFails && att.stepFails[String(maxStep)] > 0) {
      challengeLessonIndex = i;
      hasChallengeLesson = true;
      break;
    }
  }

  // 6. Skills Quest Map
  const skillGroups = {};
  lessons.forEach((lesson, index) => {
    if (!skillGroups[lesson.skill]) {
      skillGroups[lesson.skill] = {
        name: lesson.skill,
        lessons: []
      };
    }
    skillGroups[lesson.skill].lessons.push({ lesson, index });
  });

  const skillsData = Object.values(skillGroups).map(group => {
    const total = group.lessons.length;
    let completed = 0;
    let weak = false;
    let played = false;
    
    group.lessons.forEach(({ lesson }) => {
      const comp = progress.completed?.[lesson.id];
      const att = progress.attempts?.[lesson.id];
      if (comp && comp.stars === 3) completed++;
      if (att) played = true;
      if (progress.weakSkills?.[lesson.skill]) weak = true;
    });

    let status = 'Todo';
    if (completed === total) {
      status = 'Mastered';
    } else if (played || weak) {
      status = 'Improving';
    }

    return {
      ...group,
      total,
      completed,
      status
    };
  }).sort((a, b) => {
    const statusOrder = { 'Improving': 0, 'Todo': 1, 'Mastered': 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // 7. Emergency Quests Board
  let recoveryLesson = null;
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    const comp = progress.completed?.[l.id];
    const att = progress.attempts?.[l.id];
    if ((comp && comp.stars < 3) || (att && progress.weakSkills?.[l.skill])) {
      recoveryLesson = { lesson: l, index: i };
      break;
    }
  }

  let speedLesson = null;
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    const comp = progress.completed?.[l.id];
    if (comp && comp.duration > avgDuration) {
      speedLesson = { lesson: l, index: i };
      break;
    }
  }
  if (!speedLesson && completedLessons > 0) {
    for (let i = 0; i < lessons.length; i++) {
      const l = lessons[i];
      if (progress.completed?.[l.id]) {
        speedLesson = { lesson: l, index: i };
        break;
      }
    }
  }

  let nextLesson = null;
  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    if (!progress.completed?.[l.id]) {
      nextLesson = { lesson: l, index: i };
      break;
    }
  }

  return (
    <section className="insights-page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="page-head">
        <h1 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: '900' }}>🏆 Thành quả</h1>
        <button 
          className="icon-btn" 
          onClick={onOpenSettings} 
          title="Mở cài đặt"
          style={{ width: '42px', height: '42px' }}
        >
          ⚙️
        </button>
      </div>

      {/* Profile Hero Card */}
      <div className="card profile-hero" style={{ overflow: 'hidden', padding: '18px 14px 16px' }}>
        <div className="avatar-large">
          {mascotEmoji}
        </div>
        <h2>{studentName}</h2>
        <p>Đồng hành: <b>{mascotName}</b></p>
        <div className="level-pill">
          Cấp độ {level}
        </div>
        <div className="xp-bar-wrap" style={{ marginTop: '14px', maxWidth: '300px', marginInline: 'auto' }}>
          <div className="row">
            <span>Tiến trình cấp</span>
            <span>{levelProgress}/100 XP</span>
          </div>
          <div className="xp-bar">
            <i style={{ width: `${levelProgress}%` }}></i>
          </div>
        </div>
        
        {onOpenReview && (
          <button 
            className="btn btn-danger btn-sm btn-block"
            onClick={onOpenReview}
            style={{ marginTop: '12px' }}
          >
            📝 Sửa câu sai của con
          </button>
        )}
      </div>

      {/* Stat Row */}
      <div className="stat-row">
        <div className="card">
          <span>🔥</span>
          <b>{streak} ngày</b>
          <small>Học liên tục</small>
        </div>
        <div className="card">
          <span>⭐</span>
          <b>{xp} điểm</b>
          <small>Tích lũy XP</small>
        </div>
        <div className="card">
          <span>🧠</span>
          <b>{logicPower}%</b>
          <small>Hoàn thành</small>
        </div>
      </div>

      {/* Attribute card */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          <h2>📊 Chỉ số thuộc tính Anh hùng</h2>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          {/* Logic Power */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <span>🧠 Trí tuệ Logic</span>
              <b>{logicPower}%</b>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <i style={{ width: `${logicPower}%`, background: 'linear-gradient(90deg, #60a5fa, #3b82f6)' }}></i>
            </div>
          </div>

          {/* Speed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <span>⚡ Tốc độ Chớp chớp</span>
              <b>{speedRank}</b>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <i style={{ width: `${speedScore}%`, background: 'linear-gradient(90deg, #f43f5e, #e11d48)' }}></i>
            </div>
          </div>

          {/* Accuracy */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <span>🎯 Độ Chính xác</span>
              <b>{accuracy}%</b>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <i style={{ width: `${accuracy}%`, background: 'linear-gradient(90deg, #34d399, #059669)' }}></i>
            </div>
          </div>

          {/* Stamina */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <span>🔥 Năng lượng Bền bỉ</span>
              <b>{streak > 0 ? `Cấp ${Math.min(5, streak)}` : 'Chưa kích hoạt'}</b>
            </div>
            <div className="progress-track" style={{ height: '8px' }}>
              <i style={{ width: `${staminaScore}%`, background: 'linear-gradient(90deg, #fbbf24, #d97706)' }}></i>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 Achievements grid */}
      <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          <h2>🏆 Kho báu Thành quả</h2>
        </div>
        <div className="ach-grid" style={{ marginTop: '12px' }}>
          {achievementsList.map(item => (
            <div
              key={item.id}
              className={`card ach ${item.unlocked ? 'on' : ''}`}
              onClick={() => setSelectedAchievement(item)}
            >
              <span>{item.icon}</span>
              <b>{item.title}</b>
              {item.unlocked ? (
                <small style={{ color: 'var(--gold, #d97706)' }}>✨ Đã mở khóa</small>
              ) : (
                <small>{item.current}/{item.target} ({item.percent}%)</small>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Mistake Monster Codex */}
      <div className="insights-card monster-card" style={{ marginTop: '24px' }}>
        <div className="monster-header">
          <h3>👾 Bí kíp chiến thắng Quái vật Lỗi sai</h3>
          {maxCount > 0 && <div className="monster-badge">Cần tiêu diệt!</div>}
        </div>
        <div className="monster-body">
          <span className="monster-emoji" style={{ animation: maxCount > 0 ? 'bounce 2s infinite' : 'none' }}>{monsterEmoji}</span>
          <div className="monster-info">
            <h4>{monsterName} {maxCount > 0 && <small>(Sức mạnh: {monsterHP}/100 HP)</small>}</h4>
            <p className="monster-desc">{monsterDesc}</p>
            <div className="monster-tip" onClick={() => speakManual(monsterTip)} style={{ cursor: 'pointer' }} title="Bấm để nghe đọc lời khuyên">
              <span>💡</span>
              <p>{monsterTip}</p>
            </div>
            {maxCount > 0 && hasChallengeLesson && (
              <button 
                className="challenge-btn" 
                onClick={() => openLesson(challengeLessonIndex)}
              >
                ⚔️ Khiêu chiến sửa sai ngay
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Emergency Quests */}
      <div className="insights-card quests-card" style={{ marginTop: '24px' }}>
        <h3>🪙 Bảng nhiệm vụ khẩn cấp (Nhận XP cực nhanh)</h3>
        <div className="quests-grid">
          {/* Recovery Quest */}
          <div className="quest-item">
            <div className="quest-badge q-recovery">Phục hồi</div>
            <h4>🩹 Sửa sai nhận thưởng</h4>
            {recoveryLesson ? (
              <>
                <p>Chơi lại bài <b>{recoveryLesson.lesson.shortTitle}</b> để đạt 3 sao hoàn hảo.</p>
                <button onClick={() => openLesson(recoveryLesson.index)}>Đi làm ngay +20 XP</button>
              </>
            ) : (
              <p className="quest-empty">Bé hiện chưa có bài học nào bị yếu hay đạt sao thấp. Quá tuyệt vời! 🎉</p>
            )}
          </div>

          {/* Speed Quest */}
          <div className="quest-item">
            <div className="quest-badge q-speed">Tốc độ</div>
            <h4>⚡ Đua mốc thời gian</h4>
            {speedLesson ? (
              <>
                <p>Vượt qua bài <b>{speedLesson.lesson.shortTitle}</b> với tốc độ nhanh hơn để tăng điểm Tốc độ.</p>
                <button onClick={() => openLesson(speedLesson.index)}>Khiêu chiến tốc độ</button>
              </>
            ) : (
              <p className="quest-empty">Hoàn thành bài học đầu tiên để kích hoạt thử thách tốc độ.</p>
            )}
          </div>

          {/* Double XP Quest */}
          <div className="quest-item">
            <div className="quest-badge q-double">Siêu cấp</div>
            <h4>⚔️ Thử thách nhân đôi</h4>
            {nextLesson ? (
              <>
                <p>Học bài tiếp theo: <b>{nextLesson.lesson.shortTitle}</b> ở Chế độ Thử thách khó.</p>
                <button onClick={() => openLesson(nextLesson.index)}>Khiêu chiến x2 XP</button>
              </>
            ) : (
              <p className="quest-empty">Chúc mừng! Bé đã hoàn thành toàn bộ bài học của môn học này. 🏆</p>
            )}
          </div>
        </div>
      </div>

      {/* Skill Map */}
      <div className="insights-card skill-map-card" style={{ marginTop: '24px' }}>
        <h3>🗺️ Bản đồ kỹ năng toán học</h3>
        <div className="skill-map-grid">
          {skillsData.map(skill => (
            <div key={skill.name} className={`skill-card-item skill-${skill.status.toLowerCase()}`}>
              <div className="skill-card-header">
                <b>{skill.name}</b>
                <span className={`status-badge stat-${skill.status.toLowerCase()}`}>
                  {skill.status === 'Mastered' ? 'Đã thấu hiểu 🟢' : skill.status === 'Improving' ? 'Đang rèn luyện 🔵' : 'Chưa học 🟡'}
                </span>
              </div>
              <small>Tiến độ: {skill.completed}/{skill.total} bài học</small>
              <div className="skill-mini-bar">
                <div 
                  className={`skill-mini-bar-fill fill-${skill.status.toLowerCase()}`} 
                  style={{ width: `${Math.round((skill.completed / skill.total) * 100)}%` }}
                ></div>
              </div>
              <div className="skill-lessons-chips">
                {skill.lessons.map(({ lesson, index }) => {
                  const comp = progress.completed?.[lesson.id];
                  return (
                    <span 
                      key={lesson.id} 
                      className={`lesson-chip ${comp ? 'completed' : ''}`}
                      onClick={() => openLesson(index)}
                      title={`Bấm để học bài: ${lesson.title}`}
                    >
                      {lesson.icon} {lesson.shortTitle} {comp ? '⭐'.repeat(comp.stars) : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAchievement && (
        <div className="achievement-modal-overlay" onClick={() => setSelectedAchievement(null)}>
          <div className="achievement-modal-card" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedAchievement(null)}>✕</button>
            <div className="modal-icon">{selectedAchievement.icon}</div>
            <h2>{selectedAchievement.title}</h2>
            <p className="desc">{selectedAchievement.description}</p>
            
            <div className="modal-progress">
              <div className="progress-label-row">
                <span>Tiến độ:</span>
                <b>{selectedAchievement.current} / {selectedAchievement.target}</b>
              </div>
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${selectedAchievement.percent}%` }}></div>
              </div>
            </div>
            
            {selectedAchievement.unlocked ? (
              <div className="unlock-status success">
                ✨ Đã mở khóa vào {selectedAchievement.unlockedAt ? new Date(selectedAchievement.unlockedAt).toLocaleDateString('vi-VN') : 'vừa xong'}!
              </div>
            ) : (
              <div className="unlock-status locked">
                🔒 Chưa mở khóa (Tiếp tục học để mở)
              </div>
            )}
            
            <div className="mascot-advice">
              <span className="mascot-avatar">{mascotEmoji}</span>
              <div>
                <b>{mascotName} gợi ý:</b>
                <p>"{selectedAchievement.advice[mascot] || selectedAchievement.advice.owl}"</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CoachSidebar({ progress, plan, openLesson, getMascotEmotion }) {
  const mascot = progress?.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;
  
  const primary = plan?.primary;

  return (
    <div className="coach-card" style={{ marginTop: '40px' }}>
      <div className="coach">{mascotEmoji}</div>
      <b>{mascotName} khuyên:</b>
      <div>
        {primary ? (
          <>
            <span>{primary.blurb}</span>
            <button 
              className="primary-button" 
              style={{ marginTop: '10px', width: '100%', padding: '8px', fontSize: '13px', cursor: 'pointer' }}
              onClick={() => openLesson(primary.index)}
            >
              {primary.kind === 'review' ? 'Ôn bài ngay' : 'Học ngay'}
            </button>
          </>
        ) : (
          <span>Mỗi lần giải thích được “tại sao”, bộ não của con mạnh hơn.</span>
        )}
      </div>
    </div>
  );
}

function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const colors = ['#6366f1', '#10b981', '#ef4444', '#f59e0b', '#ec4899', '#3b82f6', '#f43f5e', '#a855f7'];
    
    // Spawn initial burst
    const count = 150;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height * 0.45,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.7) * 20 - 8,
        size: Math.random() * 8 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        life: 1.0,
        decay: Math.random() * 0.01 + 0.008
      });
    }

    const drawConfetti = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.98; // friction
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;
        
        if (p.life <= 0 || p.y > canvas.height) {
          particles.splice(i, 1);
          continue;
        }
        
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        
        ctx.beginPath();
        if (i % 2 === 0) {
          ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
        } else {
          ctx.rect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }
        ctx.fill();
        ctx.restore();
      }

      if (particles.length > 0) {
        animationFrameId = requestAnimationFrame(drawConfetti);
      }
    };

    drawConfetti();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 99999
      }}
    />
  );
}

function AchievementCelebration({ achievements, mascot, onClose, getMascotEmotion }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = achievements[currentIndex];
  
  if (!current) return null;

  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="achievement-celebration-overlay" onClick={handleNext}>
      <ConfettiCanvas active={true} />
      <div className="achievement-celebration-card" onClick={e => e.stopPropagation()}>
        <div className="sparkles">✨🌟✨</div>
        <div className="celebration-badge">{current.icon}</div>
        <h1>THÀNH TÍCH MỚI!</h1>
        <h3>{current.title}</h3>
        <p className="description">{current.description}</p>
        
        <div className="mascot-praise">
          <span className="mascot-emoji-big">{mascotEmoji}</span>
          <div>
            <b>{mascotName} chúc mừng:</b>
            <p>"{profile.achievementPraise || 'Chúc mừng con nhé!'}"</p>
          </div>
        </div>

        <button className="celebration-btn" onClick={handleNext}>
          {currentIndex < achievements.length - 1 ? 'Xem tiếp ➡️' : 'Nhận phần thưởng 🎁'}
        </button>
      </div>
    </div>
  );
}

function LearningPath({ lessons, progress, openLesson, activeProgress, onOpenChest, onOpenBoss }) {
  const completedCount = Object.keys(activeProgress.completed || {}).length;
  let firstIncompleteIndex = lessons.findIndex(l => !activeProgress.completed[l.id]);
  if (firstIncompleteIndex === -1) firstIncompleteIndex = lessons.length;

  const pathNodes = [];
  lessons.forEach((l, idx) => {
    const isDone = !!activeProgress.completed[l.id];
    const isCurrent = idx === firstIncompleteIndex;
    const stars = activeProgress.completed[l.id]?.stars || 0;
    
    pathNodes.push({
      type: 'lesson',
      id: l.id,
      index: idx,
      icon: l.icon || '📖',
      title: l.shortTitle || l.title,
      status: isDone ? 'done' : isCurrent ? 'current' : 'locked',
      stars: stars
    });
  });

  // Chest Node
  const chestId = 'unit_chest';
  const chestOpened = !!activeProgress.completed[`${progress.currentGrade || 'grade-4'}_${progress.currentSubject || 'math'}_unit_chest`] || !!activeProgress.completed['unit_chest'];
  pathNodes.push({
    type: 'chest',
    id: chestId,
    index: lessons.length,
    icon: chestOpened ? '✨' : '🎁',
    title: 'Rương unit',
    status: chestOpened ? 'done' : (completedCount === lessons.length ? 'current' : 'locked'),
    stars: 0
  });

  // Boss Node
  const bossId = 'unit_boss';
  const bossCompleted = !!activeProgress.completed['unit_boss'];
  pathNodes.push({
    type: 'boss',
    id: bossId,
    index: lessons.length + 1,
    icon: '⚔️',
    title: 'Thử thách Boss',
    status: bossCompleted ? 'done' : (completedCount === lessons.length && chestOpened ? 'current' : 'locked'),
    stars: 0
  });

  return (
    <div className="path">
      <div className="path-line" aria-hidden="true"></div>
      {pathNodes.map((node) => {
        const clickHandler = () => {
          if (node.status === 'locked') return;
          if (node.type === 'lesson') {
            openLesson(node.index);
          } else if (node.type === 'chest') {
            onOpenChest();
          } else if (node.type === 'boss') {
            onOpenBoss();
          }
        };

        return (
          <div key={node.id} className="path-node">
            <button
              className={`node-btn ${node.status}`}
              onClick={clickHandler}
              disabled={node.status === 'locked'}
              title={node.title}
            >
              {node.icon}
              {node.status === 'done' && node.type === 'lesson' && (
                <span className="badge">
                  {'⭐'.repeat(node.stars)}
                </span>
              )}
            </button>
            <div className="node-label">
              <b>{node.title}</b>
              <small>
                {node.status === 'done' ? 'Đã xong' : node.status === 'current' ? 'Đang học' : 'Mở sau'}
              </small>
            </div>
          </div>
        );
      })}
    </div>
  );
}


function IntroView({ lesson, progress, onStart, onBack, mascot, getMascotEmotion }) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = getMascotEmotion ? getMascotEmotion(mascot) : profile.emoji;
  const mascotName = profile.name;
  
  const stepsList = getActiveSteps(progress.studyMode || 'full', lesson);
  const facts = lesson?.facts || [];
  const roles = lesson?.factRoles || [];

  return (
    <div className="intro-page">
      <div className="intro-header">
        <button className="back-btn" onClick={() => { playClick(); onBack(); }}>‹ Quay lại</button>
        <h2 className="intro-title">Chuẩn bị vào bài</h2>
        <button className="back-btn" onClick={() => { playClick(); onStart(); }}>Bỏ qua ⏭</button>
      </div>

      <div className="intro-scroll-body">
        <div className="intro-mascot-box">
          <div className="intro-mascot-avatar">
            <span>{mascotEmoji}</span>
          </div>
          <div className="intro-bubble">
            <strong>{mascotName} hướng dẫn:</strong>
            <p>
              "Chào bạn nhỏ! Hôm nay chúng mình cùng chinh phục bài toán '{lesson?.shortTitle}'. Chúng mình sẽ trải qua các bước thông minh sau nhé!"
            </p>
          </div>
        </div>

        <div className="intro-step-pills">
          {stepsList.map((s, idx) => {
            const label = STEP_LABELS[s]?.[1] || `Bước ${idx + 1}`;
            const icon = STEP_LABELS[s]?.[0] || '✏️';
            return (
              <span key={s} className="intro-step-pill active">
                {icon} {label}
              </span>
            );
          })}
        </div>

        <div className="intro-facts-heading">
          <h4>🔍 Tóm tắt dữ kiện:</h4>
        </div>
        <div className="facts-list-container">
          {facts.map((fact, idx) => {
            const role = roles[idx] || 'known';
            const isAsk = role === 'unknown';
            return (
              <div key={idx} className={`fact-card-item ${isAsk ? 'ask-fact' : 'known-fact'}`}>
                <div className="num-dot">
                  {isAsk ? '?' : idx + 1}
                </div>
                <div>{fact}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="intro-bottom-bar">
        <button 
          className="hero-primary-btn intro-start-btn" 
          onClick={() => { playClick(); triggerHaptic('light'); onStart(); }}
        >
          Bắt đầu học ngay · ❤️ 3
        </button>
      </div>
    </div>
  );
}

function ReviewListView({ lessons, progress, openLesson, onBack }) {
  const reviews = getReviewLessons(lessons, progress, 10);
  
  return (
    <div className="review-list-page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="page-head">
        <button className="icon-btn" onClick={onBack}>←</button>
        <h1 style={{ flex: 1, margin: 0 }}>Luyện câu sai</h1>
        <span className="pill heart" style={{ margin: 0 }}>💔 {reviews.length}</span>
      </div>

      <div className="card" style={{ padding: '12px 14px', marginBottom: '14px', fontSize: '13px', fontWeight: '800', color: 'var(--muted)', lineHeight: 1.45 }}>
        Làm lại các bài toán này giúp con gỡ bỏ sai lầm cũ, hiểu sâu kiến thức và tích lũy thêm XP.
      </div>

      {reviews.length === 0 ? (
        <div className="empty">
          <div className="e">🏆</div>
          <b>Chúc mừng con!</b>
          <p>Không có bài học nào bị sai cần ôn tập lúc này.</p>
        </div>
      ) : (
        <div className="review-list">
          {reviews.map((r) => (
            <button key={r.lesson.id} className="card review-card" onClick={() => openLesson(r.index)}>
              <span className="tag">
                {r.reason === 'review-hard' ? 'Thử thách' : r.reason === 'review-mistakes' ? 'Phép tính' : 'Sửa sai'}
              </span>
              <b>{r.lesson.title}</b>
              <small>Lần học trước còn {r.mistakes} lỗi cần tự sửa. Nhấn để gỡ điểm.</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function QuestsView({ progress, onBack, openLesson, plan }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const quests = getDailyQuests(progress, todayStr);
  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const todayDayIndex = (new Date().getDay() + 6) % 7;
  const streak = progress?.streak || 0;

  return (
    <div className="quests-page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="page-head">
        <button className="icon-btn" onClick={onBack}>←</button>
        <h1 style={{ flex: 1, margin: 0 }}>Nhiệm vụ</h1>
        <span className="pill fire">🔥 {streak}</span>
      </div>

      <div className="streak-banner">
        <div className="fire">🔥</div>
        <div>
          <b>Streak {streak} ngày</b>
          <small>Hoàn thành 1 nhiệm vụ nữa để giữ lửa!</small>
        </div>
      </div>

      <div className="quest-row">
        {quests.map(q => (
          <div key={q.id} className={`quest-item ${q.completed ? 'done' : ''}`}>
            <div className="qi" style={{ background: q.completed ? 'var(--green-soft)' : 'var(--primary-soft)', color: q.completed ? 'var(--green)' : 'var(--primary)' }}>
              {q.completed ? '✓' : '🎯'}
            </div>
            <div>
              <b>{q.title}</b>
              <small>{q.completed ? 'Hoàn thành' : `Mục tiêu: ${q.target}`}</small>
            </div>
            <span className="reward">+{q.xp} XP</span>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: '20px' }}>
        <h2>Tuần này</h2>
        <span>{streak}/7 ngày</span>
      </div>
      
      <div className="streak-week-calendar" style={{ marginBottom: '24px' }}>
        {dayNames.map((day, idx) => {
          const isActive = idx <= todayDayIndex && idx > todayDayIndex - streak;
          return (
            <div key={day} className={`streak-day-cell ${isActive ? 'active-day' : ''}`}>
              <div className="day-ico">{isActive ? '🔥' : '·'}</div>
              <div className="day-lbl">{day}</div>
            </div>
          );
        })}
      </div>

      {plan?.primary && (
        <button 
          className="btn btn-primary btn-block" 
          onClick={() => openLesson(plan.primary.index)}
        >
          Làm nhiệm vụ còn lại 🚀
        </button>
      )}
    </div>
  );
}

function LeaderboardView({ onBack, openLesson, plan, progress }) {
  const studentName = progress.profile?.name || 'Minh Anh';
  const xp = progress.xp || 0;
  
  const board = [
    { rank: 1, icon: '🐯', name: 'Bảo Ngọc', level: 'Cấp 10', xp: 1680, me: false },
    { rank: 2, icon: '🦊', name: 'Đức Anh', level: 'Cấp 9', xp: Math.max(1325, xp + 85), me: false },
    { rank: 3, icon: '🦉', name: `${studentName} (em)`, level: `Cấp ${Math.floor(xp / 100) + 1}`, xp: xp, me: true },
    { rank: 4, icon: '🐰', name: 'Hà My', level: 'Cấp 8', xp: 1105, me: false },
    { rank: 5, icon: '🐼', name: 'Gia Huy', level: 'Cấp 7', xp: 980, me: false }
  ].sort((a, b) => b.xp - a.xp);

  const myPosition = board.findIndex(item => item.me);
  const myRank = myPosition + 1;
  const nextUp = myPosition > 0 ? board[myPosition - 1] : null;
  const xpDiff = nextUp ? (nextUp.xp - xp) : 0;

  return (
    <div className="leaderboard-page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)', overflowY: 'auto', boxSizing: 'border-box' }}>
      <div className="page-head">
        <button className="icon-btn" onClick={onBack}>←</button>
        <h1 style={{ flex: 1, margin: 0 }}>Bảng xếp hạng lớp</h1>
      </div>

      <div className="hero" style={{ padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', fontWeight: '800', opacity: 0.9 }}>Tuần này · Lớp 4A</div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '4px 0' }}>Hạng #{myRank}</h1>
        <p style={{ margin: 0, fontSize: '13px' }}>
          {xpDiff > 0 ? `Còn ${xpDiff} XP để lên hạng ${myRank - 1}` : 'Con đang dẫn đầu bảng xếp hạng! 🎉'}
        </p>
      </div>

      <div className="lb-list">
        {board.map((item, idx) => {
          const isTop = item.rank <= 3;
          return (
            <div 
              key={idx} 
              className={`card lb-row ${item.me ? 'me' : ''}`}
            >
              <span className={`lb-rank ${isTop ? 'top' : ''}`}>
                {idx + 1}
              </span>
              <div className="lb-av">
                {item.icon}
              </div>
              <div>
                <b>{item.name}</b>
                <small>{item.level}</small>
              </div>
              <span className="lb-xp">
                {item.xp} XP
              </span>
            </div>
          );
        })}
      </div>

      {plan?.primary && (
        <div style={{ marginTop: '16px' }}>
          <button 
            className="btn btn-primary btn-block" 
            onClick={() => openLesson(plan.primary.index)}
          >
            Học thêm để vượt hạng 🚀
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsView({ onBack, progress, setProgress }) {
  const toggleNotificationSetting = () => {
    setProgress(old => ({
      ...old,
      notificationsEnabled: !old.notificationsEnabled
    }));
  };

  const toggleChallengeMode = () => {
    setProgress(old => ({
      ...old,
      challengeMode: !old.challengeMode
    }));
  };

  const autoSpeak = progress.autoSpeak !== false;
  const toggleAutoSpeak = () => {
    setProgress(old => ({
      ...old,
      autoSpeak: !autoSpeak
    }));
  };

  const focusMode = !!progress.focusMode;
  const toggleFocusMode = () => {
    setProgress(old => ({
      ...old,
      focusMode: !focusMode
    }));
  };

  return (
    <div className="settings-page" style={{ padding: '16px', paddingBottom: 'calc(var(--nav-h, 72px) + var(--safe-b, 18px) + 16px)', boxSizing: 'border-box', overflowY: 'auto' }}>
      <div className="page-head">
        <button className="icon-btn" onClick={onBack}>←</button>
        <h1 style={{ flex: 1, margin: 0, fontSize: '18px', fontWeight: '900' }}>Cài đặt</h1>
      </div>

      <div style={{ display: 'grid', gap: '16px', textAlign: 'left' }}>
        <div className="settings-group-proto">
          <h3>Học tập</h3>
          <div className="card setting-row-proto">
            <div>
              <b>Đọc đề to</b>
              <small>Tự đọc lời thoại khi vào bài</small>
            </div>
            <button className={`switch ${autoSpeak ? 'on' : ''}`} onClick={toggleAutoSpeak}>
              <i></i>
            </button>
          </div>
          
          <div className="card setting-row-proto">
            <div>
              <b>Chế độ Thử thách</b>
              <small>Tiêu hao ❤️ khi xem gợi ý</small>
            </div>
            <button className={`switch ${progress.challengeMode ? 'on' : ''}`} onClick={toggleChallengeMode}>
              <i></i>
            </button>
          </div>

          <div className="card setting-row-proto">
            <div>
              <b>Chế độ tập trung</b>
              <small>Ẩn bớt hiệu ứng khi học</small>
            </div>
            <button className={`switch ${focusMode ? 'on' : ''}`} onClick={toggleFocusMode}>
              <i></i>
            </button>
          </div>
        </div>

        <div className="settings-group-proto">
          <h3>Thông báo</h3>
          <div className="card setting-row-proto">
            <div>
              <b>Nhắc giữ streak</b>
              <small>Báo chuông hằng ngày</small>
            </div>
            <button className={`switch ${progress.notificationsEnabled ? 'on' : ''}`} onClick={toggleNotificationSetting}>
              <i></i>
            </button>
          </div>
        </div>

        <div className="settings-group-proto">
          <h3>Tài khoản</h3>
          <div className="card setting-row-proto" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>👨‍👩‍👧</span>
              <div>
                <b>Liên kết phụ huynh</b>
                <small>Mã lớp: 4A-MINH</small>
              </div>
            </div>
            <span className="chev">›</span>
          </div>
          
          <div className="card setting-row-proto" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '24px' }}>ℹ️</span>
              <div>
                <b>Về Học Toán Vui</b>
                <small>Phiên bản App · v2.1.0</small>
              </div>
            </div>
            <span className="chev">›</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App

