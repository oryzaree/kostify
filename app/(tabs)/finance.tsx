import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function FinanceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/(tabs)', params: { tab: 'finance' } });
  }, []);

  return null;
}
