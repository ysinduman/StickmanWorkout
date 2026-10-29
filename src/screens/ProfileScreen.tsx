import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Typography, Button, Card } from '../components/ui';
import { Stickman } from '../components/Stickman/Stickman';
import { FlameEffect } from '../components/Calendar/FlameEffect';
import { LevelBars, aggregateToCoreZones } from '../components/LevelBars';
import theme from '../constants/theme';
import { useSessionStore } from '../stores/useSessionStore';
import { usePriorityStore } from '../stores/usePriorityStore';

function getPrestigeRank(totalXp: number): { title: string; color: string; icon: string } {
  if (totalXp >= 10000) return { title: 'MİTİK TANRI', color: '#FF007F', icon: 'crown' };
  if (totalXp >= 6000) return { title: 'ELMAS TİTAN', color: '#00E5FF', icon: 'diamond-stone' };
  if (totalXp >= 3500) return { title: 'ALTIN ŞAMPİYON', color: '#FFD700', icon: 'shield-crown' };
  if (totalXp >= 1500) return { title: 'GÜMÜŞ GLADYATÖR', color: '#C0C0C0', icon: 'sword-cross' };
  return { title: 'BRONZ ÇIRAK', color: '#CD7F32', icon: 'shield-account' };
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const username = useSessionStore(state => state.username);
  const bio = useSessionStore(state => state.bio);
  const progression = useSessionStore(state => state.progression);
  const signOut = useSessionStore(state => state.signOut);
  const pinnedZone = usePriorityStore(state => state.pinnedZone);
  const partLevels = progression
    ? Object.fromEntries(progression.body_parts.map(part => [part.body_part_id, part.level]))
    : undefined;
  const coreBars = progression ? aggregateToCoreZones(progression.body_parts) : [];
  const coreLevels = Object.fromEntries(coreBars.map(b => [b.id, b.level]));

  const totalXp = progression?.total_xp ?? 0;
  const prestige = getPrestigeRank(totalXp);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Avatar with Evolving Podium */}
      <View style={styles.hero}>
        {progression && progression.current_streak > 0 ? (
          <View style={styles.flame}>
            <FlameEffect intensity={1} size={160} />
          </View>
        ) : null}
        <Stickman
          muscleMass={8}
          partLevels={partLevels}
          priorityZone={pinnedZone}
          width={170}
          height={200}
        />
        {/* Podium Base */}
        <View style={styles.podiumBase}>
          <View style={styles.podiumGlow} />
          <View style={styles.podiumRing}>
            <View style={styles.podiumInnerGlow} />
          </View>
        </View>
      </View>

      {/* User Title & Prestige Tag */}
      <View style={styles.userHeaderSection}>
        <Typography variant="title1" align="center" bold>
          @{username}
        </Typography>

        <View style={[styles.prestigePill, { borderColor: prestige.color }]}>
          <MaterialCommunityIcons name={prestige.icon} size={14} color={prestige.color} />
          <Typography variant="label" bold color={prestige.color} style={{ marginLeft: 4 }}>
            {prestige.title}
          </Typography>
        </View>

        {bio ? (
          <Typography variant="bodyMuted" align="center" style={styles.bioText}>
            "{bio}"
          </Typography>
        ) : null}
      </View>

      {/* Tycoon Stats Grid */}
      {progression ? (
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statIconBox}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color={theme.colors.accent.primary} />
            </View>
            <Typography variant="title2" bold color={theme.colors.accent.primary}>
              {progression.total_xp}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              Toplam XP
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 159, 28, 0.15)' }]}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF9F1C" />
            </View>
            <Typography variant="title2" bold color="#FF9F1C">
              {progression.current_streak}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {t('history.currentStreak')}
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(255, 215, 0, 0.15)' }]}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
            </View>
            <Typography variant="title2" bold color="#FFD700">
              {progression.longest_streak}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              {t('history.longestStreak')}
            </Typography>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(74, 222, 128, 0.15)' }]}>
              <MaterialCommunityIcons name="arm-flex" size={20} color={theme.colors.status.success} />
            </View>
            <Typography variant="title2" bold color={theme.colors.status.success}>
              4 Bölge
            </Typography>
            <Typography variant="caption" color={theme.colors.text.secondary}>
              Temel Kaslar
            </Typography>
          </Card>
        </View>
      ) : null}

      {/* Achievements / Rozetler Section */}
      <View style={styles.sectionHeaderRow}>
        <MaterialCommunityIcons name="medal" size={20} color={theme.colors.accent.primary} />
        <Typography variant="title2" bold style={{ marginLeft: 6 }}>
          BAŞARIMLAR & ROZETLER
        </Typography>
      </View>

      <View style={styles.badgesContainer}>
        {[
          { id: 'first_workout', title: 'İlk Adım', desc: 'İlk antrenmanını tamamla', icon: 'shoe-sneaker', unlocked: totalXp > 0 },
          { id: 'arm_power', title: 'Çelik Kol', desc: 'Kol seviyesini 4 yap', icon: 'arm-flex', unlocked: (coreLevels.arms ?? 0) >= 4 },
          { id: 'torso_titan', title: 'Zırh Gövde', desc: 'Gövde seviyesini 4 yap', icon: 'shield-account', unlocked: (coreLevels.torso ?? 0) >= 4 },
          { id: 'fire_streak', title: 'Seri Ustası', desc: '2 günden fazla seri yap', icon: 'fire', unlocked: (progression?.longest_streak ?? 0) >= 2 },
        ].map((badge) => (
          <View key={badge.id} style={[styles.achievementBadgeCard, badge.unlocked && styles.achievementUnlocked]}>
            <View style={[styles.achievementIconCircle, badge.unlocked && styles.achievementIconUnlocked]}>
              <MaterialCommunityIcons
                name={badge.icon}
                size={20}
                color={badge.unlocked ? theme.colors.accent.primary : theme.colors.text.tertiary}
              />
            </View>
            <Typography variant="label" bold color={badge.unlocked ? theme.colors.text.primary : theme.colors.text.tertiary} style={{ marginTop: 4 }}>
              {badge.title}
            </Typography>
            <Typography variant="caption" color={theme.colors.text.tertiary} style={{ fontSize: 10, textAlign: 'center' }}>
              {badge.unlocked ? '✓ AÇILDI' : badge.desc}
            </Typography>
          </View>
        ))}
      </View>

      {/* Core Muscle Progression Section */}
      <View style={[styles.sectionHeaderRow, { marginTop: theme.spacing.lg }]}>
        <MaterialCommunityIcons name="chart-bar" size={20} color={theme.colors.accent.primary} />
        <Typography variant="title2" bold style={{ marginLeft: 6 }}>
          {t('profile.levels')} (4 Temel Bölge)
        </Typography>
      </View>

      {progression ? (
        <LevelBars parts={progression.body_parts} />
      ) : (
        <Typography variant="bodyMuted">{t('profile.empty')}</Typography>
      )}

      {/* Play Store & Privacy Policy Compliance Card */}
      <Card style={styles.complianceCard}>
        <TouchableOpacity
          onPress={() => setPrivacyOpen(!privacyOpen)}
          activeOpacity={0.8}
          style={styles.complianceHeader}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <MaterialCommunityIcons name="shield-check" size={22} color={theme.colors.accent.primary} />
            <View style={{ marginLeft: 10 }}>
              <Typography variant="body" bold>
                Gizlilik & Güvenlik Politikası
              </Typography>
              <Typography variant="caption" color={theme.colors.text.secondary}>
                Play Store Standartları • v1.0.0
              </Typography>
            </View>
          </View>
          <MaterialCommunityIcons
            name={privacyOpen ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={theme.colors.text.secondary}
          />
        </TouchableOpacity>

        {privacyOpen && (
          <View style={styles.complianceBody}>
            <View style={styles.complianceRow}>
              <MaterialCommunityIcons name="camera-outline" size={16} color={theme.colors.status.success} style={{ marginTop: 2 }} />
              <Typography variant="caption" color={theme.colors.text.secondary} style={{ marginLeft: 8, flex: 1 }}>
                <Typography variant="caption" bold color={theme.colors.text.primary}>Yerel AI Kamera: </Typography>
                AI hareket sayacı kamera görüntülerini tamamen cihazınızda yerel olarak işler. Hiçbir görüntü kaydedilmez veya harici sunuculara aktarılmaz.
              </Typography>
            </View>
            <View style={[styles.complianceRow, { marginTop: 10 }]}>
              <MaterialCommunityIcons name="database-check" size={16} color={theme.colors.accent.primary} style={{ marginTop: 2 }} />
              <Typography variant="caption" color={theme.colors.text.secondary} style={{ marginLeft: 8, flex: 1 }}>
                <Typography variant="caption" bold color={theme.colors.text.primary}>Veri Güvenliği: </Typography>
                Profil ve antrenman verileriniz PostgreSQL Row Level Security (RLS) politikalarıyla korunur.
              </Typography>
            </View>
          </View>
        )}
      </Card>

      {/* Sign Out Action Button */}
      <Button
        title={t('auth.signOut')}
        variant="outline"
        onPress={signOut}
        style={styles.signOut}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
    backgroundColor: theme.colors.background.primary,
    flexGrow: 1,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 230,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  flame: {
    position: 'absolute',
    top: 0,
  },
  podiumBase: {
    position: 'absolute',
    bottom: 14,
    width: 180,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumGlow: {
    position: 'absolute',
    width: 190,
    height: 32,
    borderRadius: 95,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
  },
  podiumRing: {
    width: 160,
    height: 22,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.65)',
    backgroundColor: 'rgba(255, 107, 53, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  podiumInnerGlow: {
    width: 110,
    height: 10,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 130, 40, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 100, 0.55)',
  },
  userHeaderSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  prestigePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.round,
    marginTop: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  bioText: {
    marginTop: 6,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 107, 53, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: theme.spacing.md,
  },
  achievementBadgeCard: {
    width: '48%',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  achievementUnlocked: {
    borderColor: 'rgba(255, 107, 53, 0.4)',
    backgroundColor: '#16131F',
  },
  achievementIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementIconUnlocked: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
  },
  signOut: {
    marginTop: theme.spacing.xl,
    borderColor: 'rgba(248, 113, 113, 0.5)',
  },
  complianceCard: {
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.25)',
    borderRadius: theme.borderRadius.md,
  },
  complianceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  complianceBody: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
});
