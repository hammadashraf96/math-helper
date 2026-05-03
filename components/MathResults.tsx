import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { MathProblem, AnalysisResult } from '@/services/openai';
import { Colors } from '@/constants/Colors';

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
  Advanced: '#8b5cf6',
};

function buildProblemHtml(problem: MathProblem): string {
  // Pass data safely via JSON — DOM is built with textContent (no XSS)
  const data = JSON.stringify(problem);

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      font-size:13px;color:#2D3748;background:#ffffff;
      padding:0 14px 16px;line-height:1.65;
    }
    .section-label{
      font-size:10px;font-weight:700;color:#718096;
      text-transform:uppercase;letter-spacing:.6px;
      margin:0 0 10px;
    }
    .step{display:flex;gap:10px;margin-bottom:14px}
    .step-num{
      width:24px;height:24px;border-radius:12px;
      background:rgba(108,99,255,.12);flex-shrink:0;margin-top:2px;
      display:flex;align-items:center;justify-content:center;
      font-size:11px;font-weight:800;color:#6C63FF;
    }
    .step-body{flex:1;min-width:0}
    .step-desc{font-size:13px;color:#2D3748;margin-bottom:6px}
    .step-work{
      background:rgba(108,99,255,.06);border-left:3px solid #6C63FF;
      border-radius:0 6px 6px 0;padding:8px 10px;margin-bottom:6px;
      overflow-x:auto;font-size:13px;
    }
    .step-result{font-size:13px;font-weight:600;color:#6C63FF;display:flex;align-items:center;gap:4px}
    .arrow{font-size:11px;opacity:.7}
    .answer-box{
      background:rgba(34,197,94,.07);border:1px solid rgba(34,197,94,.28);
      border-radius:12px;padding:14px;margin:4px 0 14px;
    }
    .answer-label{
      font-size:10px;font-weight:700;color:#22c55e;
      text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px;
    }
    .answer-text{font-size:17px;font-weight:800;color:#2D3748}
    .concepts-wrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:2px}
    .concept-tag{
      background:rgba(108,99,255,.12);color:#6C63FF;
      font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;
    }
    .katex{font-size:1em}
    .katex-display{margin:4px 0;overflow-x:auto}
  </style>
</head>
<body>
<div id="root"></div>
<script>
var p = ${data};
var root = document.getElementById('root');

function el(tag, cls) {
  var e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function setText(e, t) { e.textContent = t; return e; }

// Steps label
root.appendChild(setText(el('div','section-label'), 'Step-by-Step Solution'));

// Steps
p.steps.forEach(function(step, i) {
  var stepDiv = el('div','step');
  stepDiv.appendChild(setText(el('div','step-num'), String(i+1)));
  var body = el('div','step-body');

  body.appendChild(setText(el('div','step-desc'), step.description));

  if (step.work) {
    body.appendChild(setText(el('div','step-work'), step.work));
  }
  if (step.result) {
    var res = el('div','step-result');
    res.appendChild(setText(el('span','arrow'), '→'));
    res.appendChild(setText(el('span'), ' ' + step.result));
    body.appendChild(res);
  }
  stepDiv.appendChild(body);
  root.appendChild(stepDiv);
});

// Answer box
var ab = el('div','answer-box');
ab.appendChild(setText(el('div','answer-label'), '✓ Final Answer'));
ab.appendChild(setText(el('div','answer-text'), p.answer));
root.appendChild(ab);

// Concepts
if (p.concepts && p.concepts.length) {
  var clabel = el('div','section-label');
  clabel.style.marginTop = '4px';
  clabel.textContent = 'Key Concepts';
  root.appendChild(clabel);
  var wrap = el('div','concepts-wrap');
  p.concepts.forEach(function(c) { wrap.appendChild(setText(el('span','concept-tag'), c)); });
  root.appendChild(wrap);
}

// Render LaTeX
renderMathInElement(document.body, {
  delimiters: [
    {left:'$$',right:'$$',display:true},
    {left:'$',right:'$',display:false}
  ],
  throwOnError: false
});

// Report rendered height
function reportHeight() {
  var h = document.documentElement.scrollHeight;
  window.ReactNativeWebView && window.ReactNativeWebView.postMessage(String(h));
}
setTimeout(reportHeight, 150);
setTimeout(reportHeight, 600);
</script>
</body>
</html>`;
}

function ProblemCard({ problem, index }: { problem: MathProblem; index: number }) {
  const [expanded, setExpanded] = useState(true);
  const [webHeight, setWebHeight] = useState(220);
  const diffColor = DIFFICULTY_COLORS[problem.difficulty] ?? Colors.primary;

  return (
    <View style={styles.problemCard}>
      {/* Native header — question + badges + collapse */}
      <TouchableOpacity
        style={styles.problemHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.indexBubble}>
            <Text style={styles.indexText}>Q{index + 1}</Text>
          </View>
          <Text style={styles.questionText} numberOfLines={expanded ? undefined : 2}>
            {problem.question}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.diffBadge, { backgroundColor: diffColor + '22' }]}>
            <Text style={[styles.diffText, { color: diffColor }]}>{problem.difficulty}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>

      {/* WebView body — full KaTeX rendering */}
      {expanded && (
        <WebView
          source={{ html: buildProblemHtml(problem) }}
          style={[styles.webView, { height: webHeight }]}
          scrollEnabled={false}
          javaScriptEnabled
          onMessage={(e) => {
            const h = Number(e.nativeEvent.data);
            if (h > 0) setWebHeight(h);
          }}
        />
      )}
    </View>
  );
}

interface Props {
  result: AnalysisResult;
}

export default function MathResults({ result }: Props) {
  if (result.noProblemsFound || result.problems.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search-outline" size={36} color={Colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Math Problems Detected</Text>
        <Text style={styles.emptyBody}>
          Try uploading a clearer image or a photo that contains a math problem.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.resultsHeader}>
        <Ionicons name="sparkles" size={16} color={Colors.primary} />
        <Text style={styles.resultsTitle}>
          {result.problems.length} Problem{result.problems.length > 1 ? 's' : ''} Found
        </Text>
      </View>
      {result.problems.map((problem, i) => (
        <ProblemCard key={i} problem={problem} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 12 },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  resultsTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  problemCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
  },
  problemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 14,
    gap: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  indexBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  indexText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  questionText: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20, flex: 1 },
  diffBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  diffText: { fontSize: 11, fontWeight: '700' },

  webView: {
    width: '100%',
    backgroundColor: '#ffffff',
  },

  emptyState: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  emptyBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
