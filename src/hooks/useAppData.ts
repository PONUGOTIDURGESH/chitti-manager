import { useCallback, useEffect, useState } from 'react';
import {
  chittiService,
  memberService,
  paymentService,
  scheduleService,
} from '@/lib/services';

import type {
  Chitti,
  Member,
  Payment,
  ChittiSchedule,
} from '@/types';

export function useAppData(selectedChittiId: string | null) {
  const [chittis, setChittis] = useState<Chitti[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [schedules, setSchedules] = useState<ChittiSchedule[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [c, m, p] = await Promise.all([
        chittiService.list(),
        memberService.list(),
        paymentService.list(),
      ]);

      const scheduleGroups = await Promise.all(
        c.map((chitti) => scheduleService.list(chitti.id))
      );

      const allSchedules = scheduleGroups.flat();

      setChittis(c);
      setMembers(m);
      setPayments(p);
      setSchedules(allSchedules);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const filteredMembers = selectedChittiId
    ? members.filter(
        (m) => m.chitti_id === selectedChittiId
      )
    : members;

  const filteredPayments = selectedChittiId
    ? payments.filter(
        (p) => p.chitti_id === selectedChittiId
      )
    : payments;

  const filteredSchedules = selectedChittiId
    ? schedules.filter(
        (s) => s.chitti_id === selectedChittiId
      )
    : schedules;

  return {
    chittis,

    members: filteredMembers,
    allMembers: members,

    payments: filteredPayments,
    allPayments: payments,

    schedules: filteredSchedules,
    allSchedules: schedules,

    loading,
    error,
    refresh,
  };
}