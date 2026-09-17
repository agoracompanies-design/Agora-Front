import { useEffect, useState } from 'react';
import { listAllUsers } from '@/api/user';
import type { AuthUser } from '@/types';

export function useAllUsers() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listAllUsers()
      .then((lista) => setUsers(lista ?? []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}
