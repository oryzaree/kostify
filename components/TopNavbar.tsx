import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

interface TopNavbarProps {
  activeTab: 'index' | 'tenants' | 'finance';
  onTabPress?: (tab: 'index' | 'tenants' | 'finance') => void;
}

export function TopNavbar({ activeTab, onTabPress }: TopNavbarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isFirstRender = useRef(true);
  const currentTabRef = useRef(activeTab);
  const tabLayoutsRef = useRef<{ [key: string]: { x: number; width: number } }>({});
  const translateX = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  const [hasLayout, setHasLayout] = useState(false);
  const [tabLayouts, setTabLayouts] = useState<{
    [key: string]: { x: number; width: number };
  }>({});

  const handleTabLayout = (tab: string, layout: { x: number; width: number }) => {
    const prev = tabLayoutsRef.current[tab];
    if (!prev || Math.abs(prev.x - layout.x) > 1 || Math.abs(prev.width - layout.width) > 1) {
      tabLayoutsRef.current[tab] = { x: layout.x, width: layout.width };
      if (tab === activeTab && isFirstRender.current) {
        translateX.setValue(layout.x);
        indicatorWidth.setValue(layout.width);
        setHasLayout(true);
        isFirstRender.current = false;
        currentTabRef.current = tab;
      }
      setTabLayouts((p) => ({ ...p, [tab]: { x: layout.x, width: layout.width } }));
    }
  };

  useEffect(() => {
    const layout = tabLayouts[activeTab];
    if (layout) {
      if (isFirstRender.current) {
        translateX.setValue(layout.x);
        indicatorWidth.setValue(layout.width);
        setHasLayout(true);
        isFirstRender.current = false;
        currentTabRef.current = activeTab;
      } else if (currentTabRef.current !== activeTab) {
        currentTabRef.current = activeTab;
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: layout.x,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
          Animated.timing(indicatorWidth, {
            toValue: layout.width,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  }, [activeTab, tabLayouts]);

  const handleNav = (tab: 'index' | 'tenants' | 'finance') => {
    if (tab === activeTab) return;
    if (onTabPress) {
      onTabPress(tab);
      return;
    }
    if (tab === 'index') {
      router.replace('/(tabs)');
    } else if (tab === 'tenants') {
      router.replace('/(tabs)/tenants');
    } else if (tab === 'finance') {
      router.replace('/(tabs)/finance');
    }
  };

  return (
    <View style={[styles.navbarWrapper, { paddingTop: Math.max(insets.top, 8) }]}>
      <StatusBar style="light" />
      <View style={styles.navbarInner}>
        {/* Brand Left: logo_full.png */}
        <TouchableOpacity
          style={styles.brandContainer}
          activeOpacity={0.8}
          onPress={() => handleNav('index')}
        >
          <Image
            source={require('../assets/images/logo_full.png')}
            style={styles.logoFullImage}
            resizeMode="contain"
            tintColor="#FFFFFF"
          />
        </TouchableOpacity>

        {/* Navigation Menu Right with smooth running indicator */}
        <View style={styles.navMenu}>
          <TouchableOpacity
            style={styles.navItem}
            onLayout={(e) => handleTabLayout('index', e.nativeEvent.layout)}
            onPress={() => handleNav('index')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navText, activeTab === 'index' ? styles.navTextActive : styles.navTextInactive]}>
              Kamar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onLayout={(e) => handleTabLayout('tenants', e.nativeEvent.layout)}
            onPress={() => handleNav('tenants')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navText, activeTab === 'tenants' ? styles.navTextActive : styles.navTextInactive]}>
              Penghuni
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onLayout={(e) => handleTabLayout('finance', e.nativeEvent.layout)}
            onPress={() => handleNav('finance')}
            activeOpacity={0.7}
          >
            <Text style={[styles.navText, activeTab === 'finance' ? styles.navTextActive : styles.navTextInactive]}>
              Keuangan
            </Text>
          </TouchableOpacity>

          {/* Running Animated Indicator */}
          {hasLayout && (
            <Animated.View
              style={[
                styles.runningIndicator,
                {
                  left: translateX,
                  width: indicatorWidth,
                },
              ]}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbarWrapper: {
    backgroundColor: '#0284C7', // Full Biru
    borderBottomWidth: 1,
    borderBottomColor: '#0369A1',
    elevation: 4,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  navbarInner: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Mepet ke bagian bawah navbar
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 0,
  },
  brandContainer: {
    paddingBottom: 4,
  },
  logoFullImage: {
    width: 108,
    height: 40,
  },
  navMenu: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    gap: 8,
  },
  navItem: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  runningIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  navText: {
    fontSize: 13,
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  navTextInactive: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontWeight: '600',
  },
});
