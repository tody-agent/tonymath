import { useEffect, useMemo, useState, useRef } from 'react'
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
  updateBehavioralMetrics
} from './utils.js'
import { playSfx, speakText, cancelSpeech } from './audio.js'
import { getMascotSpeech, MASCOT_PROFILES, getIndicatorGuide } from './mascotDialogs.js'
import './App.css'

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

function loadProgress() {
  try {
    const saved = localStorage.getItem('tonymath-progress-v1')
    const cachedName = localStorage.getItem('tonymath-student-name') || ''
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
    const cachedName = localStorage.getItem('tonymath-student-name') || ''
    return {
      ...DEFAULT_PROGRESS,
      profile: { ...DEFAULT_PROGRESS.profile, name: cachedName }
    }
  }
}

function loadAudioSettings() {
  try {
    const saved = localStorage.getItem('tonymath-audio-settings-v1')
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
  const [hintUnlockedForCurrentStep, setHintUnlockedForCurrentStep] = useState(false)
  const [showHintConfirm, setShowHintConfirm] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDevMode, setIsDevMode] = useState(false)
  const [activeGuide, setActiveGuide] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState('')
  const [showIosInstructions, setShowIosInstructions] = useState(false)
  const [stepFailsSession, setStepFailsSession] = useState({})
  const [showWelcomeNudge, setShowWelcomeNudge] = useState(false)
  const [prevXpLevel, setPrevXpLevel] = useState(() => Math.floor((progress.xp || 0) / 100) + 1)
  const [newlyUnlockedAchievements, setNewlyUnlockedAchievements] = useState([])
  const isInitialMount = useRef(true)
  const [lessonStartTime, setLessonStartTime] = useState(null)
  const [stepStartTime, setStepStartTime] = useState(null)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [hasUsedShield, setHasUsedShield] = useState(false)
  const [stepConfettiActive, setStepConfettiActive] = useState(false)

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
    localStorage.setItem('tonymath-progress-v1', JSON.stringify(progress))
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
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const isStandalone = window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIos && !isStandalone) {
      const dismissed = localStorage.getItem('tonymath-ios-install-dismissed');
      if (dismissed !== 'true') {
        setShowInstallPrompt(true);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [])

  useEffect(() => {
    localStorage.setItem('tonymath-audio-settings-v1', JSON.stringify(audioSettings))
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
    speakText(feedback.message, rate, null, null, pitch)
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
    resetStepState(initialStep)
    setLessonStartTime(Date.now())
    setView('lesson')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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
      localStorage.setItem('tonymath-student-name', trimmed);
    }
    setIsEditingName(false);
  }

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

    if (isCorrect) {
      const praiseSfx = step === 7 ? 'praise' : 'correct'
      playSfx(praiseSfx, audioSettings.muted)
      const mascotMsg = getMascotSpeech(mascot, true, message, currentArchetype)
      setFeedback({ correct: true, message: mascotMsg })
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
      const mascotMsg = getMascotSpeech(mascot, false, message, currentArchetype)
      
      let nextHearts = hearts;
      if (hearts <= 1 && currentArchetype === 'budding_thinker' && !hasUsedShield) {
        setHasUsedShield(true);
        nextHearts = 1;
        const buddy = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
        setFeedback({ 
          correct: false, 
          message: `${mascotMsg} (🛡️ ${buddy.name} đã dùng Khiên Bảo Vệ bảo toàn tim cho con!)` 
        });
      } else {
        nextHearts = Math.max(0, hearts - 1);
        setFeedback({ correct: false, message: mascotMsg })
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
      speakText(`${praise.headline}. ${praise.lines[0]}`, resolveSpeechRate(audioSettings.speed))
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
      localStorage.setItem('tonymath-ios-install-dismissed', 'true');
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
              title: 'TonyMath 🚀',
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

  if (loadingPack) {
    return (
      <div className="app-shell loading-shell">
        <div className="loading-card">
          <span className="loading-mascot">{MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'}</span>
          <h2>Đang tải bài học vui...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-shell ${isSessionActive ? 'onboarding-shell' : ''}`}>
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
            <span className="brand-mascot">{MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'}</span>
            <span><strong>Học Toán</strong><small>Học cách học</small></span>
          </button>
          <div className="top-stats">
            <div className="level-card" onClick={() => handleOpenGuide('level')} title="Bấm để xem giải thích cấp độ"><span>⭐</span><div><b>Cấp độ {level}</b><div className="mini-progress"><i style={{ width: `${levelProgress}%` }} /></div></div></div>
            <div className="stat" onClick={() => handleOpenGuide('streak')} title="Bấm để xem giải thích ngày liên tiếp"><span>🔥</span><b>{progress.streak}</b><small>ngày</small></div>
            <div className="stat" onClick={() => handleOpenGuide('xp')} title="Bấm để xem giải thích điểm vàng"><span>🪙</span><b>{progress.xp}</b><small>điểm</small></div>
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
                  <button className="profile-sheet-close-btn" onClick={() => setMenuOpen(false)} aria-label="Đóng">✕</button>
                </div>
                <div className="profile-sheet-body">
                  
                  {/* Hồ sơ học sinh */}
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
                        <span className="profile-display-name">
                          {progress.profile?.name ? `Bé ${progress.profile.name}` : 'Bạn nhỏ chăm học'}
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
                  </div>

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

                  {/* Cố vấn học tập */}
                  <div className="profile-sheet-card">
                    <h4>{MASCOT_PROFILES[progress.profile?.mascot || 'owl']?.emoji || '🦉'} Cố vấn học tập</h4>
                    <div className="mascot-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px' }}>
                      {Object.keys(MASCOT_PROFILES).map(key => {
                        const mascotProfile = MASCOT_PROFILES[key];
                        const isSelected = (progress.profile?.mascot || 'owl') === key;
                        return (
                          <div 
                            key={key}
                            className={`mascot-select-card ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setProgress(old => {
                                const updated = { ...old, profile: { ...old.profile, mascot: key } };
                                localStorage.setItem('tonymath-progress-v1', JSON.stringify(updated));
                                return updated;
                              });
                              playSfx('click', audioSettings.muted);
                            }}
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

                  {/* Chế độ học tập */}
                  <div className="profile-sheet-card">
                    <h4>🎓 Chế độ học tập</h4>
                    <div className="pills-grid">
                      <button
                        className={`pill-button ${(progress.studyMode || 'full') === 'full' ? 'selected' : ''}`}
                        onClick={() => {
                          setProgress(old => {
                            const updated = { ...old, studyMode: 'full' };
                            localStorage.setItem('tonymath-progress-v1', JSON.stringify(updated));
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
                            localStorage.setItem('tonymath-progress-v1', JSON.stringify(updated));
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
                            localStorage.setItem('tonymath-progress-v1', JSON.stringify(updated));
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
                  <div className="profile-sheet-footer-actions">
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

                </div>
              </div>
            </>
          )}

      {!isSessionActive && (
        <aside className="sidebar">
          <nav>
            <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
            <NavButton icon="📚" label="Bài học" active={view === 'lessons-menu'} onClick={() => setView('lessons-menu')} />
            <NavButton icon="🏆" label="Thành quả" active={view === 'progress'} onClick={() => setView('progress')} />
          </nav>
          <CoachSidebar progress={progress} plan={learningPlan} openLesson={openLesson} />
        </aside>
      )}

      <main className={isSessionActive ? "main-content full-width" : "main-content"}>
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
          />
        )}
        {view === 'progress' && <InsightsView lessons={lessons} progress={activeProgress} openLesson={openLesson} earnedStars={earnedStars} />}
      </main>

      {!isSessionActive && (
        <nav className="mobile-nav">
          <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
          <NavButton icon="📚" label="Bài học" active={view === 'lessons-menu'} onClick={() => setView('lessons-menu')} />
          <NavButton icon="🏆" label="Thành quả" active={view === 'progress'} onClick={() => setView('progress')} />
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
            <h3>Cài đặt TonyMath trên iPhone/iPad</h3>
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
        const mascotEmoji = profile.emoji;
        const mascotName = profile.name;
        const guideData = getIndicatorGuide(mascot, activeGuide, progress);
        
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
  audioSettings
}) {
  const plan = getLearningPlan(lessons, progress)
  const mascot = progress?.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emoji;
  const mascotName = profile.name;
  const themeClass = `theme-${mascot}`;
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
    const rate = resolveSpeechRate(audioSettings?.speed || 'normal');
    const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
    speakText(speechBubbleText, rate * (profile.rateOffset || 1.0), null, null, profile.pitch || 1.0);
  };

  return (
    <div className="home-dashboard-page" style={{ padding: '24px', overflowY: 'auto', height: '100dvh', boxSizing: 'border-box', paddingBottom: '120px' }}>
      {showWelcomeNudge && (() => {
        const nudge = getWelcomeBackNudge(progress);
        return (
          <div className="welcome-nudge-banner" style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '2px solid #bfdbfe',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '24px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '40px' }}>{nudge.mascotEmoji}</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '800', color: '#1e3a8a' }}>{nudge.title}</h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#1e40af', lineHeight: '1.4' }}>{nudge.body}</p>
            </div>
            <button 
              onClick={onDismissNudge} 
              style={{
                background: '#ffffff',
                border: '1px solid #bfdbfe',
                color: '#2563eb',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Đã hiểu!
            </button>
          </div>
        )
      })()}

      <section className="home-hero-container">
        <div className={`home-hero-card ${themeClass}`}>
          <div className="mascot-hero-wrapper" onClick={handleSpeakMascot} title="Bấm để nghe tớ nói!">
            <div className="mascot-hero-avatar">
              <span className="mascot-emoji-large">{mascotEmoji}</span>
            </div>
            <span className="mascot-name-tag">{mascotName} 🔊</span>
          </div>

          <div className="speech-bubble-container" onClick={handleSpeakMascot} title="Bấm để nghe tớ nói!">
            <div className="speech-bubble">
              <p>{speechBubbleText}</p>
              <span className="speech-bubble-speaker-hint">🔊 Bấm để nghe</span>
            </div>
          </div>

          {plan?.primary ? (
            <div className="hero-cta-box">
              <div className="hero-cta-info">
                <span className="hero-cta-badge">
                  {plan.primary.kind === 'review' ? '🔄 ÔN TẬP' : '🚀 HỌC BÀI MỚI'}
                </span>
                <h3 className="hero-cta-title">
                  <span className="hero-cta-icon">{plan.primary.lesson.icon}</span>
                  {plan.primary.lesson.shortTitle}
                </h3>
                <span className="hero-skill-tag">{plan.primary.lesson.skill}</span>
                <p className="hero-blurb">{plan.primary.blurb}</p>
              </div>
              <button 
                className="hero-primary-btn" 
                onClick={() => { playSfx('click', audioSettings?.muted); openLesson(plan.primary.index); }}
              >
                {plan.primary.kind === 'review' ? 'Ôn tập ngay 🔄' : 'Chinh phục ngay 🚀'}
              </button>
            </div>
          ) : (
            <div className="hero-cta-box">
              <div className="hero-cta-info">
                <span className="hero-cta-badge">🏆 HOÀN THÀNH</span>
                <h3 className="hero-cta-title">
                  <span className="hero-cta-icon">🎉</span>
                  Đã hoàn tất!
                </h3>
                <p className="hero-blurb">Con đã vượt qua xuất sắc toàn bộ bài học. Luyện thêm Đấu trường nhé!</p>
              </div>
              <button 
                className="hero-primary-btn" 
                onClick={() => { playSfx('click', audioSettings?.muted); onOpenArena(); }}
              >
                Vào Đấu Trường ⚡
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="grade-progress-section" style={{
        background: '#ffffff',
        borderRadius: '24px',
        padding: '20px 24px',
        marginBottom: '24px',
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏫</span> Lộ trình: {currentGrade === 'grade-1' ? 'Lớp 1' : currentGrade === 'grade-2' ? 'Lớp 2' : currentGrade === 'grade-3' ? 'Lớp 3' : currentGrade === 'grade-4' ? 'Lớp 4' : 'Lớp 5'}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#92400e', background: '#fef3c7', padding: '4px 8px', borderRadius: '8px' }}>
              🎖️ {progress.profile?.academicLevel || 'Thành viên mới'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#2563eb', background: '#eff6ff', padding: '4px 8px', borderRadius: '8px' }}>
              {completedCount}/{lessons.length} bài đã học ({Math.round((completedCount / (lessons.length || 1)) * 100)}%)
            </span>
          </div>
        </div>
        <div style={{ height: '12px', background: '#f3f4f6', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #3b82f6 0%, #10b981 100%)',
            width: `${(completedCount / (lessons.length || 1)) * 100}%`,
            borderRadius: '6px',
            transition: 'width 1s ease-out'
          }}></div>
        </div>
      </section>

      <section className="secondary-quests-section">
        <h2 className="section-title-cute">🎮 Hoạt động rèn luyện</h2>
        <div className="secondary-quests-grid">
          <div className="secondary-quest-card card-arena" onClick={onOpenArena}>
            <div className="badge reflex">Luyện phản xạ</div>
            <div className="icon">⏱️</div>
            <h3>Đấu trường Tính nhanh</h3>
            <p>Giải nhanh các phép tính của bài đã học trong 60 giây.</p>
            <div className="bonus-xp">🔥 +5 XP / câu đúng</div>
            <button className="btn-action" onClick={(e) => { e.stopPropagation(); onOpenArena(); }}>Vào đấu trường ⚡</button>
          </div>

          <div className="secondary-quest-card card-buddy" onClick={onOpenBuddy}>
            <div className="badge fix">Sửa lỗi sai</div>
            <div className="icon">🐢</div>
            <h3>Góc Cố Vấn</h3>
            <p>Giúp Rùa Con/Cú Ú phát hiện lỗi sai trong bài tập.</p>
            <div className="bonus-xp">🧠 +15 XP / câu sửa sai</div>
            <button className="btn-action" onClick={(e) => { e.stopPropagation(); onOpenBuddy(); }}>Chữa lỗi sai 🩺</button>
          </div>

          <div className="secondary-quest-card card-map" onClick={() => setView('lessons-menu')}>
            <div className="badge map">Tất cả bài học</div>
            <div className="icon">🗺️</div>
            <h3>Bản đồ bài học</h3>
            <p>Tự do xem bản đồ và chinh phục lại các bài học.</p>
            <div className="bonus-xp">⭐ Săn sao & học lại</div>
            <button className="btn-action" onClick={(e) => { e.stopPropagation(); setView('lessons-menu'); }}>Mở bản đồ 🏝️</button>
          </div>
        </div>
      </section>

      <section className="personalized-progress-section">
        <h2 className="section-title-cute">📅 Nhật ký học tập của con</h2>
        <div className="personalized-progress-grid">
          {/* A. Recently studied */}
          {(() => {
            const recentlyStudied = getRecentlyStudiedLesson(lessons, progress, currentGrade, currentSubject);
            if (recentlyStudied) {
              const recIndex = lessons.findIndex(l => l.id === recentlyStudied.id);
              const done = progress.completed[recentlyStudied.id];
              return (
                <div className="progress-history-card" onClick={() => openLesson(recIndex)}>
                  <div className="card-header">
                    <span className="badge history">VỪA HỌC</span>
                    <span className="icon">{recentlyStudied.icon}</span>
                  </div>
                  <h3>{recentlyStudied.shortTitle}</h3>
                  <span className="skill-tag">{recentlyStudied.skill}</span>
                  <p className="blurb">
                    {done 
                      ? `Con đạt ⭐ ${done.stars}/3 sao với ${done.mistakes} lần tự sửa sai.` 
                      : `Hành trình đang dở dang. Hãy tiếp tục giải đố nào!`
                    }
                  </p>
                  <button className="btn-action-outline">Học lại 🔄</button>
                </div>
              )
            } else {
              return (
                <div className="progress-history-card empty" onClick={() => setView('lessons-menu')}>
                  <div className="card-header">
                    <span className="badge history">VỪA HỌC</span>
                    <span className="icon">🌱</span>
                  </div>
                  <h3>Học bài đầu tiên</h3>
                  <p className="blurb">Bắt đầu hành trình chinh phục toán học đầy thú vị hôm nay.</p>
                  <button className="btn-action-outline">Bắt đầu học 🚀</button>
                </div>
              )
            }
          })()}

          {/* B. Recommended review */}
          {(() => {
            // Find a review lesson that isn't the primary action
            const actualReview = plan?.reviews?.find(r => r.lesson.id !== plan.primary?.lesson?.id) || plan?.reviews?.[0];
            
            if (actualReview) {
              return (
                <div className="progress-history-card review" onClick={() => openLesson(actualReview.index)}>
                  <div className="card-header">
                    <span className="badge review">CẦN ÔN TẬP</span>
                    <span className="icon">{actualReview.lesson.icon}</span>
                  </div>
                  <h3>{actualReview.lesson.shortTitle}</h3>
                  <span className="skill-tag">{actualReview.lesson.skill}</span>
                  <p className="blurb">
                    Bài học này con còn {actualReview.mistakes} lỗi cần tự sửa. Ôn lại ngay nhé!
                  </p>
                  <button className="btn-action-outline">Ôn tập 🔄</button>
                </div>
              )
            } else {
              return (
                <div className="progress-history-card celebratory">
                  <div className="icon">🏆</div>
                  <h3>Bộ não siêu phàm</h3>
                  <p className="blurb">Con giải các bài toán rất chắc chắn, chưa có bài nào cần ôn gấp.</p>
                  <div className="celebrate-badge">Tuyệt vời! ✨</div>
                </div>
              )
            }
          })()}
        </div>
      </section>
    </div>
  )
}

function LessonsMenu({
  lessons,
  progress,
  openLesson,
  isUnlocked,
  completedCount,
  registry,
  currentGrade,
  currentSubject
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

  // Find where the first incomplete lesson is to expand that chapter by default
  const pathIndex = lessons.findIndex(l => !progress.completed?.[l.id]);
  const activeChapterId = pathIndex === -1 
    ? 1 
    : pathIndex < ch1End 
      ? 1 
      : pathIndex < ch2End 
        ? 2 
        : 3;

  const [expandedChapters, setExpandedChapters] = useState({
    1: activeChapterId === 1,
    2: activeChapterId === 2,
    3: activeChapterId === 3
  });

  const toggleChapter = (id) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="lessons-menu-page" style={{ padding: '24px', overflowY: 'auto', height: '100dvh', boxSizing: 'border-box', paddingBottom: '120px' }}>
      <div className="adventure-map-area">
        <section className="journey-hero">
          <div>
            <h1>Bản đồ phiêu lưu: {activeGradeObj?.title} - {activeSubjectObj?.title} 🚀</h1>
            <p>Con đang học rất tốt! Chọn bài học con muốn chinh phục hôm nay nhé.</p>
          </div>
          <div className="treasure">
            <span>🧰</span>
            <b>⭐ {completedCount}/{lessons.length}</b>
          </div>
        </section>

        {chapters.map(ch => {
          const chLessons = lessons.slice(ch.start, ch.end);
          const chCompleted = chLessons.filter(l => progress.completed[l.id]).length;
          const isExpanded = expandedChapters[ch.id];
          
          return (
            <div key={ch.id} className="chapter-section" style={{
              background: '#ffffff',
              borderRadius: '24px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
            }}>
              <div 
                onClick={() => toggleChapter(ch.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{ch.icon}</span>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#1e3a8a' }}>
                      {ch.title}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>
                      Đã xong: {chCompleted}/{chLessons.length} bài ({Math.round((chCompleted / (chLessons.length || 1)) * 100)}%)
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px', color: '#9ca3af', fontWeight: 'bold' }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              
              {isExpanded && (
                <div className="lesson-grid" style={{ marginTop: '20px' }}>
                  {chLessons.map((lesson, idx) => {
                    const originalIndex = ch.start + idx;
                    const complete = progress.completed[lesson.id];
                    const unlocked = isUnlocked(originalIndex);
                    return (
                      <button
                        key={lesson.id}
                        className={`lesson-card ${lesson.color} ${!unlocked ? 'locked' : ''} ${complete ? 'completed' : ''}`}
                        onClick={() => openLesson(originalIndex)}
                        disabled={!unlocked}
                      >
                        <span className="lesson-number">{originalIndex + 1}</span>
                        <span className="lesson-icon">{lesson.icon}</span>
                        <strong>{lesson.shortTitle}</strong>
                        <small>{lesson.skill}</small>
                        <div className="stars" aria-label={`${complete?.stars || 0} sao`}>
                          {[0, 1, 2].map((star) => <span key={star}>{complete && star < complete.stars ? '⭐' : '☆'}</span>)}
                        </div>
                        {!unlocked && <span className="lock">🔒</span>}
                        {complete && <span className="check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  )
}

function LessonView(props) {
  const { 
    lesson, step, feedback, setFeedback, hintOpen, setHintOpen, hearts, 
    validateStep, nextStep, speakStory, onBack, isAnswered,
    progress, hintUnlockedForCurrentStep, setHintUnlockedForCurrentStep,
    showHintConfirm, setShowHintConfirm, setHearts, setMistakes, audioSettings,
    stepConfettiActive, cooldownActive
  } = props
  const hasFeedback = Boolean(feedback);
  const isCorrect = feedback?.correct;

  const isChallenge = isChallengeModeActive(progress, lesson);

  const activeSteps = getActiveSteps(progress.studyMode || 'full', lesson)
  const currentStepIdx = activeSteps.indexOf(step)
  const progressPercent = activeSteps.length > 0 ? ((currentStepIdx + 1) / activeSteps.length) * 100 : 0

  function handleConfirmHint() {
    playClick();
    setShowHintConfirm(false);
    setHearts((h) => Math.max(0, h - 1));
    setMistakes((m) => m + 1);
    setHintUnlockedForCurrentStep(true);
    setHintOpen(true);
    const elapsed = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 0;
    setProgress(old => updateBehavioralMetrics(old, 'hint_opened', { latency: elapsed, step }));
  }

  return (
    <div className="lesson-page">
      {stepConfettiActive && <ConfettiCanvas active={true} />}
      <div className="lesson-toolbar">
        <button className="close-button" onClick={() => { playClick(); onBack(); }} aria-label="Quay lại danh sách bài học">✕</button>
        <div className="lesson-progress"><span style={{ width: `${progressPercent}%` }} /></div>
        {isChallenge && <span className="challenge-badge">⚡ Thử thách</span>}
        <button 
          className={`hint-button ${hintOpen ? 'active' : ''}`} 
          onClick={() => {
            playClick();
            if (isChallenge) {
              if (hintUnlockedForCurrentStep) {
                setHintOpen((open) => !open);
              } else {
                if (hearts <= 0) {
                  speakText("Con đã hết ❤️, hãy tự suy nghĩ hoặc bắt đầu lại bài nhé!", resolveSpeechRate(audioSettings.speed));
                  alert("Con đã hết ❤️, hãy tự suy nghĩ hoặc bắt đầu lại bài nhé!");
                } else {
                  setShowHintConfirm(true);
                }
              }
            } else {
              setHintOpen((open) => {
                const nextVal = !open;
                if (nextVal) {
                  const elapsed = stepStartTime ? Math.round((Date.now() - stepStartTime) / 1000) : 0;
                  setProgress(old => updateBehavioralMetrics(old, 'hint_opened', { latency: elapsed, step }));
                }
                return nextVal;
              });
            }
          }}
        >
          💡
        </button>
        <div className={`hearts ${isChallenge && hearts === 1 ? 'hearts-pulsing' : ''}`}>
          ❤️ {hearts}
        </div>
      </div>

      <div className="lesson-layout">
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
              <button className="btn-confirm" onClick={handleConfirmHint}>Đồng ý</button>
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
      return averageEqual 
        ? `San đều sách: Mỗi bạn sẽ có ${avg} ${lesson.unit || 'quyển sách'} bằng nhau!` 
        : 'Hãy bấm "San đều sách 🔄" để thấy chiều cao các cột bằng nhau thế nào nhé.'
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
          <button className="primary-button btn-widget-interact" onClick={() => { playClick(); setAverageEqual(prev => !prev); }}>
            {averageEqual ? 'Xem ban đầu ⏪' : 'San đều sách 🔄'}
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
              <button disabled={frozen} className={answers[index] === 'known' ? 'selected' : ''} onClick={() => { playClick(); setRole(index, 'known'); }}>✓ Đã biết</button>
              <button disabled={frozen} className={answers[index] === 'unknown' ? 'selected' : ''} onClick={() => { playClick(); setRole(index, 'unknown'); }}>? Cần tìm</button>
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
function CompleteView({ lesson, mistakes, progress, setProgress, plan, onHome, onOpenLesson, _lessonIndex }) {
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
      localStorage.setItem('tonymath-progress-v1', JSON.stringify(updated));
      return updated;
    });
    alert(`Chúc mừng! Con đã chuyển sang Chế độ học ${nudgeMode === 'express' ? 'Rút gọn ⚡' : 'Siêu tốc 🚀'} thành công.`);
    setNudgeMode(null);
  }

  function handleDeclineNudge() {
    playClick();
    setNudgeMode(null);
  }

  return (
    <section className="complete-screen">
      <div className="celebration">🎊</div>
      <h1>Hoàn thành bài học!</h1>
      <p>Con không chỉ tìm ra đáp án, mà còn biết giải thích cách suy nghĩ.</p>
      <div className="big-stars">{[0, 1, 2].map((i) => <span key={i} className={i < stars ? 'earned' : ''}>⭐</span>)}</div>
      <div className="result-card"><div><span>🧠</span><b>+{80 + stars * 10}</b><small>điểm tư duy</small></div><div><span>🌱</span><b>{mistakes}</b><small>lần tự sửa</small></div><div><span>{lesson.icon}</span><b>{lesson.skill}</b><small>kỹ năng mới</small></div></div>

      {nudgeMode && (() => {
        const nudgeMascot = progress.profile?.mascot || 'owl';
        const nudgeProfile = MASCOT_PROFILES[nudgeMascot] || MASCOT_PROFILES.owl;
        return (
          <div className="adaptive-nudge-box">
            <div className="nudge-avatar">
              {nudgeProfile.emoji}
            </div>
            <div className="nudge-content">
              <h4>
                {`${nudgeProfile.emoji} ${nudgeProfile.name} ${nudgeProfile.nudgeIntro || 'khuyên con:'}`}
              </h4>
              <p>
                {nudgeMode === 'express' 
                  ? 'Con giải toán rất nhanh và chính xác! Con có muốn chuyển sang Chế độ học Rút gọn (5 bước) để làm bài nhanh hơn không?' 
                  : 'Con học toán siêu đỉnh! Con có muốn thử thách bản thân với Chế độ học Siêu tốc (3 bước) để rèn luyện tư duy nhanh hơn không?'}
              </p>
              <div className="nudge-actions">
                <button className="nudge-btn-accept" onClick={handleAcceptNudge}>
                  {nudgeMode === 'express' ? 'Chuyển sang Rút gọn ⚡' : 'Chuyển sang Siêu tốc 🚀'}
                </button>
                <button className="nudge-btn-decline" onClick={handleDeclineNudge}>Giữ nguyên</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="complete-actions">
        <button className="secondary-button" onClick={() => { playClick(); onHome(); }}>Về hành trình</button>
        {hasNext && <button className="primary-button" onClick={() => { playClick(); onNext(); }}>Bài tiếp theo →</button>}
      </div>
    </section>
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
  const [name, setName] = useState(() => localStorage.getItem('tonymath-student-name') || '');
  const [mascot, setMascot] = useState('owl'); // 'owl' | 'robot' | 'turtle'
  const [selectedGrade, setSelectedGrade] = useState('grade-4');
  const [score, setScore] = useState(0);

  const mascots = Object.keys(MASCOT_PROFILES).map(key => ({
    id: key,
    emoji: MASCOT_PROFILES[key].emoji,
    label: MASCOT_PROFILES[key].name,
    desc: MASCOT_PROFILES[key].desc
  }));

  const grades = [
    { id: 'grade-1', label: 'Lớp 1', emoji: '👶' },
    { id: 'grade-2', label: 'Lớp 2', emoji: '🎒' },
    { id: 'grade-3', label: 'Lớp 3', emoji: '✏️' },
    { id: 'grade-4', label: 'Lớp 4', emoji: '📐' },
    { id: 'grade-5', label: 'Lớp 5', emoji: '🚀' }
  ];

  function handleStartTest() {
    if (!name.trim()) return;
    playClick();
    localStorage.setItem('tonymath-student-name', name.trim());
    setStage('test');
  }

  function handleSkipTest() {
    playClick();
    const finalName = name.trim() || 'Bạn nhỏ';
    setProgress(old => ({
      ...old,
      onboarded: true,
      currentGrade: selectedGrade,
      profile: {
        name: finalName,
        mascot: mascot,
        academicLevel: 'Starter',
        startingRecommendation: 'lesson-1'
      }
    }));
    localStorage.setItem('tonymath-student-name', finalName);
    setView('home');
  }

  if (stage === 'welcome') {
    return (
      <div className="onboarding-screen">
        <div className="onboarding-card">
          <span className="onboarding-header-emoji">🦉✨</span>
          <h1>Chào mừng con đến với TonyMath!</h1>
          <p>Học đọc hiểu và giải toán lời văn từng bước một cách thông minh.</p>
          
          <div className="onboarding-input-group">
            <label htmlFor="child-name">🕵️‍♂️ Nhập tên của con:</label>
            <div className="onboarding-input-wrapper">
              <span className="input-icon">✍️</span>
              <input
                id="child-name"
                type="text"
                placeholder="Ví dụ: Minh An, Bảo Vy..."
                value={name}
                onChange={e => {
                  const val = e.target.value;
                  setName(val);
                  localStorage.setItem('tonymath-student-name', val);
                }}
                maxLength={20}
              />
            </div>
          </div>
          
          <div className="mascot-selection-title">Chọn lớp học của con:</div>
          <div className="grade-select-grid">
            {grades.map(g => (
              <button
                key={g.id}
                type="button"
                className={`grade-select-btn grade-btn-${g.id} ${selectedGrade === g.id ? 'selected' : ''}`}
                onClick={() => { playClick(); setSelectedGrade(g.id); }}
              >
                <span className="emoji">{g.emoji}</span>
                <span>{g.label}</span>
              </button>
            ))}
          </div>
          
          <div className="mascot-selection-title">Chọn người bạn đồng hành:</div>
          <div className="mascot-select-grid">
            {mascots.map(m => (
              <button
                key={m.id}
                className={`mascot-select-card ${mascot === m.id ? `selected selected-${m.id}` : ''}`}
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
            onClick={handleStartTest}
          >
            Bắt đầu Thử thách Thám tử! 🚀
          </button>

          <button
            className="onboarding-btn-skip"
            onClick={handleSkipTest}
          >
            Bỏ qua bài test (Vào thẳng bài học)
          </button>
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
        onSkip={handleSkipTest}
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
  const mascotEmoji = profile.emoji;
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
  const mascotEmoji = profile.emoji;
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
  mascot
}) {
  const mascotEmoji = MASCOT_PROFILES[mascot]?.emoji || '🦉'

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
  mascot
}) {
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emoji;
  const mascotName = profile.name;

  return (
    <div className="buddy-page">
      <div className="buddy-header">
        <button className="back-btn" onClick={onBack}>✕ Thoát Góc Cố Vấn</button>
        <div className="buddy-title-badge">🧠 Sửa lỗi cho Linh vật</div>
      </div>

      {buddyQuestion && (
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



function InsightsView({ lessons, progress, openLesson, earnedStars }) {
  const [selectedAchievement, setSelectedAchievement] = useState(null)

  // 1. Character & Header indicators
  const level = Math.floor((progress.xp || 0) / 100) + 1;
  const levelProgress = (progress.xp || 0) % 100;
  const streak = progress.streak || 0;
  const xp = progress.xp || 0;
  
  const mascot = progress.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emoji;
  const mascotName = profile.name;
  const studentName = progress.profile?.name || 'Bé';

  // 2. Behavioral Archetype
  const archetype = progress.behavioralProfile?.currentArchetype || 'balanced';
  
  let archetypeTitle = 'Chiến Binh Cân Bằng ⚔️';
  let archetypeDesc = 'Con có sự cân bằng tuyệt vời giữa tốc độ và độ chính xác khi giải toán!';
  let archetypeColor = '#10B981'; // green

  if (archetype === 'pioneer') {
    archetypeTitle = 'Chiến Sĩ Tốc Độ ⚡';
    archetypeDesc = 'Con giải bài siêu nhanh! Hãy chú ý rà soát kỹ các dữ kiện để tránh lỗi sai cẩu thả nhé!';
    archetypeColor = '#3B82F6'; // blue
  } else if (archetype === 'scholar') {
    archetypeTitle = 'Học Giả Uyên Bác 🧠';
    archetypeDesc = 'Con lập luận vô cùng chặt chẽ và chính xác. Hãy tự tin tăng tốc độ giải nhanh hơn nữa nhé!';
    archetypeColor = '#8B5CF6'; // purple
  } else if (archetype === 'budding_thinker') {
    archetypeTitle = 'Chiến Sĩ Bền Bỉ 🐢';
    archetypeDesc = 'Con rất kiên trì và cẩn thận. Đừng ngại thử sức tự trả lời trước khi dùng gợi ý nhé!';
    archetypeColor = '#F59E0B'; // orange
  } else if (archetype === 'active_seeker') {
    archetypeTitle = 'Nhà Khám Phá Nhí 🗺️';
    archetypeDesc = 'Con rất yêu thích tìm tòi những thử thách mới! Hãy kiên trì hoàn thành bài học đang làm nhé!';
    archetypeColor = '#EC4899'; // pink
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
    <section className="insights-page" style={{ padding: '24px', overflowY: 'auto', boxSizing: 'border-box', paddingBottom: '120px' }}>
      <div className="page-title">
        <span>🏆</span>
        <div>
          <h1>Thành quả</h1>
          <p>Phân tích chỉ số anh hùng, huy hiệu đạt được và bài tập rèn luyện giúp bé tiến bộ.</p>
        </div>
      </div>

      <div className="insights-grid">
        {/* Left column: Hero card */}
        <div className="insights-card hero-card-large">
          <div className="hero-avatar-wrapper">
            <span className="hero-mascot">{mascotEmoji}</span>
            <div className="hero-sparkles">⭐✨</div>
          </div>
          <h2>{studentName}</h2>
          <div className="hero-level">Cấp độ {level}</div>
          <div className="hero-xp-bar">
            <div className="hero-xp-fill" style={{ width: `${levelProgress}%` }}></div>
            <span className="xp-text">{levelProgress}/100 XP</span>
          </div>
          <div className="hero-archetype-badge" style={{ backgroundColor: `${archetypeColor}1a`, border: `1px solid ${archetypeColor}`, color: archetypeColor, padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: '8px 0' }}>
            {archetypeTitle}
          </div>
          <p style={{ fontSize: '12px', opacity: 0.8, fontStyle: 'italic', margin: '4px 0 12px 0', lineHeight: '1.4' }}>
            {archetypeDesc}
          </p>
          <div className="hero-quick-stats">
            <div className="quick-stat-item">
              <span>🔥</span>
              <b>{streak} ngày</b>
              <small>Học liên tục</small>
            </div>
            <div className="quick-stat-item">
              <span>🪙</span>
              <b>{xp} điểm</b>
              <small>Tích lũy</small>
            </div>
          </div>
          <p className="hero-quote">
            "Chào bạn nhỏ! Tớ là <b>{mascotName}</b>. Hãy cùng tớ rèn luyện thêm các thuộc tính để thăng cấp nhé!"
          </p>
        </div>

        {/* Center: Attributes Grid */}
        <div className="insights-card attributes-card">
          <h3>📊 Chỉ số thuộc tính Anh hùng</h3>
          <div className="attributes-grid">
            {/* Logic Power */}
            <div className="attr-item">
              <div className="attr-header">
                <span>🧠 Trí tuệ Logic</span>
                <b>{logicPower}%</b>
              </div>
              <div className="attr-progress"><div className="attr-progress-fill bg-logic" style={{ width: `${logicPower}%` }}></div></div>
              <small>Tỷ lệ bài học đã hoàn thành: {completedLessons}/{totalLessons}</small>
            </div>

            {/* Speed */}
            <div className="attr-item">
              <div className="attr-header">
                <span>⚡ Tốc độ Chớp chớp</span>
                <b>{speedRank}</b>
              </div>
              <div className="attr-progress"><div className="attr-progress-fill bg-speed" style={{ width: `${speedScore}%` }}></div></div>
              <small>Thời gian giải bài trung bình: {avgDuration}s/bài</small>
            </div>

            {/* Accuracy */}
            <div className="attr-item">
              <div className="attr-header">
                <span>🎯 Độ Chính xác</span>
                <b>{accuracy}%</b>
              </div>
              <div className="attr-progress"><div className="attr-progress-fill bg-accuracy" style={{ width: `${accuracy}%` }}></div></div>
              <small>Tỷ lệ trả lời đúng qua các bước học</small>
            </div>

            {/* Stamina */}
            <div className="attr-item">
              <div className="attr-header">
                <span>🔥 Năng lượng Bền bỉ</span>
                <b>{streak > 0 ? `Cấp ${Math.min(5, streak)}` : 'Chưa kích hoạt'}</b>
              </div>
              <div className="attr-progress"><div className="attr-progress-fill bg-stamina" style={{ width: `${staminaScore}%` }}></div></div>
              <small>Học liên tục rèn luyện ý chí anh hùng</small>
            </div>
          </div>
        </div>
      </div>

      {/* 🏆 Achievements grid */}
      <div className="insights-card achievements-card" style={{ marginTop: '24px' }}>
        <h3>🏆 Kho báu Thành quả</h3>
        <div className="achievement-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
          {achievementsList.map(item => (
            <div
              key={item.id}
              className={item.unlocked ? 'achievement unlocked' : 'achievement'}
              onClick={() => setSelectedAchievement(item)}
              style={{ cursor: 'pointer' }}
            >
              <span className="achievement-icon">{item.icon}</span>
              <b>{item.title}</b>
              {item.unlocked ? (
                <small className="status-text unlocked-status-text">✨ Đã mở khóa</small>
              ) : (
                <>
                  <div className="achievement-progress-mini">
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${item.percent}%` }}></div>
                    </div>
                    <span className="progress-label">{item.current}/{item.target} ({item.percent}%)</span>
                  </div>
                  <small className="status-text locked-status-text">Tiếp tục để mở</small>
                </>
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

function CoachSidebar({ progress, plan, openLesson }) {
  const mascot = progress?.profile?.mascot || 'owl';
  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emoji;
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

function AchievementCelebration({ achievements, mascot, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const current = achievements[currentIndex];
  
  if (!current) return null;

  const profile = MASCOT_PROFILES[mascot] || MASCOT_PROFILES.owl;
  const mascotEmoji = profile.emoji;
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

export default App

