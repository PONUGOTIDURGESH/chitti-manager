import { supabase } from './supabase';
import type {
  Chitti,
  ChittiInput,
  Member,
  MemberInput,
  Payment,
  PaymentInput,
  ActivityLog,
  Settings,
  ChittiSchedule,
  ChittiScheduleInput,
} from '@/types';

// ---------- Activity logs ----------
export async function logActivity(
  actionType: string,
  description: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  try {
    await supabase.from('activity_logs').insert({
      action_type: actionType,
      description,
      metadata,
    });
  } catch {
    // best-effort logging
  }
}

// ---------- Chittis ----------
export const chittiService = {
  async list(): Promise<Chitti[]> {
    const { data, error } = await supabase
      .from('chittis')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  async create(input: ChittiInput): Promise<Chitti> {
    const { data, error } = await supabase
      .from('chittis')
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    await logActivity('chitti_created', `Chitti "${data.name}" created`, {
      chitti_id: data.id,
    });

    await createSafetyBackup();
    return data;
  },

  async update(id: string, input: Partial<ChittiInput>): Promise<Chitti> {
    await createSafetyBackup();

    const { data, error } = await supabase
      .from('chittis')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id: string): Promise<void> {
    await createSafetyBackup();

    const { error } = await supabase.from('chittis').delete().eq('id', id);

    if (error) throw error;

    await logActivity('chitti_deleted', 'Chitti deleted', {
      chitti_id: id,
    });
  },
};

// ---------- Members ----------
export const memberService = {
  async list(chittiId?: string): Promise<Member[]> {
    let q = supabase
      .from('members')
      .select('*')
      .order('full_name', { ascending: true });

    if (chittiId) q = q.eq('chitti_id', chittiId);

    const { data, error } = await q;
    if (error) throw error;

    return data ?? [];
  },

  async create(input: MemberInput): Promise<Member> {
    const { data, error } = await supabase
      .from('members')
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    await logActivity('member_created', `Member "${data.full_name}" added`, {
      member_id: data.id,
    });

    await createSafetyBackup();
    return data;
  },

  async update(id: string, input: Partial<MemberInput>): Promise<Member> {
    await createSafetyBackup();

    const { data, error } = await supabase
      .from('members')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity('member_updated', `Member "${data.full_name}" updated`, {
      member_id: id,
    });

    return data;
  },

  async archive(id: string, archived: boolean): Promise<void> {
    await createSafetyBackup();

    const { error } = await supabase
      .from('members')
      .update({ archived })
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      'member_archived',
      `Member ${archived ? 'archived' : 'restored'}`,
      { member_id: id }
    );
  },

  async remove(id: string): Promise<void> {
    await createSafetyBackup();

    const { error } = await supabase.from('members').delete().eq('id', id);

    if (error) throw error;

    await logActivity('member_deleted', 'Member deleted', {
      member_id: id,
    });
  },
};

// ---------- Chitti Schedule ----------
export const scheduleService = {
  async list(chittiId: string): Promise<ChittiSchedule[]> {
    const { data, error } = await supabase
      .from('chitti_schedule')
      .select('*')
      .eq('chitti_id', chittiId)
      .order('month_number', { ascending: true });

    if (error) throw error;

    return data ?? [];
  },

  async create(input: ChittiScheduleInput): Promise<ChittiSchedule> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chitti_schedule')
      .insert({
        ...input,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity(
      'schedule_created',
      `Month ${input.month_number} schedule created`,
      {
        chitti_id: input.chitti_id,
        month_number: input.month_number,
      }
    );

    return data;
  },

  async update(
    id: string,
    input: Partial<ChittiScheduleInput>
  ): Promise<ChittiSchedule> {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('chitti_schedule')
      .update({
        ...input,
        user_id: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity(
      'schedule_updated',
      'Chitti schedule updated',
      {
        schedule_id: id,
      }
    );

    return data;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('chitti_schedule')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity(
      'schedule_deleted',
      'Chitti schedule row deleted',
      {
        schedule_id: id,
      }
    );
  },

  async createBulk(
    rows: ChittiScheduleInput[]
  ): Promise<ChittiSchedule[]> {
    if (rows.length === 0) return [];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const rowsWithUserId = rows.map((row) => ({
      ...row,
      user_id: user.id,
    }));

    console.log('CREATE BULK INPUT COUNT:', rows.length);
console.log('CREATE BULK INPUT:', rowsWithUserId);

    const { data, error } = await supabase
      .from('chitti_schedule')
      .insert(rowsWithUserId)
      .select();

    if (error) throw error;

    await logActivity(
      'schedule_bulk_created',
      `${rows.length} schedule months created`,
      {
        chitti_id: rows[0].chitti_id,
        months: rows.length,
      }
    );

    return data ?? [];
  },

  async removeAll(chittiId: string): Promise<void> {
    const { error } = await supabase
      .from('chitti_schedule')
      .delete()
      .eq('chitti_id', chittiId);

    if (error) throw error;

    await logActivity(
      'schedule_cleared',
      'Chitti schedule cleared',
      {
        chitti_id: chittiId,
      }
    );
  },

  async upsertBulk(
    rows: ChittiScheduleInput[]
  ): Promise<ChittiSchedule[]> {
    if (rows.length === 0) return [];

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    const rowsWithUserId = rows.map((row) => ({
      ...row,
      user_id: user.id,
    }));

    console.log('CREATE BULK INPUT COUNT:', rows.length);
console.log('CREATE BULK INPUT:', rowsWithUserId);

    const { data, error } = await supabase
      .from('chitti_schedule')
      .upsert(rowsWithUserId, {
        onConflict: 'chitti_id,month_number',
      })
      .select();

    if (error) {
  console.error('UPSERT ERROR:', error);
  throw error;
}

console.log('UPSERT RESULT COUNT:', data?.length);
console.log('UPSERT RESULT:', data);

    await logActivity(
      'schedule_bulk_updated',
      `${rows.length} schedule months saved`,
      {
        chitti_id: rows[0].chitti_id,
        months: rows.length,
      }
    );

    return data ?? [];
  },
};

// ---------- Payments ----------
export const paymentService = {
  async list(chittiId?: string, memberId?: string): Promise<Payment[]> {
    let q = supabase.from('payments').select('*');

    if (chittiId) q = q.eq('chitti_id', chittiId);
    if (memberId) q = q.eq('member_id', memberId);

    q = q
      .order('payment_date', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await q;

    if (error) throw error;
    return data ?? [];
  },

  async create(input: PaymentInput): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(input)
      .select()
      .single();

    if (error) throw error;

    await logActivity(
      'payment_added',
      `Payment of ₹${Number(input.amount).toLocaleString('en-IN')} recorded`,
      {
        payment_id: data.id,
        member_id: input.member_id,
      }
    );

    await createSafetyBackup();
    return data;
  },

  async update(id: string, input: Partial<PaymentInput>): Promise<Payment> {
    await createSafetyBackup();

    const { data, error } = await supabase
      .from('payments')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logActivity('payment_edited', 'Payment corrected', {
      payment_id: id,
    });

    return data;
  },

  async reverse(id: string): Promise<void> {
    await createSafetyBackup();

    const { error } = await supabase
      .from('payments')
      .update({ reversed: true })
      .eq('id', id);

    if (error) throw error;

    await logActivity('payment_reversed', 'Payment reversed', {
      payment_id: id,
    });
  },
};

// ---------- Activity logs ----------
export const activityService = {
  async list(limit = 100): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data ?? [];
  },
};

// ---------- Settings ----------
export const settingsService = {
  async get(): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async upsert(input: Partial<Settings>): Promise<Settings> {
    const { data, error } = await supabase
      .from('settings')
      .upsert(input, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ---------- Safety Backup ----------
async function createSafetyBackup(): Promise<void> {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    const { error } = await supabase.rpc('create_chitti_backup', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Safety backup failed:', error.message);
    }
  } catch (error) {
    console.error('Safety backup failed:', error);
  }
}

// ---------- Backup / Restore ----------
export const backupService = {
  async listCloudBackups(limit = 30) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('You must be signed in to view cloud backups.');
  }

  const { data, error } = await supabase
    .from('app_backups')
    .select('id, created_at, backup_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load cloud backups: ${error.message}`);
  }

  return (data ?? []).map((backup) => {
    const backupData = backup.backup_data ?? {};

    return {
      ...backup,

      chittiCount: Array.isArray(backupData.chittis)
        ? backupData.chittis.length
        : 0,

      memberCount: Array.isArray(backupData.members)
        ? backupData.members.length
        : 0,

      paymentCount: Array.isArray(backupData.payments)
        ? backupData.payments.length
        : 0,
    };
  });
},

  async restoreCloudBackup(
    backupId: string
  ): Promise<{ chittis: number; members: number; payments: number }> {
    const { data, error } = await supabase.rpc('restore_chitti_backup', {
      p_backup_id: backupId,
    });

    if (error) {
      throw new Error(`Cloud backup restore failed: ${error.message}`);
    }

    if (!data || data.success !== true) {
      throw new Error('Cloud backup restore failed.');
    }

    await logActivity(
      'cloud_backup_restored',
      'Cloud backup restored successfully',
      {
        backup_id: backupId,
        chittis: Number(data.chittis ?? 0),
        members: Number(data.members ?? 0),
        payments: Number(data.payments ?? 0),
      }
    );

    return {
      chittis: Number(data.chittis ?? 0),
      members: Number(data.members ?? 0),
      payments: Number(data.payments ?? 0),
    };
  },

  async restore(
    chittis: Chitti[],
    members: Member[],
    payments: Payment[]
  ): Promise<{ chittis: number; members: number; payments: number }> {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('You must be signed in before restoring a backup.');
    }

    if (!Array.isArray(chittis)) {
      throw new Error('Invalid chittis backup data.');
    }

    if (!Array.isArray(members)) {
      throw new Error('Invalid members backup data.');
    }

    if (!Array.isArray(payments)) {
      throw new Error('Invalid payments backup data.');
    }

    if (chittis.length > 0) {
      const chittiRows = chittis.map((item) => ({
        ...item,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('chittis')
        .upsert(chittiRows, { onConflict: 'id' });

      if (error) {
        throw new Error(`Chitti restore failed: ${error.message}`);
      }
    }

    if (members.length > 0) {
      const memberRows = members.map((item) => ({
        ...item,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('members')
        .upsert(memberRows, { onConflict: 'id' });

      if (error) {
        throw new Error(`Member restore failed: ${error.message}`);
      }
    }

    if (payments.length > 0) {
      const paymentRows = payments.map((item) => ({
        ...item,
        user_id: user.id,
      }));

      const { error } = await supabase
        .from('payments')
        .upsert(paymentRows, { onConflict: 'id' });

      if (error) {
        throw new Error(`Payment restore failed: ${error.message}`);
      }
    }

    await logActivity('backup_restored', 'Backup restored successfully', {
      chittis: chittis.length,
      members: members.length,
      payments: payments.length,
    });

    return {
      chittis: chittis.length,
      members: members.length,
      payments: payments.length,
    };
  },
};
