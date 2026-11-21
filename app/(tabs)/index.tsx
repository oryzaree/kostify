import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  useWindowDimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router';
import { TopNavbar } from '../../components/TopNavbar';
import { RoomsTab } from '../../components/tabs/RoomsTab';
import { TenantsTab } from '../../components/tabs/TenantsTab';
import { FinanceTab } from '../../components/tabs/FinanceTab';

export default function MainPagerScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const pagerRef = useRef<React.ElementRef<typeof ScrollView>>(null);
  const [activeTab, setActiveTab] = useState<'index' | 'tenants' | 'finance'>('index');
  const params = useLocalSearchParams<{ tab?: string }>();

  const isClickScrolling = useRef(false);

  // Sinkronisasi saat berpindah melalui parameter
  useEffect(() => {
    if (params.tab === 'tenants') {
      goToTab('tenants');
    } else if (params.tab === 'finance') {
      goToTab('finance');
    } else if (params.tab === 'index') {
      goToTab('index');
    }
  }, [params.tab]);

  const goToTab = (tab: 'index' | 'tenants' | 'finance') => {
    setActiveTab(tab);
    isClickScrolling.current = true;
    const pageIndex = tab === 'index' ? 0 : tab === 'tenants' ? 1 : 2;
    pagerRef.current?.scrollTo({ x: pageIndex * screenWidth, animated: true });
    setTimeout(() => {
      isClickScrolling.current = false;
    }, 350);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isClickScrolling.current) return;
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    const targetTab = pageIndex === 0 ? 'index' : pageIndex === 1 ? 'tenants' : 'finance';
    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
    }
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isClickScrolling.current = false;
    const offsetX = e.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / screenWidth);
    if (pageIndex === 0) {
      setActiveTab('index');
    } else if (pageIndex === 1) {
      setActiveTab('tenants');
    } else if (pageIndex === 2) {
      setActiveTab('finance');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar style="light" />

      {/* Top Navigation Bar with active state */}
      <TopNavbar activeTab={activeTab} onTabPress={goToTab} />

      {/* Horizontal Swipeable Pager */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
      >
        {/* Halaman 1: Kamar */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <RoomsTab />
        </View>

        {/* Halaman 2: Penghuni */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <TenantsTab />
        </View>

        {/* Halaman 3: Keuangan */}
        <View style={{ width: screenWidth, flex: 1 }}>
          <FinanceTab />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  pager: { flex: 1 },
});
