import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  CURRICULUM,
  Course,
  Topic,
  Level,
  LEVEL_LABELS,
  LEVEL_ICONS,
} from '@/constants/mathCurriculum';
import LessonViewer from '@/components/LessonViewer';

const LEVELS: Level[] = ['elementary', 'middle', 'high', 'ap', 'college', 'advanced'];

const LEVEL_COLORS: Record<Level, string> = {
  elementary: '#FF9F43',
  middle:     '#4ECDC4',
  high:       '#6C63FF',
  ap:         '#FF6B6B',
  college:    '#43D9AD',
  advanced:   '#9B59B6',
};

// ─── Topic Row ────────────────────────────────────────────────────────────────

function TopicRow({
  topic,
  index,
  total,
  color,
  onPress,
}: {
  topic: Topic;
  index: number;
  total: number;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.topicRow} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.topicIndex, { backgroundColor: color + '18' }]}>
        <Text style={[styles.topicIndexText, { color }]}>{index + 1}</Text>
      </View>
      <View style={styles.topicBody}>
        <Text style={styles.topicTitle}>{topic.title}</Text>
        <Text style={styles.topicDesc} numberOfLines={1}>{topic.description}</Text>
      </View>
      <View style={[styles.topicMins, { backgroundColor: color + '12' }]}>
        <Ionicons name="time-outline" size={11} color={color} />
        <Text style={[styles.topicMinsText, { color }]}>{topic.estimatedMinutes}m</Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Course Detail View ───────────────────────────────────────────────────────

function CourseDetail({
  course,
  onBack,
  onTopicPress,
}: {
  course: Course;
  onBack: () => void;
  onTopicPress: (topic: Topic) => void;
}) {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.courseDetailContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
        <Text style={styles.backText}>All Courses</Text>
      </TouchableOpacity>

      {/* Course Header Card */}
      <View style={[styles.courseHeader, { backgroundColor: course.color }]}>
        <View style={styles.courseHeaderTop}>
          <View style={styles.courseIconBig}>
            <Text style={styles.courseIconBigText}>{course.icon}</Text>
          </View>
          <View style={styles.courseHeaderRight}>
            <Text style={styles.courseHeaderLevel}>
              {LEVEL_ICONS[course.level]} {LEVEL_LABELS[course.level]}
            </Text>
            <Text style={styles.courseHeaderTitle}>{course.title}</Text>
            <Text style={styles.courseHeaderDesc}>{course.description}</Text>
          </View>
        </View>
        <View style={styles.courseHeaderStats}>
          <View style={styles.courseHeaderStat}>
            <Text style={styles.courseHeaderStatNum}>{course.topics.length}</Text>
            <Text style={styles.courseHeaderStatLbl}>Topics</Text>
          </View>
          <View style={styles.courseHeaderStatDivider} />
          <View style={styles.courseHeaderStat}>
            <Text style={styles.courseHeaderStatNum}>
              {course.topics.reduce((s, t) => s + t.estimatedMinutes, 0)}m
            </Text>
            <Text style={styles.courseHeaderStatLbl}>Total time</Text>
          </View>
          <View style={styles.courseHeaderStatDivider} />
          <View style={styles.courseHeaderStat}>
            <Text style={styles.courseHeaderStatNum}>AI</Text>
            <Text style={styles.courseHeaderStatLbl}>Generated</Text>
          </View>
        </View>
      </View>

      {/* Topics */}
      <Text style={styles.topicsHeading}>Topics</Text>
      <View style={styles.topicsList}>
        {course.topics.map((topic, idx) => (
          <TopicRow
            key={topic.id}
            topic={topic}
            index={idx}
            total={course.topics.length}
            color={course.color}
            onPress={() => onTopicPress(topic)}
          />
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course, onPress }: { course: Course; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.82}>
      <View style={[styles.courseIconBox, { backgroundColor: course.bgColor }]}>
        <Text style={styles.courseIcon}>{course.icon}</Text>
      </View>
      <Text style={styles.courseName}>{course.title}</Text>
      <Text style={styles.courseCardDesc} numberOfLines={2}>{course.description}</Text>
      <View style={styles.courseCardFooter}>
        <View style={[styles.courseTopicBadge, { backgroundColor: course.color + '15' }]}>
          <Text style={[styles.courseTopicBadgeText, { color: course.color }]}>
            {course.topics.length} topics
          </Text>
        </View>
        <Ionicons name="arrow-forward-circle-outline" size={18} color={course.color} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('middle');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessonContext, setLessonContext] = useState<{ topic: Topic; course: Course } | null>(null);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);

  const coursesForLevel = useMemo(
    () => CURRICULUM.filter((c) => c.level === selectedLevel),
    [selectedLevel]
  );

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const results: { course: Course; topic: Topic }[] = [];
    CURRICULUM.forEach((course) => {
      course.topics.forEach((topic) => {
        if (
          topic.title.toLowerCase().includes(q) ||
          topic.description.toLowerCase().includes(q) ||
          course.title.toLowerCase().includes(q)
        ) {
          results.push({ course, topic });
        }
      });
    });
    return results.slice(0, 20);
  }, [search]);

  const totalTopics = CURRICULUM.reduce((s, c) => s + c.topics.length, 0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Learn</Text>
            <Text style={styles.subtitle}>{CURRICULUM.length} courses · {totalTopics} topics</Text>
          </View>
          <TouchableOpacity
            style={[styles.searchToggleBtn, searching && { backgroundColor: Colors.primary }]}
            onPress={() => {
              setSearching(!searching);
              setSearch('');
            }}
          >
            <Ionicons name={searching ? 'close' : 'search'} size={19} color={searching ? '#fff' : Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ── Search Bar ── */}
        {searching && (
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search topics, concepts…"
              placeholderTextColor={Colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {searching && search.length > 0 ? (
          /* ── Search Results ── */
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.searchResultsContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {searchResults.length === 0 ? (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptyTitle}>No results for "{search}"</Text>
                <Text style={styles.emptySub}>Try a different term or browse by level below.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.resultCount}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
                {searchResults.map(({ course, topic }) => (
                  <TouchableOpacity
                    key={`${course.id}-${topic.id}`}
                    style={styles.searchResult}
                    onPress={() => {
                      setSearching(false);
                      setSearch('');
                      setSelectedCourse(course);
                      setLessonContext({ topic, course });
                    }}
                    activeOpacity={0.82}
                  >
                    <View style={[styles.searchResultIcon, { backgroundColor: course.bgColor }]}>
                      <Text style={{ fontSize: 14 }}>{course.icon}</Text>
                    </View>
                    <View style={styles.searchResultBody}>
                      <Text style={styles.searchResultTopic}>{topic.title}</Text>
                      <Text style={[styles.searchResultCourse, { color: course.color }]}>{course.title}</Text>
                    </View>
                    <View style={[styles.searchResultLevel, { backgroundColor: LEVEL_COLORS[course.level] + '15' }]}>
                      <Text style={[styles.searchResultLevelText, { color: LEVEL_COLORS[course.level] }]}>
                        {LEVEL_LABELS[course.level]}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        ) : selectedCourse ? (
          /* ── Course Detail ── */
          <CourseDetail
            course={selectedCourse}
            onBack={() => setSelectedCourse(null)}
            onTopicPress={(topic) => setLessonContext({ topic, course: selectedCourse })}
          />
        ) : (
          /* ── Course Browser ── */
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.browserContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Level Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.levelTabs}
            >
              {LEVELS.map((level) => {
                const active = level === selectedLevel;
                const color = LEVEL_COLORS[level];
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() => setSelectedLevel(level)}
                    style={[
                      styles.levelTab,
                      active ? { backgroundColor: color } : { backgroundColor: Colors.surface, borderColor: Colors.border },
                    ]}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.levelTabIcon}>{LEVEL_ICONS[level]}</Text>
                    <Text style={[styles.levelTabLabel, active ? { color: '#fff' } : { color: Colors.textSecondary }]}>
                      {LEVEL_LABELS[level]}
                    </Text>
                    {active && (
                      <View style={styles.levelTabCount}>
                        <Text style={styles.levelTabCountText}>
                          {coursesForLevel.length}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Level summary */}
            <View style={[styles.levelSummary, { backgroundColor: LEVEL_COLORS[selectedLevel] + '10' }]}>
              <Text style={[styles.levelSummaryTitle, { color: LEVEL_COLORS[selectedLevel] }]}>
                {LEVEL_ICONS[selectedLevel]} {LEVEL_LABELS[selectedLevel]}
              </Text>
              <Text style={styles.levelSummaryStats}>
                {coursesForLevel.length} courses ·{' '}
                {coursesForLevel.reduce((s, c) => s + c.topics.length, 0)} topics ·{' '}
                {Math.round(coursesForLevel.reduce((s, c) => s + c.topics.reduce((t, to) => t + to.estimatedMinutes, 0), 0) / 60)}h of content
              </Text>
            </View>

            {/* Course Grid */}
            <View style={styles.courseGrid}>
              {coursesForLevel.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => setSelectedCourse(course)}
                />
              ))}
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>

      {/* Lesson Viewer Modal */}
      {lessonContext && (
        <LessonViewer
          topic={lessonContext.topic}
          course={lessonContext.course}
          onClose={() => setLessonContext(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  searchToggleBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },

  // Browser
  browserContent: { paddingHorizontal: 20, paddingTop: 4 },
  levelTabs: { gap: 10, paddingRight: 4, marginBottom: 14 },
  levelTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  levelTabIcon: { fontSize: 15 },
  levelTabLabel: { fontSize: 13, fontWeight: '600' },
  levelTabCount: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  levelTabCountText: { fontSize: 11, fontWeight: '700', color: '#fff' },

  levelSummary: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  levelSummaryTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  levelSummaryStats: { fontSize: 12, color: Colors.textSecondary },

  courseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  courseCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  courseIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  courseIcon: { fontSize: 22 },
  courseName: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  courseCardDesc: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, marginBottom: 12 },
  courseCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  courseTopicBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  courseTopicBadgeText: { fontSize: 11, fontWeight: '700' },

  // Search results
  searchResultsContent: { paddingHorizontal: 20, paddingTop: 4 },
  resultCount: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10, fontWeight: '500' },
  searchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchResultIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  searchResultBody: { flex: 1 },
  searchResultTopic: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  searchResultCourse: { fontSize: 12, fontWeight: '500' },
  searchResultLevel: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7 },
  searchResultLevelText: { fontSize: 11, fontWeight: '700' },

  emptySearch: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  emptySub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },

  // Course Detail
  courseDetailContent: { paddingHorizontal: 20, paddingTop: 4 },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  backText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },

  courseHeader: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 22,
  },
  courseHeaderTop: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  courseIconBig: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  courseIconBigText: { fontSize: 26 },
  courseHeaderRight: { flex: 1 },
  courseHeaderLevel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  courseHeaderTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 4 },
  courseHeaderDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  courseHeaderStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  courseHeaderStat: { flex: 1, alignItems: 'center' },
  courseHeaderStatNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
  courseHeaderStatLbl: { fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: '500', marginTop: 2 },
  courseHeaderStatDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.25)' },

  topicsHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 12,
  },
  topicsList: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  topicIndex: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topicIndexText: { fontSize: 13, fontWeight: '700' },
  topicBody: { flex: 1 },
  topicTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  topicDesc: { fontSize: 11, color: Colors.textTertiary },
  topicMins: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  topicMinsText: { fontSize: 11, fontWeight: '600' },
});
