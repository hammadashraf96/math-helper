import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { QUIZ_CATEGORIES, RECENT_QUIZZES } from '@/constants/MockData';

const DIFFICULTIES = [
  { id: 'easy', label: 'Easy', color: Colors.success, icon: '🌱' },
  { id: 'medium', label: 'Medium', color: Colors.warning, icon: '⚡' },
  { id: 'hard', label: 'Hard', color: Colors.error, icon: '🔥' },
  { id: 'mixed', label: 'Mixed', color: Colors.primary, icon: '🎲' },
];

function ScoreRing({ score, color }: { score: number; color: string }) {
  const isGood = score >= 80;
  const isOk = score >= 60;
  const ringColor = isGood ? Colors.success : isOk ? Colors.warning : Colors.error;
  return (
    <View style={[styles.scoreRing, { borderColor: ringColor }]}>
      <Text style={[styles.scoreRingText, { color: ringColor }]}>{score}%</Text>
    </View>
  );
}

export default function QuizScreen() {
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const readyToStart = selectedCategory !== null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quiz</Text>
            <Text style={styles.subtitle}>Test your math skills</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>7</Text>
          </View>
        </View>

        {/* Select Difficulty */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>1. Choose Difficulty</Text>
          <View style={styles.difficultyGrid}>
            {DIFFICULTIES.map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[
                  styles.difficultyChip,
                  selectedDifficulty === d.id && {
                    backgroundColor: d.color,
                    borderColor: d.color,
                  },
                ]}
                onPress={() => setSelectedDifficulty(d.id)}
              >
                <Text style={styles.difficultyChipIcon}>{d.icon}</Text>
                <Text
                  style={[
                    styles.difficultyChipLabel,
                    selectedDifficulty === d.id && { color: '#fff' },
                  ]}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Select Topic */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionCardTitle}>2. Choose Topic</Text>
          <View style={styles.categoryGrid}>
            {QUIZ_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSelected && {
                      borderColor: cat.color,
                      borderWidth: 2,
                      backgroundColor: cat.bgColor,
                    },
                  ]}
                  onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                  activeOpacity={0.85}
                >
                  {isSelected && (
                    <View style={[styles.selectedCheck, { backgroundColor: cat.color }]}>
                      <Ionicons name="checkmark" size={12} color="#fff" />
                    </View>
                  )}
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text style={[styles.categoryName, isSelected && { color: cat.color }]}>
                    {cat.topic}
                  </Text>
                  <Text style={styles.categoryMeta}>{cat.questions} questions</Text>
                  <Text style={styles.categoryMeta}>{cat.avgTime}</Text>
                  {cat.bestScore > 0 && (
                    <View style={styles.bestScoreRow}>
                      <Ionicons name="trophy-outline" size={12} color={Colors.warning} />
                      <Text style={styles.bestScoreText}>Best: {cat.bestScore}%</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startButton, !readyToStart && styles.startButtonDisabled]}
          disabled={!readyToStart}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={22} color="#fff" />
          <Text style={styles.startButtonText}>
            {readyToStart ? 'Start Quiz' : 'Select a Topic to Start'}
          </Text>
        </TouchableOpacity>

        {readyToStart && (
          <View style={styles.quizPreview}>
            {(() => {
              const cat = QUIZ_CATEGORIES.find((c) => c.id === selectedCategory)!;
              const diff = DIFFICULTIES.find((d) => d.id === selectedDifficulty)!;
              return (
                <>
                  <View style={styles.quizPreviewRow}>
                    <Ionicons name="book-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.quizPreviewText}>{cat.topic}</Text>
                  </View>
                  <View style={styles.quizPreviewDot} />
                  <View style={styles.quizPreviewRow}>
                    <Text>{diff.icon}</Text>
                    <Text style={styles.quizPreviewText}>{diff.label}</Text>
                  </View>
                  <View style={styles.quizPreviewDot} />
                  <View style={styles.quizPreviewRow}>
                    <Ionicons name="help-circle-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.quizPreviewText}>{cat.questions} questions</Text>
                  </View>
                  <View style={styles.quizPreviewDot} />
                  <View style={styles.quizPreviewRow}>
                    <Ionicons name="time-outline" size={14} color={Colors.textSecondary} />
                    <Text style={styles.quizPreviewText}>{cat.avgTime}</Text>
                  </View>
                </>
              );
            })()}
          </View>
        )}

        {/* Recent Results */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Results</Text>
          <TouchableOpacity>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {RECENT_QUIZZES.map((quiz) => (
          <View key={quiz.id} style={styles.resultCard}>
            <ScoreRing score={Math.round((quiz.score / quiz.total) * 100)} color={quiz.topicColor} />
            <View style={styles.resultBody}>
              <Text style={styles.resultTopic}>{quiz.topic} Quiz</Text>
              <Text style={styles.resultScore}>
                {quiz.score}/{quiz.total} correct
              </Text>
              <View style={styles.resultMeta}>
                <Ionicons name="calendar-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.resultDate}>{quiz.date}</Text>
                <View style={styles.resultDot} />
                <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
                <Text style={styles.resultDate}>{quiz.time}</Text>
              </View>
            </View>
            <TouchableOpacity style={[styles.retryBtn, { borderColor: quiz.topicColor }]}>
              <Ionicons name="refresh-outline" size={16} color={quiz.topicColor} />
              <Text style={[styles.retryText, { color: quiz.topicColor }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ))}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 24, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.error + '18',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  streakIcon: { fontSize: 18 },
  streakText: { fontSize: 18, fontWeight: '800', color: Colors.error },

  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },

  difficultyGrid: { flexDirection: 'row', gap: 8 },
  difficultyChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
    gap: 4,
  },
  difficultyChipIcon: { fontSize: 18 },
  difficultyChipLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryCard: {
    width: '47%',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  selectedCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: { fontSize: 28, marginBottom: 6 },
  categoryName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  categoryMeta: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  bestScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  bestScoreText: { fontSize: 12, color: Colors.warning, fontWeight: '600' },

  startButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  startButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  startButtonText: { fontSize: 17, fontWeight: '700', color: '#fff' },

  quizPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  quizPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quizPreviewText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  quizPreviewDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  scoreRing: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreRingText: { fontSize: 14, fontWeight: '700' },
  resultBody: { flex: 1 },
  resultTopic: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 },
  resultScore: { fontSize: 13, color: Colors.textSecondary, marginBottom: 4 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resultDate: { fontSize: 12, color: Colors.textTertiary },
  resultDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  retryText: { fontSize: 12, fontWeight: '600' },
});
