import { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { analyzeMathImage, AnalysisResult } from '@/services/openai';
import MathResults from '@/components/MathResults';
import { useSavedProblems, SavedScan } from '@/store/savedProblems';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning 👋';
  if (h < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
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
  if (days < 7) return `${days} days ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const DIFF_COLORS: Record<string, string> = {
  Easy: '#22c55e',
  Medium: '#f59e0b',
  Hard: '#ef4444',
  Advanced: '#8b5cf6',
};

// ─── Recent scan card ─────────────────────────────────────────────────────────

function RecentScanCard({ scan, onPress }: { scan: SavedScan; onPress: () => void }) {
  const firstProblem = scan.result.problems[0];
  const diffColor = DIFF_COLORS[firstProblem?.difficulty ?? 'Easy'];

  return (
    <TouchableOpacity style={styles.recentCard} onPress={onPress} activeOpacity={0.8}>
      {scan.photoUri ? (
        <Image
          source={{ uri: scan.photoUri }}
          style={styles.recentThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.recentThumb, styles.recentThumbPlaceholder]}>
          <Ionicons name="image-outline" size={20} color={Colors.textTertiary} />
        </View>
      )}
      <View style={styles.recentBody}>
        <Text style={styles.recentQuestion} numberOfLines={2}>
          {firstProblem?.question ?? 'Scanned problem'}
        </Text>
        <View style={styles.recentMeta}>
          <View style={[styles.recentDiffBadge, { backgroundColor: diffColor + '20' }]}>
            <Text style={[styles.recentDiffText, { color: diffColor }]}>
              {firstProblem?.difficulty ?? '—'}
            </Text>
          </View>
          {scan.result.problems.length > 1 && (
            <View style={styles.recentCountBadge}>
              <Text style={styles.recentCountText}>+{scan.result.problems.length - 1} more</Text>
            </View>
          )}
          <Text style={styles.recentTime}>{formatRelative(scan.savedAt)}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const router = useRouter();
  const { scans, addScan } = useSavedProblems();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState<string>('image/jpeg');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Compute live stats from real saved data
  const stats = useMemo(() => {
    const totalProblems = scans.reduce((s, sc) => s + sc.result.problems.length, 0);
    const allConcepts = new Set(
      scans.flatMap((sc) => sc.result.problems.flatMap((p) => p.concepts))
    );
    return [
      { label: 'Scans Saved', value: String(scans.length), icon: '📷', color: Colors.primary },
      { label: 'Problems Solved', value: String(totalProblems), icon: '✅', color: '#43D9AD' },
      { label: 'Topics Covered', value: String(allConcepts.size), icon: '📚', color: '#FFB84D' },
    ];
  }, [scans]);

  const recentScans = scans.slice(0, 3);

  // ─── Permissions & picker ────────────────────────────────────────────────

  const requestPermission = async (type: 'camera' | 'library') => {
    const { status } =
      type === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const handleTakePhoto = async () => {
    if (!(await requestPermission('camera'))) {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
      setPhotoMime(result.assets[0].mimeType ?? 'image/jpeg');
      setAnalysisResult(null);
      setAnalysisError(null);
      setSavedId(null);
    }
  };

  const handleUploadPhoto = async () => {
    if (!(await requestPermission('library'))) {
      Alert.alert('Permission needed', 'Photo library access is required to upload photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 ?? null);
      setPhotoMime(result.assets[0].mimeType ?? 'image/jpeg');
      setAnalysisResult(null);
      setAnalysisError(null);
      setSavedId(null);
    }
  };

  const handleClearPhoto = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setPhotoMime('image/jpeg');
    setAnalysisResult(null);
    setAnalysisError(null);
    setSavedId(null);
  };

  const handleAnalyze = async () => {
    if (!photoBase64) {
      setAnalysisError('Image data unavailable. Please re-select the photo.');
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisError(null);
    setSavedId(null);
    try {
      const result = await analyzeMathImage(photoBase64, photoMime);
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!analysisResult || !photoUri) return;
    setSaving(true);
    try {
      const saved = await addScan(photoUri, analysisResult);
      setSavedId(saved.id);
    } catch (err: any) {
      console.error('[handleSave] error:', err);
      Alert.alert('Save failed', err?.message ?? 'Could not save the scan. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

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
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.appTitle}>Math Helper</Text>
          </View>
          <View style={styles.headerIcon}>
            <Text style={styles.headerIconText}>🧮</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Scan widget ───────────────────────────────────────────────── */}
        <View style={styles.photoCard}>
          <View style={styles.photoCardHeader}>
            <View style={styles.photoCardTitleRow}>
              <View style={styles.photoIconBg}>
                <Ionicons name="camera" size={18} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.photoCardTitle}>Scan a Problem</Text>
                <Text style={styles.photoCardSub}>Upload or take a photo of your homework</Text>
              </View>
            </View>
            {photoUri && (
              <TouchableOpacity onPress={handleClearPhoto} style={styles.clearBtn}>
                <Ionicons name="close" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {photoUri ? (
            <View>
              {/* Preview */}
              <View style={styles.previewContainer}>
                <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                  <View style={styles.previewBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#fff" />
                    <Text style={styles.previewBadgeText}>Photo ready</Text>
                  </View>
                </View>
              </View>

              {/* Submit / Change */}
              {!analyzing && !analysisResult && (
                <View style={styles.submitRow}>
                  <TouchableOpacity style={styles.changePhotoBtn} onPress={handleClearPhoto}>
                    <Ionicons name="refresh-outline" size={16} color={Colors.textSecondary} />
                    <Text style={styles.changePhotoText}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.submitBtn} onPress={handleAnalyze}>
                    <Ionicons name="sparkles-outline" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Submit</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Analyzing */}
              {analyzing && (
                <View style={styles.analyzingBox}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                  <Text style={styles.analyzingText}>Analyzing your problem…</Text>
                </View>
              )}

              {/* Error */}
              {analysisError && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
                  <Text style={styles.errorText}>{analysisError}</Text>
                  <TouchableOpacity onPress={handleAnalyze} style={styles.retryBtn}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Post-result actions */}
              {analysisResult && (
                <>
                  <View style={styles.submitRow}>
                    <TouchableOpacity style={styles.changePhotoBtn} onPress={handleClearPhoto}>
                      <Ionicons name="camera-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.changePhotoText}>New Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reanalyzeBtn} onPress={handleAnalyze}>
                      <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                      <Text style={styles.reanalyzeBtnText}>Re-analyze</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Save button */}
                  {savedId ? (
                    <View style={styles.savedConfirmBox}>
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                      <Text style={styles.savedConfirmText}>Saved to your collection</Text>
                      <TouchableOpacity onPress={() => router.push('/(tabs)/saved')}>
                        <Text style={styles.savedConfirmLink}>View →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.saveBtn, saving && { opacity: 0.65 }]}
                      onPress={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Ionicons name="bookmark-outline" size={17} color="#fff" />
                      )}
                      <Text style={styles.saveBtnText}>
                        {saving ? 'Saving…' : 'Save to Saved'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <MathResults result={analysisResult} />
                </>
              )}
            </View>
          ) : (
            <View style={styles.photoActions}>
              <TouchableOpacity style={styles.photoActionBtn} onPress={handleTakePhoto}>
                <View style={[styles.photoActionIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <Ionicons name="camera-outline" size={22} color={Colors.primary} />
                </View>
                <Text style={styles.photoActionLabel}>Take Photo</Text>
                <Text style={styles.photoActionSub}>Use camera</Text>
              </TouchableOpacity>
              <View style={styles.photoDivider} />
              <TouchableOpacity style={styles.photoActionBtn} onPress={handleUploadPhoto}>
                <View style={[styles.photoActionIcon, { backgroundColor: Colors.secondary + '20' }]}>
                  <Ionicons name="image-outline" size={22} color={Colors.secondary} />
                </View>
                <Text style={styles.photoActionLabel}>Upload Photo</Text>
                <Text style={styles.photoActionSub}>From gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Recent Saves ──────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Saves</Text>
          {scans.length > 0 && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/saved')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          )}
        </View>

        {recentScans.length === 0 ? (
          <View style={styles.emptyRecent}>
            <Ionicons name="bookmark-outline" size={28} color={Colors.textTertiary} />
            <Text style={styles.emptyRecentText}>
              Scan and save problems — they'll appear here.
            </Text>
          </View>
        ) : (
          recentScans.map((scan) => (
            <RecentScanCard
              key={scan.id}
              scan={scan}
              onPress={() => router.push('/(tabs)/saved')}
            />
          ))
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  appTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 22 },

  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  statLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },

  // Photo card
  photoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  photoCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  photoCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  photoIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  photoCardSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoActions: { flexDirection: 'row', alignItems: 'stretch' },
  photoActionBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, gap: 8 },
  photoActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActionLabel: { fontSize: 13, fontWeight: '700', color: Colors.text },
  photoActionSub: { fontSize: 11, color: Colors.textSecondary },
  photoDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: 4 },

  previewContainer: { borderRadius: 14, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 200, borderRadius: 14 },
  previewOverlay: { position: 'absolute', top: 10, left: 10 },
  previewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  previewBadgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  submitRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  changePhotoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  changePhotoText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  analyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 10,
    backgroundColor: Colors.primary + '0D',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
  },
  analyzingText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },

  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ef444415',
    borderWidth: 1,
    borderColor: '#ef444430',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  errorText: { fontSize: 13, color: '#ef4444', flex: 1, lineHeight: 18 },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#ef444420',
  },
  retryText: { fontSize: 12, color: '#ef4444', fontWeight: '700' },

  reanalyzeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '0D',
  },
  reanalyzeBtnText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#22c55e',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  savedConfirmBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#22c55e12',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22c55e30',
  },
  savedConfirmText: { flex: 1, fontSize: 14, color: '#22c55e', fontWeight: '600' },
  savedConfirmLink: { fontSize: 14, color: Colors.primary, fontWeight: '700' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  emptyRecent: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 28,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  emptyRecentText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },

  // Recent scan card
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  recentThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.borderLight,
    flexShrink: 0,
  },
  recentThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentBody: { flex: 1 },
  recentQuestion: { fontSize: 13, fontWeight: '600', color: Colors.text, lineHeight: 18, marginBottom: 6 },
  recentMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recentDiffBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  recentDiffText: { fontSize: 11, fontWeight: '700' },
  recentCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.primary + '15',
  },
  recentCountText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  recentTime: { fontSize: 11, color: Colors.textTertiary },
});
