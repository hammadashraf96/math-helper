import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getLesson, LessonContent, PracticeProblem } from '@/services/lessons';
import { Topic, Course } from '@/constants/mathCurriculum';
import { useSavedProblems } from '@/store/savedProblems';
import { AnalysisResult } from '@/services/openai';

// ─── HTML Builder ─────────────────────────────────────────────────────────────

function buildLessonHtml(lesson: LessonContent, accentColor: string): string {
  const data = JSON.stringify(lesson);
  const accent = accentColor;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"><\/script>
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="init()"><\/script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F4F6FB;color:#1A1D2E;padding:14px 14px 0}
    .sec{background:#fff;border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06)}
    .sec-title{font-size:12px;font-weight:700;color:${accent};margin-bottom:12px;text-transform:uppercase;letter-spacing:0.7px}
    .intro{font-size:14px;line-height:22px;color:#374151}
    /* concepts */
    .cl{list-style:none}
    .ci{display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid #F3F4F6;font-size:13px;color:#374151;line-height:20px}
    .ci:last-child{border-bottom:none;padding-bottom:0}
    .dot{width:7px;height:7px;border-radius:50%;background:${accent};flex-shrink:0;margin-top:7px}
    /* formulas */
    .fb{background:${accent}15;border-radius:10px;padding:14px;margin-bottom:10px;text-align:center;overflow-x:auto}
    .fb:last-child{margin-bottom:0}
    /* examples */
    .ex{margin-bottom:18px;padding-bottom:18px;border-bottom:1px solid #F3F4F6}
    .ex:last-child{margin-bottom:0;padding-bottom:0;border-bottom:none}
    .ex-num{font-size:11px;font-weight:700;color:${accent};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
    .ex-prob{font-size:14px;font-weight:600;color:#1A1D2E;margin-bottom:12px;line-height:22px}
    .steps{margin-bottom:12px}
    .step{font-size:13px;color:#4B5563;line-height:20px;padding:7px 0 7px 14px;border-left:3px solid #E5E7EB;margin-left:4px;margin-bottom:7px}
    .step:last-child{margin-bottom:0}
    .ans-box{background:#EAFAF6;border-radius:10px;padding:10px 14px;display:flex;align-items:flex-start;gap:8px}
    .ans-lbl{font-size:11px;font-weight:700;color:#43D9AD;flex-shrink:0;padding-top:2px;text-transform:uppercase}
    .ans-val{font-size:13px;font-weight:600;color:#1A1D2E;line-height:20px;flex:1}
    /* practice */
    .pi{border:1.5px solid #E5E7EB;border-radius:14px;overflow:hidden;margin-bottom:12px}
    .pi:last-child{margin-bottom:0}
    .pq{padding:14px;font-size:14px;font-weight:600;color:#1A1D2E;line-height:22px;cursor:pointer;display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .pq-t{flex:1}
    .pq-i{font-size:15px;color:${accent};flex-shrink:0;margin-top:3px}
    /* step-by-step reveal */
    .p-inner{padding:0 14px;display:none}
    .p-inner.open{display:block;padding:0 14px 14px}
    .hint{background:#FFF8EC;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;color:#92400E;line-height:18px}
    .step-reveal{margin-bottom:10px}
    .step-r{font-size:13px;color:#4B5563;padding:7px 0 7px 13px;border-left:3px solid ${accent}40;margin-left:4px;margin-bottom:6px;line-height:20px;display:none}
    .step-r.shown{display:block}
    .p-btns{display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap}
    .btn-next{background:${accent}15;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;color:${accent};cursor:pointer}
    .btn-save{background:#6C63FF15;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:700;color:#6C63FF;cursor:pointer;display:none}
    .p-ans{background:${accent}12;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;color:#1A1D2E;line-height:20px;display:none}
    .p-ans.shown{display:block}
    /* summary */
    .sum-text{font-size:14px;line-height:22px;color:#374151}
    .katex-display{overflow-x:auto;overflow-y:hidden;padding:4px 0}
  </style>
</head>
<body>
<div id="root"></div>
<script>
var L = ${data};
function esc(s){var d=document.createElement('div');d.textContent=String(s);return d.innerHTML;}

function init(){
  var root=document.getElementById('root');
  root.innerHTML=buildHTML();
  renderMathInElement(root,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});
  // practice toggle
  root.querySelectorAll('.pq').forEach(function(btn){
    btn.addEventListener('click',function(){
      var inner=btn.nextElementSibling;
      var icon=btn.querySelector('.pq-i');
      var open=inner.classList.contains('open');
      inner.classList.toggle('open',!open);
      icon.textContent=open?'▼':'▲';
    });
  });
  // step-by-step
  root.querySelectorAll('.btn-next').forEach(function(btn){
    btn.addEventListener('click',function(){
      var container=btn.closest('.p-inner');
      var idx=parseInt(btn.dataset.idx);
      var steps=container.querySelectorAll('.step-r');
      var next=Array.prototype.slice.call(steps).find(function(s){return !s.classList.contains('shown');});
      if(next){
        next.classList.add('shown');
        // KaTeX re-render this step
        try{renderMathInElement(next,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});}catch(e){}
      }
      if(!Array.prototype.slice.call(steps).some(function(s){return !s.classList.contains('shown');})){
        // all steps shown — show answer + save button
        container.querySelector('.p-ans').classList.add('shown');
        try{renderMathInElement(container.querySelector('.p-ans'),{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false});}catch(e){}
        btn.style.display='none';
        var saveBtn=container.querySelector('.btn-save');
        if(saveBtn) saveBtn.style.display='inline-block';
      }
      reportHeight();
    });
  });
  // save button
  root.querySelectorAll('.btn-save').forEach(function(btn){
    btn.addEventListener('click',function(){
      var idx=parseInt(btn.dataset.idx);
      var p=L.practiceProblems[idx];
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'savePractice',
          idx:idx,
          question:p.question,
          steps:p.steps,
          answer:p.answer,
          topicTitle:L.topicTitle,
          courseTitle:L.courseTitle
        }));
      }
      btn.textContent='✓ Saved';
      btn.disabled=true;
    });
  });
  reportHeight();
}

function reportHeight(){
  setTimeout(function(){
    if(window.ReactNativeWebView)
      window.ReactNativeWebView.postMessage(JSON.stringify({height:document.body.scrollHeight+32}));
  },300);
}

function buildHTML(){
  var h='';
  // Intro
  h+='<div class="sec"><div class="sec-title">📖 Overview</div><p class="intro">'+esc(L.introduction)+'</p></div>';
  // Key concepts
  if(L.keyConcepts&&L.keyConcepts.length){
    h+='<div class="sec"><div class="sec-title">💡 Key Concepts</div><ul class="cl">';
    L.keyConcepts.forEach(function(c){h+='<li class="ci"><span class="dot"></span><span>'+esc(c)+'</span></li>';});
    h+='</ul></div>';
  }
  // Formulas
  if(L.keyFormulas&&L.keyFormulas.length){
    h+='<div class="sec"><div class="sec-title">📐 Key Formulas</div>';
    L.keyFormulas.forEach(function(f){h+='<div class="fb">'+esc(f)+'</div>';});
    h+='</div>';
  }
  // Worked examples
  if(L.workedExamples&&L.workedExamples.length){
    h+='<div class="sec"><div class="sec-title">✏️ Worked Examples</div>';
    L.workedExamples.forEach(function(ex,i){
      h+='<div class="ex"><div class="ex-num">Example '+(i+1)+'</div>';
      h+='<div class="ex-prob">'+esc(ex.problem)+'</div>';
      h+='<div class="steps">';
      (ex.steps||[]).forEach(function(s){h+='<div class="step">'+esc(s)+'</div>';});
      h+='</div>';
      h+='<div class="ans-box"><span class="ans-lbl">Answer</span><span class="ans-val">'+esc(ex.answer)+'</span></div>';
      h+='</div>';
    });
    h+='</div>';
  }
  // Practice problems
  if(L.practiceProblems&&L.practiceProblems.length){
    h+='<div class="sec"><div class="sec-title">🎯 Practice Problems</div>';
    L.practiceProblems.forEach(function(p,i){
      h+='<div class="pi">';
      h+='<div class="pq"><span class="pq-t">'+esc(p.question)+'</span><span class="pq-i">▼</span></div>';
      h+='<div class="p-inner">';
      if(p.hint) h+='<div class="hint">💡 Hint: '+esc(p.hint)+'</div>';
      h+='<div class="step-reveal">';
      (p.steps||[]).forEach(function(s){h+='<div class="step-r">'+esc(s)+'</div>';});
      h+='</div>';
      h+='<div class="p-btns">';
      h+='<button class="btn-next" data-idx="'+i+'">Show Next Step →</button>';
      h+='<button class="btn-save" data-idx="'+i+'">💾 Save Solution</button>';
      h+='</div>';
      h+='<div class="p-ans">✅ '+esc(p.answer)+'</div>';
      h+='</div></div>';
    });
    h+='</div>';
  }
  // Summary
  h+='<div class="sec"><div class="sec-title">✅ Summary</div><p class="sum-text">'+esc(L.summary)+'</p></div>';
  h+='<div style="height:14px"></div>';
  return h;
}
<\/script>
</body>
</html>`;
}

// ─── Quiz Mode ────────────────────────────────────────────────────────────────

function QuizModal({
  lesson,
  course,
  onClose,
}: {
  lesson: LessonContent;
  course: Course;
  onClose: () => void;
}) {
  const questions = lesson.practiceProblems;
  const [idx, setIdx] = useState(0);
  const [revealedSteps, setRevealedSteps] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [done, setDone] = useState(false);

  const current = questions[idx];

  const reset = () => { setRevealedSteps(0); setShowAnswer(false); };

  const next = () => {
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
      reset();
    } else {
      setDone(true);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={qStyles.safe} edges={['top']}>
        <View style={qStyles.header}>
          <TouchableOpacity onPress={onClose} style={qStyles.closeBtn}>
            <Ionicons name="close" size={20} color={Colors.text} />
          </TouchableOpacity>
          <Text style={qStyles.title}>Quiz</Text>
          <View style={[qStyles.progress, { backgroundColor: course.color + '20' }]}>
            <Text style={[qStyles.progressText, { color: course.color }]}>
              {done ? questions.length : idx + 1}/{questions.length}
            </Text>
          </View>
        </View>

        {done ? (
          <View style={qStyles.doneBox}>
            <Text style={qStyles.doneEmoji}>🎉</Text>
            <Text style={qStyles.doneTitle}>Quiz Complete!</Text>
            <Text style={qStyles.doneSub}>You worked through all {questions.length} practice problems.</Text>
            <TouchableOpacity
              style={[qStyles.retakeBtn, { backgroundColor: course.color }]}
              onPress={() => { setIdx(0); reset(); setDone(false); }}
            >
              <Text style={qStyles.retakeTxt}>Retake Quiz</Text>
            </TouchableOpacity>
            <TouchableOpacity style={qStyles.exitBtn} onPress={onClose}>
              <Text style={qStyles.exitTxt}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={qStyles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Progress bar */}
            <View style={qStyles.progBar}>
              <View
                style={[
                  qStyles.progFill,
                  { width: `${((idx) / questions.length) * 100}%`, backgroundColor: course.color },
                ]}
              />
            </View>

            {/* Question */}
            <View style={qStyles.qCard}>
              <Text style={[qStyles.qLabel, { color: course.color }]}>Question {idx + 1}</Text>
              <Text style={qStyles.qText}>{current.question}</Text>
            </View>

            {/* Hint */}
            {current.hint ? (
              <View style={qStyles.hintBox}>
                <Ionicons name="bulb-outline" size={14} color="#92400E" />
                <Text style={qStyles.hintText}>Hint: {current.hint}</Text>
              </View>
            ) : null}

            {/* Steps revealed so far */}
            {revealedSteps > 0 && (
              <View style={qStyles.stepsBox}>
                {current.steps.slice(0, revealedSteps).map((s, i) => (
                  <View key={i} style={[qStyles.stepRow, { borderLeftColor: course.color + '50' }]}>
                    <Text style={qStyles.stepNum}>Step {i + 1}</Text>
                    <Text style={qStyles.stepTxt}>{s}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Answer */}
            {showAnswer && (
              <View style={[qStyles.ansBox, { backgroundColor: course.color + '12' }]}>
                <Text style={[qStyles.ansLabel, { color: course.color }]}>Answer</Text>
                <Text style={qStyles.ansTxt}>{current.answer}</Text>
              </View>
            )}

            {/* Actions */}
            <View style={qStyles.actions}>
              {!showAnswer && revealedSteps < current.steps.length && (
                <TouchableOpacity
                  style={[qStyles.actionBtn, { backgroundColor: course.color + '15' }]}
                  onPress={() => setRevealedSteps(revealedSteps + 1)}
                >
                  <Text style={[qStyles.actionTxt, { color: course.color }]}>
                    Show Step {revealedSteps + 1}
                  </Text>
                </TouchableOpacity>
              )}

              {!showAnswer && revealedSteps >= current.steps.length && (
                <TouchableOpacity
                  style={[qStyles.actionBtn, { backgroundColor: course.color + '15' }]}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={[qStyles.actionTxt, { color: course.color }]}>Reveal Answer</Text>
                </TouchableOpacity>
              )}

              {showAnswer && (
                <TouchableOpacity
                  style={[qStyles.actionBtn, { backgroundColor: course.color }]}
                  onPress={next}
                >
                  <Text style={[qStyles.actionTxt, { color: '#fff' }]}>
                    {idx < questions.length - 1 ? 'Next Question →' : 'Finish Quiz'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── LessonViewer ─────────────────────────────────────────────────────────────

interface Props {
  topic: Topic;
  course: Course;
  onClose: () => void;
}

export default function LessonViewer({ topic, course, onClose }: Props) {
  const [lesson, setLesson] = useState<LessonContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [webHeight, setWebHeight] = useState(600);
  const [showQuiz, setShowQuiz] = useState(false);
  const { addScan } = useSavedProblems();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    setLesson(null);
    setError(null);
    setWebHeight(600);

    getLesson(course.id, topic.id, topic.title, course.title)
      .then((l) => { if (mounted.current) setLesson(l); })
      .catch((e) => { if (mounted.current) setError(e.message ?? 'Failed to load lesson'); });

    return () => { mounted.current = false; };
  }, [course.id, topic.id, course.title, topic.title]);

  const handleWebMessage = (e: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(e.nativeEvent.data);
      if (msg.height) {
        setWebHeight(msg.height);
      } else if (msg.type === 'savePractice' && lesson) {
        savePracticeSolution(msg);
      }
    } catch {
      // ignore malformed messages
    }
  };

  const savePracticeSolution = (msg: {
    question: string;
    steps: string[];
    answer: string;
    topicTitle: string;
    courseTitle: string;
  }) => {
    const result: AnalysisResult = {
      noProblemsFound: false,
      problems: [
        {
          question: `[${msg.courseTitle}] ${msg.topicTitle}: ${msg.question}`,
          steps: msg.steps.map((s, i) => ({
            stepNumber: i + 1,
            description: s,
            work: '',
            result: i === msg.steps.length - 1 ? msg.answer : '',
          })),
          answer: msg.answer,
          concepts: [msg.topicTitle, msg.courseTitle],
          difficulty: 'Medium' as const,
        },
      ],
    };
    addScan('', result)
      .then(() => Alert.alert('Saved', 'Practice solution added to your Saved tab.'))
      .catch(() => Alert.alert('Error', 'Could not save the solution.'));
  };

  return (
    <>
      <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: course.color + '30' }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="chevron-down" size={22} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={[styles.courseTag, { color: course.color, backgroundColor: course.bgColor }]}>
                {course.title}
              </Text>
              <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
            </View>
            <View style={[styles.timeTag, { backgroundColor: course.color + '15' }]}>
              <Ionicons name="time-outline" size={12} color={course.color} />
              <Text style={[styles.timeText, { color: course.color }]}>{topic.estimatedMinutes}m</Text>
            </View>
          </View>

          {/* Content */}
          {error ? (
            <View style={styles.centerBox}>
              <Ionicons name="alert-circle-outline" size={40} color={Colors.error} />
              <Text style={styles.statusTitle}>Couldn't load lesson</Text>
              <Text style={styles.statusSub}>{error}</Text>
            </View>
          ) : !lesson ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={course.color} />
              <Text style={styles.statusTitle}>Generating lesson…</Text>
              <Text style={styles.statusSub}>Powered by AI · Takes a few seconds</Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <WebView
                source={{ html: buildLessonHtml(lesson, course.color) }}
                style={{ height: webHeight, width: '100%' }}
                scrollEnabled={false}
                onMessage={handleWebMessage}
                showsVerticalScrollIndicator={false}
                originWhitelist={['*']}
              />

              {/* Take a Quiz button */}
              <View style={styles.quizBanner}>
                <View style={styles.quizBannerLeft}>
                  <Text style={styles.quizBannerTitle}>Ready to test yourself?</Text>
                  <Text style={styles.quizBannerSub}>
                    {lesson.practiceProblems.length} questions with step-by-step guidance
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.quizBtn, { backgroundColor: course.color }]}
                  onPress={() => setShowQuiz(true)}
                >
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.quizBtnTxt}>Take a Quiz</Text>
                </TouchableOpacity>
              </View>

              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Quiz Modal */}
      {showQuiz && lesson && (
        <QuizModal
          lesson={lesson}
          course={course}
          onClose={() => setShowQuiz(false)}
        />
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerCenter: { flex: 1 },
  courseTag: {
    fontSize: 11, fontWeight: '700',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 4,
  },
  topicTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 20 },
  timeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 0,
  },
  timeText: { fontSize: 12, fontWeight: '600' },
  scrollContent: { paddingBottom: 0 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  statusTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  statusSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  quizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  quizBannerLeft: { flex: 1 },
  quizBannerTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  quizBannerSub: { fontSize: 12, color: Colors.textSecondary },
  quizBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  quizBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});

const qStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    gap: 10,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
  progress: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  progressText: { fontSize: 13, fontWeight: '700' },

  scrollContent: { padding: 20 },
  progBar: {
    height: 4, backgroundColor: Colors.borderLight,
    borderRadius: 2, overflow: 'hidden', marginBottom: 20,
  },
  progFill: { height: '100%', borderRadius: 2 },

  qCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    padding: 20, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  qLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  qText: { fontSize: 16, fontWeight: '600', color: Colors.text, lineHeight: 24 },

  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    backgroundColor: '#FFF8EC', borderRadius: 12, padding: 12, marginBottom: 14,
  },
  hintText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 19 },

  stepsBox: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, marginBottom: 14,
  },
  stepRow: {
    borderLeftWidth: 3, paddingLeft: 12, marginBottom: 12,
  },
  stepNum: { fontSize: 10, fontWeight: '700', color: Colors.textTertiary, marginBottom: 3, textTransform: 'uppercase' },
  stepTxt: { fontSize: 13, color: Colors.text, lineHeight: 20 },

  ansBox: {
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  ansLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 },
  ansTxt: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 22 },

  actions: { gap: 10 },
  actionBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  actionTxt: { fontSize: 15, fontWeight: '700' },

  doneBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: Colors.text },
  doneSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  retakeBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  retakeTxt: { fontSize: 15, fontWeight: '700', color: '#fff' },
  exitBtn: { paddingVertical: 10 },
  exitTxt: { fontSize: 14, color: Colors.textSecondary, fontWeight: '600' },
});
