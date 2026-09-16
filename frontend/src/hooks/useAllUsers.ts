import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export function useAllUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users')
      .then((res) => setUsers(res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}