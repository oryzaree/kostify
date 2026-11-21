import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function TenantsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/(tabs)', params: { tab: 'tenants' } });
  }, []);

  return null;
}
