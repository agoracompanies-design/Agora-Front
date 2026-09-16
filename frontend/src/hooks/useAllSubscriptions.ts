import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useAllSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/subscriptions')
      .then((res) => setSubscriptions(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return { subscriptions, loading };
}