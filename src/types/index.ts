export type ChittiStatus = 'active' | 'completed' | 'archived';

// ---------- Chitti ----------

export interface Chitti {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: ChittiStatus;

  number_of_months: number | null;

  // false = normal chitti
  // true = payment amount changes after member lifts the chitti
  lifting_payment_enabled: boolean;

  created_at: string;
  updated_at: string;
}

export interface ChittiInput {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: ChittiStatus;
  lifting_payment_enabled?: boolean;
  number_of_months?: number | null;
}

// ---------- Payment Mode ----------

export type PaymentMode = 'cash' | 'upi' | 'bank' | 'other';

// ---------- Member ----------

export interface Member {
  id: string;
  user_id: string;
  chitti_id: string;

  full_name: string;
  mobile_number: string | null;
  photo_url: string | null;

  total_chitti_amount: number;
  installment_amount: number;
  total_installments: number;
  units: number;
  due_day: number;

  start_date: string | null;
  notes: string | null;

  // Lifting information
  is_lifted: boolean;
  lifted_date: string | null;
  lifted_month_number: number | null;
  lifting_note: string | null;

  archived: boolean;

  created_at: string;
  updated_at: string;
}

export interface MemberInput {
  chitti_id: string;
  full_name: string;

  mobile_number?: string | null;
  photo_url?: string | null;

  total_chitti_amount: number;
  installment_amount: number;
  total_installments: number;

  units?: number;

  due_day?: number;
  start_date?: string | null;
  notes?: string | null;

  // Lifting information
  is_lifted?: boolean;
  lifted_date?: string | null;
  lifted_month_number?: number | null;
  lifting_note?: string | null;
}

// ---------- Payment ----------

export interface Payment {
  id: string;
  user_id: string;
  member_id: string;
  chitti_id: string;

  amount: number;
  payment_date: string;
  installment_month: string;

  payment_mode: PaymentMode;
  reference_number: string | null;
  note: string | null;

  reversed: boolean;

  created_at: string;
  updated_at: string;
}

export interface PaymentInput {
  member_id: string;
  chitti_id: string;

  amount: number;
  payment_date: string;
  installment_month: string;

  payment_mode: PaymentMode;

  reference_number?: string | null;
  note?: string | null;
}

// ---------- Activity Log ----------

export interface ActivityLog {
  id: string;
  user_id: string;

  action_type: string;
  description: string;

  metadata: Record<string, unknown> | null;

  created_at: string;
}

// ---------- Settings ----------

export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  id: string;
  user_id: string;

  theme: ThemePreference;
  currency_code: string;

  default_chitti_id: string | null;
  statement_footer: string;

  created_at: string;
  updated_at: string;
}

// ---------- Chitti Schedule ----------

export interface ChittiSchedule {
  id: string;
  user_id: string;
  chitti_id: string;

  month_number: number;
  draw_date: string;

  // Total chitti / draw value configured for this month
  chit_value: number;

  // Amount member pays before lifting
  before_lifting_amount: number;

  // Amount member pays from the lifting month onwards
  after_lifting_amount: number;

  // Amount member can receive if they lift the chitti in this month
  lift_amount: number;

  created_at: string;
  updated_at: string;
}

export interface ChittiScheduleInput {
  chitti_id: string;

  month_number: number;
  draw_date: string;

  chit_value: number;

  // Monthly installment before the member lifts
  before_lifting_amount: number;

  // Monthly installment from the month the member lifts
  after_lifting_amount: number;

  // Amount available to lift/draw in this particular month
  lift_amount: number;
}
export interface MemberLift {
  

  id: string;

  member_id: string;

  lift_number: number;

  lifted_month_number: number;

  lift_amount: number;

  new_installment_amount: number | null;

  paid_date: string | null;

  notes: string | null;

  created_at: string;
}

export interface MemberLiftInput {
  

  member_id: string;

  lift_number: number;

  lifted_month_number: number;

  lift_amount: number;

  new_installment_amount: number | null;

  paid_date?: string | null;

  notes?: string | null;
}