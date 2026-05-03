import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { USER } from '@/constants/MockData';

type SettingsRowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  showChevron?: boolean;
  isLast?: boolean;
  danger?: boolean;
};

function SettingsRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  showChevron = true,
  isLast = false,
  danger = false,
}: SettingsRowProps) {
  return (
    <TouchableOpacity
      style={[styles.settingsRow, isLast && styles.settingsRowLast]}
      onPress={onPress}
      activeOpacity={toggle ? 1 : 0.7}
    >
      <View style={[styles.settingsIconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={[styles.settingsLabel, danger && { color: Colors.error }]}>{label}</Text>
      <View style={styles.settingsRight}>
        {value && <Text style={styles.settingsValue}>{value}</Text>}
        {toggle && (
          <Switch
            value={toggleValue}
            onValueChange={onToggle}
            trackColor={{ false: Colors.border, true: Colors.primary }}
            thumbColor={Colors.surface}
          />
        )}
        {!toggle && showChevron && (
          <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingsGroup}>
      <Text style={styles.settingsGroupTitle}>{title}</Text>
      <View style={styles.settingsGroupCard}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [haptics, setHaptics] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>{USER.avatar}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{USER.name}</Text>
            <Text style={styles.profileGrade}>{USER.grade}</Text>
            <View style={styles.profileStats}>
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{USER.problemsSolved}</Text>
                <Text style={styles.profileStatLabel}>Solved</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{USER.streak}</Text>
                <Text style={styles.profileStatLabel}>Streak</Text>
              </View>
              <View style={styles.profileStatDivider} />
              <View style={styles.profileStatItem}>
                <Text style={styles.profileStatValue}>{USER.accuracy}%</Text>
                <Text style={styles.profileStatLabel}>Accuracy</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editProfileBtn}>
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Study Goal Banner */}
        <View style={styles.goalBanner}>
          <View style={styles.goalLeft}>
            <Text style={styles.goalEmoji}>🎯</Text>
            <View>
              <Text style={styles.goalTitle}>Daily Goal</Text>
              <Text style={styles.goalSub}>5 problems · 30 min study</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.goalEditBtn}>
            <Text style={styles.goalEditText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <SettingsGroup title="Account">
          <SettingsRow
            icon="person-outline"
            iconBg="#EEF0FF"
            iconColor={Colors.primary}
            label="Profile"
            value="Edit"
          />
          <SettingsRow
            icon="school-outline"
            iconBg="#E8FAF9"
            iconColor={Colors.secondary}
            label="Grade Level"
            value="10th Grade"
          />
          <SettingsRow
            icon="trophy-outline"
            iconBg="#FFF8EC"
            iconColor={Colors.warning}
            label="Achievements"
            value="12 earned"
          />
          <SettingsRow
            icon="stats-chart-outline"
            iconBg="#EAFAF6"
            iconColor={Colors.success}
            label="Progress Report"
            isLast
          />
        </SettingsGroup>

        {/* Study Preferences */}
        <SettingsGroup title="Study Preferences">
          <SettingsRow
            icon="flag-outline"
            iconBg="#EEF0FF"
            iconColor={Colors.primary}
            label="Daily Goal"
            value="5 problems"
          />
          <SettingsRow
            icon="speedometer-outline"
            iconBg="#FFF0F0"
            iconColor={Colors.error}
            label="Default Difficulty"
            value="Medium"
          />
          <SettingsRow
            icon="timer-outline"
            iconBg="#FFF8EC"
            iconColor={Colors.warning}
            label="Quiz Time Limit"
            value="30 min"
          />
          <SettingsRow
            icon="layers-outline"
            iconBg="#E8FAF9"
            iconColor={Colors.secondary}
            label="Focus Topics"
            value="Algebra, Calculus"
            isLast
          />
        </SettingsGroup>

        {/* Notifications */}
        <SettingsGroup title="Notifications">
          <SettingsRow
            icon="notifications-outline"
            iconBg="#EEF0FF"
            iconColor={Colors.primary}
            label="Push Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
            showChevron={false}
          />
          <SettingsRow
            icon="alarm-outline"
            iconBg="#EAFAF6"
            iconColor={Colors.success}
            label="Daily Reminder"
            toggle
            toggleValue={dailyReminder}
            onToggle={setDailyReminder}
            showChevron={false}
          />
          <SettingsRow
            icon="time-outline"
            iconBg="#FFF8EC"
            iconColor={Colors.warning}
            label="Reminder Time"
            value="7:00 PM"
            isLast
          />
        </SettingsGroup>

        {/* Appearance */}
        <SettingsGroup title="Appearance">
          <SettingsRow
            icon="moon-outline"
            iconBg="#2D3748"
            iconColor="#CBD5E0"
            label="Dark Mode"
            toggle
            toggleValue={darkMode}
            onToggle={setDarkMode}
            showChevron={false}
          />
          <SettingsRow
            icon="text-outline"
            iconBg="#EEF0FF"
            iconColor={Colors.primary}
            label="Font Size"
            value="Medium"
            isLast
          />
        </SettingsGroup>

        {/* Sound & Haptics */}
        <SettingsGroup title="Sound & Haptics">
          <SettingsRow
            icon="volume-high-outline"
            iconBg="#E8FAF9"
            iconColor={Colors.secondary}
            label="Sound Effects"
            toggle
            toggleValue={soundEffects}
            onToggle={setSoundEffects}
            showChevron={false}
          />
          <SettingsRow
            icon="phone-portrait-outline"
            iconBg="#EAFAF6"
            iconColor={Colors.success}
            label="Haptic Feedback"
            toggle
            toggleValue={haptics}
            onToggle={setHaptics}
            showChevron={false}
            isLast
          />
        </SettingsGroup>

        {/* About */}
        <SettingsGroup title="About">
          <SettingsRow
            icon="information-circle-outline"
            iconBg="#EEF0FF"
            iconColor={Colors.primary}
            label="App Version"
            value="1.0.0"
            showChevron={false}
          />
          <SettingsRow
            icon="document-text-outline"
            iconBg="#FFF8EC"
            iconColor={Colors.warning}
            label="Terms of Service"
          />
          <SettingsRow
            icon="shield-checkmark-outline"
            iconBg="#EAFAF6"
            iconColor={Colors.success}
            label="Privacy Policy"
          />
          <SettingsRow
            icon="star-outline"
            iconBg="#FFF8EC"
            iconColor={Colors.warning}
            label="Rate MathHelper"
            isLast
          />
        </SettingsGroup>

        {/* Danger Zone */}
        <SettingsGroup title="Account Actions">
          <SettingsRow
            icon="refresh-outline"
            iconBg="#FFF0F0"
            iconColor={Colors.error}
            label="Reset Progress"
            danger
          />
          <SettingsRow
            icon="log-out-outline"
            iconBg="#FFF0F0"
            iconColor={Colors.error}
            label="Sign Out"
            danger
            isLast
            showChevron={false}
          />
        </SettingsGroup>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>MathHelper · Built with ❤️</Text>
          <Text style={styles.footerSub}>Expo SDK 54 · React Native</Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  title: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 18 },

  profileCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontSize: 34 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  profileGrade: { fontSize: 13, color: Colors.textSecondary, marginBottom: 10 },
  profileStats: { flexDirection: 'row', alignItems: 'center' },
  profileStatItem: { alignItems: 'center', flex: 1 },
  profileStatValue: { fontSize: 16, fontWeight: '700', color: Colors.text },
  profileStatLabel: { fontSize: 11, color: Colors.textSecondary },
  profileStatDivider: { width: 1, height: 28, backgroundColor: Colors.border },
  editProfileBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.primary + '14',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalBanner: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  goalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalEmoji: { fontSize: 24 },
  goalTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  goalSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  goalEditBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  goalEditText: { fontSize: 13, color: '#fff', fontWeight: '600' },

  settingsGroup: { marginBottom: 22 },
  settingsGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  settingsGroupCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  settingsRowLast: { borderBottomWidth: 0 },
  settingsIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  settingsRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingsValue: { fontSize: 14, color: Colors.textSecondary },

  footer: { alignItems: 'center', paddingVertical: 12 },
  footerText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
  footerSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 4 },
});
