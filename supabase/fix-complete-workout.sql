-- SQL Editor'e sadece bu dosyayi yapistir. Tum schema.sql dosyasini tekrar calistirma.
drop function if exists public.complete_workout(uuid, timestamptz, jsonb);

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

revoke all on function public.complete_workout(uuid, timestamptz, jsonb) from public, anon;
grant execute on function public.complete_workout(uuid, timestamptz, jsonb) to authenticated;
