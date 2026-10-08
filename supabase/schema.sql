-- StickmanWorkout — Supabase Free plan
-- Tek seferde SQL Editor'e yapıştırıp Run'a bas.
-- Antrenman geçmişi, rep satırı ve XP hareketi tablosu yok.
-- İkinci kez çalıştırma. Hata alırsan metni kopyala, tabloları elle silme.

-- ---------------------------------------------------------------------------
-- Katalog
-- ---------------------------------------------------------------------------

create table public.body_parts (
  id text primary key,
  sort_order integer not null unique
);

create table public.exercises (
  id text primary key,
  kind text not null check (kind in ('reps', 'time'))
);

create table public.exercise_muscles (
  exercise_id text not null references public.exercises (id),
  body_part_id text not null references public.body_parts (id),
  weight_bps integer not null check (weight_bps > 0 and weight_bps <= 10000),
  primary key (exercise_id, body_part_id)
);

insert into public.body_parts (id, sort_order) values
  ('chest', 1),
  ('back', 2),
  ('shoulders', 3),
  ('biceps', 4),
  ('triceps', 5),
  ('forearms', 6),
  ('abs', 7),
  ('quadriceps', 8),
  ('hamstrings', 9),
  ('glutes', 10),
  ('calves', 11);

insert into public.exercises (id, kind) values
  ('bench_press', 'reps'),
  ('push_up', 'reps'),
  ('pull_up', 'reps'),
  ('bent_over_row', 'reps'),
  ('deadlift', 'reps'),
  ('squat', 'reps'),
  ('lunge', 'reps'),
  ('dumbbell_curl', 'reps'),
  ('hammer_curl', 'reps'),
  ('triceps_extension', 'reps'),
  ('shoulder_press', 'reps'),
  ('lateral_raise', 'reps'),
  ('plank', 'time'),
  ('crunches', 'reps'),
  ('leg_raises', 'reps'),
  ('calf_raise', 'reps'),
  ('romanian_deadlift', 'reps');

insert into public.exercise_muscles (exercise_id, body_part_id, weight_bps) values
  ('bench_press', 'chest', 7000),
  ('bench_press', 'triceps', 2000),
  ('bench_press', 'shoulders', 1000),
  ('push_up', 'chest', 6000),
  ('push_up', 'triceps', 2500),
  ('push_up', 'shoulders', 1500),
  ('pull_up', 'back', 6000),
  ('pull_up', 'biceps', 3000),
  ('pull_up', 'forearms', 1000),
  ('bent_over_row', 'back', 7000),
  ('bent_over_row', 'biceps', 2000),
  ('bent_over_row', 'forearms', 1000),
  ('deadlift', 'back', 4000),
  ('deadlift', 'glutes', 3000),
  ('deadlift', 'hamstrings', 2000),
  ('deadlift', 'forearms', 1000),
  ('squat', 'quadriceps', 5000),
  ('squat', 'glutes', 3000),
  ('squat', 'hamstrings', 2000),
  ('lunge', 'quadriceps', 4500),
  ('lunge', 'glutes', 3500),
  ('lunge', 'hamstrings', 2000),
  ('dumbbell_curl', 'biceps', 10000),
  ('hammer_curl', 'biceps', 6000),
  ('hammer_curl', 'forearms', 4000),
  ('triceps_extension', 'triceps', 10000),
  ('shoulder_press', 'shoulders', 7000),
  ('shoulder_press', 'triceps', 3000),
  ('lateral_raise', 'shoulders', 10000),
  ('plank', 'abs', 8000),
  ('plank', 'shoulders', 1000),
  ('plank', 'glutes', 1000),
  ('crunches', 'abs', 10000),
  ('leg_raises', 'abs', 8000),
  ('leg_raises', 'quadriceps', 2000),
  ('calf_raise', 'calves', 10000),
  ('romanian_deadlift', 'hamstrings', 5000),
  ('romanian_deadlift', 'glutes', 3000),
  ('romanian_deadlift', 'back', 2000);

do $$
declare
  bad text;
begin
  select e.id into bad
  from public.exercises e
  left join public.exercise_muscles m on m.exercise_id = e.id
  group by e.id
  having coalesce(sum(m.weight_bps), 0) <> 10000
  limit 1;

  if bad is not null then
    raise exception 'exercise % weights do not sum to 10000', bad;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Kullanıcı state'i. Level, total_xp ve alev burada yok.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null,
  bio text not null default '',
  profile_visibility text not null default 'public' check (profile_visibility in ('public', 'private')),
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username ~ '^[a-z0-9_]{3,20}$'),
  constraint bio_length check (char_length(bio) <= 160)
);

create unique index profiles_username_key on public.profiles (username);

create table public.user_stats (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  longest_streak integer not null default 0 check (longest_streak >= 0),
  last_completed_on date,
  daily_xp integer not null default 0 check (daily_xp >= 0),
  completions_today integer not null default 0 check (completions_today >= 0),
  hour_bucket timestamptz,
  completions_this_hour integer not null default 0 check (completions_this_hour >= 0),
  updated_at timestamptz not null default now()
);

create table public.body_part_stats (
  user_id uuid not null references public.profiles (id) on delete cascade,
  body_part_id text not null references public.body_parts (id),
  total_xp integer not null default 0 check (total_xp >= 0),
  primary key (user_id, body_part_id)
);

-- Aynı isteğin ikinci kez XP yazmasını engeller. 48 saatten eski satırlar silinir.
create table public.completion_keys (
  user_id uuid not null references public.profiles (id) on delete cascade,
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);

comment on table public.completion_keys is
  '48 saatlik tekrar koruması. Antrenman geçmişi değildir.';

-- ---------------------------------------------------------------------------
-- Formüller
-- cost(L) = 8L^2 + 20L + 40
-- ---------------------------------------------------------------------------

create or replace function public.xp_cost(level integer)
returns integer
language sql
immutable
as $$
  select (8 * level * level + 20 * level + 40)::integer;
$$;

create or replace function public.xp_progress(total_xp integer)
returns table (level integer, xp_into_level integer, xp_for_next integer)
language plpgsql
immutable
as $$
declare
  v_level integer := 1;
  v_remaining integer := greatest(coalesce(total_xp, 0), 0);
  v_cost integer;
begin
  loop
    v_cost := public.xp_cost(v_level);
    exit when v_remaining < v_cost or v_level >= 500;
    v_remaining := v_remaining - v_cost;
    v_level := v_level + 1;
  end loop;

  level := v_level;
  xp_into_level := v_remaining;
  xp_for_next := public.xp_cost(v_level);
  return next;
end;
$$;

create or replace function public.streak_multiplier_bps(streak integer)
returns integer
language sql
immutable
as $$
  select case
    when streak >= 500 then 18500
    when streak >= 250 then 17000
    when streak >= 100 then 15500
    when streak >= 60 then 14000
    when streak >= 30 then 13000
    when streak >= 14 then 12000
    when streak >= 7 then 11000
    when streak >= 3 then 10500
    else 10000
  end;
$$;

create or replace function public.progression_snapshot(target uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'current_streak', s.current_streak,
    'longest_streak', s.longest_streak,
    'last_completed_on', s.last_completed_on,
    'daily_xp', s.daily_xp,
    'daily_cap', 2500,
    'total_xp', coalesce((
      select sum(b.total_xp)::integer
      from public.body_part_stats b
      where b.user_id = target
    ), 0),
    'body_parts', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'body_part_id', b.body_part_id,
          'total_xp', b.total_xp,
          'level', p.level,
          'xp_into_level', p.xp_into_level,
          'xp_for_next', p.xp_for_next
        )
        order by bp.sort_order
      )
      from public.body_part_stats b
      join public.body_parts bp on bp.id = b.body_part_id
      cross join lateral public.xp_progress(b.total_xp) as p
      where b.user_id = target
    ), '[]'::jsonb)
  )
  from public.user_stats s
  where s.user_id = target;
$$;

-- ---------------------------------------------------------------------------
-- Profil açılınca 11 bölge satırı ve streak satırı
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_stats (user_id) values (new.id);

  insert into public.body_part_stats (user_id, body_part_id, total_xp)
  select new.id, bp.id, 0
  from public.body_parts bp;

  return new;
end;
$$;

create trigger profiles_create_stats
  after insert on public.profiles
  for each row
  execute function public.handle_new_profile();

create or replace function public.validate_timezone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (select 1 from pg_timezone_names where name = new.timezone) then
    raise exception 'invalid_timezone' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger profiles_validate_timezone
  before insert or update on public.profiles
  for each row
  execute function public.validate_timezone();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Tek yazma: antrenman bitişi
-- ---------------------------------------------------------------------------

create or replace function public.complete_workout(
  p_idempotency_key uuid,
  p_started_at timestamptz,
  p_exercises jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_stat public.user_stats%rowtype;
  v_profile public.profiles%rowtype;
  v_today date;
  v_elem record;
  v_exercise_id text;
  v_kind text;
  v_reps integer;
  v_seconds integer;
  v_base integer;
  v_raw integer := 0;
  v_part_xp integer;
  v_muscle record;
  v_award jsonb := '{}'::jsonb;
  v_count integer;
  v_distinct integer;
  v_new_streak integer;
  v_incremented boolean;
  v_mult integer;
  v_daily_xp integer;
  v_completions integer;
  v_hour_count integer;
  v_hour_bucket timestamptz;
  v_sum integer;
  v_remaining integer;
  v_pair record;
  v_scaled jsonb;
  v_given integer;
  v_piece integer;
  v_largest_id text;
  v_largest_val integer;
  v_inserted uuid;
  v_daily_cap constant integer := 2500;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_idempotency_key is null
    or p_started_at is null
    or jsonb_typeof(p_exercises) <> 'array' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  if p_started_at > now() + interval '30 seconds' then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  if now() - p_started_at < interval '45 seconds' then
    raise exception 'workout_too_short' using errcode = '22023';
  end if;

  if now() - p_started_at > interval '4 hours' then
    raise exception 'workout_too_long' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_exercises);
  if v_count < 1 or v_count > 12 then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  select count(distinct elem->>'exercise_id')
  into v_distinct
  from jsonb_array_elements(p_exercises) as elem;

  if v_distinct <> v_count then
    raise exception 'invalid_payload' using errcode = '22023';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  select * into v_stat
  from public.user_stats
  where user_id = v_uid
  for update;

  if not found then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  insert into public.completion_keys (user_id, idempotency_key)
  values (v_uid, p_idempotency_key)
  on conflict (user_id, idempotency_key) do nothing
  returning completion_keys.idempotency_key into v_inserted;

  if v_inserted is null then
    return jsonb_build_object(
      'duplicate', true,
      'awarded', '[]'::jsonb,
      'streak_incremented', false,
      'progression', public.progression_snapshot(v_uid)
    );
  end if;

  delete from public.completion_keys
  where user_id = v_uid
    and created_at < now() - interval '48 hours';

  v_today := (now() at time zone v_profile.timezone)::date;

  if v_stat.last_completed_on is not distinct from v_today then
    v_daily_xp := v_stat.daily_xp;
    v_completions := v_stat.completions_today;
    v_new_streak := v_stat.current_streak;
    v_incremented := false;
  elsif v_stat.last_completed_on = v_today - 1 then
    v_daily_xp := 0;
    v_completions := 0;
    v_new_streak := v_stat.current_streak + 1;
    v_incremented := true;
  else
    v_daily_xp := 0;
    v_completions := 0;
    v_new_streak := 1;
    v_incremented := true;
  end if;

  if v_stat.hour_bucket is null or now() - v_stat.hour_bucket >= interval '1 hour' then
    v_hour_count := 0;
    v_hour_bucket := now();
  else
    v_hour_count := v_stat.completions_this_hour;
    v_hour_bucket := v_stat.hour_bucket;
  end if;

  if v_hour_count >= 4 then
    raise exception 'hourly_limit' using errcode = 'P0001';
  end if;

  if v_completions >= 6 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  v_mult := public.streak_multiplier_bps(v_new_streak);

  for v_elem in select value from jsonb_array_elements(p_exercises)
  loop
    if jsonb_typeof(v_elem.value) <> 'object' then
      raise exception 'invalid_payload' using errcode = '22023';
    end if;

    v_exercise_id := v_elem.value->>'exercise_id';

    select kind into v_kind
    from public.exercises
    where id = v_exercise_id;

    if not found then
      raise exception 'unknown_exercise' using errcode = '22023';
    end if;

    if v_kind = 'reps' then
      if coalesce(v_elem.value->>'reps', '') !~ '^[0-9]+$' then
        raise exception 'invalid_reps' using errcode = '22023';
      end if;
      v_reps := (v_elem.value->>'reps')::integer;
      if v_reps < 1 or v_reps > 150 then
        raise exception 'invalid_reps' using errcode = '22023';
      end if;
      v_base := v_reps * 2;
    else
      if coalesce(v_elem.value->>'duration_seconds', '') !~ '^[0-9]+$' then
        raise exception 'invalid_duration' using errcode = '22023';
      end if;
      v_seconds := (v_elem.value->>'duration_seconds')::integer;
      if v_seconds < 1 or v_seconds > 600 then
        raise exception 'invalid_duration' using errcode = '22023';
      end if;
      v_base := v_seconds / 2;
    end if;

    v_raw := v_raw + v_base;

    for v_muscle in
      select body_part_id, weight_bps
      from public.exercise_muscles
      where exercise_id = v_exercise_id
    loop
      v_part_xp := ((v_base::bigint * v_muscle.weight_bps * v_mult) / 100000000)::integer;
      if v_part_xp > 0 then
        v_award := v_award || jsonb_build_object(
          v_muscle.body_part_id,
          coalesce((v_award ->> v_muscle.body_part_id)::integer, 0) + v_part_xp
        );
      end if;
    end loop;
  end loop;

  if v_raw < 20 then
    raise exception 'workout_too_small' using errcode = '22023';
  end if;

  select coalesce(sum(value::integer), 0)
  into v_sum
  from jsonb_each_text(v_award);

  v_remaining := greatest(v_daily_cap - v_daily_xp, 0);

  if v_sum > v_remaining then
    if v_remaining = 0 or v_sum = 0 then
      v_award := '{}'::jsonb;
      v_sum := 0;
    else
      v_scaled := '{}'::jsonb;
      v_given := 0;
      v_largest_val := -1;
      v_largest_id := null;

      for v_pair in
        select key, value::integer as xp
        from jsonb_each_text(v_award)
      loop
        v_piece := (v_pair.xp * v_remaining) / v_sum;
        v_scaled := v_scaled || jsonb_build_object(v_pair.key, v_piece);
        v_given := v_given + v_piece;
        if v_piece > v_largest_val then
          v_largest_val := v_piece;
          v_largest_id := v_pair.key;
        end if;
      end loop;

      if v_largest_id is not null and v_given < v_remaining then
        v_scaled := v_scaled || jsonb_build_object(
          v_largest_id,
          (v_scaled ->> v_largest_id)::integer + (v_remaining - v_given)
        );
      end if;

      v_award := v_scaled;
      v_sum := v_remaining;
    end if;
  end if;

  for v_pair in
    select key, value::integer as xp
    from jsonb_each_text(v_award)
  loop
    if v_pair.xp > 0 then
      update public.body_part_stats
      set total_xp = total_xp + v_pair.xp
      where user_id = v_uid
        and body_part_id = v_pair.key;
    end if;
  end loop;

  update public.user_stats
  set
    current_streak = v_new_streak,
    longest_streak = greatest(longest_streak, v_new_streak),
    last_completed_on = v_today,
    daily_xp = v_daily_xp + v_sum,
    completions_today = v_completions + 1,
    hour_bucket = v_hour_bucket,
    completions_this_hour = v_hour_count + 1,
    updated_at = now()
  where user_id = v_uid;

  return jsonb_build_object(
    'duplicate', false,
    'awarded', coalesce((
      select jsonb_agg(jsonb_build_object('body_part_id', key, 'xp', value::integer))
      from jsonb_each_text(v_award)
      where value::integer > 0
    ), '[]'::jsonb),
    'streak_incremented', v_incremented,
    'progression', public.progression_snapshot(v_uid)
  );
end;
$$;

create or replace function public.get_my_progression()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_missing' using errcode = 'P0002';
  end if;

  return public.progression_snapshot(v_uid);
end;
$$;

create or replace function public.get_public_profile(lookup text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_name text := lower(regexp_replace(coalesce(lookup, ''), '[^a-zA-Z0-9_]', '', 'g'));
  v_profile public.profiles%rowtype;
begin
  if v_name = '' then
    return jsonb_build_object('found', false);
  end if;

  select * into v_profile
  from public.profiles
  where username = v_name;

  if not found then
    return jsonb_build_object('found', false);
  end if;

  if v_profile.profile_visibility <> 'public'
    and v_profile.id is distinct from auth.uid() then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'username', v_profile.username,
    'bio', v_profile.bio,
    'profile_visibility', v_profile.profile_visibility,
    'progression', public.progression_snapshot(v_profile.id)
  );
end;
$$;

create or replace function public.search_usernames(prefix text)
returns table (username text, bio text)
language sql
stable
security definer
set search_path = public
as $$
  with clean as (
    select lower(regexp_replace(coalesce(prefix, ''), '[^a-zA-Z0-9_]', '', 'g')) as q
  )
  select p.username, p.bio
  from public.profiles p
  cross join clean
  where char_length(clean.q) >= 2
    and p.profile_visibility = 'public'
    and p.username like (regexp_replace(clean.q, '_', '\_', 'g') || '%') escape '\'
  order by p.username
  limit 8;
$$;

-- ---------------------------------------------------------------------------
-- İstemci XP yazamasın
-- ---------------------------------------------------------------------------

revoke all on function public.xp_cost(integer) from public, anon, authenticated;
revoke all on function public.xp_progress(integer) from public, anon, authenticated;
revoke all on function public.streak_multiplier_bps(integer) from public, anon, authenticated;
revoke all on function public.progression_snapshot(uuid) from public, anon, authenticated;
revoke all on function public.handle_new_profile() from public, anon, authenticated;
revoke all on function public.validate_timezone() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.complete_workout(uuid, timestamptz, jsonb) from public, anon, authenticated;
revoke all on function public.get_my_progression() from public, anon, authenticated;
revoke all on function public.get_public_profile(text) from public, anon, authenticated;
revoke all on function public.search_usernames(text) from public, anon, authenticated;

grant execute on function public.complete_workout(uuid, timestamptz, jsonb) to authenticated;
grant execute on function public.get_my_progression() to authenticated;
grant execute on function public.get_public_profile(text) to authenticated;
grant execute on function public.search_usernames(text) to authenticated;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_stats from anon, authenticated;
revoke all on table public.body_part_stats from anon, authenticated;
revoke all on table public.completion_keys from anon, authenticated;
revoke all on table public.body_parts from anon, authenticated;
revoke all on table public.exercises from anon, authenticated;
revoke all on table public.exercise_muscles from anon, authenticated;

grant select, insert on table public.profiles to authenticated;
grant update (username, bio, profile_visibility, timezone)
  on table public.profiles to authenticated;
grant select on table public.user_stats to authenticated;
grant select on table public.body_part_stats to authenticated;
grant select on table public.body_parts to authenticated;
grant select on table public.exercises to authenticated;
grant select on table public.exercise_muscles to authenticated;

alter table public.profiles enable row level security;
alter table public.user_stats enable row level security;
alter table public.body_part_stats enable row level security;
alter table public.completion_keys enable row level security;
alter table public.body_parts enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_muscles enable row level security;

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy user_stats_select_own
  on public.user_stats
  for select
  to authenticated
  using (user_id = auth.uid());

create policy body_part_stats_select_own
  on public.body_part_stats
  for select
  to authenticated
  using (user_id = auth.uid());

create policy body_parts_read
  on public.body_parts
  for select
  to authenticated
  using (true);

create policy exercises_read
  on public.exercises
  for select
  to authenticated
  using (true);

create policy exercise_muscles_read
  on public.exercise_muscles
  for select
  to authenticated
  using (true);
