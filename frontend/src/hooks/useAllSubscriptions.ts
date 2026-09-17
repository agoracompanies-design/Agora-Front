import { useEffect, useState } from 'react';
import { listAllSubscriptions } from '@/api/subscription';
import type { Subscription } from '@/api/subscription';

export function useAllSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllSubscriptions()
      .then((lista) => setSubscriptions(lista ?? []))
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false));
  }, []);

  return { subscriptions, loading };
}
