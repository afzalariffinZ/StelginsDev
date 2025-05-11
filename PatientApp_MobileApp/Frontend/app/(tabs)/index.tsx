import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push('../../LanguageScreen');
    }, 0);
    return () => clearTimeout(timeout);
  }, [router]);

  return null; // No UI
}
