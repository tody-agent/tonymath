import { useEffect, useMemo, useState } from 'react'
import lessons from './lessons.json'
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

const DEFAULT_PROGRESS = {
  completed: {},
  xp: 0,
  streak: 1,
  lastStudyDate: null,
  currentLesson: 0
}

function loadProgress() {
  try {
    const saved = localStorage.getItem('hoc-toan-vui-progress-v1')
    return saved ? { ...DEFAULT_PROGRESS, ...JSON.parse(saved) } : DEFAULT_PROGRESS
  } catch {
    return DEFAULT_PROGRESS
  }
}

function App() {
  const [view, setView] = useState('home')
  const [progress, setProgress] = useState(loadProgress)
  const [lessonIndex, setLessonIndex] = useState(progress.currentLesson || 0)
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState(null)
  const [secondSelected, setSecondSelected] = useState(null)
  const [factAnswers, setFactAnswers] = useState([])
  const [numberAnswer, setNumberAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [hintOpen, setHintOpen] = useState(false)
  const [mistakes, setMistakes] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [menuOpen, setMenuOpen] = useState(false)

  const lesson = lessons[lessonIndex]
  const completedCount = Object.keys(progress.completed).length
  const level = Math.floor(progress.xp / 100) + 1
  const levelProgress = progress.xp % 100

  useEffect(() => {
    localStorage.setItem('hoc-toan-vui-progress-v1', JSON.stringify(progress))
  }, [progress])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    if (progress.lastStudyDate !== today) {
      setProgress((old) => ({ ...old, lastStudyDate: today }))
    }
  }, [progress.lastStudyDate])

  const isUnlocked = (index) => index === 0 || Boolean(progress.completed[lessons[index - 1].id])

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
      setFeedback({ correct: true, message })
      setProgress((old) => ({ ...old, xp: old.xp + 10 }))
    } else {
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
    setView('complete')
  }

  function speakStory() {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(lesson.story)
    utterance.lang = 'vi-VN'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  function resetAllProgress() {
    if (!window.confirm('Xóa toàn bộ điểm và tiến độ học trên thiết bị này?')) return
    setProgress(DEFAULT_PROGRESS)
    setLessonIndex(0)
    setView('home')
    setMenuOpen(false)
  }

  const earnedStars = useMemo(
    () => Object.values(progress.completed).reduce((sum, item) => sum + item.stars, 0),
    [progress.completed]
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')} aria-label="Về trang chủ">
          <span className="brand-mascot">🦉</span>
          <span><strong>Học Toán</strong><small>Học cách học</small></span>
        </button>
        <div className="top-stats">
          <div className="level-card"><span>⭐</span><div><b>Cấp độ {level}</b><div className="mini-progress"><i style={{ width: `${levelProgress}%` }} /></div></div></div>
          <div className="stat"><span>🔥</span><b>{progress.streak}</b><small>ngày</small></div>
          <div className="stat"><span>🪙</span><b>{progress.xp}</b><small>điểm</small></div>
          <button className="avatar-button" onClick={() => setMenuOpen((open) => !open)}>👦</button>
        </div>
        {menuOpen && (
          <div className="profile-menu">
            <b>Bạn nhỏ chăm học</b>
            <span>{earnedStars} sao đã kiếm được</span>
            <button onClick={resetAllProgress}>Xóa tiến độ</button>
          </div>
        )}
      </header>

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

      <main className="main-content">
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

      <nav className="mobile-nav">
        <NavButton icon="🏠" label="Trang chủ" active={view === 'home'} onClick={() => setView('home')} />
        <NavButton icon="📚" label="Bài học" active={view === 'lesson'} onClick={() => setView('home')} />
        <NavButton icon="🏆" label="Thành tích" active={view === 'achievements'} onClick={() => setView('achievements')} />
        <NavButton icon="📈" label="Tiến độ" active={view === 'progress'} onClick={() => setView('progress')} />
      </nav>
    </div>
  )
}

function NavButton({ icon, label, active, onClick }) {
  return <button className={active ? 'nav-button active' : 'nav-button'} onClick={onClick}><span>{icon}</span><b>{label}</b></button>
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
  const { lesson, step, feedback, hintOpen, setHintOpen, hearts, validateStep, nextStep, speakStory, onBack } = props
  return (
    <div className="lesson-page">
      <div className="lesson-toolbar">
        <button className="icon-button" onClick={onBack}>←</button>
        <div className="lesson-progress"><span style={{ width: `${((step + 1) / 8) * 100}%` }} /></div>
        <button className="hint-button" onClick={() => setHintOpen((open) => !open)}>💡 Gợi ý</button>
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
          <div className="story-box">
            <button className="sound-button" onClick={speakStory} aria-label="Đọc đề bài">🔊</button>
            <p>{lesson.story}</p>
            <span className="story-emoji">{lesson.icon}</span>
          </div>

          {hintOpen && <div className="hint-panel"><span>💡</span><p>{lesson.hints[step]}</p></div>}

          <div className="question-area">
            <StepContent {...props} />
          </div>

          {feedback && (
            <div className={feedback.correct ? 'feedback correct' : 'feedback wrong'}>
              <span>{feedback.correct ? '🎉' : '🌱'}</span><p><b>{feedback.correct ? 'Chính xác!' : 'Thử lại nhé!'}</b>{feedback.message}</p>
            </div>
          )}

          <div className="lesson-actions">
            <button className="secondary-button" onClick={onBack}>Quay lại</button>
            {!feedback?.correct ? (
              <button className="primary-button" onClick={validateStep}>Kiểm tra</button>
            ) : (
              <button className="primary-button" onClick={nextStep}>{step === 7 ? 'Hoàn thành' : 'Tiếp theo'} →</button>
            )}
          </div>
        </section>
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
      <div className="section-heading"><span>1</span><div><h2>Nhìn câu chuyện bằng hình</h2><p>Số lượng đang thay đổi hay đang được so sánh?</p></div></div>
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
      <div className="section-heading"><span>?</span><div><h2>{title}</h2><p>Chạm vào câu con cho là đúng nhất.</p></div></div>
      <div className="option-list">
        {options.map((option, index) => <button key={option} disabled={frozen} className={selected === index ? 'option selected' : 'option'} onClick={() => setSelected(index)}><span>{String.fromCharCode(65 + index)}</span><p>{option}</p></button>)}
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
      <div className="section-heading"><span>3</span><div><h2>Đã biết hay cần tìm?</h2><p>Phân loại từng mẩu thông tin.</p></div></div>
      <div className="facts-grid">
        {lesson.facts.map((fact, index) => (
          <div className="fact-card" key={fact}>
            <p>{fact}</p>
            <div><button disabled={frozen} className={answers[index] === 'known' ? 'selected' : ''} onClick={() => setRole(index, 'known')}>✓ Đã biết</button><button disabled={frozen} className={answers[index] === 'unknown' ? 'selected' : ''} onClick={() => setRole(index, 'unknown')}>? Cần tìm</button></div>
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
      <div className="section-heading"><span>4</span><div><h2>Chọn mô hình phù hợp</h2><p>Mô hình nào diễn tả đúng mối quan hệ trong đề?</p></div></div>
      <div className="model-grid">
        {lesson.models.map((model, index) => <button disabled={frozen} key={model} className={selected === index ? 'model-card selected' : 'model-card'} onClick={() => setSelected(index)}><span>{icons[index]}</span><b>{model}</b></button>)}
      </div>
    </div>
  )
}

function OperationStep({ lesson, selected, setSelected, secondSelected, setSecondSelected, frozen }) {
  return (
    <div>
      <div className="section-heading"><span>5</span><div><h2>Chọn phép tính và giải thích</h2><p>Đúng phép tính chưa đủ — con cần biết tại sao.</p></div></div>
      <h3 className="mini-title">Phép tính nào phù hợp?</h3>
      <div className="operation-grid">{lesson.operations.map((operation, index) => <button disabled={frozen} key={operation} className={selected === index ? 'selected' : ''} onClick={() => setSelected(index)}>{operation}</button>)}</div>
      <h3 className="mini-title">Tại sao?</h3>
      <div className="reason-list">{lesson.reasons.map((reason, index) => <button disabled={frozen} key={reason} className={secondSelected === index ? 'selected' : ''} onClick={() => setSecondSelected(index)}><span>{index + 1}</span>{reason}</button>)}</div>
    </div>
  )
}

function CalculationStep({ lesson, value, setValue, frozen }) {
  const expression = lesson.operations[lesson.correctOperation]
  return (
    <div>
      <div className="section-heading"><span>6</span><div><h2>Tự tính toán</h2><p>Điền kết quả vào ô trống.</p></div></div>
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
      <div className="complete-actions"><button className="secondary-button" onClick={onHome}>Về hành trình</button>{hasNext && <button className="primary-button" onClick={onNext}>Bài tiếp theo →</button>}</div>
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

export default App
