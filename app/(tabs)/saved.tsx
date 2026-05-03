import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useSavedProblems, SavedScan } from '@/store/savedProblems';
import MathResults from '@/components/MathResults';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

const DIFF_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
  Advanced: '#8b5cf6',
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({
  scan,
  onClose,
  onDelete,
}: {
  scan: SavedScan;
  onClose: () => void;
  onDelete: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = () => {
    Alert.alert('Delete Scan', 'Remove this scan from your saved collection?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          await onDelete();
          setDeleting(false);
        },
      },
    ]);
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.safe} edges={['top']}>
        {/* Modal header */}
        <View style={modal.header}>
          <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
            <Ionicons name="chevron-down" size={22} color={Colors.text} />
          </TouchableOpacity>
          <Text style={modal.title}>Saved Scan</Text>
          <TouchableOpacity onPress={confirmDelete} style={modal.deleteBtn} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={modal.scroll}
          contentContainerStyle={modal.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          {scan.photoUri ? (
            <Image
              source={{ uri: scan.photoUri }}
              style={modal.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={modal.photoPlaceholder}>
              <Ionicons name="image-outline" size={36} color={Colors.textTertiary} />
              <Text style={modal.photoPlaceholderText}>Photo no longer available</Text>
            </View>
          )}

          {/* Meta */}
          <View style={modal.metaRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
            <Text style={modal.metaText}>Saved {formatDate(scan.savedAt)}</Text>
            <View style={modal.dot} />
            <Text style={modal.metaText}>
              {scan.result.problems.length} problem{scan.result.problems.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Full solution */}
          <MathResults result={scan.result} />

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Scan Card ────────────────────────────────────────────────────────────────

function ScanCard({ scan, onPress }: { scan: SavedScan; onPress: () => void }) {
  const first = scan.result.problems[0];
  const diffColor = DIFF_COLORS[first?.difficulty ?? 'Easy'];
  const allConcepts = scan.result.problems.flatMap((p) => p.concepts).slice(0, 3);
  const extraProblems = scan.result.problems.length - 1;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.cardInner}>
        {/* Thumbnail */}
        {scan.photoUri ? (
          <Image source={{ uri: scan.photoUri }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbPlaceholder]}>
            <Ionicons name="image-outline" size={18} color={Colors.textTertiary} />
          </View>
        )}

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardQuestion} numberOfLines={2}>
            {first?.question ?? 'Scanned problem'}
          </Text>

          <View style={styles.cardBadges}>
            <View style={[styles.diffBadge, { backgroundColor: diffColor + '20' }]}>
              <Text style={[styles.diffText, { color: diffColor }]}>
                {first?.difficulty ?? '—'}
              </Text>
            </View>
            {extraProblems > 0 && (
              <View style={styles.moreBadge}>
                <Text style={styles.moreText}>+{extraProblems} more</Text>
              </View>
            )}
          </View>

          {/* Concepts */}
          {allConcepts.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.conceptsRow}
            >
              {allConcepts.map((c) => (
                <View key={c} style={styles.conceptTag}>
                  <Text style={styles.conceptText}>{c}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.cardFooter}>
            <Ionicons name="time-outline" size={12} color={Colors.textTertiary} />
            <Text style={styles.cardTime}>{formatRelative(scan.savedAt)}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.cardChevron} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const { scans, loading, deleteScan } = useSavedProblems();
  const [search, setSearch] = useState('');
  const [selectedScan, setSelectedScan] = useState<SavedScan | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return scans;
    const q = search.toLowerCase();
    return scans.filter((sc) =>
      sc.result.problems.some(
        (p) =>
          p.question.toLowerCase().includes(q) ||
          p.concepts.some((c) => c.toLowerCase().includes(q)) ||
          p.answer.toLowerCase().includes(q)
      )
    );
  }, [scans, search]);

  const handleDelete = async (id: string) => {
    await deleteScan(id);
    setSelectedScan(null);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Saved Problems</Text>
          <View style={styles.headerCount}>
            <Text style={styles.headerCountText}>{scans.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={17} color={Colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by problem, concept, answer…"
            placeholderTextColor={Colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={17} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results count */}
        {search.length > 0 && (
          <Text style={styles.resultCount}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </Text>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {filtered.length === 0 ? (
              scans.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBg}>
                    <Ionicons name="bookmark-outline" size={36} color={Colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No saved problems yet</Text>
                  <Text style={styles.emptySub}>
                    Scan a homework problem from the Dashboard, then tap{' '}
                    <Text style={{ fontWeight: '700', color: Colors.text }}>Save to Saved</Text>
                    {' '}to build your collection.
                  </Text>
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="search-outline" size={32} color={Colors.textTertiary} />
                  <Text style={styles.emptyTitle}>No results for "{search}"</Text>
                  <Text style={styles.emptySub}>Try a different keyword or concept.</Text>
                </View>
              )
            ) : (
              filtered.map((scan) => (
                <ScanCard key={scan.id} scan={scan} onPress={() => setSelectedScan(scan)} />
              ))
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </View>

      {/* Detail modal */}
      {selectedScan && (
        <DetailModal
          scan={selectedScan}
          onClose={() => setSelectedScan(null)}
          onDelete={() => handleDelete(selectedScan.id)}
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
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  headerCount: {
    backgroundColor: Colors.primary + '18',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  headerCountText: { fontSize: 13, fontWeight: '700', color: Colors.primary },

  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  resultCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 6,
    fontWeight: '500',
  },

  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 20, paddingTop: 4 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 20 },
  emptyIconBg: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, gap: 12 },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    flexShrink: 0,
  },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  cardBody: { flex: 1 },
  cardQuestion: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18, marginBottom: 6 },
  cardBadges: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  diffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  diffText: { fontSize: 11, fontWeight: '700' },
  moreBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.primary + '15',
  },
  moreText: { fontSize: 11, fontWeight: '600', color: Colors.primary },

  conceptsRow: { gap: 5, paddingBottom: 6 },
  conceptTag: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  conceptText: { fontSize: 10, fontWeight: '600', color: Colors.primary },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardTime: { fontSize: 11, color: Colors.textTertiary },
  cardChevron: { alignSelf: 'center', marginLeft: 2 },
});

const modal = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 16, fontWeight: '700', color: Colors.text },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef444415',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: Colors.borderLight,
  },
  photoPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  photoPlaceholderText: { fontSize: 13, color: Colors.textTertiary },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textTertiary,
  },
});
