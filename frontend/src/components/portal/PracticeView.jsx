import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BASE_URL } from '../../lib/api.js';

const QUIZ_BANKS = [
  {
    id: 'topography-grading',
    title: 'Site Topography & Environmental Grading',
    description: 'Master cut-and-fill optimization, slope percentage ratios, and stormwater contour redirects.',
    durationMins: 10,
    questionsCount: 5,
    difficulty: 'Intermediate',
    icon: 'terrain',
    questions: [
      {
        id: 1,
        question: 'What is the minimum recommended slope percentage away from building foundations for surface drainage?',
        options: [
          '0.5% for the first 5 feet',
          '2% to 5% for the first 10 feet',
          '8% to 12% across all planes',
          'Level 0% with sub-surface perforated pipes'
        ],
        correctIndex: 1,
        explanation: 'A 2% to 5% minimum slope for the first 10 feet (roughly 6 inches drop) ensures positive drainage away from foundations without causing topsoil erosion.'
      },
      {
        id: 2,
        question: 'When analyzing contour lines on a topographical map, V-shaped contours pointing uphill indicate what geological feature?',
        options: [
          'A geological ridge or knoll',
          'A flat plateau with water retention',
          'A valley, swale, or natural drainage stream',
          'An engineered retaining wall'
        ],
        correctIndex: 2,
        explanation: 'Contour lines forming a V or U pointing towards higher elevations indicate a drainage swale or stream valley, where runoff concentrates.'
      },
      {
        id: 3,
        question: 'In earthwork cut-and-fill balancing, what is the typical soil "bulking factor" (swell) considered after excavation of undisturbed clay-loam?',
        options: [
          '0% (Soil volume never changes)',
          '10% to 25% volume expansion',
          '50% to 60% compaction reduction',
          '-30% shrinkage'
        ],
        correctIndex: 1,
        explanation: 'Excavated soil breaks loose and increases in volume due to air voids. Clay-loam typically exhibits a 15% to 25% swell factor before final compaction.'
      },
      {
        id: 4,
        question: 'What is the maximum stable slope gradient for standard turfgrass maintenance without requiring mechanical terracing or retaining structures?',
        options: [
          '1:1 (45 degrees)',
          '1:2 (26.5 degrees)',
          '1:3 (18.4 degrees) or 33%',
          '1:10 (5.7 degrees)'
        ],
        correctIndex: 2,
        explanation: 'A 3:1 (horizontal to vertical) slope ratio is the standard industry safety maximum for lawn mowers and soil stabilization without retaining reinforcement.'
      },
      {
        id: 5,
        question: 'Which swale design provides optimal infiltration while preventing sediment scour during a 10-year storm event?',
        options: [
          'Narrow V-shaped asphalt ditch',
          'Broad parabolic vegetated bioswale with 1%-3% longitudinal slope',
          'Rectangular concrete gutter with 15% incline',
          'Horizontal circular ponding pit'
        ],
        correctIndex: 1,
        explanation: 'Broad parabolic bioswales slow velocity, filter heavy metals and suspended solids through turf, and promote groundwater recharge.'
      }
    ]
  },
  {
    id: 'hardscape-engineering',
    title: 'Hardscape Engineering & Masonry Construction',
    description: 'Structural cross-sections, mortar mixes, geogrid reinforcement, and frost line standards.',
    durationMins: 8,
    questionsCount: 4,
    difficulty: 'Advanced',
    icon: 'construction',
    questions: [
      {
        id: 1,
        question: 'At what height does a segmental gravity retaining wall typically mandate structural engineer stamped geogrid soil reinforcement?',
        options: [
          'Over 4 feet (1.2 meters) total height including embedment',
          'Over 10 feet only',
          'Under 2 feet for residential borders',
          'Any wall regardless of height'
        ],
        correctIndex: 0,
        explanation: 'Most municipal building codes mandate engineered calculations and geogrid soil reinforcement for retaining walls exceeding 4 feet from footing to cap.'
      },
      {
        id: 2,
        question: 'What is the recommended aggregate base compaction density for vehicular driveway permeable unit pavers?',
        options: [
          '70% Standard Proctor density',
          '95% to 98% Modified Proctor density (ASTM D1557)',
          '80% loose gravel with sand filler',
          'Compaction is not required under pavers'
        ],
        correctIndex: 1,
        explanation: 'Interlocking concrete pavers subjected to vehicular loads require minimum 95% to 98% Modified Proctor density to resist rutting and settlement.'
      },
      {
        id: 3,
        question: 'Where must weep holes with clear crushed stone and geotextile filter fabric be positioned in concrete masonry unit (CMU) retaining walls?',
        options: [
          'At the very top coping stone',
          'Just above the finished grade line of the lower tier at 4 to 6 foot spacing',
          'Directly in the center of the footing concrete',
          'Weep holes are never used in masonry'
        ],
        correctIndex: 1,
        explanation: 'Weep holes relieve hydrostatic water pressure behind the wall face. Positioning them right above lower finished grade allows gravity drainage.'
      },
      {
        id: 4,
        question: 'What is the optimal bedding sand layer thickness directly beneath interlocking dry-laid architectural patio pavers?',
        options: [
          '1 inch (25mm) uniform uncompacted concrete sand (ASTM C33)',
          '4 inches of masonry mortar',
          '1/8 inch stone dust',
          '6 inches of washed pea gravel'
        ],
        correctIndex: 0,
        explanation: 'A uniform 1-inch bed of sharp, washed concrete sand (ASTM C33) allows pavers to seat properly during plate compaction without sand pumping up joints.'
      }
    ]
  },
  {
    id: 'botanical-scenography',
    title: 'Botanical Scenography & Microclimate Planting',
    description: 'Canopy layering, xeriscape irrigation zones, and botanical root barrier design.',
    durationMins: 10,
    questionsCount: 4,
    difficulty: 'All Levels',
    icon: 'local_florist',
    questions: [
      {
        id: 1,
        question: 'In xeriscape design, grouping plants with identical moisture and sunlight requirements is termed:',
        options: [
          'Hydrozoning',
          'Monoculture sequencing',
          'Topiary drafting',
          'Allelopathy'
        ],
        correctIndex: 0,
        explanation: 'Hydrozoning groups plants into specific water-demand sectors (High, Moderate, Low, Very Low), maximizing irrigation efficiency and reducing plant stress.'
      },
      {
        id: 2,
        question: 'When specifying large shade trees near underground utility easements or paved sidewalks, what minimum root barrier depth is recommended?',
        options: [
          '6 inches',
          '18 to 24 inches with vertical deflective ribs',
          '5 feet solid steel plates',
          'No barrier required'
        ],
        correctIndex: 1,
        explanation: '18 to 24-inch HDPE barriers with vertical guide ribs force roots downward into deeper subsoil before spreading horizontally, protecting pavement.'
      },
      {
        id: 3,
        question: 'Which architectural planting stratum provides windbreak attenuation and sound buffering most effectively?',
        options: [
          'Multi-layered tier of dense evergreen canopy, intermediate shrubs, and groundcover',
          'Single row of deciduous birch trees',
          'Uniform 2-inch turfgrass meadow',
          'Single decorative pergola with wisteria'
        ],
        correctIndex: 0,
        explanation: 'Staggered evergreen canopy with dense intermediate understory absorbs acoustic vibrations and deflects laminar wind streams across properties.'
      },
      {
        id: 4,
        question: 'What soil testing parameter most directly determines phosphorus and micronutrient uptake availability in ornamental landscapes?',
        options: [
          'Soil pH level (Ideal range 6.0 to 7.0 for most ornamentals)',
          'Particle size of sand grains only',
          'Elevation above sea level',
          'Ambient atmospheric humidity'
        ],
        correctIndex: 0,
        explanation: 'Soil pH governs chemical solubility; in extreme alkaline (>7.8) or acid (<5.5) soils, key nutrients like iron and phosphorus become locked out from root absorption.'
      }
    ]
  }
];

const DEFAULT_ASSIGNMENTS = [
  {
    id: 'asg-01',
    title: 'Executive Cut-and-Fill Contour Calculation Sheet',
    module: 'Module 1: Topography & Site Grading',
    deadline: 'Self-Paced / Recommended Week 2',
    status: 'Pending', // Pending | Submitted | Graded
    description: 'Calculate the net cubic meters of cut and fill for a 2,500 sq.m residential hill slope based on the provided AutoCAD elevation contours.',
    points: 100,
    submissionNotes: ''
  },
  {
    id: 'asg-02',
    title: 'Reinforced Retaining Wall CAD Detail Section',
    module: 'Module 2: Hardscape Masonry & Engineering',
    deadline: 'Self-Paced / Recommended Week 4',
    status: 'Submitted',
    score: '96/100',
    description: 'Draft a 1:20 cross-section structural detail showing concrete footing, perforated French drain, geotextile wrap, and geogrid tiebacks.',
    points: 100,
    submissionNotes: 'Submitted DWG cross-section with perforated drain spec and ASTM C33 sand bed calculation.'
  },
  {
    id: 'asg-03',
    title: 'Hydrozone Palette & Drip Irrigation Layout',
    module: 'Module 3: Botanical Scenography',
    deadline: 'Self-Paced / Recommended Week 6',
    status: 'Pending',
    description: 'Design a microclimate plant schedule identifying canopy trees, intermediate shrubs, and xeriscape hydrozone GPM demands for Zone 9b.',
    points: 100,
    submissionNotes: ''
  }
];

export default function PracticeView({ onOpenProfile }) {
  const [activeSection, setActiveSection] = useState('quizzes'); // 'quizzes' | 'assignments'

  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionIdx]: selectedOptionIndex }
  const [showExplanation, setShowExplanation] = useState({}); // { [questionIdx]: boolean }
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Assignments state
  const [assignments, setAssignments] = useState(() => {
    try {
      const saved = localStorage.getItem('lm_student_assignments');
      return saved ? JSON.parse(saved) : DEFAULT_ASSIGNMENTS;
    } catch {
      return DEFAULT_ASSIGNMENTS;
    }
  });
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchLiveAssignments = async () => {
    const token = localStorage.getItem('lm_auth_token') || '';
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/api/assignments/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.assignments && data.assignments.length > 0) {
          const mapped = data.assignments.map(a => ({
            id: a.id,
            title: a.title,
            module: a.module_name,
            deadline: a.deadline,
            status: a.submission ? a.submission.status : 'Pending',
            score: a.submission?.score !== null && a.submission?.score !== undefined ? `${a.submission.score}/${a.points}` : null,
            feedback: a.submission?.feedback || null,
            gradedBy: a.submission?.graded_by || null,
            description: a.description,
            points: a.points,
            submissionNotes: a.submission?.submission_text || '',
            submittedAt: a.submission?.submitted_at ? new Date(a.submission.submitted_at).toLocaleDateString() : null
          }));
          setAssignments(mapped);
        }
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    }
  };

  useEffect(() => {
    fetchLiveAssignments();
  }, []);

  // Save assignments to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem('lm_student_assignments', JSON.stringify(assignments));
    } catch (e) {
      // Continue
    }
  }, [assignments]);

  const handleStartQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setShowExplanation({});
    setQuizCompleted(false);
  };

  const handleSelectOption = (optionIdx) => {
    if (selectedAnswers[currentQuestionIdx] !== undefined) return; // Answer already picked
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestionIdx]: optionIdx }));
    setShowExplanation((prev) => ({ ...prev, [currentQuestionIdx]: true }));
  };

  const calculateScore = () => {
    if (!activeQuiz) return { correct: 0, total: 0, pct: 0 };
    let correct = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correct += 1;
    });
    const total = activeQuiz.questions.length;
    return {
      correct,
      total,
      pct: Math.round((correct / total) * 100)
    };
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!activeAssignment || !submissionText.trim()) return;

    const token = localStorage.getItem('lm_auth_token') || '';
    if (token) {
      try {
        await fetch(`${BASE_URL}/api/assignments/${activeAssignment.id}/submit/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ submission_text: submissionText.trim() })
        });
      } catch (err) {
        console.error('Error submitting to server:', err);
      }
    }

    setAssignments((prev) =>
      prev.map((a) =>
        a.id === activeAssignment.id
          ? {
              ...a,
              status: 'Submitted',
              submissionNotes: submissionText.trim(),
              submittedAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })
            }
          : a
      )
    );

    setSubmitSuccess(true);
    setTimeout(() => {
      setSubmitSuccess(false);
      setActiveAssignment(null);
      setSubmissionText('');
      fetchLiveAssignments();
    }, 1200);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-1.5 border border-blue-200/60">
            <span className="material-symbols-outlined text-sm">shuffle</span>
            <span>Real-Time Practice Hub</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Practice &amp; Field Assignments</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Solidify your spatial engineering skills through interactive architectural quizzes and project drafting exercises.
          </p>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-stone-100 p-1.5 rounded-xl border border-stone-200">
          <button
            onClick={() => { setActiveSection('quizzes'); setActiveQuiz(null); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'quizzes'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">quiz</span>
            <span>Architectural Quizzes</span>
          </button>
          <button
            onClick={() => { setActiveSection('assignments'); setActiveQuiz(null); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'assignments'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span className="material-symbols-outlined text-sm">assignment</span>
            <span>Field Assignments</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: INTERACTIVE QUIZZES                                     */}
      {/* ============================================================== */}
      {activeSection === 'quizzes' && (
        <div className="space-y-6 max-w-5xl">
          {!activeQuiz ? (
            /* Quiz Library Grid */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {QUIZ_BANKS.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white border border-stone-200/90 rounded-2xl p-6 hover:shadow-lg hover:border-blue-400 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <span className="material-symbols-outlined text-2xl">{quiz.icon}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {quiz.difficulty} • {quiz.questionsCount} Questions
                      </span>
                      <h3 className="font-bold text-base text-stone-900 mt-0.5 group-hover:text-blue-700 transition-colors">
                        {quiz.title}
                      </h3>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        {quiz.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between">
                    <span className="text-xs text-stone-400 flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      ~{quiz.durationMins} mins
                    </span>
                    <button
                      onClick={() => handleStartQuiz(quiz)}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-blue-600 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <span>Start Assessment</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Active Live Quiz Runner */
            <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              {/* Quiz Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="p-2 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors cursor-pointer"
                    title="Exit Quiz"
                  >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                  </button>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                      Live Quiz Assessment
                    </span>
                    <h2 className="font-bold text-lg text-stone-900">{activeQuiz.title}</h2>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-stone-800">
                      Question {currentQuestionIdx + 1} of {activeQuiz.questions.length}
                    </span>
                    <div className="w-32 bg-stone-100 rounded-full h-1.5 mt-1 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {!quizCompleted ? (
                /* Question & Options View */
                <div className="space-y-6">
                  {/* Question Stem */}
                  <div className="p-4 sm:p-6 rounded-2xl bg-stone-50 border border-stone-200/80">
                    <span className="text-[11px] font-bold text-stone-400 font-mono block mb-1">
                      QUESTION #{currentQuestionIdx + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug">
                      {activeQuiz.questions[currentQuestionIdx].question}
                    </h3>
                  </div>

                  {/* Options List */}
                  <div className="space-y-3">
                    {activeQuiz.questions[currentQuestionIdx].options.map((option, optIdx) => {
                      const isPicked = selectedAnswers[currentQuestionIdx] === optIdx;
                      const hasAnswered = selectedAnswers[currentQuestionIdx] !== undefined;
                      const isCorrect = optIdx === activeQuiz.questions[currentQuestionIdx].correctIndex;

                      let btnStyle = 'border-stone-200 hover:border-stone-400 bg-white text-stone-800';
                      if (hasAnswered) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/30';
                        } else if (isPicked) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-950 ring-2 ring-rose-400/30';
                        } else {
                          btnStyle = 'border-stone-200 bg-stone-50/50 text-stone-400 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={hasAnswered}
                          onClick={() => handleSelectOption(optIdx)}
                          className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span className="leading-relaxed">{option}</span>
                          </div>

                          {hasAnswered && isCorrect && (
                            <span className="material-symbols-outlined text-emerald-600 text-lg shrink-0">
                              check_circle
                            </span>
                          )}
                          {hasAnswered && isPicked && !isCorrect && (
                            <span className="material-symbols-outlined text-rose-600 text-lg shrink-0">
                              cancel
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation Banner */}
                  <AnimatePresence>
                    {showExplanation[currentQuestionIdx] && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 space-y-1.5"
                      >
                        <div className="flex items-center gap-1.5 font-bold text-blue-900">
                          <span className="material-symbols-outlined text-base">info</span>
                          <span>Architectural Rationale &amp; Field Code</span>
                        </div>
                        <p className="leading-relaxed">
                          {activeQuiz.questions[currentQuestionIdx].explanation}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bottom Stepper Controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                    <button
                      disabled={currentQuestionIdx === 0}
                      onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs hover:bg-stone-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">arrow_back</span>
                      <span>Previous</span>
                    </button>

                    {currentQuestionIdx < activeQuiz.questions.length - 1 ? (
                      <button
                        disabled={selectedAnswers[currentQuestionIdx] === undefined}
                        onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                        className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <span>Next Question</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </button>
                    ) : (
                      <button
                        disabled={selectedAnswers[currentQuestionIdx] === undefined}
                        onClick={() => setQuizCompleted(true)}
                        className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-400 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-md"
                      >
                        <span className="material-symbols-outlined text-sm">done_all</span>
                        <span>Complete &amp; Calculate Score</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Completed Summary Card */
                <div className="py-8 text-center space-y-6 max-w-lg mx-auto">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
                    <span className="material-symbols-outlined text-4xl">emoji_events</span>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-100/70 px-3 py-1 rounded-full">
                      Assessment Completed
                    </span>
                    <h3 className="font-bold text-2xl text-stone-900 mt-2">
                      Score: {calculateScore().pct}% ({calculateScore().correct} of {calculateScore().total} Correct)
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 max-w-xs mx-auto">
                      {calculateScore().pct >= 80
                        ? 'Mastery Demonstrated! You have strong command over these architectural standards.'
                        : 'Review the module lessons and attempt the quiz again to hone your calculations.'}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => handleStartQuiz(activeQuiz)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">replay</span>
                      <span>Retake Assessment</span>
                    </button>
                    <button
                      onClick={() => setActiveQuiz(null)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Return to Practice Library
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: FIELD ASSIGNMENTS                                       */}
      {/* ============================================================== */}
      {activeSection === 'assignments' && (
        <div className="space-y-6 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className="bg-white border border-stone-200/90 rounded-2xl p-6 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        asg.status === 'Submitted'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : asg.status === 'Graded'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {asg.status}
                    </span>
                    <span className="text-[11px] font-mono text-stone-400 font-bold">
                      {asg.points} Pts
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {asg.module}
                    </span>
                    <h3 className="font-bold text-base text-stone-900 mt-0.5 leading-snug">
                      {asg.title}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                      {asg.description}
                    </p>
                  </div>

                  {asg.submissionNotes && (
                    <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-[11px] text-stone-600 space-y-1">
                      <strong className="text-stone-800 block">Your Submission Notes:</strong>
                      <p className="italic">"{asg.submissionNotes}"</p>
                      {asg.score && (
                        <span className="inline-block mt-1 font-bold text-emerald-700">
                          Grade: {asg.score}
                        </span>
                      )}
                    </div>
                  )}

                  {asg.feedback && (
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 space-y-1">
                      <strong className="text-emerald-900 block font-bold">
                        Faculty Review {asg.gradedBy ? `(${asg.gradedBy})` : ''}:
                      </strong>
                      <p className="leading-relaxed">{asg.feedback}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-stone-100 mt-6 flex items-center justify-between">
                  <span className="text-[10.5px] text-stone-400">
                    {asg.submittedAt ? `Submitted: ${asg.submittedAt}` : asg.deadline}
                  </span>
                  <button
                    onClick={() => {
                      setActiveAssignment(asg);
                      setSubmissionText(asg.submissionNotes || '');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-blue-600 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                  >
                    {asg.status === 'Submitted' ? 'Update Submission' : 'Submit Work'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Submission Modal */}
          {activeAssignment && (
            <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-stone-200 shadow-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                      Assignment Submission Desk
                    </span>
                    <h3 className="font-bold text-lg text-stone-900">{activeAssignment.title}</h3>
                  </div>
                  <button
                    onClick={() => setActiveAssignment(null)}
                    className="p-1 text-stone-400 hover:text-stone-800 rounded-lg cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>

                <p className="text-xs text-stone-600 leading-relaxed">
                  Provide your calculation methodology, AutoCAD layer notes, or link to your CAD blueprint drawings for review.
                </p>

                <form onSubmit={handleSubmitAssignment} className="space-y-4">
                  <textarea
                    required
                    rows={5}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="e.g. Cut-and-fill total: +1,240 cu.m cut, -1,180 cu.m fill. Net surplus soil balanced with perimeter berm terracing. DWG layers 01-CONTOURS-NEW and 02-EROSION-BARRIER verified..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-900 focus:bg-white focus:outline-none focus:border-blue-500 font-mono leading-relaxed"
                  />

                  {submitSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      <span>Assignment submitted in real time!</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveAssignment(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                    >
                      Confirm Submission
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
