import React, { useMemo, useState } from 'react';

const TOTAL_STEPS = 8;

const DailyReflection = ({ onNavigate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    overallFeeling: '',
    yesterdayRating: 5,
    emotions: [],
    moodAffect: '',
    sleepQuality: '',
    sleepHours: '',
    energyLevel: '',
    completedTasks: '',
    stressLevel: '',
    feltLonely: '',
    bestPart: '',
    didWell: '',
    tookTimeForSelf: '',
    somethingMadeSmile: '',
    todayOutlook: '',
    emotionallyOkay: '',
    disturbingThoughts: '',
  });

  const progress = useMemo(() => Math.round((currentStep / TOTAL_STEPS) * 100), [currentStep]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleEmotion = (emotion) => {
    setFormData((prev) => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter((item) => item !== emotion)
        : [...prev.emotions, emotion],
    }));
  };

  const validateStep = () => {
    setError('');

    if (currentStep === 1) {
      if (!formData.overallFeeling) return 'Please select how you felt overall yesterday.';
      if (!formData.yesterdayRating) return 'Please rate your day from 1 to 10.';
    }

    if (currentStep === 2) {
      if (formData.emotions.length === 0) return 'Please select at least one emotion.';
      if (!formData.moodAffect.trim()) return 'Please share what affected your mood.';
    }

    if (currentStep === 3) {
      if (!formData.sleepQuality) return 'Please select your sleep quality.';
      if (!formData.sleepHours) return 'Please choose how many hours you slept.';
    }

    if (currentStep === 4) {
      if (!formData.energyLevel) return 'Please select your energy level.';
      if (!formData.completedTasks) return 'Please select your task completion status.';
    }

    if (currentStep === 5) {
      if (!formData.stressLevel) return 'Please select your stress level.';
      if (!formData.feltLonely) return 'Please select whether you felt lonely.';
    }

    if (currentStep === 6) {
      if (!formData.bestPart.trim()) return 'Please share the best part of your day.';
      if (!formData.didWell.trim()) return 'Please share one thing you did well.';
    }

    if (currentStep === 7) {
      if (!formData.tookTimeForSelf) return 'Please share whether you took time for yourself.';
      if (!formData.somethingMadeSmile) return 'Please share whether anything made you smile.';
      if (!formData.todayOutlook) return 'Please share how you would like today to be.';
    }

    if (currentStep === 8) {
      if (!formData.emotionallyOkay) return 'Please share if you felt emotionally okay yesterday.';
      if (!formData.disturbingThoughts) return 'Please share if you had any disturbing thoughts yesterday.';
    }

    return '';
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handlePrevious = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSubmitted(true);
  };

  const sectionTitle = {
    1: 'Overall Day Reflection 🌤️',
    2: 'Emotions 💭',
    3: 'Sleep 😴',
    4: 'Energy & Productivity ⚡',
    5: 'Stress & Social 🤝',
    6: 'Positive Reflection 🌱',
    7: 'Simple Self-Reflection 🌼',
    8: 'Safety 🛡️',
  };

  const summarySections = [
    {
      title: 'Overall Day Reflection 🌤️',
      items: [
        { label: 'How you felt overall', value: formData.overallFeeling },
        { label: 'Yesterday rating', value: `${formData.yesterdayRating}/10` },
      ],
    },
    {
      title: 'Emotions 💭',
      items: [
        { label: 'Emotions experienced', value: formData.emotions },
        { label: 'Mood influence', value: formData.moodAffect },
      ],
    },
    {
      title: 'Sleep 😴',
      items: [
        { label: 'Sleep quality', value: formData.sleepQuality },
        { label: 'Hours slept', value: formData.sleepHours },
      ],
    },
    {
      title: 'Energy & Productivity ⚡',
      items: [
        { label: 'Energy level', value: formData.energyLevel },
        { label: 'Task completion', value: formData.completedTasks },
      ],
    },
    {
      title: 'Stress & Social 🤝',
      items: [
        { label: 'Stress level', value: formData.stressLevel },
        { label: 'Felt lonely', value: formData.feltLonely },
      ],
    },
    {
      title: 'Positive Reflection 🌱',
      items: [
        { label: 'Best part of your day', value: formData.bestPart },
        { label: 'One thing you did well', value: formData.didWell },
      ],
    },
    {
      title: 'Simple Self-Reflection 🌼',
      items: [
        { label: 'Took time for yourself', value: formData.tookTimeForSelf },
        { label: 'Something made you smile', value: formData.somethingMadeSmile },
        { label: 'How you want today to be', value: formData.todayOutlook },
      ],
    },
    {
      title: 'Safety 🛡️',
      items: [
        { label: 'Felt emotionally okay', value: formData.emotionallyOkay },
        { label: 'Any disturbing thoughts', value: formData.disturbingThoughts },
      ],
    },
  ];

  const renderSummaryValue = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? value : ['Not provided'];
    }

    if (typeof value === 'string') {
      return value.trim() ? value : 'Not provided';
    }

    return value ?? 'Not provided';
  };

  const renderOptions = (field, options, type = 'radio') => (
    <div className="option-grid">
      {options.map((option) => {
        const isSelected =
          type === 'checkbox'
            ? formData[field].includes(option)
            : formData[field] === option;

        return (
          <label key={option} className={`option-chip ${isSelected ? 'selected' : ''}`}>
            <input
              type={type}
              name={field}
              value={option}
              checked={isSelected}
              onChange={() => {
                if (type === 'checkbox') {
                  toggleEmotion(option);
                } else {
                  updateField(field, option);
                }
              }}
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <div className="field">
              <label>How did you feel overall yesterday?</label>
              {renderOptions('overallFeeling', ['Good', 'Okay', 'Not great', 'Very difficult'])}
            </div>
            <div className="field">
              <label>Rate yesterday (1–10): {formData.yesterdayRating}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.yesterdayRating}
                onChange={(e) => updateField('yesterdayRating', Number(e.target.value))}
                className="range-input"
              />
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="field">
              <label>What emotions did you experience yesterday?</label>
              {renderOptions('emotions', ['Happy', 'Stress', 'Anxiety', 'Sadness', 'Anger'], 'checkbox')}
            </div>
            <div className="field">
              <label>Did anything affect your mood?</label>
              <input
                type="text"
                value={formData.moodAffect}
                onChange={(e) => updateField('moodAffect', e.target.value)}
                placeholder="Share what influenced your mood..."
              />
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="field">
              <label>How well did you sleep?</label>
              {renderOptions('sleepQuality', ['Very well', 'Okay', 'Poorly'])}
            </div>
            <div className="field">
              <label>How many hours did you sleep?</label>
              {renderOptions('sleepHours', ['5 hrs', '6 hrs', '7 hrs', '8 hrs'])}
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="field">
              <label>Energy level</label>
              {renderOptions('energyLevel', ['Low', 'Medium', 'High'])}
            </div>
            <div className="field">
              <label>Were you able to complete your tasks?</label>
              {renderOptions('completedTasks', ['Yes', 'Partially', 'No'])}
            </div>
          </>
        );
      case 5:
        return (
          <>
            <div className="field">
              <label>How stressed did you feel yesterday?</label>
              {renderOptions('stressLevel', ['Not at all', 'A little', 'A lot'])}
            </div>
            <div className="field">
              <label>Did you feel lonely at any point?</label>
              {renderOptions('feltLonely', ['Yes', 'No'])}
            </div>
          </>
        );
      case 6:
        return (
          <>
            <div className="field">
              <label>What was the best part of your day?</label>
              <textarea
                rows="4"
                value={formData.bestPart}
                onChange={(e) => updateField('bestPart', e.target.value)}
                placeholder="A moment, person, or activity that stood out..."
              />
            </div>
            <div className="field">
              <label>One thing you did well yesterday?</label>
              <textarea
                rows="4"
                value={formData.didWell}
                onChange={(e) => updateField('didWell', e.target.value)}
                placeholder="A small win is still a win 💚"
              />
            </div>
          </>
        );
      case 7:
        return (
          <>
            <div className="field">
              <label>Did you take some time for yourself yesterday?</label>
              {renderOptions('tookTimeForSelf', ['Yes', 'No'])}
            </div>
            <div className="field">
              <label>Did anything make you smile yesterday?</label>
              {renderOptions('somethingMadeSmile', ['Yes', 'No'])}
            </div>
            <div className="field">
              <label>How would you like today to be?</label>
              {renderOptions('todayOutlook', ['Better', 'Same', 'Not sure'])}
            </div>
          </>
        );
      case 8:
        return (
          <>
            <div className="field">
              <label>Did you feel emotionally okay yesterday?</label>
              {renderOptions('emotionallyOkay', ['Yes', 'No'])}
            </div>
            <div className="field">
              <label>Did you have any disturbing thoughts yesterday?</label>
              {renderOptions('disturbingThoughts', ['Yes', 'No'])}
            </div>
          </>
        );
      default:
        return null;
    }
  };

  if (submitted) {
    return (
      <div className="reflection-page">
        <div className="reflection-card">
          <h1>Daily Reflection - Yesterday Check-In</h1>
          <p className="subtitle">Thank you for sharing. We're here to support your well-being.</p>

          <div className="summary-card">
            <h2>Your Reflection Summary</h2>
            <p className="summary-intro">You can expand each section to review your responses 💚</p>

            <div className="summary-grid">
              {summarySections.map((section, index) => (
                <details className="summary-section" key={section.title} open={index === 0}>
                  <summary>{section.title}</summary>
                  <div className="summary-list">
                    {section.items.map((item) => {
                      const value = renderSummaryValue(item.value);
                      return (
                        <div className="summary-row" key={item.label}>
                          <p className="summary-label">{item.label}</p>
                          {Array.isArray(value) ? (
                            <div className="summary-chips">
                              {value.map((chip) => (
                                <span className="summary-chip" key={chip}>{chip}</span>
                              ))}
                            </div>
                          ) : (
                            <p className="summary-value">{value}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="button-row summary-actions">
            <button
              className="btn"
              onClick={() => {
                setSubmitted(false);
                setCurrentStep(1);
              }}
            >
              Edit Responses
            </button>
            <button className="btn btn-primary" onClick={() => onNavigate?.('dashboard')}>
              Continue to Dashboard
            </button>
          </div>
        </div>

        <style jsx>{styles}</style>
      </div>
    );
  }

  return (
    <div className="reflection-page">
      <form className="reflection-card" onSubmit={handleSubmit}>
        <h1>Daily Reflection - Yesterday Check-In</h1>
        <p className="subtitle">A gentle check-in to understand how yesterday felt for you 🌿</p>

        <div className="progress-meta">
          <span>Step {currentStep} of {TOTAL_STEPS}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress}>
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        <div key={currentStep} className="step-panel">
          <h2>{sectionTitle[currentStep]}</h2>
          {renderStep()}
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="button-row">
          <button type="button" className="btn" onClick={handlePrevious} disabled={currentStep === 1}>
            Previous
          </button>

          {currentStep < TOTAL_STEPS ? (
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit" className="btn btn-primary">
              Submit Reflection
            </button>
          )}
        </div>
      </form>

      <style jsx>{styles}</style>
    </div>
  );
};

const styles = `
  .reflection-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: linear-gradient(145deg, rgba(196, 237, 194, 0.35), rgba(248, 250, 243, 1));
  }

  .reflection-card {
    width: min(760px, 100%);
    background: rgba(255, 255, 255, 0.88);
    backdrop-filter: blur(8px);
    border-radius: 24px;
    padding: clamp(1.25rem, 2vw, 2rem);
    box-shadow: 0 16px 40px rgba(45, 52, 44, 0.12);
    border: 1px solid rgba(172, 180, 169, 0.35);
    animation: cardEnter 420ms ease;
  }

  h1 {
    color: var(--color-on-surface);
    font-size: clamp(1.4rem, 3.4vw, 2rem);
    margin-bottom: 0.35rem;
  }

  .subtitle {
    color: var(--color-on-surface-variant);
    margin-bottom: 1rem;
  }

  .progress-meta {
    display: flex;
    justify-content: space-between;
    color: var(--color-on-surface-variant);
    font-weight: 600;
    margin-bottom: 0.4rem;
    font-size: 0.9rem;
  }

  .progress-track {
    height: 10px;
    border-radius: 9999px;
    background: #e4eadf;
    overflow: hidden;
    margin-bottom: 1.2rem;
  }

  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, #7da47d, #436745);
    transition: width 320ms ease;
  }

  .step-panel {
    animation: slideFade 280ms ease;
  }

  .step-panel h2 {
    font-size: 1.15rem;
    margin-bottom: 1rem;
    color: var(--color-primary);
  }

  .field {
    margin-bottom: 1rem;
  }

  .field label {
    display: block;
    margin-bottom: 0.55rem;
    font-weight: 600;
    color: var(--color-on-surface);
  }

  .option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.65rem;
  }

  .option-chip {
    border: 1px solid #c7cec3;
    border-radius: 14px;
    padding: 0.6rem 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 180ms ease;
    background: #fbfdf8;
  }

  .option-chip:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 18px rgba(45, 52, 44, 0.07);
  }

  .option-chip.selected {
    border-color: #436745;
    background: #ecf5e9;
    box-shadow: 0 8px 18px rgba(67, 103, 69, 0.12);
  }

  .option-chip input {
    accent-color: #436745;
  }

  input[type='text'],
  input[type='number'],
  textarea {
    width: 100%;
    border: 1px solid #c7cec3;
    border-radius: 12px;
    padding: 0.75rem 0.9rem;
    font-size: 0.98rem;
    color: var(--color-on-surface);
    background: #fff;
  }

  input[type='text']:focus,
  input[type='number']:focus,
  textarea:focus {
    outline: none;
    border-color: #436745;
    box-shadow: 0 0 0 3px rgba(67, 103, 69, 0.15);
  }

  .range-input {
    width: 100%;
    accent-color: #436745;
  }

  .button-row {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .btn {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.1rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
    background: #dde5d9;
    color: #2d342c;
  }

  .btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(45, 52, 44, 0.12);
  }

  .btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .btn-primary {
    background: linear-gradient(145deg, #436745 0%, #375b3a 100%);
    color: var(--color-on-primary);
  }

  .error-message {
    margin-top: 0.4rem;
    background: rgba(167, 59, 33, 0.08);
    color: #8f2e17;
    padding: 0.65rem 0.8rem;
    border-radius: 10px;
    border: 1px solid rgba(167, 59, 33, 0.2);
    font-size: 0.92rem;
  }

  .summary-card {
    background: #f7fbf4;
    border: 1px solid #d2dfcc;
    border-radius: 16px;
    padding: 1rem;
    margin: 1.25rem 0;
  }

  .summary-card h2 {
    margin-bottom: 0.3rem;
    color: var(--color-primary);
    font-size: 1.1rem;
  }

  .summary-intro {
    font-size: 0.92rem;
    color: var(--color-on-surface-variant);
    margin-bottom: 0.85rem;
  }

  .summary-grid {
    display: grid;
    gap: 0.65rem;
  }

  .summary-section {
    border: 1px solid #d9e4d4;
    border-radius: 12px;
    background: #ffffff;
    overflow: hidden;
    transition: box-shadow 180ms ease, border-color 180ms ease;
  }

  .summary-section[open] {
    border-color: #bfd0b7;
    box-shadow: 0 8px 18px rgba(67, 103, 69, 0.08);
  }

  .summary-section summary {
    list-style: none;
    cursor: pointer;
    padding: 0.75rem 0.9rem;
    font-weight: 700;
    color: #375b3a;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
  }

  .summary-section summary::-webkit-details-marker {
    display: none;
  }

  .summary-section summary::after {
    content: '▾';
    font-size: 0.9rem;
    transition: transform 160ms ease;
  }

  .summary-section[open] summary::after {
    transform: rotate(180deg);
  }

  .summary-list {
    padding: 0.2rem 0.9rem 0.85rem;
    display: grid;
    gap: 0.65rem;
  }

  .summary-row {
    background: #f9fcf7;
    border: 1px solid #e3ecdf;
    border-radius: 10px;
    padding: 0.65rem 0.7rem;
  }

  .summary-label {
    font-size: 0.82rem;
    color: #5a6857;
    margin-bottom: 0.2rem;
    font-weight: 600;
  }

  .summary-value {
    font-size: 0.96rem;
    color: #2d342c;
    line-height: 1.45;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .summary-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
  }

  .summary-chip {
    background: #ecf5e9;
    border: 1px solid #cfe0c8;
    color: #365a39;
    border-radius: 999px;
    padding: 0.22rem 0.55rem;
    font-size: 0.82rem;
    font-weight: 600;
  }

  .summary-actions {
    margin-top: 0.4rem;
  }

  @keyframes slideFade {
    from {
      opacity: 0;
      transform: translateX(12px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes cardEnter {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 640px) {
    .reflection-page {
      padding: 0.7rem;
      align-items: flex-start;
    }

    .reflection-card {
      margin-top: 0.5rem;
      border-radius: 20px;
    }

    .button-row {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }
  }
`;

export default DailyReflection;