import { apiClient } from './client';

export interface Subscription {
  idSubscription: string;
  userId: string;
  userEnterpriseId?: string | null;
  planType?: string | null;
  name: string;
  cost: number;
  description: string | null;
  status: boolean;
  quantityAccounts: number;
  durationDays: number;
  createdAt: string;
  expiresAt: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  userEnterprise?: {
    idUserEnterprise: string;
    companyName: string;
  } | null;
}

export interface SubscriptionInput {
  userId: string;
  name: string;
  cost: number;
  description?: string;
  quantityAccounts: number;
  durationDays: number;
  planType?: PlanType;
}

export type PlanType = 'buyer' | 'seller';

export function estaVigente(s: Subscription | null | undefined): boolean {
  return Boolean(s?.status);
}

export function getMyActiveSubscription() {
  return apiClient.get<Subscription>('/subscription').then((res) => res.data);
}

export function getMySubscriptionHistory() {
  return apiClient.get<Subscription[]>('/subscription/history').then((res) => res.data);
}

export function createSubscription(input: SubscriptionInput) {
  return apiClient.post<Subscription>('/subscription', input).then((res) => res.data);
}

export function cancelSubscription(id: string) {
  return apiClient.delete<void>(`/subscription/${id}`).then((res) => res.data);
}

export function listAllSubscriptions() {
  return apiClient
    .get<Subscription[] | { data: Subscription[] } | { subscriptions: Subscription[] }>(
      '/subscription/all',
    )
    .then((res) => {
      const payload = res.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray((payload as any)?.data)) return (payload as any).data;
      if (Array.isArray((payload as any)?.subscriptions))
        return (payload as any).subscriptions;
      return [];
    });
}